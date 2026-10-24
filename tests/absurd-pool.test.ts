import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newImpossible} from '../src/impossible.ts';
import {ANSWERS,ALLOWED} from '../src/words.ts';

test('Absurd can select answers only from the current curated pool while accepting broader guesses',()=>{
 const run=newImpossible();
 assert.equal(run.candidates.length,2103);
 assert.deepEqual(new Set(run.candidates),new Set(ANSWERS));
 assert.equal(run.candidates.includes('XYLEM'),false);assert.equal(ALLOWED.has('XYLEM'),true);
});

import {emptySave,encode,decode} from '../src/persistence.ts';
import {submit,newRun,difficulty} from '../src/domain.ts';
import {ANSWER_DATASET} from '../src/words.ts';
test('all pre-update round formats reset to first-use defaults',()=>{
 const save=emptySave('2026-10-24','hard');save.daily=submit(save.daily,'XYLEM').run;save.practice=submit(newRun('APPLE','strict'),'ALLEY').run;
 for(const dataset of ['accepted-words-14855-v1',ANSWER_DATASET]){
  const raw=JSON.parse(encode(save));raw.version=2;raw.version=2;raw.mode='evil';raw.evil={version:2,dataset,difficulty:'strict',guesses:['AUDIO','ENTRY','BEACH','VALVE','GAFFE'],draft:'PAS'};delete raw.impossible;
  assert.deepEqual(decode(JSON.stringify(raw),save.date),emptySave(save.date));
 }
});

import {impossibleShare} from '../src/impossible.ts';
test('adaptive shares use the Absurd name and identify the curated count',()=>{
 const share=impossibleShare(newImpossible());assert.match(share,/Morrowmark · Absurd · adaptive/);assert.doesNotMatch(share,/Evil|Impossible/);assert.match(share,/2103 curated answers remain/);
});

import {submitImpossible,restoreImpossible,impossibleSnapshot,impossibleStatus} from '../src/impossible.ts';
import {ABSURD_DATASET} from '../src/words.ts';
import {score} from '../src/domain.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
test('all difficulties keep every surviving candidate and terminal reveal inside the curated pool',()=>{
 const curated=new Set(ANSWERS);
 for(const level of ['easy','normal','hard','strict'] as const){
  let run=newImpossible(level);
  const exploratory=submitImpossible(run,'XYLEM');assert.equal(exploratory.error,undefined);run=exploratory.run;
  while(impossibleStatus(run)==='playing'){
   assert.ok(run.candidates.every(word=>curated.has(word)));const next=run.candidates.find(word=>!run.guesses.includes(word))!;assert.ok(next);const result=submitImpossible(run,next);assert.equal(result.error,undefined);run=result.run;
   run.guesses.forEach((guess,row)=>run.candidates.forEach(answer=>assert.deepEqual(score(answer,guess),run.feedback[row])));
  }
  assert.ok(curated.has(run.answer));assert.ok(run.candidates.every(word=>curated.has(word)));assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);
 }
});
test('new Absurd snapshots and all old naming aliases reconstruct the same curated round',()=>{
 const save=emptySave('2026-10-24');save.mode='impossible';save.impossible=submitImpossible(newImpossible('easy'),'AUDIO').run;save.impossible.draft='PAS';
 assert.equal(JSON.parse(encode(save)).impossible.dataset,ABSURD_DATASET);
 for(const alias of ['impossible','evil','absurd']){
  const raw=JSON.parse(encode(save));raw.mode=alias;raw[alias]=raw.impossible;if(alias!=='impossible')delete raw.impossible;
  assert.deepEqual(decode(JSON.stringify(raw),save.date),save);
 }
});
test('Absurd advice counts only curated candidates and ignores unsupported pool overrides',()=>{
 let run=newImpossible('easy');for(const word of ['AUDIO','ENTRY','BEACH','VALVE','GAFFE'])run=submitImpossible(run,word).run;
 assert.equal(run.candidates.length,7);assert.deepEqual(possibleAnswers(observedClues(run)),run.candidates);
 const oldScope={...observedClues(run),candidatePool:'accepted'};assert.deepEqual(possibleAnswers(oldScope),run.candidates);
 for(const kind of ['optimal','suboptimal'] as const)assert.equal(analyzeObservations(observedClues(run),kind).totalCandidates,7);
});
test('out-of-pool cached candidates cannot become an Absurd reveal and obsolete dataset snapshots fail closed',()=>{
 let run=newImpossible();for(const word of ['AUDIO','ENTRY','BEACH','VALVE','GAFFE'])run=submitImpossible(run,word).run;
 const forged=restoreImpossible({...impossibleSnapshot(run),answer:'XYLEM',candidates:['XYLEM'],candidatePool:'accepted'})!;assert.deepEqual(forged.candidates,run.candidates);const ended=submitImpossible(forged,'MAKES').run;assert.equal(ended.answer,'PAPER');assert.ok(ANSWERS.includes(ended.answer));
 assert.equal(restoreImpossible({...impossibleSnapshot(run),dataset:'curated-absurd-2315-v1'}),null);
});
