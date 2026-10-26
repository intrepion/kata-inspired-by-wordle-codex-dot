import {test} from 'node:test';import assert from 'node:assert/strict';import {DefinitionClient} from '../src/definitions.ts';
test('default dictionary works without any third-party request and preserves honest missing entries',async()=>{
 const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('External requests forbidden')};
 try{const en=new DefinitionClient();const result=await en.lookup('APPLE');assert.match(result.entries[0]?.senses.join(' '),/fruit/i);assert.equal(calls,0);assert.ok(vocabulary(5,'en').allowed.has('ABACA'));const missing=await en.lookup('ABACA');assert.deepEqual(missing.entries,[]);assert.equal(calls,0);const es=new DefinitionClient(undefined,6000,Date.now,'es-MX');assert.match((await es.lookup('LUGAR')).entries.flatMap(e=>e.senses).join(' '),/place/i);assert.equal(calls,0)}finally{globalThis.fetch=old}
});

test('local meanings stay language/length isolated, labelled, immutable and available after a fresh client',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>{throw Error('No external access')};
 try{for(const [en,es] of [['BOOK','CASA'],['APPLE','LUGAR'],['LETTER','CAMINO'],['BALLOON','CAMINAR']]){const english=await new DefinitionClient().lookup(en);assert.ok(english.entries.length,en);assert.match(english.sourceUrl,/simple\.wiktionary\.org/);const spanish=await new DefinitionClient(undefined,6000,Date.now,'es-MX').lookup(es);assert.ok(spanish.entries.length,es);assert.notDeepEqual(spanish.entries,english.entries);const before=JSON.stringify(english);english.entries[0].senses[0]='changed';assert.equal(JSON.stringify(await new DefinitionClient().lookup(en)),before)}
 const original=await new DefinitionClient(undefined,6000,Date.now,'es-MX').lookup('LUGAR');assert.match(original.sourceLabel??'',/AI-authored/);assert.match(original.note??'',/not a dictionary quotation/);
 assert.deepEqual((await new DefinitionClient(undefined,6000,Date.now,'es-MX').lookup('ZZZZZZZ')).entries,[]);
 await assert.rejects(new DefinitionClient().lookup('../bad'));
 }finally{globalThis.fetch=old}
});

import {createHash} from 'node:crypto';import {readFileSync} from 'node:fs';import {vocabulary} from '../src/words.ts';
test('filtered dictionary has reproducible hashes, accepted-only words and no quotation/media payloads',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/data/definitions/source.json',import.meta.url),'utf8'));
 for(const length of [4,5,6,7]){const bytes=readFileSync(new URL(`../src/data/definitions/${length}.json`,import.meta.url));const table=JSON.parse(bytes.toString());assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.byLength[length].sha256);assert.equal(Object.keys(table).length,manifest.byLength[length].defined);for(const [word,entries] of Object.entries(table)){assert.equal(word.length,length);assert.ok(vocabulary(length,'en').allowed.has(word));for(const entry of entries as {partOfSpeech:string;senses:string[]}[]){assert.deepEqual(Object.keys(entry).sort(),['partOfSpeech','senses']);assert.ok(entry.senses.length>0&&entry.senses.length<=4);assert.ok(entry.senses.every(s=>s.trim()&&s.length<=1800));}}}
});
