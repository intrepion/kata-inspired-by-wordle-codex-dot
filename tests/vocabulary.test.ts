import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ANSWERS,ALLOWED} from '../src/words.ts';
import {choosePractice,newRun,shareText,submit} from '../src/domain.ts';
test('v1 vocabulary has unique ASCII five-letter answers and separate accepted guesses',()=>{
 assert.equal(ANSWERS.length,837);assert.equal(new Set(ANSWERS).size,837);assert.equal(ALLOWED.size,1134);
 for(const word of ALLOWED)assert.match(word,/^[A-Z]{5}$/);
 for(const word of ANSWERS)assert.equal(ALLOWED.has(word),true);
 assert.equal(ALLOWED.has('ALLEY'),true);assert.equal(ANSWERS.includes('ALLEY'),false);
});
test('practice chooses a different answer even at random boundaries',()=>{
 assert.notEqual(choosePractice('ACORN',()=>0).answer,'ACORN');
 assert.notEqual(choosePractice('ZESTY',()=>1).answer,'ZESTY');
});
test('share is local spoiler-free evidence, without answers or guesses',()=>{
 const text=shareText('2026-10-11',submit(newRun('APPLE'),'APPLE').run);
 assert.equal(text,'Morrowmark · 2026-10-11 UTC\n1/6\n■■■■■\n■ exact · ◩ elsewhere · □ absent');
 assert.equal(text.includes('APPLE'),false);
});
