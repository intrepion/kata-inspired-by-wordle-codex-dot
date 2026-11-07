import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const read=(name:string)=>JSON.parse(readFileSync(new URL('../src/data/portuguese/'+name,import.meta.url),'utf8'));
const key=(word:string)=>word.normalize('NFD').replace(/\p{M}/gu,'').toUpperCase();
for(const region of ['br','pt'])test(`Portuguese ${region} sources, meanings, collisions and curated pools`,()=>{
 const vocabulary=read(`vocabulary-${region}.json`),selection=read(`answer-selection-${region}.json`),membership=new Set(read(`membership-${region}.json`)),collisions=read(`collisions-${region}.json`),review=read(`review-${region}.json`);
 for(let length=3;length<=11;length++){
  const {answers,guesses}=vocabulary[length],definitions=read(`definitions-${region}-${length}.json`);
  assert.ok(answers.length>=5);assert.ok(guesses.length>answers.length);assert.equal(new Set(answers.map(key)).size,answers.length);
  assert.ok(answers.some((first:string)=>answers.some((second:string)=>key(first)!==key(second)&&key(first).slice(0,2)===key(second).slice(-2))));
  for(const word of guesses){assert.match(word,/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ]+$/u);assert.equal(word.normalize('NFC'),word);assert.equal([...word].length,length);assert.ok(membership.has(word));assert.ok(definitions[key(word)]?.some((entry:{sourceWord:string})=>entry.sourceWord.toUpperCase()===word));}
  for(const word of answers){assert.ok(guesses.includes(word));assert.ok(review.approved.includes(word));assert.ok(selection[word].senses.length);assert.equal(selection[word].key,key(word));assert.ok(!Object.hasOwn(review.excluded,word));const primary=review.primarySenses[word],entry=definitions[key(word)].find((item:{sourceWord:string;partOfSpeech:string})=>item.sourceWord===primary.sourceWord&&item.partOfSpeech===primary.partOfSpeech);assert.ok(entry.senses[0].endsWith(primary.gloss));}
 }
 assert.ok(collisions.AVO.includes('AVÓ'));assert.ok(collisions.AVO.includes('AVÔ'));assert.ok(vocabulary[3].guesses.includes('AVÓ'));assert.ok(vocabulary[3].guesses.includes('AVÔ'));
 assert.ok(vocabulary[4].guesses.includes('CASA'));assert.ok(read(`definitions-${region}-4.json`).CASA.some((entry:{senses:string[]})=>entry.senses.some(sense=>/home|abode/i.test(sense))));
});
test('Portuguese sources retain explicit regional licenses and reproduce offline',()=>{
 const source=read('source.json');for(const [name,hash] of Object.entries(source.inputs))assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/portuguese/'+name,import.meta.url))).digest('hex'),hash);
 assert.equal(source.wiktionary.dataLicense,'CC-BY-SA-4.0');assert.equal(source.wordfreq.dataLicense,'CC-BY-SA-4.0');assert.equal(source.regionalSources.br.license,'LGPL-3.0');assert.equal(source.regionalSources.pt.license,'MPL-1.1');
 execFileSync(process.execPath,['scripts/generate-portuguese.mjs','--verify-regions','--check']);
});
test('Portuguese membership preserves explicit regional orthographic differences',()=>{
 const br=new Set(read('membership-br.json')),pt=new Set(read('membership-pt.json'));
 assert.ok(br.has('ÔNIBUS'));assert.ok(!pt.has('ÔNIBUS'));assert.ok(br.has('TÊNIS'));assert.ok(!br.has('TÉNIS'));assert.ok(pt.has('TÉNIS'));assert.ok(!pt.has('TÊNIS'));
});
