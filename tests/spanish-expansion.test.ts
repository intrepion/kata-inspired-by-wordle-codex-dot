import {test} from 'node:test';import assert from 'node:assert/strict';
import {vocabulary} from '../src/words.ts';import {answerEligibility} from '../src/answer-eligibility.ts';
test('common documented Spanish base words are possible answers without requiring teaching coverage',()=>{
 for(const word of ['LUGAR','RAZÓN','HABER','VALOR','SISTEMA','ADULTO','LÍDER','FACTOR','AHORA','ANTES','LUEGO','TRAS'])assert.equal(answerEligibility(word,word.length as 4|5|6|7,'es-MX').possible,true,word);
 for(const length of [4,5,6,7])assert.ok(vocabulary(length,'es-MX').answers.length>100);
});
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {learningFor} from '../src/learning.ts';
test('source policy rejects grammatical, rare and unsuitable forms while preserving ordinary homographs and guesses',()=>{
 for(const word of ['NIÑOS','CASAS','DATOS','GEMELOS','USTEDES','HABLO','COMES','VIVÍA','COMIDO','ABINARE','CRETINO','PINCHE']){assert.equal(answerEligibility(word,word.length as 4|5|6|7,'es-MX').possible,false,word);assert.ok(vocabulary(word.length,'es-MX').allowed.has(word),word)}
 for(const word of ['VINO','TRAJE','PAÍS','CRISIS','VIERNES','CANSADO','SUMANDO','GRACIAS','TENIS','AGUAS','RAYOS','GATA','AMIGA','CHICA'])assert.equal(answerEligibility(word,word.length as 4|5|6|7,'es-MX').possible,true,word);
 assert.match(answerEligibility('DATOS',5,'es-MX').reason,/plural/i);assert.match(answerEligibility('HABLO',5,'es-MX').reason,/inflected verb/i);assert.match(answerEligibility('ABINARE',7,'es-MX').reason,/frequency/i);
});
test('all439 teaching records remain byte-for-byte equivalent through the public learning lookup',()=>{
 const archive=JSON.parse(readFileSync(new URL('./fixtures/spanish-teaching-archive.json',import.meta.url),'utf8'));assert.equal(archive.words.length,439);const records=archive.words.map((word:string)=>learningFor(word,'es-MX'));assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'),archive.sha256);assert.equal(learningFor('LUGAR','es-MX'),null);assert.equal(answerEligibility('LUGAR',5,'es-MX').possible,true);
});
import selection from '../src/data/spanish/answer-selection.json';
import evidence from '../src/data/spanish/selection-evidence.json';
test('the uncapped selected pools have exact reviewed counts and every inclusion has source/frequency evidence',()=>{
 assert.deepEqual(selection.counts,{'4':468,'5':857,'6':949,'7':1059});
 const audit:Record<string,{zipf:number;source?:string;entry:number;sense:number}>=evidence;
 for(const length of [4,5,6,7])for(const word of vocabulary(length,'es-MX').answers){assert.ok(audit[word]?.zipf>=3.5,word);assert.ok(Number.isInteger(audit[word].entry));assert.ok(Number.isInteger(audit[word].sense));}
 for(const word of ['AMIGA','CHICA','GATA'])assert.equal(audit[word].source,'supplemental');assert.equal(audit['LISA'].sense,1);
 assert.equal(answerEligibility('BEBA',4,'es-MX').possible,false);
});
