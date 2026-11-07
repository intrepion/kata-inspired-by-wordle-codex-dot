import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LANGUAGES,varietiesFor,normalizeGuess,normalizeSpelling,keyboardRows,validLetters,selectedLanguage,usesAccentEquivalence} from '../src/language.ts';
test('Italy and Sweden are separately selectable language varieties',()=>{
 for(const locale of ['it-IT','sv-SE'] as const){assert.ok(LANGUAGES.includes(locale));assert.equal(selectedLanguage(locale),locale)}
 assert.deepEqual(varietiesFor('it'),[{id:'it-IT',label:'Italia'}]);assert.deepEqual(varietiesFor('sv'),[{id:'sv-SE',label:'Sverige'}]);
});
test('Italian folds only vowel accents and keeps canonical spelling',()=>{
 for(const [raw,key] of [['città','CITTA'],['caffè','CAFFE'],['perché','PERCHE'],['lunedì','LUNEDI'],['però','PERO'],['virtù','VIRTU'],['córso','CORSO']]){assert.equal(normalizeGuess(raw.normalize('NFD'),'it-IT'),key);assert.equal(normalizeSpelling(raw.normalize('NFD'),'it-IT'),raw.toUpperCase())}
 for(const invalid of ['ÖSTER','NIÑO','STRAẞE','ÅLAND',"L'AMORE",'DUE PAROLE','Ĳ'])assert.equal(validLetters(normalizeGuess(invalid,'it-IT'),'it-IT'),false);
 assert.equal(usesAccentEquivalence('it-IT'),true);assert.equal(keyboardRows('it-IT').join('').replace(/[↵⌫]/g,'').length,26);
});
test('Swedish preserves its three distinct extra letters, with full keyboard support',()=>{
 for(const word of ['blå','här','höra','åäö']){assert.equal(normalizeGuess(word.normalize('NFD'),'sv-SE'),word.toUpperCase());assert.ok(validLetters(normalizeGuess(word,'sv-SE'),'sv-SE'))}
 for(const [a,b] of [['Å','A'],['Å','Ä'],['Ä','A'],['Ö','O']])assert.notEqual(normalizeGuess(a,'sv-SE'),normalizeGuess(b,'sv-SE'));
 assert.equal(usesAccentEquivalence('sv-SE'),false);
 for(const word of ['ENTRÉ','MÜSLI','ÆRE','ØRN','Å-LAND','TVÅ ORD','123'])assert.equal(validLetters(normalizeGuess(word,'sv-SE'),'sv-SE'),false);
 const letters=keyboardRows('sv-SE').join('').replace(/[↵⌫]/g,'');assert.equal(letters.length,29);assert.equal(new Set(letters).size,29);for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ')assert.ok(letters.includes(letter));
});
test('new language rules leave existing orthography unchanged',()=>{
 assert.equal(normalizeGuess('niño','es-MX'),'NIÑO');assert.equal(normalizeGuess('Straße','de-DE'),'STRAẞE');assert.equal(normalizeGuess('ёлка','ru-RU'),'ЁЛКА');assert.equal(normalizeGuess('avó','pt-BR'),'AVO');
 assert.match(readFileSync('index.html','utf8'),/<meta name="description" content="[^"]*Italian and Swedish/);
});
