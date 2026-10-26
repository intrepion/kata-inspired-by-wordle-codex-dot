import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerEligibility} from '../src/answer-eligibility.ts';
test('answer membership uses the selected language and length, independent of clues',()=>{
 assert.equal(answerEligibility('glass',5,'en').possible,true);
 assert.equal(answerEligibility('VINO',4,'es-MX').possible,true);
 assert.equal(answerEligibility('VINO',5,'es-MX').possible,false);
 assert.equal(answerEligibility('VINO',4,'en').possible,false);
});
test('only verified exclusions get grammatical reasons; homographs keep eligibility',()=>{
 assert.match(answerEligibility('BOOKS',5,'en').reason,/plural.*book/i);
 assert.match(answerEligibility('WROTE',5,'en').reason,/past.tense.*write/i);
 assert.match(answerEligibility('GEESE',5,'en').reason,/plural.*goose/i);
 assert.equal(answerEligibility('FOUND',5,'en').possible,true);
 assert.equal(answerEligibility('CLASS',5,'en').possible,true);
 assert.match(answerEligibility('HABLO',5,'es-MX').reason,/Valid guess.*inflected verb/);
 assert.doesNotMatch(answerEligibility('HABLO',5,'es-MX').reason,/plural noun|past.tense/);
});
test('length-specific irregular exclusions and independent senses stay distinct',()=>{
 assert.match(answerEligibility('FEET',4,'en').reason,/plural.*FOOT/);
 assert.match(answerEligibility('BAKED',5,'en').reason,/past.tense.*BAKE/);
 assert.equal(answerEligibility('VIERNES',7,'es-MX').possible,true);
 assert.equal(answerEligibility('COMIDA',6,'es-MX').possible,true);
 assert.equal(answerEligibility('VIVIR',5,'es-MX').possible,true);
});
test('reviewed exceptions retain the source uncertainty in their explanation',()=>{
 assert.match(answerEligibility('HIDED',5,'en').reason,/past form of hide.*uncertain/i);
 assert.match(answerEligibility('SADES',5,'en').reason,/noun plural of sade.*uncertain/i);
});
