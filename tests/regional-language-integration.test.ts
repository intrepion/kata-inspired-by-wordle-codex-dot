import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,LANGUAGE_FAMILIES,varietiesFor,normalizeGuess,normalizeSpelling,keyboardRows,isLetterInput,languageLabel,type Language} from '../src/language.ts';
import {vocabulary,answerDataset,absurdDataset,supportedLengths} from '../src/words.ts';
import {newRun,submit,status,score,shareText,dailyAnswer} from '../src/domain.ts';
import {newImpossible,submitImpossible,impossibleSnapshot,restoreImpossible} from '../src/impossible.ts';
import {newLetroso,submitLetroso,restoreLetroso,letrosoStatus} from '../src/letroso.ts';
import {dailySmashPair,newSmashRun,submitSmash,restoreSmashRun,smashStatus} from '../src/smashare.ts';
import {dailyOneMix} from '../src/daily-variants.ts';
import {emptySave,encode,decode,recordDaily} from '../src/persistence.ts';
import {activeSaveKeyForPath} from '../src/site.ts';
import {DefinitionClient} from '../src/definitions.ts';
import {answerEligibility} from '../src/answer-eligibility.ts';
const date='2026-11-06',locales=['es-ES','fr-FR','fr-CA'] as const;
test('only backed varieties appear in the language registry with distinct identities',()=>{
 assert.deepEqual(LANGUAGE_FAMILIES.flatMap(item=>item.varieties.map(variety=>variety.id)),LANGUAGES);
 for(const locale of locales){assert.ok(LANGUAGES.includes(locale));assert.ok(varietiesFor(locale.slice(0,2)).some(item=>item.id===locale));assert.ok(languageLabel(locale));}
 assert.notEqual(activeSaveKeyForPath('/',5,'es-ES'),activeSaveKeyForPath('/',5,'es-MX'));
 assert.notEqual(activeSaveKeyForPath('/',5,'fr-CA'),activeSaveKeyForPath('/',5,'fr-FR'));
});
test('Spain keeps accents and Ñ distinct; French folds accents/ç and expands ligatures consistently',()=>{
 assert.equal(normalizeGuess('niño','es-ES'),'NIÑO');assert.notEqual(normalizeGuess('papa','es-ES'),normalizeGuess('papá','es-ES'));
 assert.ok(keyboardRows('es-ES').join('').includes('Ñ'));assert.ok(keyboardRows('es-ES').join('').includes('Á'));
 for(const locale of ['fr-CA','fr-FR'] as const){
  assert.equal(normalizeSpelling('cœur',locale),'COEUR');assert.equal(normalizeGuess('français',locale),'FRANCAIS');assert.equal(normalizeGuess('été',locale),'ETE');assert.equal(normalizeGuess('æ',locale),'AE');assert.ok(isLetterInput('OE',locale));assert.ok(isLetterInput('AE',locale));
  const answer='ÉCOLE';assert.ok(vocabulary(5,locale).answers.includes(answer));assert.ok(vocabulary(5,locale).allowed.has('ECOLE'));
  const solved=submit(newRun(answer,'normal',locale),'ecole');assert.equal(solved.error,undefined);assert.equal(status(solved.run),'won');assert.deepEqual(score(answer,'ECOLE',locale),Array(5).fill('exact'));
  assert.equal(answerEligibility('ECOLE',5,locale).possible,true);
  const letroso=submitLetroso(newLetroso(answer,locale,'normal'),'ecole');assert.equal(letroso.error,undefined);assert.equal(letrosoStatus(letroso.run),'won');assert.deepEqual(restoreLetroso(letroso.run,locale,5),letroso.run);
 }
});
test('all regional lengths use matching answer/guess pools, fresh saves and deterministic daily identities',()=>{
 for(const locale of locales)for(const length of supportedLengths(locale)){
  const {answers,allowed}=vocabulary(length,locale);assert.ok(answers.length);assert.ok(answers.every(word=>word.length===length&&allowed.has(normalizeGuess(word,locale))));assert.equal(new Set(answers.map(word=>normalizeGuess(word,locale))).size,answers.length);
  assert.match(answerDataset(length,locale),new RegExp(locale));assert.match(absurdDataset(length,locale),new RegExp(locale));assert.ok(answers.includes(dailyAnswer(date,length,locale)));
  const save=emptySave(date,'normal',length,locale);save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,date,save.daily);assert.deepEqual(decode(encode(save),date,length,locale),save);
  const adaptive=newImpossible('normal',length,locale);const next=submitImpossible(adaptive,answers[0]);assert.equal(next.error,undefined);assert.deepEqual(restoreImpossible(impossibleSnapshot(next.run)),next.run);
  assert.ok(next.run.candidates.every(answer=>answers.includes(answer)));
 }
});
test('regional One, Smashare and share text stay within the selected locale',()=>{
 for(const locale of locales){
  const mix=dailyOneMix(date,5,locale);assert.ok(mix.length);for(const item of mix)assert.ok(vocabulary(5,locale).answers.includes(item.answer));
  const pair=dailySmashPair(date,5,locale);const run=newSmashRun(pair,locale,'normal');const solved=submitSmash(run,normalizeGuess(pair.merged,locale));assert.equal(solved.error,undefined);assert.equal(smashStatus(solved.run),'won');assert.deepEqual(restoreSmashRun(solved.run,locale,5),solved.run);
  assert.ok(shareText(date,newRun(vocabulary(5,locale).answers[0],'normal',locale)).includes(languageLabel(locale)));
 }
});
test('Spain and French definitions use their own language sources instead of English homographs or Mexican lessons',async()=>{
 const spain=await new DefinitionClient(undefined,6000,Date.now,'es-ES').lookup('COCHE');assert.ok(spain.entries.length);assert.match(spain.sourceLabel??'',/Spanish meanings/);assert.match(spain.note??'',/not English translations/);
 for(const locale of ['fr-CA','fr-FR'] as const){const result=await new DefinitionClient(undefined,6000,Date.now,locale).lookup('ÉCOLE');assert.ok(result.entries.length);assert.match(result.sourceUrl,/#French/);assert.match(result.entries.flatMap(entry=>entry.senses).join(' '),/school/i);}
});

import {orderFeedback} from '../src/letroso.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {analyzeObservations,adviceKey} from '../src/evil-advice.ts';
import {dailyAbsurdTarget} from '../src/daily-variants.ts';
test('French accented answers reproduce identical clues, difficulty constraints and advice keys',()=>{
 for(const locale of ['fr-FR','fr-CA'] as const){
  for(const length of supportedLengths(locale))for(const answer of vocabulary(length,locale).answers){const plain=normalizeGuess(answer,locale);if(answer===plain)continue;assert.deepEqual(score(answer,plain,locale),Array(length).fill('exact'));assert.equal(status(submit(newRun(answer,'strict',locale),plain).run),'won');assert.deepEqual(orderFeedback(answer,plain,locale),orderFeedback(plain,plain,locale));}
  let strict=newRun('ÉCOLE','strict',locale);strict=submit(strict,'ARBRE').run;assert.equal(submit(strict,'ECOLE').error,undefined);
  const save=emptySave(date,'normal',5,locale);save.practice=newRun('ÉCOLE','normal',locale);save.practice=submit(save.practice,'ARBRE').run;save.practice.draft='EC';assert.deepEqual(decode(encode(save),date,5,locale),save);
  const input=observedClues(save.practice),result=analyzeObservations(input,'optimal');assert.equal(result.totalCandidates,possibleAnswers(input).length);assert.ok(result.suggestions.every(item=>vocabulary(5,locale).allowed.has(item.word)));assert.match(adviceKey(input),new RegExp(locale));
  const target=dailyAbsurdTarget(date,5,locale);assert.ok(vocabulary(5,locale).answers.includes(target.target));assert.ok(target.witness.every(word=>vocabulary(5,locale).allowed.has(word)));
 }
});
