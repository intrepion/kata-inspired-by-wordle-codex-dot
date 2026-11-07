import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,LANGUAGE_FAMILIES,varietiesFor,normalizeGuess,normalizeSpelling,keyboardRows,validLetters,isLetterInput,languageLabel,selectedLanguage,displaySpelling,usesAccentEquivalence} from '../src/language.ts';
const locales=['pt-BR','pt-PT'] as const;
test('Portuguese offers distinct Brazil and Portugal varieties',()=>{
 assert.equal(LANGUAGE_FAMILIES.find(family=>family.id==='pt')?.label,'Português');
 assert.deepEqual(varietiesFor('pt'),[{id:'pt-BR',label:'Brasil'},{id:'pt-PT',label:'Portugal'}]);
 for(const locale of locales){assert.ok(LANGUAGES.includes(locale));assert.equal(selectedLanguage(locale),locale);assert.match(languageLabel(locale),/Português/)}
});
for(const locale of locales)test(`${locale}: accent/cedilla equivalence preserves original spelling and letter counts`,()=>{
 for(const [raw,key] of [['ação','ACAO'],['coração','CORACAO'],['avó','AVO'],['avô','AVO'],['órgão','ORGAO'],['pêssego','PESSEGO'],['açúcar','ACUCAR'],['saúde','SAUDE'],['linguiça','LINGUICA'],['mãe','MAE']] as const){
  assert.equal(normalizeGuess(raw,locale),key);assert.equal(normalizeGuess(raw.normalize('NFD'),locale),key);
  assert.equal(normalizeSpelling(raw.normalize('NFD'),locale),raw.toLocaleUpperCase(locale));
  assert.equal(displaySpelling(raw.toLocaleUpperCase(locale),locale),raw.toLocaleUpperCase(locale));
  assert.ok(validLetters(normalizeSpelling(raw,locale),locale));
 }
 assert.ok(usesAccentEquivalence(locale));assert.equal(normalizeGuess('avó',locale),normalizeGuess('avô',locale));
 for(const raw of ['chá','ilha','ninho'])assert.equal(normalizeGuess(raw,locale).length,raw.length);
 for(const raw of ['guarda-chuva','d’água','olá!','two words','123'])assert.equal(validLetters(normalizeGuess(raw,locale),locale),false);
 const keys=keyboardRows(locale).join('').replace(/[↵⌫]/g,'');assert.equal(keys.length,26);assert.equal(new Set(keys).size,26);
 for(const key of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')assert.ok(isLetterInput(key,locale)&&keys.includes(key));
 assert.equal(isLetterInput('CH',locale),false);assert.equal(isLetterInput('LH',locale),false);assert.equal(isLetterInput('NH',locale),false);
});
test('Portuguese folding does not change Spanish or German orthography',()=>{
 assert.notEqual(normalizeGuess('avó','es-MX'),normalizeGuess('avo','es-MX'));
 assert.notEqual(normalizeGuess('grün','de-DE'),normalizeGuess('grun','de-DE'));
 assert.equal(normalizeGuess('Straße','de-DE'),'STRAẞE');
});
