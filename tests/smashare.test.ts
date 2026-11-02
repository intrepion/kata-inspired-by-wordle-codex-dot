import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailySmashPair,makeSmashPair,parseSmashGuess,scoreSmash,smashPairCount} from '../src/smashare.ts';
import {vocabulary,WORD_LENGTHS,isSupportedLength} from '../src/words.ts';

test('first word starts with the end of the second and is displayed second',()=>{
 const pair=makeSmashPair('sheep','fresh');assert.deepEqual(pair,{first:'sheep',second:'fresh',merged:'fresheep'});
 assert.equal(makeSmashPair('fresh','sheep'),undefined);
 assert.equal(makeSmashPair('aaaa','aaaa'),undefined);
});
for(const language of ['en','es-MX'] as const)for(const length of WORD_LENGTHS.filter(n=>isSupportedLength(n,language)))test(`${language} ${length}: deterministic, eligible and parseable`,()=>{
 assert.ok(smashPairCount(length,language)>0);
 const a=dailySmashPair('2026-11-02',length,language),b=dailySmashPair('2026-11-02',length,language),answers=vocabulary(length,language).answers;
 assert.deepEqual(a,b);assert.ok(answers.includes(a.first));assert.ok(answers.includes(a.second));assert.equal(a.first.slice(0,2),a.second.slice(-2));assert.deepEqual(parseSmashGuess(a.merged,length,language),a);
 assert.equal(parseSmashGuess('!'.repeat(2*length-2),length,language),undefined);
});
test('shared seam is counted once with duplicate-letter feedback',()=>{
 const answer=makeSmashPair('sheep','fresh')!,guess=makeSmashPair('sheet','fresh')!;
 assert.deepEqual(scoreSmash(answer,guess),['exact','exact','exact','exact','exact','exact','exact','absent']);
});
test('rejects invalid dates and dictionary guesses',()=>{
 assert.throws(()=>dailySmashPair('2026-02-30',5,'en'));
 assert.equal(parseSmashGuess('zzzzzzzz',5,'en'),undefined);
});

test('game rejects invalid guesses and restores valid state by replay',async()=>{
 const {newSmashRun,submitSmash,restoreSmashRun,smashStatus}=await import('../src/smashare.ts');
 const answer=dailySmashPair('2026-11-02',5,'en'),run=newSmashRun(answer,'en','strict');
 assert.ok(submitSmash(run,'zzzzzzzz').error);
 const submitted=submitSmash(run,answer.merged);assert.equal(submitted.error,undefined);assert.equal(smashStatus(submitted.run),'won');
 assert.deepEqual(restoreSmashRun(submitted.run,'en',5,answer),submitted.run);
 assert.equal(restoreSmashRun({...submitted.run,guesses:['zzzzzzzz']},'en',5,answer),undefined);
});

test('Smashare schedules have isolated, date-scoped storage',async()=>{
 const {variantKey,parseSelection}=await import('../src/variant-context.ts');
 const daily={rules:'smashare',schedule:'daily'} as const,practice={rules:'smashare',schedule:'practice'} as const;
 assert.notEqual(variantKey('notebook',daily,'2026-11-02'),variantKey('notebook',daily,'2026-11-03'));
 assert.notEqual(variantKey('notebook',daily,'2026-11-02'),variantKey('notebook',practice,'2026-11-02'));
 assert.notEqual(variantKey('notebook',practice,'2026-11-02'),'notebook');
 assert.deepEqual(parseSelection(JSON.stringify(daily),{rules:'conquest',schedule:'daily'}),daily);
});

