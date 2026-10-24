import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {ACCEPTED_GUESSES} from '../src/data/scowl-guesses.ts';
import {execFileSync} from 'node:child_process';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ANSWERS,ALLOWED} from '../src/words.ts';
import {choosePractice,newRun,shareText,submit} from '../src/domain.ts';
test('licensed SCOWL vocabulary has unique ASCII five-letter answers and separate accepted guesses',()=>{
 assert.equal(ANSWERS.length,2103);assert.equal(new Set(ANSWERS).size,2103);assert.equal(ALLOWED.size,11193);
 for(const word of ALLOWED)assert.match(word,/^[A-Z]{5}$/);
 for(const word of ANSWERS)assert.equal(ALLOWED.has(word),true);
 assert.equal(ALLOWED.has('ALLEY'),true);assert.equal(ANSWERS.includes('ALLEY'),true);
});
test('practice chooses a different answer even at random boundaries',()=>{
 assert.notEqual(choosePractice('ACORN',()=>0).answer,'ACORN');
 assert.notEqual(choosePractice('ZESTY',()=>1).answer,'ZESTY');
});
test('share is local spoiler-free evidence, without answers or guesses',()=>{
 const text=shareText('2026-10-11',submit(newRun('APPLE'),'APPLE').run);
 assert.equal(text,'Morrowmark · 2026-10-11 UTC · 5 letters\n1/6\n■■■■■\n■ exact · ◩ elsewhere · □ absent');
 assert.equal(text.includes('APPLE'),false);
});

test('expanded field guide accepts missing words with normalized case',()=>{
 for(const word of ['ABBEY','ABYSS','ADIEU','CYNIC','XYLEM','ORATE','GAFFE']){
  const result=submit(newRun('APPLE'),word.toLowerCase());
  assert.equal(result.error,undefined,word);
  assert.deepEqual(result.run.guesses,[word]);
 }
 const noted=submit(newRun('APPLE'),'adieu').run;
 assert.equal(submit(noted,'AdIeU').error,'Already noted. Try a different word.');
});

test('pinned SCOWL inputs generate the exact answer/guess modules reproducibly',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../src/data/scowl-source.json',import.meta.url),'utf8'));
 assert.equal(manifest.revision,'5ef55f9c42730ebe4394a78b77855468a6f15dd2');assert.equal(manifest.archiveSha256,'5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc');
 const raw=readFileSync(new URL('../src/data/scowl-five-letter.json',import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.snapshotSha256);assert.equal(Object.keys(manifest.files).length,27);
 assert.deepEqual([...ALLOWED],ACCEPTED_GUESSES);assert.deepEqual([...ALLOWED],[...ALLOWED].sort());
 const notice=readFileSync(new URL('../public/third-party/SCOWL-Copyright.txt',import.meta.url),'utf8');assert.match(notice,/Permission to use, copy, modify, distribute and sell/);assert.match(notice,/WordNet 1.6 Copyright 1997/);assert.match(notice,/J Ross Beresford 1993-1999/);
 assert.match(execFileSync(process.execPath,['scripts/generate-vocabulary.mjs','--check'],{encoding:'utf8'}),/2103 answers, 11193 guesses/);
});
test('invalid guesses leave the run, draft and turn count intact',()=>{
 const run={...newRun('APPLE'),draft:'ADI'};
 for(const raw of ['', 'AB', 'ABCDEF', '12345', 'AB CD', 'CAFÉ', ' ADIEU', 'ADIEU ', 'ZZZZZ']){
  const result=submit(run,raw);assert.ok(result.error,raw);assert.equal(result.run,run);
 }
});
