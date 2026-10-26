import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teachingFields,learningFor} from '../src/learning.ts';
test('empty teaching data has no visible translation section',()=>{
 assert.deepEqual(teachingFields(null),[]);
 assert.deepEqual(teachingFields({translation:' ',example:'',exampleTranslation:'\n'}),[]);
});
test('partial teaching keeps only useful fields without placeholder rows',()=>{
 assert.deepEqual(teachingFields({translation:' blackberry ',example:' ',exampleTranslation:''}),[{label:'English translation',value:'blackberry',language:'en'}]);
 assert.deepEqual(teachingFields({example:'La mora está dulce.'}),[{label:'Spanish example · Mexico learner context',value:'La mora está dulce.',language:'es-MX'}]);
});
test('full Spanish learning preserves field order and English has no teaching fields',()=>{
 const fields=teachingFields(learningFor('NIÑO','es-MX'));
 assert.deepEqual(fields.map(field=>field.label),['English translation','Spanish example · Mexico learner context','English sentence translation']);
 assert.deepEqual(fields.map(field=>field.language),['en','es-MX','en']);assert.match(fields[0].value,/boy; child/);
 assert.deepEqual(teachingFields(learningFor('NIÑO','en')),[]);
});
import {analyzeObservations} from '../src/evil-advice.ts';
test('former Easy openers keep their teaching even when new pools choose different openers',()=>{
 for(const word of ['DALO','LADO','LOCA','COLA','LAMO','CORLA','CAREA','LACRO','CORLE','RALEO','CONREA','COBREN','CIERNO','COBRAN','CORNEA','CRETINO','CRUENTO','CETRINO','CINTERO','APRENDA']){const entry=learningFor(word,'es-MX');assert.ok(entry);assert.equal(teachingFields(entry).length,3);assert.ok(entry.definition);assert.equal(entry.license,'CC-BY-SA-4.0')}
});
import {vocabulary} from '../src/words.ts';
test('answer eligibility is independent of teaching availability while all lengths retain accepted normalized answers',()=>{
 for(const length of [4,5,6,7]){const pool=vocabulary(length,'es-MX');assert.ok(pool.answers.length>100);assert.equal(new Set(pool.answers).size,pool.answers.length);for(const word of pool.answers){assert.equal(word.length,length);assert.ok(pool.allowed.has(word));assert.equal(word.normalize('NFC'),word)}assert.ok(pool.answers.some(word=>!learningFor(word,'es-MX')))}
});
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('the expanded guide preserves every original teaching record and complete accepted dictionary',()=>{
 const previous=JSON.parse(readFileSync(new URL('./fixtures/spanish-preserved-teaching.json',import.meta.url),'utf8'));
 const records=previous.words.map((word:string)=>learningFor(word,'es-MX'));assert.equal(records.length,118);assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'),previous.sha256);
 for(const length of [4,5,6,7]){const pool=vocabulary(length,'es-MX');assert.equal(pool.allowed.size,previous.guesses[length].count);assert.equal(createHash('sha256').update([...pool.allowed].join('\n')).digest('hex'),previous.guesses[length].sha256)}
 for(const word of ['AÑOS','CASAS','NIÑOS','COMIÓ','CRETINO','CRUENTO','CONREA','CINTERO'])assert.equal(learningFor(word,'es-MX')!.answer,false,word);
 for(const word of ['VINO','OÍDO','BEBIDA','CARGA','ASIENTO','CAPTURA','DERECHO'])assert.equal(learningFor(word,'es-MX')!.answer,true,word);
});
