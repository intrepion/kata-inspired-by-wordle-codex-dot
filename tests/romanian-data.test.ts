import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const read=(name:string)=>JSON.parse(readFileSync(new URL('../src/data/romanian/'+name,import.meta.url),'utf8'));
test('Romanian pack has distinct Latin guesses and curated defined answers at every length',()=>{
 const vocabulary=read('vocabulary.json'),selection=read('answer-selection.json');
 for(let length=3;length<=11;length++){const {answers,guesses}=vocabulary[length],definitions=read(`definitions-${length}.json`);assert.ok(answers.length>=20);assert.ok(guesses.length>answers.length);assert.equal(new Set(answers).size,answers.length);assert.equal(new Set(guesses).size,guesses.length);
 for(const word of guesses){assert.match(word,/^[A-ZĂÂÎȘȚ]+$/u);assert.equal(word,word.normalize('NFC'));assert.equal([...word].length,length);assert.ok(definitions[word]?.length)}
 for(const word of answers){assert.ok(guesses.includes(word));assert.ok(selection[word].senses.length)}
 }
});
test('Romanian licensed inputs are pinned and generated output reproduces offline',()=>{
 const source=read('source.json');for(const [name,hash] of Object.entries(source.inputs))assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/romanian/'+name,import.meta.url))).digest('hex'),hash);
 assert.equal(source.wiktionary.dataLicense,'CC-BY-SA-4.0');assert.equal(source.wordfreq.dataLicense,'CC-BY-SA-4.0');execFileSync(process.execPath,['scripts/generate-romanian.mjs','--check']);
});

test('Romanian source identities preserve modern letters and reject removed punctuation',()=>{
 const vocabulary=read('vocabulary.json'),lexical=read('lexical-evidence.json'),source=read('source.json');
 for(const data of Object.values(vocabulary) as any[])for(const word of data.guesses){assert.doesNotMatch(word,/[ŞŢşţ’ʼ'\-]/u);for(const entry of lexical[word])assert.equal(entry.sourceWord.normalize('NFC').replace(/[şŞ]/g,'ș').replace(/[ţŢ]/g,'ț').toUpperCase(),word)}
 assert.match(source.wiktionary.modifications,/Legacy cedilla/);assert.match(source.wiktionary.modifications,/Apostrophes and hyphens are excluded/);
});

test('Romanian known bad source senses are removed rather than invented replacements',()=>{
 const review=read('review.json'),selection=read('answer-selection.json');assert.ok(review.rejectedSenses.length>0);
 for(const item of review.rejectedSenses){const definitions=read(`definitions-${item.word.length}.json`)[item.word]??[];
  for(const entry of definitions.filter((entry:any)=>entry.sourceWord===item.sourceWord&&entry.partOfSpeech===item.partOfSpeech))assert.ok(entry.senses.every((sense:string)=>sense!==item.gloss&&!sense.endsWith('] '+item.gloss)));
  assert.ok(!(selection[item.word]?.senses??[]).some((sense:any)=>sense.sourceWord===item.sourceWord&&sense.partOfSpeech===item.partOfSpeech&&sense.gloss===item.gloss));
 }
});