test('Easy suggestions use clues only and every suggested pair is valid',async()=>{
 const {newSmashRun,suggestSmash}=await import('../src/smashare.ts');
 const a=newSmashRun(dailySmashPair('2026-11-02',5,'en'),'en','easy');
 const b=newSmashRun(dailySmashPair('2026-11-03',5,'en'),'en','easy');
 const result=suggestSmash(a);assert.deepEqual(result,suggestSmash(b));assert.equal(result.pairs.length,5);
 for(const pair of result.pairs)assert.deepEqual(parseSmashGuess(pair.merged,5,'en'),pair);
});
test('difficulty changes preserve earlier assistance and reject incompatible history',async()=>{
 const {newSmashRun,submitSmash,changeSmashDifficulty}=await import('../src/smashare.ts');
 let run=newSmashRun(dailySmashPair('2026-11-02',5,'en'),'en','normal');
 run=submitSmash(run,'FRESHEEP').run;const easier=changeSmashDifficulty(run,'easy');assert.equal(easier.error,undefined);assert.equal(easier.run.assisted,true);assert.equal(easier.run.easiest,'easy');
 assert.equal(changeSmashDifficulty(easier.run,'normal').run.easiest,'easy');
 const second=submitSmash(run,'FISHYENA').run;const rejected=changeSmashDifficulty(second,'strict');assert.ok(rejected.error);assert.equal(rejected.run,second);
});
test('Smashare completion tracking is isolated and idempotent',async()=>{
 const {newSmashRun,submitSmash}=await import('../src/smashare.ts');const {addSmashResult,summarizeSmash,readSmashResults}=await import('../src/smash-statistics.ts');
 const a=dailySmashPair('2026-11-02',5,'en');let run=newSmashRun(a,'en','normal');run=submitSmash(run,a.merged).run;
 const records=addSmashResult([],'2026-11-02','2026-11-02',run);assert.equal(addSmashResult(records,'2026-11-02','2026-11-02',run).length,1);
 assert.equal(summarizeSmash(readSmashResults(JSON.stringify(records)),'all','all','2026-11-02').wins,1);
 assert.equal(summarizeSmash(records,'easy','all','2026-11-02').played,0);
 assert.equal(summarizeSmash(records,'all','all','2026-11-01').played,0);
});

test('legacy results keep unknown date and assistance rather than inventing history',async()=>{
 const {newSmashRun,submitSmash,restoreSmashRun,changeSmashDifficulty}=await import('../src/smashare.ts');const {addSmashResult,readSmashResults}=await import('../src/smash-statistics.ts');
 const answer=dailySmashPair('2026-11-02',5,'en');const fresh=newSmashRun(answer,'en','normal');const {easiest,assisted,...old}=fresh;
 const restored=restoreSmashRun(old,'en',5)!;assert.equal(restored.easiest,undefined);assert.equal(restored.assisted,undefined);
 assert.equal(changeSmashDifficulty(restored,'hard').run.easiest,undefined);
 const ended=submitSmash(restored,answer.merged).run;const rows=addSmashResult([],'legacy-last',null,ended);assert.equal(rows[0].difficulty,'legacy');assert.equal(rows[0].assisted,null);assert.equal(readSmashResults(JSON.stringify(rows))[0].date,null);
});
test('suggestions reproduce observed feedback after a guess',async()=>{
 const {newSmashRun,submitSmash,suggestSmash}=await import('../src/smashare.ts');let run=newSmashRun(dailySmashPair('2026-11-02',5,'en'),'en','easy');run=submitSmash(run,'FRESHEEP').run;
 const expected=scoreSmash(run.answer,parseSmashGuess('FRESHEEP',5,'en')!);const result=suggestSmash(run);
 assert.ok(result.pairs.length);for(const pair of result.pairs)assert.deepEqual(scoreSmash(pair,parseSmashGuess('FRESHEEP',5,'en')!),expected);
});

test('statistics contexts separate all rules and schedules without changing legacy keys',async()=>{
 const {variantKey,modeFor}=await import('../src/variant-context.ts');
 for(const rules of ['conquest','absurd','one','smashare'] as const)for(const schedule of ['daily','practice'] as const){
  const selection={rules,schedule},key=variantKey('base',selection,'2026-11-02',0);
  if(rules==='conquest')assert.equal(key,'base');
  if(rules==='absurd')assert.equal(modeFor(selection),'impossible');
  if(rules==='one')assert.equal(modeFor(selection),'one');
  if(rules==='smashare')assert.ok(key.includes(`smashare.v1.${schedule}`));
  if(schedule==='daily'&&rules!=='conquest')assert.ok(key.includes('2026-11-02'));
 }
});
