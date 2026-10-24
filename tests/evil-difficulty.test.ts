import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newImpossible,submitImpossible,impossibleStatus,setImpossibleDifficulty,restoreImpossible,impossibleSnapshot,impossibleShare} from '../src/impossible.ts';
import {newRun,submit,score,difficulty,type Difficulty} from '../src/domain.ts';
import {ANSWERS,ALLOWED} from '../src/words.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
const levels:Difficulty[]=['easy','normal','hard','strict'];
function small(level:Difficulty){return {...newImpossible(level),candidates:['AMPLE','APPLE'],answer:'APPLE'}}
test('Absurd supports every difficulty; clue rules depend on actual feedback, never representative answer',()=>{
 for(const level of levels){
  const first=submitImpossible(small(level),'alley');assert.equal(first.error,undefined);const run=first.run;
  assert.equal(difficulty(run),level);assert.deepEqual(run.feedback,[score('APPLE','ALLEY')]);
  const exploratory=submitImpossible({...run,answer:'ZZZZZ',draft:'CRANE'},'CRANE');
  assert.equal(Boolean(exploratory.error),level==='hard'||level==='strict');
  if(exploratory.error){assert.equal(exploratory.run.draft,'CRANE');assert.deepEqual(exploratory.run.guesses,['ALLEY']);}
  assert.equal(submitImpossible({...run,answer:'ZZZZZ'},'AMPLE').error,undefined);
 }
});
test('Hard retains positive copies but permits old yellows/gray; Strict applies duplicate caps and all rows',()=>{
 const hard=submitImpossible(small('hard'),'ALLEY').run,strict=submitImpossible(small('strict'),'ALLEY').run;
 assert.ok(ALLOWED.has('ALLEL'));assert.equal(submitImpossible(hard,'ALLEL').error,undefined);assert.match(submitImpossible(strict,'ALLEL').error!,/Strict/);
 for(const guess of ['CRANE','APPLE','AMPLE','ALLEL','ALLEY','ALONE','ABASE','APPLY']){
  const ordinary=submit({...newRun('APPLE','strict'),guesses:['ALLEY']},guess);
  assert.equal(Boolean(submitImpossible(strict,guess).error),Boolean(ordinary.error),guess);
 }
 const row={...strict,guesses:['FUZZY','ALLEY'],feedback:[score('APPLE','FUZZY'),score('APPLE','ALLEY')]};
 assert.ok(submitImpossible(row,'APPAL').error);assert.equal(submitImpossible(row,'APPLE').error,undefined);
 for(const level of ['hard','strict'] as const){
  const target='EERIE',run={...newImpossible(level),answer:'ZZZZZ',candidates:[target],guesses:['SEEDS'],feedback:[score(target,'SEEDS')]};
  assert.ok(submitImpossible(run,'REACT').error);assert.equal(submitImpossible(run,target).error,undefined);
 }
});
test('all difficulty histories preserve surviving answers and exact prior clues through six turns or win',()=>{
 for(const level of levels){
  let run=newImpossible(level);
  for(let i=0;i<6&&impossibleStatus(run)==='playing';i++){
   const answer=run.candidates.find(word=>!run.guesses.includes(word))!;assert.ok(answer);
   const next=submitImpossible(run,answer);assert.equal(next.error,undefined);run=next.run;assert.ok(run.candidates.length);
   for(const candidate of run.candidates)run.guesses.forEach((guess,row)=>assert.deepEqual(score(candidate,guess),run.feedback[row]));
   assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);
  }
  assert.notEqual(impossibleStatus(run),'playing');
 }
});
test('difficulty changes block upgrades mid-round, permit downgrade/Easy, retain Assisted and drafts',()=>{
 let run=newImpossible('strict');run.draft='CRA';run=submitImpossible(run,'ALLEY').run;run.draft='CRA';
 run=setImpossibleDifficulty(run,'hard').run;assert.equal(difficulty(run),'hard');assert.equal(run.draft,'CRA');assert.ok(setImpossibleDifficulty(run,'strict').error);
 run=setImpossibleDifficulty(run,'easy').run;assert.equal(run.assisted,true);assert.equal(difficulty(run),'easy');assert.ok(setImpossibleDifficulty(run,'hard').error);
 run=setImpossibleDifficulty(run,'normal').run;assert.equal(run.assisted,true);assert.equal(run.draft,'CRA');assert.match(impossibleShare(run),/Absurd · adaptive · Normal · Assisted/);
 const won=submitImpossible({...newImpossible(),candidates:['APPLE']},'APPLE').run;assert.ok(setImpossibleDifficulty(won,'easy').error);
 for(const level of levels){const fresh=newImpossible(level);assert.equal(difficulty(newImpossible(difficulty(fresh))),level);assert.match(impossibleShare(fresh),new RegExp(`Absurd · adaptive · ${level[0].toUpperCase()+level.slice(1)}`));}
});
test('Absurd saves its own difficulty, old snapshots default Normal, malformed restriction histories fail safely',()=>{
 for(const ordinary of levels)for(const level of levels){
  const save=emptySave('2026-10-24',ordinary);save.mode='impossible';save.impossible=submitImpossible(newImpossible(level),'ALLEY').run;save.impossible.draft='CRA';
  const restored=decode(encode(save),save.date);assert.equal(difficulty(restored.daily),ordinary);assert.equal(difficulty(restored.practice),ordinary);assert.equal(difficulty(restored.settings),ordinary);assert.deepEqual(restored.impossible,save.impossible);
  const raw=JSON.parse(encode(save));delete raw.impossible.difficulty;raw.impossible.assisted=true;const old=decode(JSON.stringify(raw),save.date);assert.equal(difficulty(old.impossible),'normal');assert.equal(old.impossible.assisted,true);assert.deepEqual(old.impossible.feedback,save.impossible.feedback);
 }
 let normal=submitImpossible(newImpossible(),'ALLEY').run;normal=submitImpossible(normal,'CRANE').run;
 assert.equal(restoreImpossible({...impossibleSnapshot(normal),difficulty:'strict'}),null);
 assert.equal(difficulty(restoreImpossible({...impossibleSnapshot(normal),difficulty:'garbage'})!),'normal');
});
test('Easy advice is determined only by adaptive feedback and agrees with remaining curated candidates',()=>{
 const run=submitImpossible(newImpossible('easy'),'ALLEY').run;
 assert.deepEqual(possibleAnswers(observedClues(run)),run.candidates);assert.ok(ANSWERS.length===3493);
 const same={...run,answer:'ZZZZZ',candidates:[]};assert.deepEqual(observedClues(same),observedClues(run));
 assert.deepEqual(analyzeObservations(observedClues(same),'optimal'),analyzeObservations(observedClues(run),'optimal'));
 const equivalent={...newRun(run.candidates[0],'easy'),guesses:run.guesses};assert.deepEqual(analyzeObservations(observedClues(run),'optimal'),analyzeObservations(observedClues(equivalent),'optimal'));
});
