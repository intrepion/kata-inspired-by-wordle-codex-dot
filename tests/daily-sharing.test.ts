import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shareText,newRun,submit,giveUp} from '../src/domain.ts';
import {copyShareText} from '../src/clipboard.ts';

test('daily win shares only date, count, labels and duplicate-aware colored squares',()=>{
 let run=newRun('APPLE');run=submit(run,'ALLEY').run;run=submit(run,'APPLE').run;
 const text=shareText('2026-11-02',run);assert.match(text,/Lexi Conquest · 2026-11-02 UTC · 5 letters\n2\/6/);assert.match(text,/🟩🟨⬛🟨⬛\n🟩🟩🟩🟩🟩/);assert.doesNotMatch(text,/APPLE|ALLEY|definition|translation/i);
});
test('daily give-up and extended play share loss or attempts without words',()=>{
 const run=giveUp(submit(newRun('APPLE','strict'),'ALLEY').run),text=shareText('2026-11-02',run);
 assert.match(text,/Strict · Gave up\nX\/6/);assert.doesNotMatch(text,/APPLE|ALLEY/);
});
test('clipboard succeeds once, and unavailable, rejected and stalled writes return false',async()=>{
 let calls=0;assert.equal(await copyShareText('grid',async value=>{calls++;assert.equal(value,'grid')}),true);assert.equal(calls,1);
 assert.equal(await copyShareText('grid',undefined),false);assert.equal(await copyShareText('grid',async()=>{throw Error('denied')}),false);assert.equal(await copyShareText('grid',()=>new Promise(()=>{}),5),false);
});
