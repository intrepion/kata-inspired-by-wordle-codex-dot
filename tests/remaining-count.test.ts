import {test} from 'node:test';import assert from 'node:assert/strict';
import {remainingAnswerCount,observedClues,type Observations} from '../src/observations.ts';
import {newRun,submit} from '../src/domain.ts';
test('remaining count starts full, follows exact duplicate-aware feedback and ignores drafts/invalid guesses',()=>{
 let run=newRun('APPLE');assert.equal(remainingAnswerCount(observedClues(run)),2103);
 // Exact A; one L elsewhere; E elsewhere; no Y: AGILE,AISLE,AMBLE,AMPLE,ANGLE,ANKLE,APPLE.
 run=submit(run,'ALLEY').run;assert.equal(remainingAnswerCount(observedClues(run)),7);
 const invalid=submit(run,'NOPE').run;assert.equal(remainingAnswerCount(observedClues(invalid)),7);
});
test('the count depends on revealed rows, never an unsolved selected answer or assistance',()=>{
 const a=submit(newRun('APPLE'),'ALLEY').run,b=submit(newRun('AMPLE'),'ALLEY').run;
 assert.equal(remainingAnswerCount(observedClues(a)),7);assert.equal(remainingAnswerCount(observedClues(b)),7);assert.equal(a.assisted,undefined);assert.equal(b.assisted,undefined);
 const impossible:Observations={guesses:['AAAAA'],feedback:[['exact','exact','exact','exact','exact']]};
 assert.equal(remainingAnswerCount(impossible),0);
 assert.equal(remainingAnswerCount(observedClues(submit(a,'APPLE').run)),1);
});
import {vocabulary} from '../src/words.ts';
import {newImpossible,submitImpossible,impossibleStatus} from '../src/impossible.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
function reference(answer:string,guess:string):string[]{
 const counts=new Map<string,number>();for(const letter of answer)counts.set(letter,(counts.get(letter)??0)+1);
 const row:string[]=[...guess].map((letter,i)=>{if(letter!==answer[i])return 'absent';counts.set(letter,counts.get(letter)!-1);return 'exact'});
 for(let i=0;i<guess.length;i++)if(row[i]!=='exact'&&(counts.get(guess[i])??0)>0){row[i]='elsewhere';counts.set(guess[i],counts.get(guess[i])!-1)}return row;
}
test('language/length caches stay isolated; all modes count complete histories through loss and reload',()=>{
 for(const language of ['en','es-MX'] as const)for(const length of [4,5,6,7] as const){
  const pool=vocabulary(length,language),answer=pool.answers.at(-1)!;
  assert.equal(remainingAnswerCount({language,wordLength:length,guesses:[],feedback:[]}),pool.answers.length);
  const guesses=[...pool.allowed].filter(word=>word!==answer).slice(0,6);let run=newRun(answer,'normal',language),adaptive=newImpossible('normal',length,language);
  for(const guess of guesses){
   run=submit(run,guess).run;const input=observedClues(run);
   const expected=pool.answers.filter(candidate=>input.guesses.every((word,row)=>reference(candidate,word).every((clue,i)=>clue===input.feedback[row][i]))).length;
   assert.equal(remainingAnswerCount(input),expected);assert.ok(expected>0);assert.equal(run.assisted,undefined);
   if(impossibleStatus(adaptive)==='playing')adaptive=submitImpossible(adaptive,guess).run;
   assert.equal(remainingAnswerCount(observedClues(adaptive)),adaptive.candidates.length);
  }
  assert.equal(run.guesses.length,6);
  const save=emptySave('2026-10-25',false,length,language);save.practice=run;save.impossible=adaptive;
  const restored=decode(encode(save),'2026-10-25',length,language);
  assert.equal(remainingAnswerCount(observedClues(restored.practice)),remainingAnswerCount(observedClues(run)));
  assert.equal(remainingAnswerCount(observedClues(restored.impossible)),adaptive.candidates.length);
 }
 // The earlier 5-letter English result must survive cache churn without borrowing another locale's count.
 assert.equal(remainingAnswerCount(observedClues(submit(newRun('APPLE'),'ALLEY').run)),7);
});
