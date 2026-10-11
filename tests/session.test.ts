import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailyAnswer, dateKey, newRun, submit, status, keyboardClues, rollover} from '../src/domain.ts';
test('incomplete, invalid and duplicate guesses do not spend a turn',()=>{
 const run=newRun('APPLE');
 assert.equal(submit(run,'APP').error,'Use all five letters.');
 assert.equal(submit(run,'ZZZZZ').error,'That word is outside our field guide.');
 const next=submit(run,'ALLEY').run;
 assert.equal(next.guesses.length,1);
 assert.equal(submit(next,'ALLEY').error,'Already noted. Try a different word.');
});
test('win and sixth wrong guess close runs',()=>{
 assert.equal(status(submit(newRun('APPLE'),'APPLE').run),'won');
 let run=newRun('APPLE');
 for(const word of ['CRANE','SHOUT','MIGHT','BERRY','LEVEL','ALLEY']) run=submit(run,word).run;
 assert.equal(status(run),'lost'); assert.equal(submit(run,'APPLE').run,run);
});
test('keyboard retains best evidence across guesses and duplicate copies',()=>{
 assert.equal(keyboardClues({answer:'APPLE',guesses:['ALLEY','APPLE'],draft:''}).L,'exact');
 assert.equal(keyboardClues({answer:'APPLE',guesses:['ALLEY'],draft:''}).L,'elsewhere');
});
test('UTC midnight identity and rollover preserve completed history but abandon unfinished input',()=>{
 assert.equal(dateKey(new Date('2026-10-11T23:59:59Z')),'2026-10-11');
 assert.equal(dateKey(new Date('2026-10-12T00:00:00Z')),'2026-10-12');
 assert.equal(dailyAnswer('2026-01-01'),'ACORN');
 assert.equal(dailyAnswer('2026-01-02'),'ADAPT');
 const run={...newRun(dailyAnswer('2026-10-11')),draft:'CRA'};
 assert.equal(rollover('2026-10-11',run,'2026-10-11'),run);
 assert.deepEqual(rollover('2026-10-11',run,'2026-10-12'),newRun(dailyAnswer('2026-10-12')));
});
