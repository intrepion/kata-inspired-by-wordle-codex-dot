import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,submit,score,status,keyboardClues,shareText} from '../src/domain.ts';
import {canRevealLetterHint,revealLetterHint,publicLetterHint,revealSmashLetterHint,restoreLetterHint,matchesLetterHint} from '../src/letter-hints.ts';
import {observedClues,possibleAnswers,remainingAnswerCount} from '../src/observations.ts';
import {adviceKey} from '../src/advice-protocol.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
import {applyGlobalDifficulty} from '../src/global-difficulty.ts';
import {newImpossible} from '../src/impossible.ts';
import {dailySmashPair,newSmashRun,submitSmash,restoreSmashRun,observedSmashClues,analyzeSmashObservations,changeSmashDifficulty} from '../src/smashare.ts';
import {smashAdviceKey} from '../src/smash-advice.ts';

test('reveal preserves draft, guesses and difficulty, is deterministic and single use',()=>{
 const base={...newRun('APPLE','strict'),draft:'ANG'},run=revealLetterHint(base);
 assert.deepEqual(run.letterHint,{position:0,afterGuess:0});assert.deepEqual(publicLetterHint(run),{position:0,letter:'A'});
 assert.equal(run.draft,'ANG');assert.deepEqual(run.guesses,[]);assert.equal(run.strictMode,true);assert.equal(run.assisted,true);assert.equal(status(run),'playing');assert.equal(revealLetterHint(run),run);
 assert.equal(keyboardClues(run).A,'exact');assert.match(shareText('2026-11-08',run),/1 letter hint/);assert.doesNotMatch(shareText('2026-11-08',run),/APPLE/);
 assert.match(submit(run,'CRANE').error!,/position 1 must be A/);
 assert.equal(submit({...run,strictMode:false},'CRANE').error,undefined);
});
test('exact positions across all rows and prefilled clues are skipped, repeated letters remain positional',()=>{
 const run={...newRun('APPLE'),guesses:['AMPLE']};
 assert.deepEqual(score('APPLE','AMPLE'),['exact','absent','exact','exact','exact']);
 assert.deepEqual(revealLetterHint(run).letterHint,{position:1,afterGuess:1});
 assert.equal(canRevealLetterHint({...run,guesses:['APPLE']}),false);
 assert.equal(canRevealLetterHint(newImpossible()),false);
});
test('public observations reveal only one letter and narrow candidates and advice cache',()=>{
 const plain=observedClues(newRun('APPLE')),hinted=observedClues(revealLetterHint(newRun('APPLE')));
 assert.deepEqual(hinted.letterHint,{position:0,letter:'A'});assert.equal('answer' in hinted,false);assert.equal('afterGuess' in hinted.letterHint!,false);
 assert.ok(possibleAnswers(hinted).every(word=>word[0]==='A'));assert.ok(remainingAnswerCount(hinted)<remainingAnswerCount(plain));assert.notEqual(adviceKey(plain),adviceKey(hinted));
 const guide=vocabulary(5),candidates=guide.answers.filter(word=>word[0]==='A'),optimal=analyzeObservations(hinted,'optimal');
 assert.deepEqual(possibleAnswers(hinted),candidates);assert.equal(optimal.totalCandidates,candidates.length);assert.equal(optimal.eligibleWords,guide.allowed.size);
 for(const suggestion of optimal.suggestions){
  const buckets=new Map<string,number>();for(const answer of candidates){const feedback=score(answer,suggestion.word).join(',');buckets.set(feedback,(buckets.get(feedback)??0)+1)}
  const worst=Math.max(...buckets.values()),expected=[...buckets.values()].reduce((sum,n)=>sum+n*n,0)/candidates.length;
  assert.equal(suggestion.worstCaseLeft,worst);assert.equal(suggestion.guaranteedEliminations,candidates.length-worst);assert.equal(suggestion.expectedSurvivors,expected);
 }
 const suboptimal=analyzeObservations(hinted,'suboptimal');assert.equal(suboptimal.eligibleWords,[...guide.allowed].filter(word=>word[0]==='A').length);
 assert.ok(suboptimal.suggestions.every(item=>item.word[0]==='A'));
});
test('hard replay applies hints only after reveal and keeps terminal daily and practice hints',()=>{
 const date='2026-11-08',save=emptySave(date);let run=submit(newRun('APPLE'),'CRANE').run;run=revealLetterHint(run);
 assert.equal(applyGlobalDifficulty(run,'hard').error,undefined);
 save.practice={...run,hardMode:true};let restored=decode(encode(save),date);assert.deepEqual(restored.practice.letterHint,run.letterHint);assert.equal(restored.practice.hardMode,true);
 save.daily=revealLetterHint(save.daily);save.daily=submit(save.daily,save.daily.answer).run;
 save.practice=submit(save.practice,'APPLE').run;restored=decode(encode(save),date);
 assert.equal(status(restored.daily),'won');assert.deepEqual(restored.daily.letterHint,save.daily.letterHint);assert.equal(restored.daily.assisted,true);assert.deepEqual(restored.practice.letterHint,run.letterHint);
});
test('malformed hint preserves valid game and sticky assistance without allowing another reveal',()=>{
 const save=emptySave('2026-11-08');save.practice=submit(newRun('APPLE'),'CRANE').run;
 const raw=JSON.parse(encode(save));raw.practice.letterHint={position:100,afterGuess:1};const run=decode(JSON.stringify(raw),'2026-11-08').practice;
 assert.deepEqual(run.guesses,['CRANE']);assert.equal(run.letterHintInvalid,true);assert.equal(run.assisted,true);assert.equal(revealLetterHint(run),run);
 assert.deepEqual(restoreLetterHint({},5,0),{});assert.equal(restoreLetterHint({letterHint:null},5,0).letterHintInvalid,true);
});
test('letter matching follows accents and distinct Romanian gameplay letters',()=>{
 assert.deepEqual(publicLetterHint(revealLetterHint(newRun('ÉTÉ','normal','fr-FR'))),{position:0,letter:'E'});
 assert.equal(matchesLetterHint('ȘARPE',{position:0,letter:'Ș'},'ro-RO'),true);
 assert.equal(matchesLetterHint('SARPE',{position:0,letter:'Ș'},'ro-RO'),false);
});
test('Smash reveal uses merged positions once, replay chronology, public advice and persistence',()=>{
 const pair=dailySmashPair('2026-11-08',5,'en'),base=newSmashRun(pair,'en'),hinted=revealSmashLetterHint({...base,draft:'AB'});
 assert.deepEqual(hinted.letterHint,{position:0,afterGuess:0});assert.equal(hinted.draft,'AB');assert.equal(hinted.assisted,true);assert.equal(revealSmashLetterHint(hinted),hinted);
 const plain=observedSmashClues(base),observed=observedSmashClues(hinted);assert.notEqual(smashAdviceKey(plain),smashAdviceKey(observed));assert.equal('answer' in observed,false);
 assert.ok(analyzeSmashObservations(observed).pairs.every(pair=>pair.merged[0]===observed.letterHint!.letter));
 const strict=changeSmashDifficulty(hinted,'strict').run,won=submitSmash(strict,pair.merged).run;
 assert.deepEqual(restoreSmashRun(won,'en',5)?.letterHint,hinted.letterHint);
 const malformed={...won,letterHint:{position:-1,afterGuess:0}};const restored=restoreSmashRun(malformed,'en',5);assert.equal(restored?.letterHintInvalid,true);assert.equal(restored?.assisted,true);
});
import {LANGUAGES,normalizeGuess} from '../src/language.ts';
import {WORD_LENGTHS,isSupportedLength,vocabulary} from '../src/words.ts';
import {uniqueCluePairs} from '../src/one.ts';
test('every supported locale, length and difficulty roundtrips the normalized reveal',()=>{
 for(const language of LANGUAGES)for(const length of WORD_LENGTHS)if(isSupportedLength(length,language))for(const level of ['easy','normal','hard','strict'] as const){
  const save=emptySave('2026-11-08',level,length,language);save.practice=revealLetterHint(save.practice);
  assert.deepEqual(publicLetterHint(save.practice),{position:0,letter:normalizeGuess(save.practice.answer,language)[0]});
  const restored=decode(encode(save),'2026-11-08',length,language);
  assert.deepEqual(restored.practice.letterHint,save.practice.letterHint);assert.equal(restored.practice.assisted,true);
  assert.equal(submit(restored.practice,restored.practice.answer).error,undefined);
 }
});
test('One prefilled clue remains a row, reveals only an unknown position and roundtrips',()=>{
 const guide=vocabulary(5),pair=uniqueCluePairs(guide.answers,[...guide.allowed],1)[0];assert.ok(pair);
 const save=emptySave('2026-11-08');save.one=revealLetterHint({...newRun(pair.answer,'hard'),guesses:[pair.clue]});
 assert.equal(save.one.letterHint?.afterGuess,1);assert.notEqual(score(pair.answer,pair.clue)[save.one.letterHint!.position],'exact');
 assert.deepEqual(decode(encode(save),'2026-11-08').one.letterHint,save.one.letterHint);
});
test('shared Smash seam is one merged position, and pending continuation cannot reveal',()=>{
 const base=newSmashRun(dailySmashPair('2026-11-08',5,'en'),'en');
 // An already observed exact prefix leaves the first shared tile as the next reveal.
 const merged=base.answer.merged,prior=merged.slice(0,3)+[...merged.slice(3)].map(c=>c==='Z'?'Q':'Z').join('');
 assert.deepEqual(revealSmashLetterHint({...base,guesses:[prior]}).letterHint,{position:3,afterGuess:1});
 const pending={...newRun('APPLE'),continuation:'pending' as const};assert.equal(revealLetterHint(pending),pending);
 const smashPending={...base,continuation:'pending' as const};assert.equal(revealSmashLetterHint(smashPending),smashPending);
});
test('upgrading after a post-reveal ignoring guess rejects that guess, not pre-reveal history',()=>{
 let run=revealLetterHint(submit(newRun('APPLE'),'CRANE').run);run=submit(run,'BROWN').run;
 assert.match(applyGlobalDifficulty(run,'strict').error!,/Earlier guess 2/);
});
import {initializeNotebookStats,beginStatsPuzzle,recordCompletion} from '../src/notebook-statistics.ts';
import {recordDaily} from '../src/persistence.ts';
test('conflicting hint chronology is quarantined without discarding valid Smash progress or difficulty',()=>{
 const base=submitSmash(newSmashRun(dailySmashPair('2026-11-08',5,'en'),'en','hard'),'CEDARROW').run;
 assert.deepEqual(base.guesses,['CEDARROW']);assert.ok(restoreSmashRun(base,'en',5));
 const restored=restoreSmashRun({...base,letterHint:{position:0,afterGuess:0}},'en',5)!;
 assert.deepEqual(restored.guesses,base.guesses);assert.equal(restored.difficulty,'hard');assert.equal(restored.letterHint,undefined);assert.equal(restored.letterHintInvalid,true);assert.equal(restored.assisted,true);
 assert.equal(restoreSmashRun({...base,guesses:['NOTAWORD'],letterHint:{position:0,afterGuess:0}},'en',5),undefined);
});
test('conflicting ordinary hint chronology does not downgrade otherwise valid Hard or Strict history',()=>{
 for(const level of ['hard','strict'] as const){
  const save=emptySave('2026-11-08');save.practice={...submit(newRun('APPLE',level),'CRANE').run,letterHint:{position:0,afterGuess:0}};
  const restored=decode(encode(save),'2026-11-08').practice;
  assert.deepEqual(restored.guesses,['CRANE']);assert.equal(level==='hard'?restored.hardMode:restored.strictMode,true);
  assert.equal(restored.letterHint,undefined);assert.equal(restored.letterHintInvalid,true);assert.equal(restored.assisted,true);
 }
});
test('authoritative terminal hint usage and assistance survive a stale pre-reveal daily snapshot',()=>{
 const date='2026-11-08',save=emptySave(date);initializeNotebookStats(save);beginStatsPuzzle(save,'daily','normal');const stale={...save.daily};
 save.daily=submit(revealLetterHint(save.daily),save.daily.answer).run;recordDaily(save,date,save.daily);recordCompletion(save,'daily',date);
 const raw=JSON.parse(encode(save));raw.daily=stale;const restored=decode(JSON.stringify(raw),date);
 assert.equal(status(restored.daily),'won');assert.equal(restored.daily.assisted,true);assert.equal(restored.daily.letterHintUsed,true);assert.equal(publicLetterHint(restored.daily),undefined);
 assert.match(shareText(date,restored.daily),/Assisted.*1 letter hint/);
 assert.equal(decode(encode(restored),date).daily.letterHintUsed,true);
});
