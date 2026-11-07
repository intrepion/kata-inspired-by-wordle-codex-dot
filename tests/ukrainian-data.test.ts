import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const read=(name:string)=>JSON.parse(readFileSync(new URL('../src/data/ukrainian/'+name,import.meta.url),'utf8'));
test('Ukrainian pack has distinct Cyrillic guesses and curated defined answers at every length',()=>{
 const vocabulary=read('vocabulary.json'),selection=read('answer-selection.json');
 for(let length=3;length<=11;length++){const {answers,guesses}=vocabulary[length],definitions=read(`definitions-${length}.json`);assert.ok(answers.length>=40);assert.ok(guesses.length>answers.length);assert.equal(new Set(answers).size,answers.length);assert.equal(new Set(guesses).size,guesses.length);
 for(const word of guesses){assert.match(word,/^[АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ]+$/u);assert.equal(word,word.normalize('NFC'));assert.equal([...word].length,length);assert.ok(definitions[word]?.length)}
 for(const word of answers){assert.ok(guesses.includes(word));assert.ok(selection[word].senses.length)}
 }
});
test('Ukrainian licensed inputs are pinned and generated output reproduces offline',()=>{
 const source=read('source.json');for(const [name,hash] of Object.entries(source.inputs))assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/ukrainian/'+name,import.meta.url))).digest('hex'),hash);
 assert.equal(source.wiktionary.dataLicense,'CC-BY-SA-4.0');assert.equal(source.wordfreq.dataLicense,'CC-BY-SA-4.0');execFileSync(process.execPath,['scripts/generate-ukrainian.mjs','--check']);
});

test('Ukrainian source spellings never lose required apostrophes or native letters',()=>{
 const vocabulary=read('vocabulary.json');const guesses=Object.values(vocabulary).flatMap((data:any)=>data.guesses) as string[];
 for(const word of guesses)assert.doesNotMatch(word,/[’ʼ'ЁЪЫЭA-Z]/u);
 for(const word of ['МЯСО','ПЯТЬ','СІМЯ','ОБЄКТ'])assert.ok(!guesses.includes(word),word);
 const source=read('source.json');assert.match(source.wiktionary.modifications,/Apostrophes are excluded/);assert.doesNotMatch(JSON.stringify(source),/VESUM|dict_uk/i);
});

test('Ukrainian frequency exceptions are explicit and narrowly reviewed',()=>{
 const selection=read('answer-selection.json'),coverage=read('coverage.json');
 assert.deepEqual(Object.keys(coverage.editorialSupplements),['ҐРУНТ']);
 assert.deepEqual(Object.keys(selection).filter(word=>selection[word].zipf<4.3),['ҐРУНТ']);
 assert.equal(selection['ҐРУНТ'].zipf,3.82);assert.match(selection['ҐРУНТ'].editorialSupplement,/Individually reviewed/);
 assert.ok(selection['ҐРУНТ'].senses.some((sense:any)=>/soil/.test(sense.gloss)));assert.ok(selection['ҐРУНТ'].senses.every((sense:any)=>!sense.tags.includes('historical')));
});
