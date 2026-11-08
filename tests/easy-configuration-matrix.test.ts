import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,normalizeGuess,type Language} from '../src/language.ts';
import {supportedLengths,vocabulary} from '../src/words.ts';
import {newRun,submit,setDifficulty,difficulty,score} from '../src/domain.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
import {dailyOneMix,dailyAbsurdTarget} from '../src/daily-variants.ts';
import {newImpossible,submitImpossible,setImpossibleDifficulty,impossibleSnapshot,restoreImpossible} from '../src/impossible.ts';
import {dailySmashPair,practiceSmashPair,newSmashRun,suggestSmash,parseSmashGuess,submitSmash,changeSmashDifficulty,restoreSmashRun} from '../src/smashare.ts';
import {newLetroso,submitLetroso,changeLetrosoDifficulty,restoreLetroso,letrosoShare,orderFeedback} from '../src/letroso.ts';
import {observedLetrosoClues,possibleLetrosoAnswers,analyzeLetrosoObservations} from '../src/letroso-advice.ts';
const date='2026-11-08';
const configurations=LANGUAGES.flatMap(language=>supportedLengths(language).map(length=>({language,length})));
const key=(word:string,language:Language)=>normalizeGuess(word,language);

test('Easy matrix covers every offered locale and supported length',()=>{
 assert.equal(LANGUAGES.length,16);assert.equal(configurations.length,136);
 assert.deepEqual(supportedLengths('fil-PH'),[5]);
});
for(const {language,length} of configurations)test(`Easy configuration ${language} / ${length}: schedules, rulesets, reload, sticky assistance`,()=>{
 const {answers,allowed}=vocabulary(length,language);
 const save=emptySave(date,'easy',length,language);
 for(const mode of ['daily','practice'] as const){
  let run=save[mode];assert.equal(difficulty(run),'easy');assert.equal(run.assisted,true);
  const other=answers.find(word=>key(word,language)!==key(run.answer,language))!;
  const played=submit(run,other.normalize('NFD').toLocaleLowerCase(language));assert.equal(played.error,undefined);run=played.run;
  assert.ok(submit(run,other).error);run=setDifficulty(run,'normal').run;assert.equal(run.assisted,true);save[mode]=run;
 }
 const restored=decode(encode(save),date,length,language);
 for(const mode of ['daily','practice'] as const){assert.deepEqual(restored[mode].guesses,save[mode].guesses);assert.equal(restored[mode].assisted,true);assert.equal(difficulty(restored[mode]),'normal')}
 // One possibility supplies a real, independently generated singleton observation.
 const pairs=dailyOneMix(date,length,language);assert.equal(pairs.length,5);
 const pair=pairs[0],one=submit(newRun(pair.answer,'easy',language),pair.clue);assert.equal(one.error,undefined);
 const observations=observedClues(one.run),remaining=possibleAnswers(observations);assert.deepEqual(remaining,[pair.answer]);
 const direct=analyzeObservations(observations,'optimal');assert.equal(direct.suggestions[0]?.directSolve,true);assert.equal(direct.suggestions[0]?.word,pair.answer);
 assert.equal(submit(one.run,direct.suggestions[0].word).error,undefined);
 assert.deepEqual(analyzeObservations({...observations,finished:true},'optimal').suggestions,[]);
 // Absurd Daily and Practice share public-clue ranking, never a hidden target.
 const target=dailyAbsurdTarget(date,length,language).target;
 const adaptive=newImpossible('easy',length,language),daily={...adaptive,target};
 assert.deepEqual(observedClues(adaptive),observedClues(daily));
 const played=submitImpossible(adaptive,answers[0]);assert.equal(played.error,undefined);
 const downgraded=setImpossibleDifficulty(played.run,'normal').run,loaded=restoreImpossible(impossibleSnapshot(downgraded));
 assert.ok(loaded);assert.equal(loaded.assisted,true);assert.deepEqual(loaded.feedback,played.run.feedback);
 assert.deepEqual(possibleAnswers(observedClues(played.run)).sort(),[...played.run.candidates].sort());
 // Both pair schedules must supply legal Easy buttons and retain assistance.
 for(const answer of [dailySmashPair(date,length,language),practiceSmashPair(length,language,()=>0.75)]){
  const run=newSmashRun(answer,language,'easy'),advice=suggestSmash(run);assert.ok(advice.pairs.length);
  assert.equal(new Set(advice.pairs.map(pair=>key(pair.merged,language))).size,advice.pairs.length);
  for(const suggestion of advice.pairs){assert.ok(parseSmashGuess(suggestion.merged,length,language));assert.equal(submitSmash(run,suggestion.merged).error,undefined)}
  assert.deepEqual(suggestSmash({...run,answer:practiceSmashPair(length,language,()=>0.25)}).pairs,advice.pairs);
  const normal=changeSmashDifficulty(run,'normal').run;assert.equal(normal.assisted,true);assert.equal(restoreSmashRun(JSON.parse(JSON.stringify(normal)),language,length)?.assisted,true);
 }
 // A hidden-length round accepts its own length, survives reload and cannot repeat a guess.
 const letroso=newLetroso(answers[0],language,'easy');
 assert.equal(restoreLetroso(JSON.parse(JSON.stringify(letroso)),language,length)?.assisted,true);
 const normal=changeLetrosoDifficulty(letroso,'normal').run;assert.equal(normal.assisted,true);assert.equal(restoreLetroso(normal,language,length)?.assisted,true);assert.match(letrosoShare(normal,date),/Assisted/);assert.match(letrosoShare(letroso,date),/Easy/i);
 const other=answers.find(word=>key(word,language)!==key(letroso.answer,language))!;
 const lplayed=submitLetroso(letroso,other);assert.equal(lplayed.error,undefined);assert.ok(submitLetroso(lplayed.run,other).error);
 const singleton=analyzeLetrosoObservations(observedLetrosoClues(lplayed.run),[letroso.answer]);assert.equal(singleton.suggestions[0]?.directSolve,true);assert.ok(allowed.has(singleton.suggestions[0].word));
});
for(const language of LANGUAGES)test(`Easy ${language}: full hidden-length pool and public-clue advice`,()=>{
 const lengths=supportedLengths(language),all=lengths.flatMap(length=>vocabulary(length,language).answers);
 const first=newLetroso(all[0],language,'easy'),last=newLetroso(all.at(-1)!,language,'easy');
 assert.deepEqual(observedLetrosoClues(first),observedLetrosoClues(last));
 const pool=possibleLetrosoAnswers(observedLetrosoClues(first));
 assert.deepEqual([...new Set(pool.map(word=>word.length))],lengths);
 assert.equal(new Set(pool.map(word=>key(word,language))).size,pool.length);
 assert.equal(pool.length,new Set(all.map(word=>key(word,language))).size);
 const guess=all.find(word=>key(word,language)!==key(first.answer,language))!;
 const observed=observedLetrosoClues(submitLetroso(first,guess).run),advice=analyzeLetrosoObservations(observed);
 assert.ok(advice.suggestions.length);assert.ok(advice.totalCandidates>0);
 for(const suggestion of advice.suggestions){
  assert.ok(vocabulary(suggestion.word.length,language).allowed.has(suggestion.word));assert.notEqual(key(suggestion.word,language),key(guess,language));
  assert.deepEqual(orderFeedback(suggestion.word,guess,language),observed.feedback[0]);
 }
 // Standard advice on real public feedback, covering Unicode at the longest length.
 const length=lengths.at(-1)!,words=vocabulary(length,language).answers,answer=words.at(-1)!;
 const guesses=words.filter(word=>key(word,language)!==key(answer,language)).slice(0,4);
 const input={language,wordLength:length,guesses,feedback:guesses.map(word=>score(answer,word,language)),finished:false};
 const result=analyzeObservations(input,'optimal');assert.ok(result.suggestions.length);
 for(const suggestion of result.suggestions){assert.ok(vocabulary(length,language).allowed.has(suggestion.word));assert.ok(!guesses.some(word=>key(word,language)===key(suggestion.word,language)))}
});
test('legacy Easy variant saves infer assistance rather than silently dropping it',()=>{
 const letroso={...newLetroso('APPLE','en-US','easy'),assisted:undefined};
 assert.equal(restoreLetroso(letroso,'en-US',5)?.assisted,true);
 const smash={...newSmashRun(dailySmashPair(date,5,'en-US'),'en-US','easy'),assisted:undefined};
 assert.equal(restoreSmashRun(smash,'en-US',5)?.assisted,true);
});
test('Letroso restoration rejects an answer whose length disagrees with the saved notebook',()=>{
 const run=newLetroso('APPLE','en-US','easy');
 assert.equal(restoreLetroso({...run,length:3},'en-US',3),undefined);
 assert.equal(restoreLetroso({...run,answer:'CAT'},'en-US',5),undefined);
});
