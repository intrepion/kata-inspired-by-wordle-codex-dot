import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptySave,encode,decode,recordDaily,statistics} from '../src/persistence.ts';
import {newRun,submit,dailyAnswer,difficulty} from '../src/domain.ts';
import {newImpossible,submitImpossible} from '../src/impossible.ts';
const today='2026-04-02';
function populated(){const save=emptySave(today,'strict');save.daily=submit(save.daily,'XYLEM').run;save.daily.draft='CRA';save.daily.assisted=true;save.practice=submit(newRun('APPLE','easy'),'ALLEY').run;save.practice.draft='AMP';save.impossible=submitImpossible(newImpossible('easy'),'AUDIO').run;save.impossible.draft='PAS';save.mode='impossible';save.settings.contrast=true;save.settings.suboptimal=true;recordDaily(save,'2026-04-01',submit(newRun(dailyAnswer('2026-04-01')),dailyAnswer('2026-04-01')).run);return save}
test('pre-update populated notebooks become genuine first-use defaults across every saved variant',()=>{
 const old=JSON.parse(encode(populated()));old.version=2;
 const reset=decode(JSON.stringify(old),today);
 assert.equal(difficulty(reset.daily),'normal');assert.deepEqual(reset,emptySave(today));assert.equal(reset.version,3);
 assert.equal(reset.mode,'daily');assert.deepEqual(reset.settings,{contrast:false,hardMode:false});assert.equal(statistics(reset.results,today,reset.history).played,0);
});

test('the reset happens once: new rounds, statistics and explicit preferences survive repeated reloads',()=>{
 const current=populated();assert.equal(current.version,3);
 const once=decode(encode(current),today),twice=decode(encode(once),today);
 assert.deepEqual(once,current);assert.deepEqual(twice,current);assert.equal(statistics(twice.results,today,twice.history).wins,1);
});
test('all old variants and legacy preferences are discarded together',()=>{
 for(const version of [1,2])for(const mode of ['daily','practice','impossible','evil','absurd']){
  const raw=JSON.parse(encode(populated()));raw.version=version;raw.mode=mode;raw.datasetNotice=true;raw.evilPoolNotice=true;raw.otherGameOwnedState={assisted:true};
  assert.deepEqual(decode(JSON.stringify(raw),today),emptySave(today));
 }
});
