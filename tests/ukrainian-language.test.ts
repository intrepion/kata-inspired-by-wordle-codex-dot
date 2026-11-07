import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LANGUAGES,LANGUAGE_FAMILIES,varietiesFor,normalizeGuess,normalizeSpelling,keyboardRows,isLetterInput,validLetters,languageLabel,selectedLanguage,usesAccentEquivalence} from '../src/language.ts';
const language='uk-UA';
test('Ukrainian is a distinct selectable Ukraine variety',()=>{
 assert.ok(LANGUAGES.includes(language));assert.deepEqual(varietiesFor('uk'),[{id:'uk-UA',label:'Україна'}]);assert.equal(LANGUAGE_FAMILIES.find(family=>family.id==='uk')?.label,'Українська');assert.equal(languageLabel(language),'Українська (Україна)');assert.equal(selectedLanguage(language),language);
});
test('Ukrainian NFC keeps all 33 letters and counts the soft sign as one tile',()=>{
 for(const raw of ['ґрунт','їжак','єнот','хліб','кінь','чай','поїзд']){const expected=raw.toUpperCase();assert.equal(normalizeGuess(raw.normalize('NFD'),language),expected);assert.equal(normalizeSpelling(raw.normalize('NFD'),language),expected);assert.ok(validLetters(expected,language));assert.equal(normalizeGuess(raw.normalize('NFD'),language).length,raw.length)}
 for(const [a,b] of [['й','и'],['ї','і'],['і','и'],['є','е'],['ґ','г'],['а','a'],['с','c'],['р','p']])assert.notEqual(normalizeGuess(a,language),normalizeGuess(b,language));
 assert.equal(usesAccentEquivalence(language),false);
 for(const raw of ['APPLE','MОЛОКО','123','два слова','будь-що','ё','ъ','ы','э','ѣ',"м'ясо",'мʼясо','м’ясо','п’ять'])assert.equal(validLetters(normalizeGuess(raw,language),language),false,raw);
 assert.equal(normalizeGuess('п’ять',language),'П’ЯТЬ','apostrophes are rejected, never silently stripped');
});
test('Ukrainian keyboard includes each native letter once and no Russian-only letters',()=>{
 const rows=keyboardRows(language),letters=rows.join('').replace(/[↵⌫]/g,'');assert.equal(rows[0],'ЙЦУКЕНГШЩЗХЇ');assert.equal(letters.length,33);assert.equal(new Set(letters).size,33);
 for(const letter of 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ')assert.ok(isLetterInput(letter,language)&&letters.includes(letter),letter);
 for(const key of ['A','Ё','Ъ','Ы','Э','CH',"'",'’','ʼ',''])assert.equal(isLetterInput(key,language),false);
});
test('Ukrainian normalization leaves existing language rules unchanged',()=>{assert.equal(normalizeGuess('ёлка','ru-RU'),'ЁЛКА');assert.equal(normalizeGuess('Straße','de-DE'),'STRAẞE');assert.equal(normalizeGuess('avó','pt-BR'),'AVO');assert.equal(normalizeGuess('niño','es-MX'),'NIÑO')});
test('public description includes Ukrainian',()=>assert.match(readFileSync('index.html','utf8'),/<meta name="description" content="[^"]*Ukrainian/));
