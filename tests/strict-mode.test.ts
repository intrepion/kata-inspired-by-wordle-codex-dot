import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRun,submit} from '../src/domain.ts';
test('strict mode rejects a yellow in its previous position without using a turn',()=>{
 const first=submit(newRun('APPLE','strict'),'ADIEU').run;
 const run={...first,draft:'AIDER'};
 const result=submit(run,'aider');
 assert.match(result.error!,/E cannot be in position 4/);
 assert.equal(result.run,run);
});

test('strict mode enforces green positions, absent letters and exact duplicate caps',()=>{
 const run=submit(newRun('APPLE','strict'),'ALLEY').run;
 assert.match(submit(run,'PLEAT').error!,/position 1 must be A/);
 assert.match(submit(run,'ATOLL').error!,/exactly 1 L/);
 const noY=submit(newRun('APPLE','strict'),'CRAZY').run;
 assert.match(submit(noY,'YAPOK').error!,/Y was ruled out/);
 const minimum=submit(newRun('APPLE','strict'),'PUPPY').run;
 assert.match(submit(minimum,'AMPLE').error!,/at least 2 Ps/);
 assert.match(submit(minimum,'APPLY').error!,/Y was ruled out/);
 assert.equal(submit(minimum,'APPLE').error,undefined);
});
test('strict mode retains exclusions from older rows',()=>{
 let run=submit(newRun('APPLE','strict'),'FUZZY').run;
 run=submit(run,'CRANE').run;assert.equal(run.guesses.length,2);
 assert.match(submit(run,'FABLE').error!,/F was ruled out.*fieldnote 1/);
});
test('strict mode accepts consistent dictionary candidates outside the answer pool',async()=>{
 const {ANSWERS}=await import('../src/words.ts');
 assert.equal(ANSWERS.includes('APAGE'),false);
 const run=submit(newRun('APPLE','strict'),'ADIEU').run;
 assert.equal(submit(run,'APAGE').error,undefined);
});
test('strict acceptance matches hypothetical-answer scoring across the entire guess dictionary',async()=>{
 const {ALLOWED}=await import('../src/words.ts');const {score}=await import('../src/domain.ts');
 const fixtures=[['APPLE',['ALLEY']],['APPLE',['PAPAL']],['LEVEL',['LEECH']],['APPLE',['FUZZY','CRANE']],['CROWN',['ORATE','SCORN']]] as const;
 for(const [answer,history] of fixtures){
  const run={...newRun(answer,'strict'),guesses:[...history]};
  for(const candidate of ALLOWED){
   if(history.some(word=>word===candidate))continue;
   const possible=history.every(previous=>score(candidate,previous).every((clue,i)=>clue===score(answer,previous)[i]));
   assert.equal(!submit(run,candidate).error,possible,`${answer}/${history.join(',')}/${candidate}`);
  }
 }
});

test('difficulty upgrades lock after a guess but downgrades preserve the run',async()=>{
 const {setDifficulty,difficulty}=await import('../src/domain.ts');
 let run=setDifficulty({...newRun('APPLE'),draft:'AL'},'strict').run;
 assert.equal(difficulty(run),'strict');assert.equal(run.draft,'AL');
 run=submit(run,'ALLEY').run;
 const hard=setDifficulty(run,'hard').run;
 assert.equal(difficulty(hard),'hard');assert.deepEqual(hard.guesses,run.guesses);
 assert.equal(submit(hard,'ALLEL').error,undefined);
 assert.match(setDifficulty(hard,'strict').error!,/before the first accepted guess/);
 const normal=setDifficulty(hard,'normal').run;
 assert.equal(difficulty(normal),'normal');assert.ok(setDifficulty(normal,'hard').error);
 assert.equal(setDifficulty(normal,'strict').run,normal);
});
test('strict saves retain independent difficulty, future preference and completed ledger metadata',async()=>{
 const {emptySave,decode,recordDaily,encode}=await import('../src/persistence.ts');const {difficulty,choosePractice}=await import('../src/domain.ts');
 const save=emptySave('2026-10-24');save.settings.strictMode=true;
 save.practice=submit(newRun('APPLE','strict'),'ALLEY').run;save.practice.draft='AMP';
 const restored=decode(encode(save),save.date);assert.deepEqual(restored,save);
 assert.equal(difficulty(restored.daily),'normal');assert.equal(difficulty(restored.practice),'strict');
 const tomorrow=decode(encode(save),'2026-10-25');assert.equal(difficulty(tomorrow.daily),'strict');assert.deepEqual(tomorrow.practice,save.practice);
 assert.equal(difficulty(choosePractice('APPLE',()=>0,'strict')),'strict');
 save.daily=submit(newRun(save.daily.answer,'strict'),save.daily.answer).run;recordDaily(save,save.date,save.daily);
 assert.deepEqual(decode(encode(save),save.date),save);
});
test('old saves migrate without changing guesses; inconsistent strict flags lose only difficulty',async()=>{
 const {emptySave,decode,encode}=await import('../src/persistence.ts');const {difficulty}=await import('../src/domain.ts');
 const save=emptySave('2026-10-24');
 save.practice=submit(newRun('APPLE',true),'ADIEU').run;
 save.practice=submit(save.practice,'AIDER').run;
 assert.equal(difficulty(decode(encode(save),save.date).practice),'hard');
 const invalid={...save,practice:{...save.practice,strictMode:true},settings:{contrast:false,hardMode:false,strictMode:'true'}};
 const decoded=decode(JSON.stringify(invalid),save.date);
 assert.deepEqual(decoded.practice.guesses,save.practice.guesses);assert.equal(difficulty(decoded.practice),'normal');assert.equal(decoded.settings.strictMode,undefined);
 const legacy={...save,practice:{answer:'APPLE',guesses:['ALLEY'],draft:'AMP'},settings:{contrast:true}};
 assert.deepEqual(decode(JSON.stringify(legacy),save.date).practice,legacy.practice);
});
test('shares label actual difficulty after safe downgrades without revealing words',async()=>{
 const {shareText,setDifficulty}=await import('../src/domain.ts');
 let run=submit(newRun('APPLE','strict'),'APPLE').run;
 assert.match(shareText('2026-10-24',run),/UTC · 5 letters · Strict\n1\/6/);
 run=setDifficulty(run,'hard').run;assert.match(shareText('2026-10-24',run),/UTC · 5 letters · Hard\n1\/6/);
 run=setDifficulty(run,'normal').run;assert.doesNotMatch(shareText('2026-10-24',run),/Strict|Hard|APPLE/);
});

test('yellow positional exclusions survive even when the latest row omits that position clue',()=>{
 let run=submit(newRun('APPLE','strict'),'ORATE').run;
 run=submit(run,'AGILE').run;assert.equal(run.guesses.length,2);
 // AVALE would reproduce AGILE's feedback, but reuses ORATE's yellow A at position 3.
 assert.match(submit(run,'AVALE').error!,/A cannot be in position 3.*fieldnote 1/);
});
