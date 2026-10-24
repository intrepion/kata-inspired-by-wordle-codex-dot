import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DefinitionClient} from '../src/definitions.ts';
import {InlineDefinitions} from '../src/inline-definitions.ts';
const sleep=(ms=15)=>new Promise(r=>setTimeout(r,ms));
const response=(word='A meaning.')=>new Response(JSON.stringify({en:[{partOfSpeech:'Noun',definitions:[{definition:word}]}]}));
test('visible words automatically load without activation, bounded to two concurrent requests and deduplicated',async()=>{
 const requests:{word:string;resolve:(r:Response)=>void}[]=[];
 const client=new DefinitionClient(async url=>new Promise<Response>(resolve=>requests.push({word:url.split('/').at(-1)!,resolve})),1000);
 const words:string[]=[];const session=new InlineDefinitions(client,word=>words.push(word),0);
 try{session.show(['ABBEY','APPLE','ABBEY','CRANE']);await sleep();assert.deepEqual(requests.map(r=>r.word),['abbey','apple']);requests[0].resolve(response());await sleep();assert.equal(requests[2].word,'crane');requests[1].resolve(response());requests[2].resolve(response());await sleep();session.show(['ABBEY','APPLE','CRANE']);await sleep();assert.equal(requests.length,3);assert.ok(words.includes('ABBEY'))}finally{session.close()}
});
test('previously cached visible words publish immediately without another request',async()=>{
 let calls=0;const client=new DefinitionClient(async()=>{calls++;return response()},100);await client.lookup('ABBEY');const words:string[]=[];const session=new InlineDefinitions(client,word=>words.push(word),0);
 try{session.show(['ABBEY']);assert.deepEqual(words,['ABBEY']);assert.equal(session.state('ABBEY').phase,'ready');assert.equal(calls,1)}finally{session.close()}
});
test('abandoned words cancel, delayed responses cannot publish into another visible list, and close stops queued work',async()=>{
 const requests:{word:string;signal:AbortSignal;resolve:(r:Response)=>void}[]=[];const published:string[]=[];
 const client=new DefinitionClient((url,init)=>new Promise<Response>(resolve=>requests.push({word:url.split('/').at(-1)!,signal:init.signal as AbortSignal,resolve})),1000);
 const session=new InlineDefinitions(client,word=>published.push(word),0);
 session.show(['ABBEY','APPLE','CRANE']);await sleep();session.show(['MASSE']);await sleep();assert.equal(requests[0].signal.aborted,true);assert.equal(requests[1].signal.aborted,true);assert.deepEqual(requests.map(r=>r.word),['abbey','apple','masse']);requests[0].resolve(response('Stale'));requests[1].resolve(response('Stale'));requests[2].resolve(response('Current'));await sleep();assert.deepEqual(published,['MASSE']);assert.equal(session.state('MASSE').phase,'ready');session.show(['BEACH','ENTRY','VALVE']);await sleep();session.close();for(const request of requests.slice(3)){assert.equal(request.signal.aborted,true);request.resolve(response('Late'))}await sleep();assert.deepEqual(published,['MASSE']);assert.equal(requests.length,5);
});
test('missing, offline, malformed and timed-out entries stay distinct and repeated renders never hammer failures',async()=>{
 let calls=0;const client=new DefinitionClient(async url=>{calls++;if(url.endsWith('qajaq'))return new Response('{}',{status:404});if(url.endsWith('audio'))throw new Error('offline');if(url.endsWith('entry'))return new Response('bad');return new Promise<Response>(()=>{})},20);
 const session=new InlineDefinitions(client,()=>{},0);try{session.show(['QAJAQ','AUDIO','ENTRY','BEACH']);await sleep(80);assert.equal(session.state('QAJAQ').phase,'missing');assert.deepEqual(session.state('AUDIO'),{phase:'error',reason:'network'});assert.deepEqual(session.state('ENTRY'),{phase:'error',reason:'invalid'});assert.deepEqual(session.state('BEACH'),{phase:'error',reason:'timeout'});for(let i=0;i<10;i++)session.show(['QAJAQ','AUDIO','ENTRY','BEACH']);await sleep();assert.equal(calls,4)}finally{session.close()}
});
test('debounce avoids fetching words which disappear immediately and only normalized bounded visible words are sent',async()=>{
 const calls:string[]=[];const session=new InlineDefinitions(new DefinitionClient(async url=>{calls.push(url.split('/').at(-1)!);return response()},100),()=>{},20);
 try{session.show(['ABBEY']);session.show([]);await sleep(35);assert.deepEqual(calls,[]);session.show(['../no','apple','APPLE','AUDIO']);await sleep(50);assert.deepEqual(calls,['apple','audio']);assert.equal(session.state('APPLE').phase,'ready')}finally{session.close()}
});
