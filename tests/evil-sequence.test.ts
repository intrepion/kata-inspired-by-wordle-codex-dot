import {test} from 'node:test';import assert from 'node:assert/strict';
import {newImpossible,submitImpossible,restoreImpossible,impossibleSnapshot,impossibleStatus} from '../src/impossible.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';import {score,type Clue} from '../src/domain.ts';import {ALLOWED,ANSWERS} from '../src/words.ts';import {analyzeObservations} from '../src/evil-advice.ts';import {emptySave,encode,decode} from '../src/persistence.ts';
// Independently calculated from the pinned SCOWL snapshot using a Python Counter scorer.
const rows:[string,number,Clue[]][]=[
 ['AUDIO',670,['elsewhere','absent','absent','absent','absent']],
 ['ENTRY',106,['elsewhere','absent','absent','absent','absent']],
 ['BEACH',36,['absent','elsewhere','elsewhere','absent','absent']],
 ['VALVE',15,['absent','exact','absent','absent','elsewhere']],
 ['GAFFE',5,['absent','exact','absent','absent','elsewhere']],
];
const survivors=['MAKES','MAZES','SAMES','WAKES','WAXES'];
function replay(){let run=newImpossible();for(const [word] of rows)run=submitImpossible(run,word).run;return run}
test('reported sequence uses the new curated SCOWL counts and retains exactly the same feedback after reload',()=>{
 for(const level of ['normal','easy'] as const){let run=newImpossible(level);assert.equal(run.candidates.length,3493);
  for(const [word,count,feedback] of rows){const next=submitImpossible(run,word);assert.equal(next.error,undefined);run=next.run;assert.equal(run.candidates.length,count,word);assert.deepEqual(run.feedback.at(-1),feedback,word);assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);for(const answer of run.candidates)run.guesses.forEach((guess,i)=>assert.deepEqual(score(answer,guess),run.feedback[i]))}
  assert.deepEqual(run.candidates,survivors);
  for(const [word,candidates] of [['MAKES',['WAXES']],['WAXES',['MAKES','MAZES','SAMES']]] as const){const next=submitImpossible(run,word);assert.equal(next.error,undefined);assert.equal(impossibleStatus(next.run),'lost');assert.deepEqual(next.run.candidates,candidates);assert.ok(ANSWERS.includes(next.run.answer));const save=emptySave('2026-10-24');save.impossible=next.run;assert.deepEqual(decode(encode(save),save.date).impossible,next.run)}
 }
});
test('both former endings are outside the independent dictionary and cannot spend a turn or alter remaining answers',()=>{
 const run={...replay(),draft:'PAS'};for(const word of ['PASSE','MASSE']){assert.equal(ALLOWED.has(word),false);assert.equal(submitImpossible(run,word).run,run);assert.match(submitImpossible(run,word).error!,/outside our field guide/)}
});
test('advice and reconstruction count curated survivors rather than clue-fitting exploratory guesses',()=>{
 const run=replay(),input=observedClues(run);assert.deepEqual(possibleAnswers(input),survivors);
 const fitting=[...ALLOWED].filter(word=>rows.every(([guess,,feedback])=>score(word,guess).every((clue,i)=>clue===feedback[i])));assert.ok(fitting.length>survivors.length);
 for(const kind of ['optimal','suboptimal'] as const){const result=analyzeObservations(input,kind);assert.equal(result.totalCandidates,5);assert.ok(result.suggestions.length);for(const item of result.suggestions){assert.ok(ALLOWED.has(item.word));assert.equal(item.guaranteedEliminations,5-item.worstCaseLeft)}}
 const forged=restoreImpossible({...impossibleSnapshot(run),answer:'XYLEM',candidates:['XYLEM'],feedback:[]})!;assert.deepEqual(forged.candidates,survivors);assert.deepEqual(possibleAnswers(observedClues(forged)),survivors);
});
