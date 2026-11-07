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
const language='ru-RU',date='2026-11-07',levels:Difficulty[]=['easy','normal','hard','strict'];
test('Russian has independent valid answer and guess pools at all nine lengths',()=>{
 assert.deepEqual(supportedLengths(language),[3,4,5,6,7,8,9,10,11]);
 for(const length of supportedLengths(language)){
  const {answers,allowed}=vocabulary(length,language);assert.ok(answers.length>=5);assert.ok(allowed.size>answers.length);
  assert.ok(answers.every(word=>word.length===length&&allowed.has(word)));assert.equal(new Set(answers).size,answers.length);
  assert.equal(answerDataset(length,language),`ru-RU-wiktionary-wordfreq-${length}-v1`);assert.equal(absurdDataset(length,language),`ru-RU-wiktionary-wordfreq-absurd-${length}-v1`);
  assert.ok(answers.includes(dailyAnswer(date,length,language)));assert.ok(smashPairCount(length,language)>0);
  for(const path of ['/',PROJECT_PATH])for(const other of LANGUAGES.filter(value=>value!==language))assert.notEqual(activeSaveKeyForPath(path,length,language),activeSaveKeyForPath(path,length,other));
 }
});
for(const level of levels)test(`${level}: Russian NFC letters solve and restore without expansion`,()=>{
 for(const letter of ['Ё','Й','Ь','Ъ']){
  const answer=supportedLengths(language).flatMap(length=>vocabulary(length,language).answers).find(word=>word.includes(letter));
  assert.ok(answer,`curated answer containing ${letter}`);const input=answer.toLowerCase().normalize('NFD');
  const result=submit(newRun(answer,level,language),input);assert.equal(result.error,undefined);assert.equal(status(result.run),'won');assert.deepEqual(result.run.guesses,[answer]);
  assert.deepEqual(score(answer,normalizeGuess(input,language),language),Array(answer.length).fill('exact'));assert.ok(shareText(date,result.run).includes(languageLabel(language)));
  const save=emptySave(date,level,answer.length,language);save.practice=result.run;assert.deepEqual(decode(encode(save),date,answer.length,language).practice,result.run);
  const ordered=submitLetroso(newLetroso(answer,language,level),input);assert.equal(ordered.error,undefined);assert.equal(letrosoStatus(ordered.run),'won');assert.deepEqual(restoreLetroso(ordered.run,language,answer.length),ordered.run);
 }
});
test('Russian duplicates and letter distinctions remain exact',()=>{
 assert.deepEqual(score('ЁЛКА','ЕЛКА',language),['absent','exact','exact','exact']);
 assert.deepEqual(score('ЧАЙ','ЧАИ',language),['exact','exact','absent']);
 assert.deepEqual(score('МОЛОКО','ОООООО',language),['absent','exact','absent','exact','absent','exact']);
 const answers=vocabulary(5,language).answers,run=newRun(answers[0],'normal',language);
 for(const invalid of ['APPLE','AБВГД','АБВГD','12345']){const result=submit(run,invalid);assert.ok(result.error);assert.equal(result.run,run)}
 const guess=answers.find(word=>word!==run.answer)!;const first=submit(run,guess).run;assert.match(submit(first,guess.toLowerCase().normalize('NFD')).error!,/Already/);
});
for(const length of [3,4,5,6,7,8,9,10,11])test(`Russian ${length} letters: all five rules, daily replay and valid source pools`,()=>{
 const {answers}=vocabulary(length,language),save=emptySave(date,'normal',length,language);save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,date,save.daily);assert.deepEqual(decode(encode(save),date,length,language),save);
 for(const level of levels){const answer=answers[0],fixed=submit(newRun(answer,level,language),answer.toLocaleLowerCase('ru-RU'));assert.equal(fixed.error,undefined);assert.equal(status(fixed.run),'won');const ordered=submitLetroso(newLetroso(answer,language,level),answer.toLocaleLowerCase('ru-RU'));assert.equal(ordered.error,undefined);assert.equal(letrosoStatus(ordered.run),'won');assert.deepEqual(restoreLetroso(ordered.run,language,length),ordered.run)}
 const mix=dailyOneMix(date,length,language);assert.equal(mix.length,5);for(const pair of mix){assert.ok(validUniqueClue(pair.answer,pair.clue,answers,language));assert.equal(status(submit({...newRun(pair.answer,'strict',language),guesses:[pair.clue]},pair.answer).run),'won')}
 const pair=dailySmashPair(date,length,language);for(const level of levels){const solved=submitSmash(newSmashRun(pair,language,level),pair.merged.toLocaleLowerCase('ru-RU'));assert.equal(solved.error,undefined);assert.equal(smashStatus(solved.run),'won');assert.deepEqual(restoreSmashRun(solved.run,language,length),solved.run)}
 const target=dailyAbsurdTarget(date,length,language);let adaptive={...newImpossible('normal',length,language),target:target.target};for(const guess of target.witness){if(adaptive.continuation==='pending')adaptive={...adaptive,continuation:'unlimited'};const result=submitImpossible(adaptive,guess);assert.equal(result.error,undefined);adaptive={...result.run,target:target.target};assert.ok(adaptive.candidates.every(word=>answers.includes(word)))}assert.equal(impossibleStatus(adaptive),'won');const {target:_,...snapshot}=adaptive;assert.deepEqual(restoreImpossible(impossibleSnapshot(adaptive)),snapshot);
});
test('Russian drafts, advice and eligibility stay language-specific',()=>{
 const answers=vocabulary(5,language).answers,answer=answers[0],guess=answers[1],save=emptySave(date,'easy',5,language);save.practice=newRun(answer,'easy',language);save.practice.draft='ЙЁ';assert.deepEqual(decode(encode(save),date,5,language).practice,save.practice);
 assert.equal(answerEligibility(answer,5,language).possible,true);assert.equal(answerEligibility('APPLE',5,language).possible,false);
 const run=submit(save.practice,guess).run,input=observedClues(run),candidates=possibleAnswers(input),advice=analyzeObservations(input,'optimal');assert.ok(candidates.includes(answer));assert.equal(advice.totalCandidates,candidates.length);assert.ok(advice.suggestions.every(item=>vocabulary(5,language).allowed.has(item.word)));
});
test('Russian bundled meanings are local and never English lookalikes',async()=>{
 const client=new DefinitionClient(undefined,6000,Date.now,language);
 for(const length of supportedLengths(language)){const word=vocabulary(length,language).answers[0],result=await client.lookup(word);assert.ok(result.entries.length);assert.match(result.sourceUrl,/#Russian$/);assert.equal(result.license,'CC-BY-SA-4.0');assert.ok(result.sourceLinks?.length)}
 assert.deepEqual((await client.lookup('ЯЯЯЯЯ')).entries,[]);assert.match((await client.lookup('ЯЯЯЯЯ')).sourceUrl,/ru-RU/);
 await assert.rejects(client.lookup('APPLE'));
});
test('Russian deterministic daily cycles and notebook identities remain isolated',()=>{
 for(const length of supportedLengths(language)){
  const {answers}=vocabulary(length,language),start=Date.parse('2026-11-07'),seen=new Set<string>();
  for(let day=0;day<answers.length;day++){const date=new Date(start+day*86400000).toISOString().slice(0,10),word=dailyAnswer(date,length,language);assert.equal(word,dailyAnswer(date,length,language));seen.add(word)}
  assert.equal(seen.size,answers.length);
 }
 const save=emptySave(date,'hard',5,language);save.practice.draft='ЙЁ';save.settings.contrast=true;save.settings.suboptimal=true;
 const encoded=encode(save),value=JSON.parse(encoded);value.language='en-US';assert.notEqual(decode(JSON.stringify(value),date,5,language).practice.draft,'ЙЁ');
 const restored=decode(encoded,date,5,language);assert.equal(restored.settings.contrast,true);assert.equal(restored.settings.suboptimal,true);assert.equal(restored.practice.draft,'ЙЁ');
});
