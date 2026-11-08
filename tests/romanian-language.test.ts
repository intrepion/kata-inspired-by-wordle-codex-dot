import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LANGUAGES,LANGUAGE_FAMILIES,varietiesFor,normalizeGuess,normalizeSpelling,keyboardRows,isLetterInput,validLetters,languageLabel,selectedLanguage,usesAccentEquivalence} from '../src/language.ts';
const language='ro-RO';
test('Romanian is a separate selectable Romania variety',()=>{
 assert.ok(LANGUAGES.includes(language));assert.deepEqual(varietiesFor('ro'),[{id:'ro-RO',label:'România'}]);assert.equal(LANGUAGE_FAMILIES.find(family=>family.id==='ro')?.label,'Română');assert.equal(languageLabel(language),'Română (România)');assert.equal(selectedLanguage(language),language);
});
test('Romanian NFC preserves five distinct letters and modernizes legacy cedillas only',()=>{
 for(const raw of ['casă','câine','înger','școală','țară']){const expected=raw.toUpperCase();assert.equal(normalizeGuess(raw.normalize('NFD'),language),expected);assert.equal(normalizeSpelling(raw.normalize('NFD'),language),expected);assert.ok(validLetters(expected,language));assert.equal(normalizeGuess(raw.normalize('NFD'),language).length,raw.length)}
 for(const [a,b] of [['ă','a'],['â','a'],['î','i'],['ș','s'],['ț','t'],['â','î']])assert.notEqual(normalizeGuess(a,language),normalizeGuess(b,language));
 for(const raw of ['şţ','ŞŢ','s\u0327t\u0327','s\u0326t\u0326'])assert.equal(normalizeGuess(raw,language),'ȘȚ');
 assert.equal(normalizeGuess('şcoală',language),'ȘCOALĂ');assert.equal(usesAccentEquivalence(language),false);
 for(const raw of ['123','două cuvinte','într-un',"s-a",'é','ä','ß','ﬀ','ı','ſ','ы','œ','l’amour'])assert.equal(validLetters(normalizeGuess(raw,language),language),false,raw);
 assert.equal(normalizeGuess('într-un',language),'ÎNTR-UN','punctuation is rejected, never stripped');
});
test('Romanian keyboard includes each of its 31 letters once',()=>{
 const rows=keyboardRows(language),letters=rows.join('').replace(/[↵⌫]/g,'');assert.equal(rows[0],'QWERTYUIOP');assert.equal(rows.at(-1),'ĂÂÎȘȚ');assert.equal(letters.length,31);assert.equal(new Set(letters).size,31);
 for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZĂÂÎȘȚ')assert.ok(isLetterInput(letter,language)&&letters.includes(letter),letter);
 for(const key of ['É','Ь','Ş','Ţ','CH',"'",'’',''])assert.equal(isLetterInput(key,language),false);
 assert.ok(isLetterInput(normalizeGuess('ş',language),language),'legacy keyboard events normalize before validation');
});
test('Romanian leaves existing language orthography unchanged',()=>{assert.equal(normalizeGuess('ёлка','ru-RU'),'ЁЛКА');assert.equal(normalizeGuess('Straße','de-DE'),'STRAẞE');assert.equal(normalizeGuess('avó','pt-BR'),'AVO');assert.equal(normalizeGuess('niño','es-MX'),'NIÑO');assert.equal(normalizeGuess('їжак','uk-UA'),'ЇЖАК')});
test('public description includes Romanian',()=>assert.match(readFileSync('index.html','utf8'),/<meta name="description" content="[^"]*Romanian/));
