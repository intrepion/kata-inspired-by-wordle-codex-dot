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
const date='2026-11-07',levels:Difficulty[]=['easy','normal','hard','strict'];
for(const language of ['it-IT','sv-SE'] as const){
test(`${language} has independent valid answer and guess pools at all nine lengths`,()=>{
 assert.deepEqual(supportedLengths(language),[3,4,5,6,7,8,9,10,11]);
 for(const length of supportedLengths(language)){
  const {answers,allowed}=vocabulary(length,language);assert.ok(answers.length>=5);assert.ok(allowed.size>answers.length);
  assert.ok(answers.every(word=>word.length===length&&allowed.has(word)));assert.equal(new Set(answers).size,answers.length);
  assert.equal(answerDataset(length,language),`${language}-wiktionary-wordfreq-${length}-v1`);assert.equal(absurdDataset(length,language),`${language}-wiktionary-wordfreq-absurd-${length}-v1`);
  assert.ok(answers.includes(dailyAnswer(date,length,language)));assert.ok(smashPairCount(length,language)>0);
  for(const path of ['/',PROJECT_PATH])for(const other of LANGUAGES.filter(value=>value!==language))assert.notEqual(activeSaveKeyForPath(path,length,language),activeSaveKeyForPath(path,length,other));
 }
});
for(const length of [3,4,5,6,7,8,9,10,11])test(`${language} ${length} letters: all five rules, daily replay and valid source pools`,()=>{
 const {answers}=vocabulary(length,language),save=emptySave(date,'normal',length,language);save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,date,save.daily);assert.deepEqual(decode(encode(save),date,length,language),save);
 for(const level of levels){const answer=answers[0],fixed=submit(newRun(answer,level,language),answer.toLocaleLowerCase(language));assert.equal(fixed.error,undefined);assert.equal(status(fixed.run),'won');const ordered=submitLetroso(newLetroso(answer,language,level),answer.toLocaleLowerCase(language));assert.equal(ordered.error,undefined);assert.equal(letrosoStatus(ordered.run),'won');assert.deepEqual(restoreLetroso(ordered.run,language,length),ordered.run)}
 const mix=dailyOneMix(date,length,language);assert.equal(mix.length,5);for(const pair of mix){assert.ok(validUniqueClue(pair.answer,pair.clue,answers,language));assert.equal(status(submit({...newRun(pair.answer,'strict',language),guesses:[pair.clue]},pair.answer).run),'won')}
 const pair=dailySmashPair(date,length,language);for(const level of levels){const solved=submitSmash(newSmashRun(pair,language,level),pair.merged.toLocaleLowerCase(language));assert.equal(solved.error,undefined);assert.equal(smashStatus(solved.run),'won');assert.deepEqual(restoreSmashRun(solved.run,language,length),solved.run)}
 const target=dailyAbsurdTarget(date,length,language);let adaptive={...newImpossible('normal',length,language),target:target.target};for(const guess of target.witness){if(adaptive.continuation==='pending')adaptive={...adaptive,continuation:'unlimited'};const result=submitImpossible(adaptive,guess);assert.equal(result.error,undefined);adaptive={...result.run,target:target.target};assert.ok(adaptive.candidates.every(word=>answers.includes(word)))}assert.equal(impossibleStatus(adaptive),'won');const {target:_,...snapshot}=adaptive;assert.deepEqual(restoreImpossible(impossibleSnapshot(adaptive)),snapshot);
});
}
for(const language of ['it-IT','sv-SE'] as const){
 test(`${language} daily cycles, drafts, advice and definitions stay independent`,async()=>{
  for(const length of supportedLengths(language)){const {answers}=vocabulary(length,language),seen=new Set<string>(),start=Date.parse(date);for(let day=0;day<answers.length;day++){const current=new Date(start+day*86400000).toISOString().slice(0,10);seen.add(dailyAnswer(current,length,language))}assert.equal(seen.size,answers.length)}
  const answers=vocabulary(5,language).answers,save=emptySave(date,'easy',5,language);save.practice=newRun(answers[0],'easy',language);save.practice.draft=language==='it-IT'?'CA':'ÅÄÖ';
  assert.deepEqual(decode(encode(save),date,5,language),save);assert.equal(answerEligibility(answers[0],5,language).possible,true);
  const run=submit(save.practice,answers[1]).run,input=observedClues(run),remaining=possibleAnswers(input),advice=analyzeObservations(input,'optimal');assert.ok(remaining.includes(answers[0]));assert.equal(advice.totalCandidates,remaining.length);assert.ok(advice.suggestions.every(item=>vocabulary(5,language).allowed.has(item.word)));
  const client=new DefinitionClient(undefined,6000,Date.now,language);
  for(const length of supportedLengths(language)){const word=vocabulary(length,language).answers[0],meaning=await client.lookup(word);assert.ok(meaning.entries.length);assert.ok(meaning.sourceUrl.endsWith(language==='it-IT'?'#Italian':'#Swedish'));assert.equal(meaning.license,'CC-BY-SA-4.0')}
  const missing=await client.lookup('ZZZZZ');assert.deepEqual(missing.entries,[]);assert.ok(missing.sourceUrl.includes(language));
 });
}
test('Italian accents solve all difficulty levels, remain source-spelled, and cannot duplicate guesses',async()=>{
 const language='it-IT',answer='CITTÀ';assert.ok(vocabulary(5,language).answers.includes(answer));
 for(const level of levels){const result=submit(newRun(answer,level,language),'citta');assert.equal(result.error,undefined);assert.equal(status(result.run),'won');assert.equal(result.run.answer,answer);assert.deepEqual(result.run.guesses,['CITTA']);assert.equal(displaySpelling(answer,language),answer);assert.equal(letrosoStatus(submitLetroso(newLetroso(answer,language,level),'citta').run),'won')}
 const run=submit(newRun('AMORE','normal',language),'caffè').run;assert.match(submit(run,'caffe').error!,/Already/);
 const client=new DefinitionClient(undefined,6000,Date.now,language),meaning=await client.lookup('CITTÀ');assert.ok(meaning.sourceUrl.includes('citt%C3%A0'));assert.match(meaning.entries[0].senses.join(' '),/city|town/i);const plain=await client.lookup('CITTA');assert.match(plain.entries[0].partOfSpeech,/città/);assert.match(plain.entries[0].senses[0],/city|town/i);
 assert.deepEqual(score('CITTÀ','CITTA',language),Array(5).fill('exact'));
});
test('Swedish Å Ä Ö never match A O or one another and NFC input solves',()=>{
 const language='sv-SE';assert.deepEqual(score('ÅÄÖ','AAO',language),['absent','absent','absent']);assert.deepEqual(score('ALLA','AAAA',language),['exact','absent','absent','exact']);
 for(const letter of ['Å','Ä','Ö']){const answer=supportedLengths(language).flatMap(length=>vocabulary(length,language).answers).find(word=>word.includes(letter));assert.ok(answer);for(const level of levels){const result=submit(newRun(answer,level,language),answer.toLowerCase().normalize('NFD'));assert.equal(result.error,undefined);assert.equal(status(result.run),'won');assert.deepEqual(result.run.guesses,[answer])}}
});
test('unresolved or defective source glosses do not masquerade as English meanings',async()=>{
 for(const [language,words] of [['it-IT',['PERFINO','GIACOMO']],['sv-SE',['UTAV','MÖJLIGEN','BUTIK']]] as const){
  const client=new DefinitionClient(undefined,6000,Date.now,language);
  for(const word of words){assert.ok(vocabulary(word.length,language).allowed.has(word));assert.equal(vocabulary(word.length,language).answers.includes(word),false);assert.deepEqual((await client.lookup(word)).entries,[])}
 }
});
