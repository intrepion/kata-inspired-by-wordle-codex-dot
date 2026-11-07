import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {normalizeGuess} from '../src/language.ts';
for(const [name,locale] of [['italian','it-IT'],['swedish','sv-SE']] as const)test(`${name}: all answers have reviewed source senses and meaning coverage is accurately reported`,()=>{
 const read=(file:string)=>JSON.parse(readFileSync(`src/data/${name}/${file}`,'utf8')),vocabulary=read('vocabulary.json'),selection=read('answer-selection.json'),source=read('source.json'),coverage=read('coverage.json');
 for(let length=3;length<=11;length++){
  const {answers,guesses}=vocabulary[length],definitions=read(`definitions-${length}.json`);assert.ok(answers.length>=20);assert.ok(guesses.length>answers.length);assert.equal(new Set(guesses).size,guesses.length);assert.equal(new Set(answers.map((word:string)=>normalizeGuess(word,locale))).size,answers.length);
  for(const word of guesses){assert.equal(word.length,length);assert.equal(word,word.normalize('NFC'));assert.match(word,name==='italian'?/^[A-ZÀÈÉÌÒÓÙ]+$/:/^[A-ZÅÄÖ]+$/);assert.equal(Boolean(definitions[normalizeGuess(word,locale)]?.length),!coverage.lengths[length].missingMeanings.includes(word))}
  for(const word of answers){assert.ok(guesses.includes(word));assert.ok(selection[word].primarySense.gloss);assert.ok(definitions[normalizeGuess(word,locale)]?.length)}
 }
 for(const [file,hash] of Object.entries(source.inputs))assert.equal(createHash('sha256').update(readFileSync(`src/data/${name}/${file}`)).digest('hex'),hash);
 assert.equal(source.wiktionary.dataLicense,'CC-BY-SA-4.0');assert.equal(source.wordfreq.dataLicense,'CC-BY-SA-4.0');
 for(const file of ['NOTICE.txt','CC-BY-SA-4.0.txt','wordfreq-README.md','wordfreq-MIT-LICENSE.txt'])assert.ok(readFileSync(`public/third-party/${locale}/${file}`,'utf8').length>100);
});
test('Italian and Swedish generation reproduces all pinned outputs offline',()=>{execFileSync(process.execPath,['scripts/generate-italian-swedish.mjs','--check'])});
