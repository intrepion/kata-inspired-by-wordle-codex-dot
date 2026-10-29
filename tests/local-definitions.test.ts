import {test} from 'node:test';import assert from 'node:assert/strict';import {DefinitionClient} from '../src/definitions.ts';
test('default dictionary works without any third-party request and preserves honest missing entries',async()=>{
 const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('External requests forbidden')};
 try{const en=new DefinitionClient();const result=await en.lookup('APPLE');assert.match(result.entries[0]?.senses.join(' '),/fruit/i);assert.equal(calls,0);assert.ok(vocabulary(4,'en').allowed.has('ABYS'));const missing=await en.lookup('ABYS');assert.deepEqual(missing.entries,[]);assert.equal(calls,0);const es=new DefinitionClient(undefined,6000,Date.now,'es-MX');assert.match((await es.lookup('LUGAR')).entries.flatMap(e=>e.senses).join(' '),/place/i);assert.equal(calls,0)}finally{globalThis.fetch=old}
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

// Existing public client seam: English fallback must work offline without replacing simpler entries.
test('English Wiktionary fills previously missing accepted headwords offline with its own attribution',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>{throw Error('External requests forbidden')};
 try {
  const client=new DefinitionClient();
  for(const [word,meaning] of [['ABACA',/banana|fibre|fiber|hemp/i],['ABALONE',/mollusc|mollusk|shellfish|gastropod/i],['XYLEM',/vascular|plant|water|tissue/i],['ZYMURGY',/ferment/i]] as const){
   assert.ok(vocabulary(word.length,'en').allowed.has(word));
   const result=await client.lookup(word);
   assert.match(result.entries.flatMap(e=>e.senses).join(' '),meaning,word);
   assert.match(result.sourceUrl,/https:\/\/en\.wiktionary\.org\/wiki\//);
   assert.match(result.sourceLabel??'',/English Wiktionary/);assert.equal(result.license,'CC-BY-SA-4.0');
  }
  assert.match((await client.lookup('APPLE')).sourceUrl,/simple\.wiktionary\.org/);
  assert.match((await client.lookup('abacas')).entries.flatMap(e=>e.senses).join(' '),/\[form-of, plural\] plural of abaca/);
  assert.match((await client.lookup('BROIDER')).entries.flatMap(e=>e.senses).join(' '),/\[archaic\].*embroider/i);
  const fresh=await new DefinitionClient().lookup('ABACA');fresh.entries[0].senses[0]='changed';assert.match((await new DefinitionClient().lookup('ABACA')).entries[0].senses[0],/Musa textilis/);
 }finally{globalThis.fetch=old}
});

test('gap-fill dataset preserves original definitions and contains only bounded accepted English records',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/data/definitions/english-source.json',import.meta.url),'utf8'));
 const baseline=['8775c562000eee2bcd124a68a562cb4023f449633cc81d98a1709191e5ca0ab6','ef2c40365ad365eba4a1ca7d4765655ad4c6d88ac931e7a6b20a241fbfcd2418','402913c082899cfa527ae4662e43acb9fbb9288fe68073856575e13071805dc1','a10f29083afa3d664bbe252b8c584f5899739cb6e59fb1904f9c46cd1c5c2f69'];
 for(const length of [4,5,6,7]){
  const original=readFileSync(new URL(`../src/data/definitions/${length}.json`,import.meta.url));
  assert.equal(createHash('sha256').update(original).digest('hex'),baseline[length-4]);
  const base=JSON.parse(original.toString());const bytes=readFileSync(new URL(`../src/data/definitions/english-${length}.json`,import.meta.url));const table=JSON.parse(bytes.toString());
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.byLength[length].sha256);
  assert.equal(Object.keys(table).length,manifest.byLength[length].added);
  assert.equal(Object.keys(table).length+Object.keys(base).length,manifest.byLength[length].defined);
  for(const [word,entries] of Object.entries(table)){
   assert.equal(word.length,length);assert.ok(vocabulary(length,'en').allowed.has(word));assert.equal(base[word],undefined);
   assert.ok((entries as unknown[]).length>0&&(entries as unknown[]).length<=4);
   for(const entry of entries as {partOfSpeech:string;senses:string[]}[]){assert.deepEqual(Object.keys(entry).sort(),['partOfSpeech','senses']);assert.ok(entry.senses.length>0&&entry.senses.length<=4);assert.ok(entry.senses.every(s=>s.trim()&&s.length<=1800));}
  }
 }
});
