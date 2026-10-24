import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DefinitionClient,DefinitionError,definitionText,parseDefinitions,definitionVisible,DEFINITION_ENDPOINT} from '../src/definitions.ts';
import {DefinitionSession} from '../src/definition-session.ts';
const phase=(session:DefinitionSession):string=>session.state.phase;
const sleep=(ms=10)=>new Promise(resolve=>setTimeout(resolve,ms));
const payload={en:[{language:'English',partOfSpeech:'Noun',definitions:[{definition:'A <a href="/wiki/monastery">monastery</a> &amp; church.'},{definition:'A second sense.'}]},{language:'English',partOfSpeech:'Verb',definitions:[{definition:'To test.'}]}]};
const response=(body:unknown=payload,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
test('English meanings preserve parts of speech, homographs and multiple senses with fixed attribution',()=>{
 const result=parseDefinitions(payload,'abbey');assert.equal(result.word,'ABBEY');assert.deepEqual(result.entries,[{partOfSpeech:'Noun',senses:['A monastery & church.','A second sense.']},{partOfSpeech:'Verb',senses:['To test.']}]);assert.equal(result.sourceUrl,'https://en.wiktionary.org/wiki/abbey#English');
 assert.deepEqual(parseDefinitions({en:[...payload.en,{partOfSpeech:'Noun',definitions:[{definition:'Another etymology.'}]},{language:'French',definitions:[{definition:'Wrong language'}]}]},'ABBEY').entries.at(-1)?.senses,['Another etymology.']);
 assert.deepEqual(parseDefinitions({},'QAJAQ').entries,[]);assert.deepEqual(parseDefinitions({fr:payload.en},'ABBEY').entries,[]);assert.throws(()=>parseDefinitions({en:'bad'},'ABBEY'),DefinitionError);
});
test('untrusted response becomes bounded plain text, ignoring executable markup, URLs, media and quotes',()=>{
 assert.equal(definitionText('A<style>.danger{}</style><script>steal()</script><img src=x onerror=steal()>word &#38; &#x26; &lt;b&gt;text&lt;/b&gt;'),'Aword & & <b>text</b>');
 assert.equal(definitionText('Hello <script>bad'),'Hello');assert.equal(definitionText({html:'bad'}),'');assert.equal(definitionText('x'.repeat(20001)),'');assert.equal(definitionText('x'.repeat(2000)).length,1800);
 const result=parseDefinitions({en:[{partOfSpeech:'<img src=x>Noun',definitions:[{definition:'Safe',examples:['Unlicensed quote'],source:'javascript:bad'},{definition:'Safe'}]}],sourceUrl:'javascript:bad'},'ABBEY');assert.deepEqual(result.entries,[{partOfSpeech:'Noun',senses:['Safe']}]);assert.ok(!JSON.stringify(result).includes('javascript:'));
});
test('requests contain only normalized requested word and omit cookies/referrer; successful and missing lookups cache',async()=>{
 let calls=0,now=0;const client=new DefinitionClient(async(url,init)=>{calls++;assert.equal(url,DEFINITION_ENDPOINT+'abbey');assert.equal(init.credentials,'omit');assert.equal(init.referrerPolicy,'no-referrer');assert.equal(init.body,undefined);return response()},100,()=>now);
 const first=await client.lookup('abbey');first.entries[0].senses[0]='mutated';assert.notEqual((await client.lookup('ABBEY')).entries[0].senses[0],'mutated');assert.equal(calls,1);now=86400001;await client.lookup('ABBEY');assert.equal(calls,2);
 let misses=0;const missing=new DefinitionClient(async()=>{misses++;return response({},404)},100,()=>now);assert.deepEqual((await missing.lookup('QAJAQ')).entries,[]);await missing.lookup('QAJAQ');assert.equal(misses,1);now+=300001;await missing.lookup('QAJAQ');assert.equal(misses,2);
 await assert.rejects(client.lookup('../no'),(e:DefinitionError)=>e.reason==='invalid');
});
test('concurrent identical lookups dedupe; network, malformed and timeout errors remain retryable',async()=>{
 let resolve!:(response:Response)=>void,calls=0;const client=new DefinitionClient(async()=>{calls++;return new Promise<Response>(r=>resolve=r)},100);
 const one=client.lookup('ABBEY'),two=client.lookup('abbey');assert.equal(one,two);resolve(response());await one;assert.equal(calls,1);
 for(const [fetcher,reason] of [[async()=>{throw new Error('offline')},'network'],[async()=>response({},503),'network'],[async()=>new Response('not json'),'invalid'],[async()=>new Response('x'.repeat(200001)),'invalid']] as const){const broken=new DefinitionClient(fetcher,100);await assert.rejects(broken.lookup('ABBEY'),(e:DefinitionError)=>e.reason===reason);assert.equal(broken.peek('ABBEY'),null);}
 const timeout=new DefinitionClient(()=>new Promise<Response>(()=>{}),5);await assert.rejects(timeout.lookup('ABBEY'),(e:DefinitionError)=>e.reason==='timeout');
});
test('opening is local-only; debounce suppresses abandoned lookups; duplicate activation and cached reopen do no extra work',async()=>{
 let calls=0;const client=new DefinitionClient(async()=>{calls++;return response()},100);const session=new DefinitionSession(client,()=>{},15);
 session.open('ABBEY');assert.equal(phase(session),'idle');await sleep();assert.equal(calls,0);
 session.request();session.request();session.close();await sleep(25);assert.equal(calls,0);assert.equal(phase(session),'hidden');
 session.open('ABBEY');session.request();session.request();await sleep(25);assert.equal(calls,1);assert.equal(phase(session),'ready');session.close();session.open('abbey');assert.equal(phase(session),'ready');assert.equal(calls,1);
});
test('rapid word changes and close cancel in-flight work and reject stale completions',async()=>{
 const requests:{url:string;resolve:(r:Response)=>void;signal:AbortSignal}[]=[];const client=new DefinitionClient((url,init)=>new Promise<Response>(resolve=>requests.push({url,resolve,signal:init.signal as AbortSignal})),1000);const session=new DefinitionSession(client,()=>{},0);
 session.open('ABBEY');session.request();await sleep();session.open('APPLE');assert.equal(requests[0].signal.aborted,true);session.request();await sleep();requests[0].resolve(response());requests[1].resolve(response());await sleep();assert.equal(phase(session),'ready');assert.equal('word' in session.state&&session.state.word,'APPLE');assert.equal(client.peek('ABBEY'),null);
 session.open('CRANE');session.request();await sleep();session.close();requests[2].resolve(response());await sleep();assert.equal(phase(session),'hidden');
});
test('failed requests show error and can retry, while missing words remain distinct from offline errors',async()=>{
 let fail=true;const session=new DefinitionSession(new DefinitionClient(async()=>{if(fail)throw new Error('offline');return response()},100),()=>{},0);session.open('ABBEY');session.request();await sleep();assert.equal(phase(session),'error');fail=false;session.request();await sleep();assert.equal(phase(session),'ready');session.close();
 const missing=new DefinitionSession(new DefinitionClient(async()=>response({},404),100),()=>{},0);missing.open('QAJAQ');missing.request();await sleep();assert.equal(missing.state.phase,'missing');missing.close();
});
test('only submitted, currently suggested or explicitly revealed words are available for definitions',()=>{
 assert.equal(definitionVisible('APPLE',[],null),false);assert.equal(definitionVisible('APPLE',['ALLEY'],null,['CRANE']),false);assert.equal(definitionVisible('ALLEY',['ALLEY'],null),true);assert.equal(definitionVisible('CRANE',[],null,['CRANE']),true);assert.equal(definitionVisible('APPLE',[],'APPLE'),true);assert.equal(definitionVisible('<img>',[],'<img>'),false);
});
