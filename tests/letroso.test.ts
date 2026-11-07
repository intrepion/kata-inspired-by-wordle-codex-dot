import {test} from 'node:test';import assert from 'node:assert/strict';
import {orderFeedback,dailyLetroso,newLetroso,submitLetroso,letrosoStatus,letrosoShare,restoreLetroso,changeLetrosoDifficulty} from '../src/letroso.ts';
import {vocabulary} from '../src/words.ts';
const kinds=(a:string,g:string)=>orderFeedback(a,g).map(t=>t.kind);
test('official order, contiguous, boundary and win examples',()=>{
 const p=orderFeedback('EXAMPLE','PERMIT');assert.deepEqual(p.map(t=>t.kind),['ordered','ordered','absent','present','absent','absent']);assert.equal(p[1].joinPrevious,false);
 const m=orderFeedback('EXAMPLE','IMPLY');assert.deepEqual(m.map(t=>t.kind),['absent','ordered','ordered','ordered','absent']);assert.equal(m[2].joinPrevious,true);assert.equal(m[3].joinPrevious,true);
 const x=orderFeedback('EXAMPLE','EXCUSE');assert.equal(x[0].start,true);assert.equal(x[1].joinPrevious,true);assert.equal(x[5].end,true);
 const win=orderFeedback('EXAMPLE','EXAMPLE');assert.ok(win.every(t=>t.kind==='ordered'));assert.ok(win.slice(1).every(t=>t.joinPrevious));assert.equal(win[0].start,true);assert.equal(win.at(-1)!.end,true);
});
test('duplicate counts, zero matches, order and accents remain distinct',()=>{
 const tiles=orderFeedback('APPLE','PAPAYA');assert.equal(tiles.filter(t=>t.letter==='A'&&t.kind!=='absent').length,1);assert.equal(tiles.filter(t=>t.letter==='P'&&t.kind!=='absent').length,2);
 assert.ok(kinds('CAT','ZZZ').every(k=>k==='absent'));assert.equal(orderFeedback('AÑO','ANO')[1].kind,'absent');
});
for(const language of ['en','es-MX'] as const)for(const length of [3,11])test(`${language} ${length} daily and dictionary`,()=>{
 const answer=dailyLetroso('2026-11-02',length,language);assert.equal(answer,dailyLetroso('2026-11-02',length,language));assert.ok(vocabulary(length,language).answers.includes(answer));let run=newLetroso(answer,language,'normal');
 assert.ok(submitLetroso(run,'ZZ').error);const alternate=[...vocabulary(length===3?4:3,language).allowed][0];const step=submitLetroso(run,alternate);assert.equal(step.error,undefined);run=step.run;const result=submitLetroso(run,answer);assert.equal(result.error,undefined);assert.equal(letrosoStatus(result.run),'won');assert.deepEqual(restoreLetroso(result.run,language,length,answer),result.run);assert.ok(!letrosoShare(result.run,'2026-11-02').includes(answer));
});
test('changing difficulty respects prior rows and retains assistance',()=>{let r=newLetroso(dailyLetroso('2026-11-02',5,'en'),'en','normal');const a=submitLetroso(r,'CRANE');assert.equal(a.error,undefined);r=a.run;const b=changeLetrosoDifficulty(r,'easy');assert.equal(b.run.assisted,true);assert.equal(changeLetrosoDifficulty(b.run,'normal').run.easiest,'easy')});
test('completion records are isolated and idempotent across schedules',async()=>{
 const {variantKey,parseSelection}=await import('../src/variant-context.ts');const {addLetrosoResult}=await import('../src/letroso-statistics.ts');const {summarizeSmash}=await import('../src/smash-statistics.ts');
 const daily={rules:'letroso',schedule:'daily'} as const,practice={rules:'letroso',schedule:'practice'} as const;assert.notEqual(variantKey('base',daily,'2026-11-02'),variantKey('base',practice,'2026-11-02'));assert.notEqual(variantKey('base',daily,'2026-11-02'),variantKey('base',daily,'2026-11-03'));assert.deepEqual(parseSelection(JSON.stringify(daily),{rules:'conquest',schedule:'daily'}),daily);
 const answer=dailyLetroso('2026-11-02',3,'en'),run=submitLetroso(newLetroso(answer,'en','normal'),answer).run;const records=addLetrosoResult([],'day','2026-11-02',run);assert.equal(addLetrosoResult(records,'day','2026-11-02',run).length,1);assert.equal(summarizeSmash(records,'all','all','2026-11-02').wins,1);assert.equal(summarizeSmash(records,'hard','all','2026-11-02').played,0);
});
test('Easy suggestions depend only on public clues and stay consistent',async()=>{
 const {observedLetrosoClues,possibleLetrosoAnswers}=await import('../src/letroso-advice.ts');const candidates=(run:Parameters<typeof observedLetrosoClues>[0])=>possibleLetrosoAnswers(observedLetrosoClues(run));const a=newLetroso('APPLE','en','easy'),b=newLetroso('CRANE','en','easy');assert.deepEqual(candidates(a),candidates(b));
 const run=submitLetroso(a,'CRANE').run,result=candidates(run);for(const word of result)assert.deepEqual(orderFeedback(word,'CRANE'),orderFeedback('APPLE','CRANE'));
});
test('unlimited play continues beyond six and restores all guesses',()=>{
 const answer=dailyLetroso('2026-11-02',3,'en');let run=newLetroso(answer,'en','normal');const choices=[...vocabulary(3,'en').allowed].filter(w=>w!==answer).slice(0,7);
 for(const guess of choices){const result=submitLetroso(run,guess);assert.equal(result.error,undefined);run=result.run}assert.equal(run.guesses.length,7);assert.equal(letrosoStatus(run),'playing');assert.equal(restoreLetroso(run,'en',3,answer)?.guesses.length,7);
});
test('practice is reproducible with an injected random source and avoids the prior answer',async()=>{
 const {practiceLetroso}=await import('../src/letroso.ts');const a=practiceLetroso(11,'es-MX','',()=>0);assert.equal(practiceLetroso(11,'es-MX','',()=>0),a);assert.notEqual(practiceLetroso(11,'es-MX',a,()=>0),a);
});
test('an incompatible difficulty upgrade preserves existing guesses',async()=>{
 const {letrosoConstraint}=await import('../src/letroso.ts');let run=newLetroso('APPLE','en','normal');run=submitLetroso(run,'CRANE').run;const bad=[...vocabulary(5,'en').allowed].find(w=>w!=='APPLE'&&w!=='CRANE'&&letrosoConstraint(run,w,'strict'))!;assert.ok(bad);run=submitLetroso(run,bad).run;const result=changeLetrosoDifficulty(run,'strict');assert.ok(result.error);assert.equal(result.run,run);assert.equal(run.guesses.length,2);
});

test('hidden answer lengths cover 3–11 and daily answers are stable across preferences',async()=>{
 const {dailyHiddenLetroso,practiceHiddenLetroso}=await import('../src/letroso.ts');
 for(const language of ['en','es-MX'] as const){
  for(let i=0;i<9;i++)assert.equal(practiceHiddenLetroso(language,'',()=>i/9+.001).length,i+3);
  const lengths=new Set<number>();for(let day=1;day<=28;day++){const date=`2026-11-${String(day).padStart(2,'0')}`,answer=dailyHiddenLetroso(date,language);assert.equal(answer,dailyHiddenLetroso(date,language));lengths.add(answer.length)}
  assert.ok(lengths.has(3)&&lengths.has(11));
 }
});
