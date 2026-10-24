import {test} from 'node:test';import assert from 'node:assert/strict';
import {ANSWERS,ALLOWED,ANSWER_DATASET,ABSURD_DATASET} from '../src/words.ts';
test('independently licensed common answer guide and broader guesses replace Wordle-derived selections',()=>{
 assert.equal(ANSWERS.length,3493);assert.equal(ALLOWED.size,11193);assert.equal(ANSWER_DATASET,'scowl-2020.12.07-common35-v1');assert.equal(ABSURD_DATASET,'scowl-2020.12.07-absurd35-v1');
 assert.equal(new Set(ANSWERS).size,ANSWERS.length);assert.deepEqual(ANSWERS,[...ANSWERS].sort());
 for(const answer of ANSWERS){assert.match(answer,/^[A-Z]{5}$/);assert.ok(ALLOWED.has(answer))}
 for(const word of ['APPLE','ALLEY','ABBEY','CYNIC','EERIE','AUDIO','ENTRY','BEACH','VALVE'])assert.ok(ANSWERS.includes(word));
 for(const word of ['ADIEU','XYLEM','GAFFE']){assert.ok(ALLOWED.has(word));assert.ok(!ANSWERS.includes(word))}
 for(const word of ['QAJAQ','SOARE','ROATE','MASSE','PASSE'])assert.equal(ALLOWED.has(word),false);
});

test('changed guide resets the old populated notebook once while current progress persists',async()=>{
 const {emptySave,encode,decode,recordDaily}=await import('../src/persistence.ts');const {submit}=await import('../src/domain.ts');const {submitImpossible}=await import('../src/impossible.ts');
 const date='2026-10-24',save=emptySave(date,'strict');save.settings.suboptimal=true;save.settings.contrast=true;save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,date,save.daily);save.impossible=submitImpossible(save.impossible,'ALLEY').run;save.impossible.assisted=true;save.mode='impossible';
 const old=JSON.parse(encode(save));old.dataset='original-wordle-2315-v2';assert.deepEqual(decode(JSON.stringify(old),date),emptySave(date));
 assert.deepEqual(decode(encode(save),date),save);assert.deepEqual(decode(encode(decode(encode(save),date)),date),save);
});
