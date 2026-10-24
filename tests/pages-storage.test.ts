import {test} from 'node:test';import assert from 'node:assert/strict';
import {SAVE_KEY} from '../src/persistence.ts';
test('GitHub project paths use a repository namespace while local root saves keep their existing key',async()=>{
 const {saveKeyForPath,PAGES_SAVE_KEY}=await import('../src/site.ts');assert.notEqual(PAGES_SAVE_KEY,SAVE_KEY);assert.match(PAGES_SAVE_KEY,/kata-inspired-by-wordle-codex-dot/);
 for(const path of ['/kata-inspired-by-wordle-codex-dot/','/kata-inspired-by-wordle-codex-dot/index.html','/kata-inspired-by-wordle-codex-dot'])assert.equal(saveKeyForPath(path),PAGES_SAVE_KEY);
 assert.equal(saveKeyForPath('/'),SAVE_KEY);assert.equal(saveKeyForPath('/index.html'),SAVE_KEY);
});
