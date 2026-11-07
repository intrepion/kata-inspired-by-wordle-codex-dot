import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const read=(name:string)=>JSON.parse(readFileSync(new URL('../src/data/russian/'+name,import.meta.url),'utf8'));
test('Russian pack has distinct Cyrillic guesses and curated defined answers at every length',()=>{
 const vocabulary=read('vocabulary.json'),selection=read('answer-selection.json');
 for(let length=3;length<=11;length++){const {answers,guesses}=vocabulary[length],definitions=read(`definitions-${length}.json`);assert.ok(answers.length>=5);assert.ok(guesses.length>answers.length);assert.equal(new Set(answers).size,answers.length);assert.equal(new Set(guesses).size,guesses.length);
 for(const word of guesses){assert.match(word,/^[А-ЯЁ]+$/u);assert.equal(word,word.normalize('NFC'));assert.equal([...word].length,length);assert.ok(definitions[word]?.length)}
 for(const word of answers){assert.ok(guesses.includes(word));assert.ok(selection[word].senses.length)}
 }
});
test('Russian licensed inputs are pinned and generated output reproduces offline',()=>{
 const source=read('source.json');for(const [name,hash] of Object.entries(source.inputs))assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/russian/'+name,import.meta.url))).digest('hex'),hash);
 assert.equal(source.wiktionary.dataLicense,'CC-BY-SA-4.0');assert.equal(source.wordfreq.dataLicense,'CC-BY-SA-4.0');execFileSync(process.execPath,['scripts/generate-russian.mjs','--check']);
});
