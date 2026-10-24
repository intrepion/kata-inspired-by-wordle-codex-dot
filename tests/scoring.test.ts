import {test} from 'node:test';
import assert from 'node:assert/strict';
import {score} from '../src/domain.ts';
test('exact copies are reserved before allocating repeated letters',()=>{
 assert.deepEqual(score('APPLE','ALLEY'),['exact','elsewhere','absent','elsewhere','absent']);
 assert.deepEqual(score('LEVEL','LEECH'),['exact','exact','elsewhere','absent','absent']);
 assert.deepEqual(score('APPLE','PUPPY'),['elsewhere','absent','exact','absent','absent']);
});

test('new repeated-letter guesses consume only available answer copies',()=>{
 assert.deepEqual(score('APPLE','ABBEY'),['exact','absent','absent','elsewhere','absent']);
 assert.deepEqual(score('APPLE','PAPAL'),['elsewhere','elsewhere','exact','absent','elsewhere']);
});
