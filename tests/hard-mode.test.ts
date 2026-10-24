import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRun,submit,setHardMode,choosePractice} from '../src/domain.ts';

test('hard mode keeps green positions and preserves rejected drafts and turns',()=>{
 let run=newRun('APPLE',true);
 run=submit(run,'ALLEY').run;
 run={...run,draft:'PLEAT'};
 const result=submit(run,run.draft);
 assert.equal(result.error,'Hard mode: position 1 must be A.');
 assert.equal(result.run,run);
 assert.equal(submit(run,'AMPLE').error,undefined);
});

test('hard mode requires yellow letters but allows their old positions and gray letters',()=>{
 const run=submit(newRun('APPLE',true),'ADIEU').run;
 assert.equal(submit(run,'ABOUT').error,'Hard mode: include E.');
 // E stays in the same yellow position; I and D were gray. Both remain legal.
 assert.equal(submit(run,'AIDER').error,undefined);
});
test('hard mode counts green and yellow copies together, without banning extra copies',()=>{
 const run=submit(newRun('APPLE',true),'PUPPY').run;
 assert.equal(submit(run,'AMPLE').error,'Hard mode: include at least 2 Ps.');
 assert.equal(submit(run,'APPLY').error,undefined); // Previously gray Y is allowed.
 const next=submit(run,'PAPAL').run;
 assert.equal(submit(next,'APPLE').error,undefined); // Counts are minima, not added across rows.
 const oneL=submit(newRun('APPLE',true),'ALLEY').run;
 assert.equal(submit(oneL,'ALLEL').error,undefined); // Extra L copies are allowed.
});
test('normal mode still permits guesses that ignore positive hints',()=>{
 const run=submit(newRun('APPLE'),'ALLEY').run;
 assert.equal(submit(run,'CRANE').error,undefined);
});
test('hard mode toggle locks only enabling after an accepted guess',async()=>{
 const draft={...newRun('APPLE'),draft:'CRA'};
 assert.equal(setHardMode(draft,true).run.hardMode,true);
 const started=submit(setHardMode(draft,true).run,'ALLEY').run;
 assert.equal(setHardMode(started,true).run,started);
 const disabled=setHardMode(started,false).run;
 assert.equal(disabled.hardMode,undefined);assert.deepEqual(disabled.guesses,['ALLEY']);
 assert.match(setHardMode(disabled,true).error!,/before the first accepted guess/);
 assert.equal(setHardMode(disabled,true).run,disabled);
 const invalid=submit(newRun('APPLE'),'ZZZZZ').run;
 assert.equal(setHardMode(invalid,true).error,undefined);
 const won=submit(newRun('APPLE'),'APPLE').run;
 assert.ok(setHardMode(won,true).error);
});

test('hard mode persists independently for daily and practice with a future-puzzle preference',async()=>{
 const {emptySave,decode,encode}=await import('../src/persistence.ts');
 const save=emptySave('2026-10-23');
 save.settings.hardMode=true;
 save.practice=submit(newRun('APPLE',true),'PUPPY').run;
 save.daily=submit(save.daily,'ADIEU').run;
 save.practice.draft='AMP';
 const restored=decode(encode(save),'2026-10-23');
 assert.deepEqual(restored,save);
 const tomorrow=decode(encode(save),'2026-10-24');
 assert.equal(tomorrow.daily.hardMode,true);assert.deepEqual(tomorrow.practice,save.practice);
 assert.equal(tomorrow.daily.guesses.length,0);
});
test('legacy saves remain normal and invalid hard-mode metadata cannot erase history',async()=>{
 const {emptySave,decode,encode}=await import('../src/persistence.ts');
 const save=emptySave('2026-10-23');
 const old=JSON.parse(encode(save));delete old.settings.hardMode;
 old.practice={answer:'APPLE',guesses:['ALLEY','CRANE'],draft:'APP'};
 assert.deepEqual(decode(JSON.stringify(old),old.date).practice,old.practice);
 const flagged={...old,settings:{contrast:false,hardMode:'true'},practice:{...old.practice,hardMode:true}};
 const restored=decode(JSON.stringify(flagged),old.date);
 assert.deepEqual(restored.practice,old.practice);assert.equal(restored.settings.hardMode,false);
});
test('completed daily ledger preserves matching hard-mode run metadata on reload',async()=>{
 const {emptySave,decode,recordDaily,encode}=await import('../src/persistence.ts');
 const save=emptySave('2026-10-23');
 save.daily=newRun(save.daily.answer,true);
 save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,save.date,save.daily);
 assert.deepEqual(decode(encode(save),save.date),save);
 const stale={...save,daily:newRun(save.daily.answer,true)};
 assert.equal(decode(JSON.stringify(stale),save.date).daily.hardMode,undefined);
});

test('fresh practice inherits preference without changing answer membership',()=>{
 const next=choosePractice('APPLE',()=>0,true);
 assert.equal(next.hardMode,true);assert.notEqual(next.answer,'APPLE');
});
