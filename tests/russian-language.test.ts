import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LANGUAGES,LANGUAGE_FAMILIES,varietiesFor,normalizeGuess,normalizeSpelling,keyboardRows,isLetterInput,validLetters,languageLabel,selectedLanguage,usesAccentEquivalence} from '../src/language.ts';
const language='ru-RU';
test('Russian is a distinct selectable Russia variety',()=>{
 assert.ok(LANGUAGES.includes(language));assert.deepEqual(varietiesFor('ru'),[{id:'ru-RU',label:'Россия'}]);assert.equal(LANGUAGE_FAMILIES.find(family=>family.id==='ru')?.label,'Русский');assert.equal(languageLabel(language),'Русский (Россия)');assert.equal(selectedLanguage(language),language);
});
test('Russian NFC keeps all 33 Cyrillic letters, including yo, short-i and both signs',()=>{
 for(const raw of ['ёлка','чай','объект','семья','подъезд','йод','всё','все']){const expected=raw.toUpperCase();assert.equal(normalizeGuess(raw.normalize('NFD'),language),expected);assert.equal(normalizeSpelling(raw.normalize('NFD'),language),expected);assert.ok(validLetters(expected,language));assert.equal(normalizeGuess(raw.normalize('NFD'),language).length,raw.length)}
 for(const [a,b] of [['й','и'],['ё','е'],['ь','ъ'],['а','a'],['с','c'],['р','p']])assert.notEqual(normalizeGuess(a,language),normalizeGuess(b,language));
 assert.equal(usesAccentEquivalence(language),false);
 for(const raw of ['APPLE','MОСКВА','123','два слова','что-то','ї','і','є','ґ','ѣ'])assert.equal(validLetters(normalizeGuess(raw,language),language),false,raw);
});
test('Russian on-screen keyboard includes each native letter exactly once',()=>{
 const rows=keyboardRows(language),letters=rows.join('').replace(/[↵⌫]/g,'');assert.equal(rows[0],'ЙЦУКЕНГШЩЗХЪ');assert.equal(letters.length,33);assert.equal(new Set(letters).size,33);
 for(const letter of 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ')assert.ok(isLetterInput(letter,language)&&letters.includes(letter),letter);
 for(const key of ['A','CH','YO','SH',''])assert.equal(isLetterInput(key,language),false);
});
test('Russian normalization does not alter other language rules',()=>{assert.equal(normalizeGuess('Straße','de-DE'),'STRAẞE');assert.equal(normalizeGuess('avó','pt-BR'),'AVO');assert.equal(normalizeGuess('niño','es-MX'),'NIÑO')});
test('public description includes Russian',()=>assert.match(readFileSync('index.html','utf8'),/<meta name="description" content="[^"]*Russian/));
