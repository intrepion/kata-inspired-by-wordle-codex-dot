import {test} from 'node:test';import assert from 'node:assert/strict';
import {dailyAnswer,DAY,dateKey} from '../src/domain.ts';import {vocabulary} from '../src/words.ts';
const start='2026-11-01',after=(n:number)=>dateKey(new Date(Date.parse(start)+n*DAY));
test('shuffled daily cycles visit every possible answer once, repeat without boundary duplicates and differ from alphabetical traversal',()=>{
 for(const language of ['en','es-MX'] as const)for(const length of [4,5,6,7]){
  const answers=vocabulary(length,language).answers,actual=answers.map((_,i)=>dailyAnswer(after(i),length,language));
  const old=answers.map((_,i)=>answers[(Math.floor((Date.parse(after(i))-Date.parse('2026-01-01'))/DAY))%answers.length]);
  assert.notDeepEqual(actual.slice(0,30),old.slice(0,30),'must no longer walk the alphabetical list');
  assert.equal(new Set(actual).size,answers.length);assert.deepEqual(new Set(actual),new Set(answers));
  for(let i=0;i<answers.length;i++)assert.equal(dailyAnswer(after(i+answers.length),length,language),actual[i]);
  assert.notEqual(actual.at(-1),dailyAnswer(after(answers.length),length,language));
 }
});
import {emptySave,encode,decode,recordDaily,dailyPuzzleDate,statistics} from '../src/persistence.ts';
import {legacyDailyAnswer,legacyDailyLabel} from '../src/daily-schedule.ts';import {newRun,submit,continueGuessing,status} from '../src/domain.ts';
import {initializeNotebookStats,beginStatsPuzzle,settleNotebookStats,notebookStatistics} from '../src/notebook-statistics.ts';
test('a legacy client’s post-boundary saved clues and wins keep their original answer and stats through extension, rollover and repeated reload',()=>{
 const date='2026-11-02',old=emptySave(date);old.history['2026-11-01']={won:true,turns:1};old.results['2026-11-01']=[legacyDailyAnswer('2026-11-01')];
 old.daily=newRun(legacyDailyAnswer(date));for(const word of [...vocabulary().allowed].filter(w=>w!==old.daily.answer).slice(0,6))old.daily=submit(old.daily,word).run;
 const input=JSON.parse(encode(old));delete input.dailyScheduleVersion;
 let restored=decode(JSON.stringify(input),date);assert.equal(restored.daily.answer,old.daily.answer);assert.deepEqual(restored.daily.guesses,old.daily.guesses);assert.equal(legacyDailyLabel(restored,date),'Legacy daily schedule');
 assert.equal(statistics(restored.results,date,restored.history).wins,1);initializeNotebookStats(restored);assert.equal(notebookStatistics(restored,'daily','all',date).wins,1);
 restored=decode(encode(restored),'2026-11-03');assert.equal(dailyPuzzleDate(restored),date);assert.equal(restored.daily.answer,old.daily.answer);
 restored.daily=submit(continueGuessing(restored.daily),old.daily.answer).run;assert.equal(status(restored.daily),'won');recordDaily(restored,date,restored.daily);settleNotebookStats(restored);
 restored=decode(encode(restored),'2026-11-03');settleNotebookStats(restored);assert.equal(restored.daily.answer,dailyAnswer('2026-11-03'));assert.equal(legacyDailyLabel(restored,'2026-11-03'),'');assert.equal(notebookStatistics(restored,'daily','all','2026-11-03').wins,2);assert.equal(restored.history[date].turns,7);
});
import {createHash} from 'node:crypto';
test('all pre-rollout dates keep their original identity and UTC offsets cross the activation correctly',()=>{
 for(const language of ['en','es-MX'] as const)for(const length of [4,5,6,7]){
  for(let i=0;i<304;i++){const date=dateKey(new Date(Date.parse('2026-01-01')+i*DAY));assert.equal(dailyAnswer(date,length,language),legacyDailyAnswer(date,length,language));}
 }
 assert.equal(dateKey(new Date('2026-10-31T19:00:00-05:00')),start);assert.equal(dateKey(new Date('2026-11-01T01:00:00+02:00')),'2026-10-31');
});
test('shuffle identity is frozen per language and length, independent of lookup order or difficulty',()=>{
 const expected:Record<string,string>={"en4":"208c9e3c6c09cc961c784cfde4b03aa87e3a275c91a404482eac4ad37267fb7b","en5":"964501f070d1ad2910c91027ca47b1706613b4511970e3b21cd63985487f275f","en6":"1807037e26d77d602bdad511bc26328028ead644611843482f7161bbe7be3fd7","en7":"4676b9efaca7f4e17641d0f37220ebdff7d8085785a9243962d2a00b490b8955","es-MX4":"53a34548668982a34023f4dc9245093682dafb1d94923a95abe5ac30489dee97","es-MX5":"2f1285b6c0f25c0be5d26a0c818c0b21759aeabd6f81b0349d39dc56e1fc1d5c","es-MX6":"e476b9846a1326c8a44de8cc132bbbbe59afdb88ee89b420a3deddcc88d29226","es-MX7":"a53ae6dd1baf737ec3ad3bcef70ce1f1d6016c169997bcd25eaa913e1019b5bf"}; // Complete-cycle stability vectors, not future-answer lists.
 for(const language of ['en','es-MX'] as const)for(const length of [4,5,6,7]){
  const first=vocabulary(length,language).answers.map((_,i)=>dailyAnswer(after(i),length,language));
  const backwards=first.map((_,i)=>dailyAnswer(after(first.length-1-i),length,language)).reverse();assert.deepEqual(first,backwards);
  const hash=createHash('sha256').update(first.join('\n')).digest('hex');assert.equal(hash,expected[language+length]);
 }
});
test('legacy post-boundary active and completed games migrate independently at every locale and length, without altering other modes',()=>{
 for(const language of ['en','es-MX'] as const)for(const length of [4,5,6,7]){
  const date='2026-11-02',old=emptySave(date,'hard',length,language),answer=legacyDailyAnswer(date,length,language);
  old.daily=submit(newRun(answer,'hard',language),answer).run;old.history[date]={won:true,turns:1};old.results[date]=[answer];
  const raw=JSON.parse(encode(old));delete raw.dailyScheduleVersion;
  const restored=decode(JSON.stringify(raw),date,length,language);assert.equal(restored.daily.answer,answer);assert.equal(status(restored.daily),'won');assert.deepEqual(restored.practice,old.practice);assert.deepEqual(restored.impossible,old.impossible);assert.equal(legacyDailyLabel(restored,date),'Legacy daily schedule');
  initializeNotebookStats(restored);assert.equal(notebookStatistics(restored,'daily','all',date).wins,1);assert.equal(statistics(restored.results,date,restored.history).wins,1);assert.deepEqual(decode(encode(restored),date,length,language),restored);
  const next=decode(encode(restored),'2026-11-03',length,language);assert.equal(next.daily.answer,dailyAnswer('2026-11-03',length,language));assert.equal(legacyDailyLabel(next,'2026-11-03'),'');assert.equal(next.history[date].won,true);assert.equal(next.settings.hardMode,true);
 }
});
test('current-schedule games and pre-boundary continued games survive midnight without reclassification or duplicate completion',()=>{
 for(const date of ['2026-10-31','2026-11-01']){
  let save=emptySave(date);initializeNotebookStats(save,true);const original=save.daily.answer;
  for(const word of [...vocabulary().allowed].filter(w=>w!==original).slice(0,6))save.daily=submit(save.daily,word).run;
  const tomorrow=after(date==='2026-10-31'?0:1);save=decode(encode(save),tomorrow);assert.equal(dailyPuzzleDate(save),date);assert.equal(save.daily.answer,original);assert.equal(legacyDailyLabel(save,date),'');
  save.daily=submit(continueGuessing(save.daily),original).run;recordDaily(save,date,save.daily);settleNotebookStats(save);save=decode(encode(save),tomorrow);settleNotebookStats(save);assert.equal(notebookStatistics(save,'daily','all',tomorrow).played,1);assert.equal(save.daily.answer,dailyAnswer(tomorrow));
 }
});
test('zero-guess legacy exposure survives migration, and corrupted schedule hints cannot supply arbitrary answers',()=>{
 const date='2026-11-01',old=emptySave(date,'strict');old.daily=newRun(legacyDailyAnswer(date),'strict');initializeNotebookStats(old,true);beginStatsPuzzle(old,'daily','strict');
 const raw=JSON.parse(encode(old));delete raw.dailyScheduleVersion;raw.daily.answer='XXXXX';raw.dailySchedules={'__proto__':'alphabetical-v1','2026-11-99':'alphabetical-v1','2026-12-01':'alphabetical-v1','2026-11-01':'arbitrary-answer'};
 const restored=decode(JSON.stringify(raw),date);assert.equal(restored.daily.answer,legacyDailyAnswer(date));assert.equal(restored.daily.strictMode,true);assert.equal(restored.notebookStats!.exposure.daily,'strict');assert.deepEqual(restored.dailySchedules,{[date]:'alphabetical-v1'});
 const fresh=emptySave(date,'strict'),next=decode(encode(fresh),date);assert.equal(next.daily.answer,dailyAnswer(date));assert.equal(legacyDailyLabel(next,date),'');assert.equal(next.dailySchedules,undefined);
});
