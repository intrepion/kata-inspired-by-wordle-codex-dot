import {giveUp,awaitingContinuation,continueGuessing} from '../src/domain.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decode,emptySave,recordDaily,statistics,synchronize,encode} from '../src/persistence.ts';
import {dailyAnswer,newRun,submit} from '../src/domain.ts';
const today='2026-10-11';
function win(date:string){return submit(newRun(dailyAnswer(date)),dailyAnswer(date)).run}
test('terminal daily ledger is idempotent and practice cannot add records',()=>{
 const save=emptySave(today);
 recordDaily(save,today,win(today)); recordDaily(save,today,win(today));
 assert.equal(statistics(save.results,today).played,1);
 recordDaily(save,today,newRun('APPLE')); assert.equal(statistics(save.results,today).played,1);
});
test('streaks survive yesterday, break on missed days/loss and keep best',()=>{
 const s=emptySave(today);
 for(const d of ['2026-10-08','2026-10-09','2026-10-10'])recordDaily(s,d,win(d));
 assert.equal(statistics(s.results,today).current,3);
 assert.equal(statistics(s.results,'2026-10-12').current,0);
 recordDaily(s,today,win(today)); assert.equal(statistics(s.results,today).current,4);
 assert.equal(statistics(s.results,today).best,4);
 assert.equal(statistics(s.results,today).histogram[0],4);
});
test('save validates terminal history, draft, dates, no post-win turns and settings',()=>{
 const s=emptySave(today); s.daily={...s.daily,draft:'CRA'};
 s.practice={answer:'APPLE',guesses:['ALLEY'],draft:'PUP'};
 s.results['2026-10-10']=[dailyAnswer('2026-10-10')];
 const restored=decode(JSON.stringify(s),today);
 assert.equal(restored.daily.draft,'CRA'); assert.deepEqual(restored.practice,s.practice);
 assert.equal(statistics(restored.results,today).wins,1);
 const bad={...s,daily:{guesses:['ZZZZZ'],draft:'<b>'},practice:{answer:'XXXXX',guesses:[],draft:''},results:{'2026-02-30':['APPLE'],[today]:[dailyAnswer(today),'CRANE']},settings:{contrast:'yes'}};
 const cleaned=decode(JSON.stringify(bad),today);
 assert.deepEqual(cleaned.daily,newRun(dailyAnswer(today))); assert.deepEqual(cleaned.results,{});
 assert.equal(cleaned.settings.contrast,false);
 assert.deepEqual(decode('{bad',today),emptySave(today));
 assert.deepEqual(decode(JSON.stringify({...s,version:99}),today),emptySave(today));
});
test('rollover retains results and practice, resets unfinished daily',()=>{
 const s=emptySave('2026-10-10');s.daily.draft='CRA';s.practice.draft='APP';
 recordDaily(s,'2026-10-10',win('2026-10-10'));
 const next=decode(JSON.stringify(s),today);
 assert.equal(next.date,today);assert.equal(next.daily.draft,''); assert.equal(next.practice.draft,'APP');
 assert.equal(statistics(next.results,today).current,1);
});
test('loss resets current streak without erasing the best streak',()=>{
 const s=emptySave(today);recordDaily(s,'2026-10-10',win('2026-10-10'));
 let run=newRun(dailyAnswer(today));for(const word of ['APPLE','CRANE','SHOUT','MIGHT','BERRY','LEVEL'])run=submit(run,word).run;
 recordDaily(s,today,giveUp(run));
 assert.deepEqual(statistics(s.results,today),{played:2,wins:1,percent:50,current:0,best:1,histogram:[1,0,0,0,0,0]});
});
test('terminal daily run is recorded on restore even without a ledger entry',()=>{
 const s=emptySave(today);s.daily=win(today);
 const restored=decode(JSON.stringify(s),today);
 assert.equal(statistics(restored.results,today).played,1);
 assert.equal(decode(JSON.stringify(restored),today).daily.guesses.length,1);
});
test('ledger wins over stale unfinished saves and rejects future entries',()=>{
 const s=emptySave(today);recordDaily(s,today,win(today));s.daily.draft='APP';
 s.results['2026-10-12']=[dailyAnswer('2026-10-12')];
 const restored=decode(JSON.stringify(s),today);
 assert.equal(restored.daily.draft,'');assert.equal(restored.daily.guesses.length,1);
 assert.equal(statistics(restored.results,today).played,1);
});
test('malformed duplicate guesses and overlong runs are discarded',()=>{
 const s=emptySave(today);
 for(const guesses of [['CRANE','CRANE'],Array(7).fill('CRANE'),['apple'],[null]]){
  const restored=decode(JSON.stringify({...s,daily:{guesses,draft:'ABCDEF'}}),today);
  assert.deepEqual(restored.daily,newRun(dailyAnswer(today)));
 }
});

test('storage read failure at midnight still rolls the in-memory daily run forward',()=>{
 const s=emptySave('2026-10-10');s.daily.draft='CRA';s.practice.draft='APP';
 const result=synchronize(s,today,()=>{throw new Error('Storage blocked')});
 assert.equal(result.available,false);assert.equal(result.save.date,today);
 assert.equal(result.save.daily.draft,'');assert.equal(result.save.practice.draft,'APP');
});
test('an externally cleared notebook resets state on the next action',()=>{
 const s=emptySave(today);s.daily.draft='CRA';recordDaily(s,today,win(today));
 assert.deepEqual(synchronize(s,today,()=>null).save,emptySave(today));
});

test('expanded guesses survive reload alongside existing drafts and results',()=>{
 const save=emptySave(today);save.daily=submit(save.daily,'adieu').run;
 save.daily.draft='CRA';save.practice={answer:'APPLE',guesses:['ALLEY'],draft:'PUP'};
 recordDaily(save,'2026-10-10',win('2026-10-10'));
 assert.deepEqual(decode(encode(save),today),save);
});
