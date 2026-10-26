import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {newRun,submit,shareText} from '../src/domain.ts';import {newImpossible,impossibleShare} from '../src/impossible.ts';import {vocabulary} from '../src/words.ts';import {decode,encode} from '../src/persistence.ts';import {saveKeyForPath,STORAGE_EPOCH} from '../src/site.ts';import {decodeGlobalDifficulty} from '../src/global-difficulty.ts';import type {Language} from '../src/language.ts';
test('ordinary and adaptive results share the Lexi Conquest display name',()=>{
 for(const language of ['en','es-MX'] as Language[])for(const length of [4,5,6,7]){
  const answer=vocabulary(length,language).answers[0],run=submit(newRun(answer,'normal',language),answer).run;
  assert.match(shareText('2026-10-11',run),/^Lexi Conquest · /);assert.match(impossibleShare(newImpossible('normal',length,language)),/^Lexi Conquest · /);
 }
});
test('pre-rename notebooks retain namespaces, epoch, rounds, language, difficulty and drafts',()=>{
 const input=JSON.parse(readFileSync('tests/fixtures/pre-rename-notebooks.json','utf8'));assert.equal(STORAGE_EPOCH,input.epoch);assert.equal(decodeGlobalDifficulty(input.globalDifficulty),'strict');
 assert.equal(saveKeyForPath('/',5),'morrowmark.v1');assert.equal(saveKeyForPath('/kata-inspired-by-wordle-codex-dot/',5),'morrowmark.kata-inspired-by-wordle-codex-dot.v1');
 for(const f of input.fixtures){assert.equal(saveKeyForPath('/kata-inspired-by-wordle-codex-dot/',f.length,f.language),f.key);assert.deepEqual(JSON.parse(encode(decode(f.raw,f.date,f.length,f.language))),JSON.parse(f.raw));}
});
