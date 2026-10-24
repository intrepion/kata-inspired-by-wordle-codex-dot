import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ANSWERS,ALLOWED} from '../src/words.ts';
import {decode,emptySave,encode,recordDaily,statistics} from '../src/persistence.ts';
import {dailyAnswer,newRun,submit,choosePractice,difficulty} from '../src/domain.ts';
import {newImpossible,submitImpossible,impossibleSnapshot,restoreImpossible} from '../src/impossible.ts';
import {possibleAnswers,observedClues} from '../src/observations.ts';
const today='2026-04-02';
test('all pre-update schemas reset rounds, settings and lifetime records rather than migrating them',()=>{
 for(const version of [1,2]){const old=JSON.parse(encode(emptySave(today,'strict')));old.version=version;old.settings={contrast:true,hardMode:false,easyMode:true,suboptimal:true};old.results={'2026-04-01':[dailyAnswer('2026-04-01')]};old.history={'2026-04-01':{won:true,turns:1}};old.mode='evil';old.evil={version:1,guesses:['AUDIO'],draft:'PAS'};assert.deepEqual(decode(JSON.stringify(old),today),emptySave(today));}
});
test('new-format completed rounds and statistics survive repeated reloads after the one-time reset',()=>{
 const save=emptySave(today,'hard');save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,today,save.daily);save.practice.draft='CRA';
 const restored=decode(encode(save),today);assert.deepEqual(restored,save);assert.equal(statistics(restored.results,today,restored.history).wins,1);assert.deepEqual(decode(encode(restored),today),restored);
});
test('corrupt or unsupported current data resets safely to defaults',()=>{
 const save=emptySave(today,'easy');save.daily=submit(save.daily,'ADIEU').run;save.settings.contrast=true;
 const raw=JSON.parse(encode(save));raw.dataset='future-or-corrupt';assert.deepEqual(decode(JSON.stringify(raw),today),emptySave(today));assert.deepEqual(decode('{bad',today),emptySave(today));
 assert.equal(restoreImpossible({...impossibleSnapshot(newImpossible()),dataset:'old'}),null);
});
test('ordinary schedule, practice, Absurd and advice use the current curated answer selection',()=>{
 assert.equal(new Set(ANSWERS).size,3493);assert.equal(ALLOWED.size,11193);for(const answer of ANSWERS)assert.ok(ALLOWED.has(answer));
 assert.equal(dailyAnswer('2026-01-01'),'ABACK');assert.equal(choosePractice('ABACK',()=>0).answer,'ABATE');assert.deepEqual(newImpossible().candidates,ANSWERS);assert.deepEqual(possibleAnswers({guesses:[],feedback:[]}),ANSWERS);
 let run=newImpossible();for(const word of ['AUDIO','ENTRY','BEACH','VALVE','GAFFE'])run=submitImpossible(run,word).run;assert.equal(possibleAnswers(observedClues(run)).length,5);assert.deepEqual(possibleAnswers(observedClues(run)),run.candidates);assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);
});
test('current-format UTC rollover retains newly earned history and practice preferences',()=>{
 const save=emptySave('2026-04-01','strict');save.practice=newRun('APPLE','easy');save.practice.draft='CRA';save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,save.date,save.daily);
 const next=decode(encode(save),today);assert.equal(difficulty(next.daily),'strict');assert.equal(difficulty(next.practice),'easy');assert.equal(next.practice.draft,'CRA');assert.equal(statistics(next.results,today,next.history).current,1);
});
