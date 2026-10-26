import {test} from 'node:test';import assert from 'node:assert/strict';
import {teachingFor,teachingFields,learningFor} from '../src/learning.ts';
test('new answer teaching is visible without inventing a bundled dictionary definition',()=>{
 const entry=teachingFor('abad','es-MX');assert.ok(entry);assert.match(entry.translation,/abbot/i);assert.equal(teachingFields(entry).length,3);assert.equal(learningFor('ABAD','es-MX'),null);assert.equal(teachingFor('ABAD','en'),null);
});
import {validateTeaching} from '../scripts/teaching-validation.mjs';
test('teaching validation catches missing/blank/duplicate/placeholder and mismatched usage records',()=>{
 const good={word:'LUGAR',translation:'place',example:'Este lugar está cerca del mercado.',exampleTranslation:'This place is near the market.'};
 assert.deepEqual(validateTeaching([good],['LUGAR']),[]);
 for(const rows of [[],[good,good],[{...good,translation:' '}],[{...good,example:'TODO'}],[{...good,example:'La casa está cerca.'}],[{...good,exampleTranslation:good.example}]])assert.ok(validateTeaching(rows,['LUGAR']).length);
});
test('validation permits real Spanish todo but rejects invented source fields and accent mismatches',()=>{
 const good={word:'TODO',translation:'everything',example:'Revisé todo antes de salir.',exampleTranslation:'I checked everything before leaving.'};assert.deepEqual(validateTeaching([good],['TODO']),[]);assert.ok(validateTeaching([{...good,sourceUrl:'https://invented.invalid'}],['TODO']).length);
 const accented={word:'LÁPIZ',translation:'pencil',example:'Dejé el lapiz en la mesa.',exampleTranslation:'I left the pencil on the table.'};assert.ok(validateTeaching([accented],['LÁPIZ']).length);
});
import {vocabulary} from '../src/words.ts';import {SPANISH_TEACHING_TOTAL} from '../src/learning.ts';
test('every current Spanish possible answer has complete teaching without replacing the preserved archive',()=>{
 let total=0;for(const length of [4,5,6,7])for(const word of vocabulary(length,'es-MX').answers){const entry=teachingFor(word,'es-MX');assert.ok(entry,word);assert.equal(teachingFields(entry).length,3,word);assert.ok(entry.example.normalize('NFC').toLocaleUpperCase('es-MX').includes(word));total++}
 assert.equal(total,3333);assert.equal(SPANISH_TEACHING_TOTAL,3410);assert.deepEqual(teachingFor('NIÑO','es-MX'),learningFor('NIÑO','es-MX'));
});
import {DefinitionClient} from '../src/definitions.ts';
test('authored teaching normalizes Spanish but never seeds a fabricated dictionary meaning or English lookup',()=>{
 assert.equal(teachingFor('razo\u0301n','es-MX')?.word,'RAZÓN');assert.equal(teachingFor('RAZÓN','en'),null);assert.equal(teachingFor('ZZZZ','es-MX'),null);
 assert.deepEqual(Object.keys(teachingFor('LUGAR','es-MX')!).sort(),['example','exampleTranslation','translation','word']);
 const dictionary=new DefinitionClient(async()=>{throw Error('offline')},1000,Date.now,'es-MX');assert.equal(dictionary.peek('LUGAR'),null);assert.ok(dictionary.peek('NIÑO'));
});
import {execFileSync} from 'node:child_process';
test('complete reviewed teaching regenerates byte-for-byte with approved immutable batch hashes',()=>{
 assert.match(execFileSync(process.execPath,['scripts/generate-complete-teaching.mjs','--check'],{encoding:'utf8'}),/3333\/3333 possible answers covered; 3410 total/);
});
