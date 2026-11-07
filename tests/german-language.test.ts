import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,LANGUAGE_FAMILIES,varietiesFor,normalizeGuess,normalizeSpelling,keyboardRows,isLetterInput,validLetters,languageLabel,selectedLanguage,usesAccentEquivalence} from '../src/language.ts';
const language='de-DE';
test('German is a distinct selectable Germany variety',()=>{
 assert.ok(LANGUAGES.includes(language));
 assert.deepEqual(varietiesFor('de'),[{id:'de-DE',label:'Deutschland'}]);
 assert.equal(LANGUAGE_FAMILIES.find(family=>family.id==='de')?.label,'Deutsch');
 assert.equal(languageLabel(language),'Deutsch (Deutschland)');
 assert.equal(selectedLanguage(language),language);
});
test('German keeps umlauts and eszett as distinct single tiles after NFC and uppercase',()=>{
 for(const [raw,want] of [['größer','GRÖẞER'],['Straße','STRAẞE'],['Füße','FÜẞE'],['Maße','MAẞE'],['Masse','MASSE'],['ÄÖÜẞ','ÄÖÜẞ']]){
  assert.equal(normalizeGuess(raw,language),want);assert.equal(normalizeSpelling(raw.normalize('NFD'),language),want);assert.ok(validLetters(want,language));
 }
 for(const [a,b] of [['ä','a'],['ö','o'],['ü','u'],['ß','ss'],['ä','ae'],['ö','oe'],['ü','ue']])assert.notEqual(normalizeGuess(a,language),normalizeGuess(b,language));
 assert.equal(usesAccentEquivalence(language),false);
 assert.equal(normalizeGuess('Straße',language).length,6);assert.equal(normalizeGuess('Füße',language).length,4);
 assert.equal(normalizeGuess('E-Mail',language),'E-MAIL');assert.equal(validLetters(normalizeGuess('E-Mail',language),language),false);
 assert.equal(validLetters('CAFÉ',language),false);
});
test('German on-screen keyboard contains every input letter exactly once in QWERTZ order',()=>{
 const rows=keyboardRows(language),letters=rows.join('').replace(/[↵⌫]/g,'');
 assert.equal(rows[0],'QWERTZUIOP');assert.equal(letters.length,30);assert.equal(new Set(letters).size,30);
 for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜẞ')assert.ok(isLetterInput(letter,language)&&letters.includes(letter),letter);
 assert.equal(isLetterInput('SS',language),false);assert.equal(isLetterInput('AE',language),false);
});

test('public game description includes the German pack',async()=>{
 const {readFile}=await import('node:fs/promises');
 assert.match(await readFile(new URL('../index.html',import.meta.url),'utf8'),/<meta name="description" content="[^"]*German/);
});
