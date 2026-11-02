import {test} from 'node:test';import assert from 'node:assert/strict';
import {vocabulary,isSupportedLength,WORD_LENGTHS} from '../src/words.ts';import {dailyAnswer,newRun,submit,score,shareText} from '../src/domain.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';import {initializeNotebookStats,beginStatsPuzzle,settleNotebookStats,notebookStatistics} from '../src/notebook-statistics.ts';import {saveKeyForPath} from '../src/site.ts';import {dailyOneMix} from '../src/daily-variants.ts';import {dailySmashPair,parseSmashGuess} from '../src/smashare.ts';import {definitionWord} from '../src/definitions.ts';import {localDefinition} from '../src/local-definitions.ts';
for(const length of [3,8,9,10,11])test(`English ${length}: full lists, daily determinism, gameplay, saves, share and meanings`,async()=>{
 const {answers,allowed}=vocabulary(length,'en');assert.ok(answers.length>100);assert.ok(allowed.size>=answers.length);assert.equal(new Set(answers).size,answers.length);assert.ok(answers.every(w=>w.length===length&&allowed.has(w)));
 const date='2026-11-02',answer=dailyAnswer(date,length,'en');assert.equal(dailyAnswer(date,length,'en'),answer);const run=submit(newRun(answer),answer);assert.equal(run.error,undefined);assert.equal(run.run.guesses[0],answer);
 const save=emptySave(date,false,length,'en');initializeNotebookStats(save,true);assert.equal(beginStatsPuzzle(save,'daily','normal'),true);save.daily=run.run;settleNotebookStats(save);const restored=decode(encode(save),date,length,'en');assert.equal(restored.daily.guesses[0],answer);assert.equal(notebookStatistics(restored,'daily','all',date).wins,1);assert.notEqual(saveKeyForPath('/',length),saveKeyForPath('/',5));assert.ok(!shareText(date,run.run).includes(answer));
 assert.equal(definitionWord(answer),answer);const meaning=await localDefinition(answer,'en');assert.equal(meaning.word,answer);assert.ok(Array.isArray(meaning.entries));
 const pair=dailySmashPair(date,length,'en');assert.deepEqual(parseSmashGuess(pair.merged,length,'en'),pair);assert.equal(new Set(dailyOneMix(date,length,'en').map(p=>p.answer)).size,5);
});
test('extended language availability and boundaries are explicit',()=>{assert.deepEqual([...WORD_LENGTHS],[3,4,5,6,7,8,9,10,11]);for(const n of [3,8,9,10,11])assert.equal(isSupportedLength(n,'es-MX'),true);assert.equal(isSupportedLength(2,'en'),false);assert.equal(isSupportedLength(12,'en'),false)});
test('duplicate letters are consumed correctly at long lengths',()=>{assert.deepEqual(score('AAAAABBBBBB','BAAAAAAAAAA'),['elsewhere','exact','exact','exact','exact','elsewhere','absent','absent','absent','absent','absent'])});
test('new definition tables are checksum-pinned to accepted spellings',async()=>{
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');const manifest=JSON.parse(readFileSync(new URL('../src/data/definitions/extended-source.json',import.meta.url),'utf8'));
 for(const length of [3,8,9,10,11]){const bytes=readFileSync(new URL(`../src/data/definitions/extended-${length}.json`,import.meta.url)),table=JSON.parse(bytes.toString()),allowed=vocabulary(length,'en').allowed;
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.byLength[length].sha256);assert.equal(Object.keys(table).length,manifest.byLength[length].defined);assert.ok(Object.keys(table).every(word=>word.length===length&&allowed.has(word)));}
});

for(const length of [3,8,9,10,11])test(`Spanish ${length}: valid lists, deterministic daily, gameplay and isolated saves`,async()=>{
 const {answers,allowed}=vocabulary(length,'es-MX');assert.ok(answers.length>100);assert.ok(answers.every(w=>w.length===length&&allowed.has(w)));const date='2026-11-02',answer=dailyAnswer(date,length,'es-MX');assert.equal(dailyAnswer(date,length,'es-MX'),answer);
 const run=submit(newRun(answer,'normal','es-MX'),answer);assert.equal(run.error,undefined);const save=emptySave(date,false,length,'es-MX');initializeNotebookStats(save,true);assert.equal(beginStatsPuzzle(save,'daily','normal'),true);save.daily=run.run;settleNotebookStats(save);const restored=decode(encode(save),date,length,'es-MX');assert.equal(restored.daily.guesses[0],answer);assert.equal(notebookStatistics(restored,'daily','all',date).wins,1);assert.ok(!shareText(date,run.run).includes(answer));
 assert.notEqual(saveKeyForPath('/',length,'es-MX'),saveKeyForPath('/',length,'en'));const pair=dailySmashPair(date,length,'es-MX');assert.deepEqual(parseSmashGuess(pair.merged,length,'es-MX'),pair);assert.equal(new Set(dailyOneMix(date,length,'es-MX').map(p=>p.answer)).size,5);
});
test('new Spanish meanings are sourced and missing translations are honest',async()=>{const {TranslationClient}=await import('../src/translations.ts');const c=new TranslationClient();const known=await c.lookup('COMPUTADORA','es-MX');assert.equal(known.phase,'ready');if(known.phase==='ready'){assert.match(known.entry.sourceUrl,/^https:\/\/es\.wiktionary\.org\//);assert.ok(known.entry.senses.some(s=>s.english.length>0))}assert.equal((await c.lookup('ZZZZZZZZZZZ','es-MX')).phase,'missing')});
test('extended Spanish answers satisfy the pinned frequency and lexical policy',async()=>{
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');const {selectSpanishAnswer}=await import('../scripts/spanish-eligibility-policy.mjs');
 const root=new URL('../src/data/spanish/',import.meta.url),read=(n:string)=>readFileSync(new URL(n,root),'utf8'),manifest=JSON.parse(read('extended-source.json'));
 for(const [name,digest] of Object.entries(manifest.inputs))assert.equal(createHash('sha256').update(read(name)).digest('hex'),digest);
 const frequency=JSON.parse(read('extended-frequency-evidence.json')),lexical=JSON.parse(read('extended-lexical-evidence.json'));
 for(const length of [3,8,9,10,11])for(const word of vocabulary(length,'es-MX').answers)assert.equal(selectSpanishAnswer(word,frequency[word],lexical[word]).possible,true,word);
});
