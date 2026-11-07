import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const read=(name:string)=>JSON.parse(readFileSync(new URL('../src/data/german/'+name,import.meta.url),'utf8'));
test('German data has broad defined guesses and curated standalone answers at every length',()=>{
 const vocabulary=read('vocabulary.json'),canonical=read('canonical-spellings.json'),selection=read('answer-selection.json');
 for(let length=3;length<=11;length++){
  const {answers,guesses}=vocabulary[length],definitions=read(`definitions-${length}.json`);
  assert.ok(answers.length>=40);assert.ok(guesses.length>answers.length);
  for(const word of guesses){assert.match(word,/^[A-ZÄÖÜẞ]+$/u);assert.equal([...word].length,length);assert.ok(definitions[word]?.length);assert.ok(canonical[word]);assert.equal(canonical[word].normalize('NFC').replace(/ß/g,'ẞ').toUpperCase(),word);}
  for(const word of answers){assert.ok(guesses.includes(word));assert.ok(selection[word].senses.length);assert.ok(selection[word].zipf>=4.3);}
 }
 assert.ok(vocabulary[6].guesses.includes('STRAẞE'));assert.equal(canonical.STRAẞE,'Straße');
 assert.ok(vocabulary[4].guesses.includes('GROẞ'));assert.ok(vocabulary[4].guesses.includes('WEIẞ'));assert.ok(vocabulary[3].guesses.includes('FÜR'));assert.ok(vocabulary[3].guesses.includes('TÜR'));
});
test('German pins lexical inputs and regenerates byte-for-byte offline',()=>{
 const source=read('source.json');for(const [name,hash] of Object.entries(source.inputs))assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/german/'+name,import.meta.url))).digest('hex'),hash);
 assert.equal(source.wiktionary.dataLicense,'CC-BY-SA-4.0');assert.equal(source.wordfreq.dataLicense,'CC-BY-SA-4.0');
 execFileSync(process.execPath,['scripts/generate-german.mjs','--check']);
});
