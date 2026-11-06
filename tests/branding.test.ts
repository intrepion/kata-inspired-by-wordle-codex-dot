import {DAILY_SCHEDULE_VERSION} from '../src/daily-schedule.ts';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {newRun,submit,shareText} from '../src/domain.ts';import {newImpossible,impossibleShare} from '../src/impossible.ts';import {vocabulary} from '../src/words.ts';import {decode,encode} from '../src/persistence.ts';import {saveKeyForPath,activeSaveKeyForPath,preserveEnglishStorageForUpdate,STORAGE_EPOCH} from '../src/site.ts';import {decodeGlobalDifficulty} from '../src/global-difficulty.ts';import type {Language} from '../src/language.ts';
test('ordinary and adaptive results share the Lexi Conquest display name',()=>{
 for(const language of ['en','es-MX'] as Language[])for(const length of [4,5,6,7]){
  const answer=vocabulary(length,language).answers[0],run=submit(newRun(answer,'normal',language),answer).run;
  assert.match(shareText('2026-10-11',run),/^Lexi Conquest · /);assert.match(impossibleShare(newImpossible('normal',length,language)),/^Lexi Conquest · /);
 }
});
test('pre-rename originals stay verbatim while compatible rounds, language, difficulty and drafts migrate',()=>{
 const input=JSON.parse(readFileSync('tests/fixtures/pre-rename-notebooks.json','utf8'));assert.equal(STORAGE_EPOCH,input.epoch);assert.equal(decodeGlobalDifficulty(input.globalDifficulty),'strict');
 assert.equal(saveKeyForPath('/',5),'morrowmark.v1');assert.equal(saveKeyForPath('/kata-inspired-by-wordle-codex-dot/',5),'morrowmark.kata-inspired-by-wordle-codex-dot.v1');
 const data=new Map<string,string>(input.fixtures.map((f:{key:string;raw:string})=>[f.key,f.raw]));const storage={get length(){return data.size},key:(i:number)=>[...data.keys()][i]??null,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};preserveEnglishStorageForUpdate(storage,'/kata-inspired-by-wordle-codex-dot/');
 for(const f of input.fixtures){
  assert.equal(saveKeyForPath('/kata-inspired-by-wordle-codex-dot/',f.length,f.language),f.key);assert.equal(storage.getItem(f.key),f.raw);
  const original=JSON.parse(f.raw),restored=decode(f.raw,f.date,f.length,f.language);
  if(f.language==='en'){
   assert.equal(storage.getItem(activeSaveKeyForPath('/kata-inspired-by-wordle-codex-dot/',f.length,f.language)),f.raw);assert.deepEqual(restored.daily,original.daily);assert.deepEqual(restored.practice,original.practice);assert.deepEqual(restored.settings,original.settings);assert.equal(restored.mode,original.mode);assert.deepEqual(restored.impossible.guesses,[]);assert.equal(restored.impossible.strictMode,true);assert.equal(restored.englishAnswerUpdate,true);assert.deepEqual(decode(encode(restored),f.date,f.length,f.language),restored);
  }else assert.deepEqual(JSON.parse(encode(restored)),{...original,dailyScheduleVersion:DAILY_SCHEDULE_VERSION});
 }
});
test('home tagline reflects the multilingual word game',()=>{
 const main=readFileSync('src/main.ts','utf8');assert.match(main,/Words across languages\.<br><em>One clue at a time\.<\/em>/);assert.doesNotMatch(main,/Every word leaves<br>a <em>little mark/);
});
