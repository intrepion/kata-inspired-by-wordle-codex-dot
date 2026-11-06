import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vocabulary,answerDataset,absurdDataset,WORD_LENGTHS} from '../src/words.ts';
import * as languages from '../src/language.ts';
import {activeSaveKeyForPath,saveKeyForPath} from '../src/site.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
import {newRun,submit,shareText} from '../src/domain.ts';
import {newImpossible,submitImpossible,impossibleSnapshot,restoreImpossible} from '../src/impossible.ts';
import {dailyAnswer} from '../src/domain.ts';
import {localDefinition} from '../src/local-definitions.ts';
import {execFileSync} from 'node:child_process';
const locales=['en-US','en-GB'] as const;
test('English varieties are distinct playable choices, with no mixed option or unsupported variety',()=>{
 assert.ok(languages.LANGUAGES.includes('en-US'));
 assert.ok(languages.LANGUAGES.includes('en-GB'));
 assert.ok(!languages.LANGUAGES.includes('en'));
 assert.deepEqual(languages.LANGUAGE_FAMILIES.map(item=>item.id),['en','es','fr','fil','nl']);
 assert.deepEqual(languages.varietiesFor('en').map(item=>item.id),['en-US','en-GB','en-AU']);
 assert.deepEqual(languages.varietiesFor('es').map(item=>item.id),['es-MX','es-ES']);
 assert.equal(languages.selectedLanguage('en'),'en-US');
 assert.equal(languages.selectedLanguage('fr-FR'),'fr-FR');
 assert.equal(languages.selectedLanguage('nl-NL'),'nl-NL');
});
test('both answer and guess pools use only their selected English variety, across lengths',()=>{
 for(const [american,british] of [['COLOR','COLOUR'],['CENTER','CENTRE'],['GRAY','GREY'],['FAVOR','FAVOUR'],['ORGANIZE','ORGANISE'],['THEATER','THEATRE']]){
  for(const [locale,yes,no] of [['en-US',american,british],['en-GB',british,american]] as const){
   assert.ok(vocabulary(yes.length,locale).allowed.has(yes),`${locale} accepts ${yes}`);
   assert.ok(vocabulary(yes.length,locale).answers.includes(yes),`${locale} answers include ${yes}`);
   assert.ok(!vocabulary(no.length,locale).allowed.has(no),`${locale} rejects ${no}`);
   assert.ok(!vocabulary(no.length,locale).answers.includes(no),`${locale} cannot answer ${no}`);
  }
 }
 for(const locale of locales)for(const length of WORD_LENGTHS){const {answers,allowed}=vocabulary(length,locale);assert.ok(answers.length);assert.ok(allowed.size>answers.length);assert.ok(answers.every(word=>word.length===length&&allowed.has(word)));assert.match(answerDataset(length,locale),new RegExp(locale));assert.match(absurdDataset(length,locale),new RegExp(locale));}
 assert.ok(vocabulary(5,'en-US').answers.includes('APPLE'));assert.ok(vocabulary(5,'en-GB').answers.includes('APPLE'));
});
test('rounds, daily schedules, adaptive pools and storage stay variety-specific without importing mixed notebooks',()=>{
 const date='2026-11-06';
 for(const locale of locales){
  const save=emptySave(date,'normal',5,locale);assert.equal(save.practice.answer,'APPLE');save.practice=submit(newRun('APPLE','normal',locale),'ALLEY').run;
  assert.deepEqual(decode(encode(save),date,5,locale),save);
  assert.ok(vocabulary(5,locale).answers.includes(dailyAnswer(date,5,locale)));
  assert.match(shareText(date,save.practice),locale==='en-US'?/American English/:/British English/);
  const absurd=newImpossible('normal',5,locale);assert.deepEqual(absurd.candidates,vocabulary(5,locale).answers);assert.deepEqual(restoreImpossible(impossibleSnapshot(absurd)),absurd);
  assert.match(submitImpossible(absurd,locale==='en-US'?'SABRE':'SABER').error??'',/outside our field guide/i);
  assert.notEqual(activeSaveKeyForPath('/',5,locale),activeSaveKeyForPath('/'));
  assert.notEqual(activeSaveKeyForPath('/',5,locale),saveKeyForPath('/'));
 }
 const us=emptySave(date,'normal',5,'en-US');us.daily.draft='COL';assert.equal(decode(encode(us),date,5,'en-GB').daily.draft,'');
 assert.notEqual(activeSaveKeyForPath('/',5,'en-US'),activeSaveKeyForPath('/',5,'en-GB'));
 assert.equal(activeSaveKeyForPath('/',5,'es-MX'),saveKeyForPath('/',5,'es-MX'));
});
test('English variety lists reproduce offline and bundled English meanings still load',async()=>{
 assert.match(execFileSync(process.execPath,['scripts/generate-english-varieties.mjs','--check'],{encoding:'utf8'}),/en-GB/);
 for(const locale of locales){const result=await localDefinition('APPLE',locale);assert.ok(result.entries.length);assert.ok(result.sourceUrl.includes('wiktionary'));}
});

test('Australian is independently sourced and keeps unreviewed new morphology guess-only',()=>{
 for(const word of ['ARVO','BOGAN','CHOOK','DINKUM','DOONA','UTE','RACQUET'])assert.ok(vocabulary(word.length,'en-AU').answers.includes(word),word);
 for(const word of ['ARVOS','BOGANS','CHOOKS','DOONAS','UTES','RACQUETS','BINGLED','FOSSICKED','SWAGMEN']){assert.ok(vocabulary(word.length,'en-AU').allowed.has(word),word);assert.ok(!vocabulary(word.length,'en-AU').answers.includes(word),word)}
 for(const [yes,no]of [['COLOUR','COLOR'],['CENTRE','CENTER']]){assert.ok(vocabulary(yes.length,'en-AU').allowed.has(yes));assert.ok(!vocabulary(no.length,'en-AU').allowed.has(no))}
 for(const length of WORD_LENGTHS){const pool=vocabulary(length,'en-AU');assert.ok(pool.answers.length);assert.ok(pool.answers.every(word=>pool.allowed.has(word)));assert.match(answerDataset(length,'en-AU'),/en-AU/)}
});
