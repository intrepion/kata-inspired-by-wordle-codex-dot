import {test} from 'node:test';
import assert from 'node:assert/strict';
import {largestBucket,newImpossible,submitImpossible,impossibleStatus,restoreImpossible,impossibleSnapshot} from '../src/impossible.ts';
import {score,submit,dailyAnswer} from '../src/domain.ts';

test('largest bucket beats smaller feedback groups and is independent of input order',()=>{
 const pool=['APPLE','AMPLE','CRANE'];
 assert.deepEqual(largestBucket(pool,'ALLEY'),{candidates:['AMPLE','APPLE'],feedback:['exact','elsewhere','absent','elsewhere','absent']});
 assert.deepEqual(largestBucket(pool,'ZZZZZ').candidates,['AMPLE','APPLE','CRANE']);
 assert.deepEqual(largestBucket([...pool].reverse(),'APPLE'),largestBucket(pool,'APPLE'));
});
test('tied feedback avoids all green and then follows stable pattern order',()=>{
 assert.deepEqual(largestBucket(['APPLE','AMPLE'],'APPLE').feedback,['exact','absent','exact','exact','exact']);
 assert.deepEqual(largestBucket(['APPLE'],'APPLE').feedback,Array(5).fill('exact'));
 assert.deepEqual(largestBucket(['APPLE','AMPLE','CRANE'],'APPLE').candidates,['CRANE']);
});
test('duplicate-aware partitions exactly match every retained candidate',()=>{
 const pool=['APPLE','AMPLE','ALLEY','LEVEL','LEECH'];
 const selected=largestBucket(pool,'ALLEY');
 assert.deepEqual(selected,{candidates:['AMPLE','APPLE'],feedback:['exact','elsewhere','absent','elsewhere','absent']});
 for(const candidate of selected.candidates)assert.deepEqual(score(candidate,'ALLEY'),selected.feedback);
});
const exploratory=['XYLEM','JAZZY','FUZZY','BOOZY','DIZZY','MAMMA'];
test('full-pool play never empties or contradicts past clues; six turns persist',()=>{
 let run=newImpossible();assert.equal(run.candidates.length,3493);
 for(const guess of exploratory){
  const next=submitImpossible(run,guess);assert.equal(next.error,undefined);run=next.run;
  assert.ok(run.candidates.length>0);
  for(const candidate of run.candidates)for(let row=0;row<run.guesses.length;row++)assert.deepEqual(score(candidate,run.guesses[row]),run.feedback[row]);
  assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);
 }
 assert.equal(impossibleStatus(run),'lost');assert.equal(submitImpossible(run,'APPLE').run,run);
});
test('invalid and repeated guesses preserve draft and state; input normalizes case',()=>{
 const run={...newImpossible(),draft:'ZZ'};
 for(const guess of ['ZZ','ZZZZZ','12345','<abc>'])assert.equal(submitImpossible(run,guess).run,run);
 const next=submitImpossible(run,'adieu').run;assert.deepEqual(next.guesses,['ADIEU']);
 assert.equal(submitImpossible(next,'ADIEU').run,next);
});
test('winning requires selected all-green feedback, not guessing a current candidate',()=>{
 let run={...newImpossible(),candidates:['AMPLE','APPLE'],answer:'APPLE'};
 run=submitImpossible(run,'APPLE').run;assert.equal(impossibleStatus(run),'playing');assert.deepEqual(run.candidates,['AMPLE']);
 run=submitImpossible(run,'AMPLE').run;assert.equal(impossibleStatus(run),'won');
});
test('restore reconstructs deterministic candidates and ignores forged caches or difficulty',()=>{
 const run=submitImpossible(newImpossible(),'ADIEU').run;
 assert.deepEqual(restoreImpossible({...impossibleSnapshot(run),answer:'ZZZZZ',candidates:[],feedback:[],hardMode:true,strictMode:true}),run);
 for(const value of [null,{...impossibleSnapshot(run),version:99},...[['ZZZZZ'],['ADIEU','ADIEU'],['adieu'],Array(7).fill('ADIEU')].map(guesses=>({...impossibleSnapshot(run),guesses}))])assert.equal(restoreImpossible(value),null);
});
test('Impossible state and results resume independently of Hard/Strict daily and practice',async()=>{
 const {emptySave,decode,encode,recordDaily,synchronize,statistics}=await import('../src/persistence.ts');
 const {newRun,difficulty}=await import('../src/domain.ts');
 for(const level of ['hard','strict'] as const){
  const save=emptySave('2026-10-24',level);save.daily.draft='CRA';save.practice=newRun('APPLE',level);
  save.mode='impossible';save.impossible=submitImpossible(save.impossible,'ADIEU').run;save.impossible.draft='CRA';
  const restored=decode(encode(save),save.date);assert.deepEqual(restored,save);
  assert.equal(difficulty(restored.impossible),'normal');assert.equal(difficulty(restored.daily),level);assert.equal(difficulty(restored.practice),level);assert.equal(difficulty(restored.settings),level);
  assert.deepEqual(synchronize(save,save.date,()=>{throw new Error('Unavailable')}).save,save);
  for(const word of exploratory)if(restored.impossible.guesses.length<6)restored.impossible=submitImpossible(restored.impossible,word).run;
  assert.equal(impossibleStatus(restored.impossible),'lost');recordDaily(restored,restored.date,{...restored.impossible,answer:dailyAnswer(restored.date)});assert.equal(statistics(restored.results,restored.date).played,0);
  restored.mode='daily';assert.deepEqual(decode(encode(restored),restored.date).impossible,restored.impossible);
  const nextDay=decode(encode(restored),'2026-10-25');assert.deepEqual(nextDay.impossible,restored.impossible);assert.equal(difficulty(nextDay.daily),level);
 }
});
test('Impossible save corruption resets only the separate round and share is honestly labeled',async()=>{
 const {emptySave,decode,encode}=await import('../src/persistence.ts');const {impossibleShare}=await import('../src/impossible.ts');
 const save=emptySave('2026-10-24');save.daily.draft='CRA';save.practice.draft='APP';
 const raw=JSON.parse(encode(save));raw.impossible={version:1,guesses:['ZZZZZ'],draft:'<b>'};
 const restored=decode(JSON.stringify(raw),save.date);assert.deepEqual(restored.daily,save.daily);assert.deepEqual(restored.practice,save.practice);assert.deepEqual(restored.impossible,newImpossible());
 const run=submitImpossible(newImpossible(),'ADIEU').run;
 const data=JSON.parse(encode({...save,impossible:run})).impossible;
 assert.deepEqual(Object.keys(data).sort(),['dataset','difficulty','draft','guesses','version']);
 const text=impossibleShare(run);assert.match(text,/Absurd · adaptive · Normal/);assert.doesNotMatch(text,/ADIEU|UTC|Strict|Hard/);
});

test('full-pool deterministic win resumes and rejects a post-win saved guess',()=>{
 let run=newImpossible();
 for(const guess of ['ALOES','TRUNK','BUMPH','DAMME','JUMPS','PUMPS'])run=submitImpossible(run,guess).run;
 assert.equal(impossibleStatus(run),'won');assert.equal(run.candidates.length,1);assert.deepEqual(run.feedback.at(-1),Array(5).fill('exact'));
 assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);
 assert.equal(restoreImpossible({...impossibleSnapshot(run),guesses:[...run.guesses,'CRANE']}),null);
});
test('restart repeats identical full-pool feedback and surviving counts',()=>{
 const first=submitImpossible(newImpossible(),'ADIEU').run;
 const restarted=submitImpossible(newImpossible(),'ADIEU').run;
 assert.equal(first.candidates.length,430);assert.deepEqual(first.feedback,[['elsewhere','absent','absent','absent','absent']]);
 assert.deepEqual(restarted,first);
});
