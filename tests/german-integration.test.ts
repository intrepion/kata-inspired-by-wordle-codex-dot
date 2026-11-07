import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,normalizeGuess,displaySpelling,languageLabel} from '../src/language.ts';
import {vocabulary,answerDataset,absurdDataset,supportedLengths} from '../src/words.ts';
import {newRun,submit,status,score,dailyAnswer,shareText,type Difficulty} from '../src/domain.ts';
import {newImpossible,submitImpossible,impossibleStatus,impossibleSnapshot,restoreImpossible} from '../src/impossible.ts';
import {newLetroso,submitLetroso,restoreLetroso,letrosoStatus,orderFeedback} from '../src/letroso.ts';
import {dailySmashPair,newSmashRun,submitSmash,restoreSmashRun,smashStatus,smashPairCount} from '../src/smashare.ts';
import {dailyOneMix,dailyAbsurdTarget} from '../src/daily-variants.ts';
import {validUniqueClue} from '../src/one.ts';
import {emptySave,encode,decode,recordDaily} from '../src/persistence.ts';
import {activeSaveKeyForPath,PROJECT_PATH} from '../src/site.ts';
import {DefinitionClient} from '../src/definitions.ts';
import {answerEligibility} from '../src/answer-eligibility.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
const language='de-DE',date='2026-11-07',levels:Difficulty[]=['easy','normal','hard','strict'];
test('German has independent valid answer and guess pools at all nine lengths',()=>{
 assert.deepEqual(supportedLengths(language),[3,4,5,6,7,8,9,10,11]);
 for(const length of supportedLengths(language)){
  const {answers,allowed}=vocabulary(length,language);assert.ok(answers.length>=5);assert.ok(allowed.size>answers.length);
  assert.ok(answers.every(word=>word.length===length&&allowed.has(word)));assert.equal(new Set(answers).size,answers.length);
  assert.equal(answerDataset(length,language),`de-DE-wiktionary-wordfreq-${length}-v1`);assert.equal(absurdDataset(length,language),`de-DE-wiktionary-wordfreq-absurd-${length}-v1`);
  assert.ok(answers.includes(dailyAnswer(date,length,language)));assert.ok(smashPairCount(length,language)>0);
  for(const path of ['/',PROJECT_PATH])for(const other of LANGUAGES.filter(value=>value!==language))assert.notEqual(activeSaveKeyForPath(path,length,language),activeSaveKeyForPath(path,length,other));
 }
});
test('German preserves correct headwords, noun case and eszett in reveals',()=>{
 assert.equal(displaySpelling('STRAẞE',language),'Straße');assert.equal(displaySpelling('KATZE',language),'Katze');
 assert.equal(displaySpelling('GRÜN',language),'grün');
 assert.ok(vocabulary(6,language).answers.includes('STRAẞE'));assert.ok(vocabulary(5,language).answers.includes('KATZE'));
 assert.ok(vocabulary(4,language).answers.includes('GRÜN'));assert.equal(vocabulary(5,language).allowed.has('APPLE'),false);
});
for(const level of levels)test(`${level}: German umlauts and eszett solve and restore with no length expansion`,()=>{
 for(const [answer,input] of [['STRAẞE','Straße'],['GRÜN','gru\u0308n'],['KÖNIG','König']]){
  const result=submit(newRun(answer,level,language),input);assert.equal(result.error,undefined);assert.equal(status(result.run),'won');assert.deepEqual(result.run.guesses,[answer]);
  assert.deepEqual(score(answer,normalizeGuess(input,language),language),Array(answer.length).fill('exact'));assert.ok(shareText(date,result.run).includes(languageLabel(language)));
  const save=emptySave(date,level,answer.length,language);save.practice=result.run;assert.deepEqual(decode(encode(save),date,answer.length,language).practice,result.run);
  const ordered=submitLetroso(newLetroso(answer,language,level),input);assert.equal(ordered.error,undefined);assert.equal(letrosoStatus(ordered.run),'won');assert.deepEqual(restoreLetroso(ordered.run,language,answer.length),ordered.run);assert.ok(orderFeedback(answer,normalizeGuess(input,language),language).every(tile=>tile.kind==='ordered'));
 }
});
test('German duplicates score exactly while A/Ä and S/ẞ remain distinct',()=>{
 assert.deepEqual(score('MÄẞIG','MASSE',language),['exact','absent','absent','absent','absent']);
 assert.deepEqual(score('GRÜNE','ÜÜÜÜÜ',language),['absent','absent','exact','absent','absent']);
 const run=newRun('KÖNIG','normal',language);const invalid=submit(run,'KONIG');assert.ok(invalid.error);assert.equal(invalid.run,run);
 const first=submit(newRun('KATZE','normal',language),'KÖNIG').run;assert.match(submit(first,'Ko\u0308nig').error!,/Already/);
});
for(const length of [3,4,5,6,7,8,9,10,11])test(`German ${length} letters: all five rules, daily replay and valid source pools`,()=>{
 const {answers}=vocabulary(length,language),save=emptySave(date,'normal',length,language);save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,date,save.daily);assert.deepEqual(decode(encode(save),date,length,language),save);
 for(const level of levels){const answer=answers[0],fixed=submit(newRun(answer,level,language),answer.toLocaleLowerCase('de-DE'));assert.equal(fixed.error,undefined);assert.equal(status(fixed.run),'won');const ordered=submitLetroso(newLetroso(answer,language,level),answer.toLocaleLowerCase('de-DE'));assert.equal(ordered.error,undefined);assert.equal(letrosoStatus(ordered.run),'won');assert.deepEqual(restoreLetroso(ordered.run,language,length),ordered.run)}
 const mix=dailyOneMix(date,length,language);assert.equal(mix.length,5);for(const pair of mix){assert.ok(validUniqueClue(pair.answer,pair.clue,answers,language));assert.equal(status(submit({...newRun(pair.answer,'strict',language),guesses:[pair.clue]},pair.answer).run),'won')}
 const pair=dailySmashPair(date,length,language);for(const level of levels){const solved=submitSmash(newSmashRun(pair,language,level),pair.merged.toLocaleLowerCase('de-DE'));assert.equal(solved.error,undefined);assert.equal(smashStatus(solved.run),'won');assert.deepEqual(restoreSmashRun(solved.run,language,length),solved.run)}
 const target=dailyAbsurdTarget(date,length,language);let adaptive={...newImpossible('normal',length,language),target:target.target};for(const guess of target.witness){if(adaptive.continuation==='pending')adaptive={...adaptive,continuation:'unlimited'};const result=submitImpossible(adaptive,guess);assert.equal(result.error,undefined);adaptive={...result.run,target:target.target};assert.ok(adaptive.candidates.every(word=>answers.includes(word)))}assert.equal(impossibleStatus(adaptive),'won');const {target:_,...snapshot}=adaptive;assert.deepEqual(restoreImpossible(impossibleSnapshot(adaptive)),snapshot);
});
test('German drafts, advice and eligibility use language-specific letters and dictionaries',()=>{
 const save=emptySave(date,'easy',5,language);save.practice=newRun('KÖNIG','easy',language);save.practice.draft='KÖ';assert.deepEqual(decode(encode(save),date,5,language).practice,save.practice);
 assert.equal(answerEligibility('KÖNIG',5,language).possible,true);assert.equal(answerEligibility('KONIG',5,language).possible,false);
 const run=submit(save.practice,'KATZE').run,input=observedClues(run),candidates=possibleAnswers(input),advice=analyzeObservations(input,'optimal');assert.ok(candidates.includes('KÖNIG'));assert.equal(advice.totalCandidates,candidates.length);assert.ok(advice.suggestions.every(item=>vocabulary(5,language).allowed.has(item.word)));
});
test('German bundled definitions retain case-sensitive sources and never use English homographs',async()=>{
 const client=new DefinitionClient(undefined,6000,Date.now,language);
 for(const [word,expected] of [['Straße',/street|road/i],['Gift',/poison/i],['König',/king/i]] as const){const result=await client.lookup(word);assert.ok(result.entries.length);assert.match(result.sourceUrl,/#German$/);assert.match(result.entries.flatMap(entry=>entry.senses).join(' '),expected);assert.equal(result.license,'CC-BY-SA-4.0');assert.ok(result.sourceLinks?.some(link=>decodeURIComponent(link.url).includes(`/wiki/${word}#German`)))}
 assert.deepEqual((await client.lookup('ZZZZZ')).entries,[]);assert.match((await client.lookup('ZZZZZ')).sourceUrl,/de-DE/);
});
