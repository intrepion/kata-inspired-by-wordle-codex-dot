import {test} from 'node:test';import assert from 'node:assert/strict';
import {applyGlobalDifficulty,decodeGlobalDifficulty} from '../src/global-difficulty.ts';
import {difficulty,newRun,submit} from '../src/domain.ts';import {newImpossible,submitImpossible} from '../src/impossible.ts';
test('a global Easy selection applies to ordinary and Absurd notebooks without discarding progress',()=>{
 for(const run of [submit(newRun('APPLE'),'ALLEY').run,submitImpossible(newImpossible(),'AUDIO').run]){
  const changed=applyGlobalDifficulty(run,'easy');assert.equal(changed.error,undefined);assert.equal(difficulty(changed.run),'easy');assert.equal(changed.run.assisted,true);assert.deepEqual(changed.run.guesses,run.guesses);assert.equal(changed.run.answer,run.answer);
 }
 assert.equal(decodeGlobalDifficulty('strict'),'strict');assert.equal(decodeGlobalDifficulty(null),'normal');assert.equal(decodeGlobalDifficulty('invalid','hard'),'hard');
});
test('upgrades validate every historical row; incompatible rounds remain intact and can be resumed at Normal',()=>{
 let run=newRun('APPLE');for(const guess of ['ALLEY','CRANE'])run=submit(run,guess).run;
 const blocked=applyGlobalDifficulty(run,'strict');assert.match(blocked.error??'',/Earlier guess 2.*CRANE/s);assert.equal(blocked.run,run);
 const compatible=submit(newRun('APPLE'),'ALLEY').run;const strict=applyGlobalDifficulty(compatible,'strict');assert.equal(strict.error,undefined);assert.equal(difficulty(strict.run),'strict');assert.match(submit(strict.run,'CRANE').error??'',/Strict/);
 const easy=applyGlobalDifficulty(compatible,'easy').run;const normal=applyGlobalDifficulty(easy,'normal').run;assert.equal(normal.assisted,true);assert.equal(difficulty(normal),'normal');
});
test('completed results keep their earned difficulty and assistance when the global preference changes',()=>{
 const won=submit(newRun('APPLE','strict'),'APPLE').run;
 assert.equal(applyGlobalDifficulty(won,'easy').run,won);
 assert.equal(applyGlobalDifficulty(won,'normal').run,won);
});
test('all difficulties apply at each language and length, and adaptive clues govern upgrades',async()=>{
 const {vocabulary}=await import('../src/words.ts');const {encode,decode,emptySave}=await import('../src/persistence.ts');
 for(const language of ['en','es-MX'] as const)for(const length of [4,5,6,7] as const)for(const level of ['easy','normal','hard','strict'] as const){
  const answer=vocabulary(length,language).answers[0];
  for(const run of [newRun(answer,'normal',language),newImpossible('normal',length,language)]){
   const next=applyGlobalDifficulty(run,level);assert.equal(next.error,undefined);assert.equal(difficulty(next.run),level);assert.equal(next.run.answer,run.answer);assert.deepEqual(next.run.guesses,[]);
  }
  const save=emptySave('2026-10-25',false,length,language);save.daily=applyGlobalDifficulty(save.daily,level).run;save.practice=applyGlobalDifficulty(save.practice,level).run;save.impossible=applyGlobalDifficulty(save.impossible,level).run;
  const restored=decode(encode(save),'2026-10-25',length,language);for(const run of [restored.daily,restored.practice,restored.impossible])assert.equal(difficulty(run),level);
 }
 let run=newImpossible();for(const guess of ['AUDIO','ENTRY'])run=submitImpossible(run,guess).run;
 const strict=applyGlobalDifficulty(run,'strict');assert.ok(strict.error);assert.equal(strict.run,run);
 const first=submitImpossible(newImpossible(),'AUDIO').run;const changed=applyGlobalDifficulty(first,'strict');assert.equal(changed.error,undefined);assert.deepEqual(changed.run.feedback,first.feedback);assert.deepEqual(changed.run.candidates,first.candidates);
});
