import {test} from 'node:test';import assert from 'node:assert/strict';
import {dailyAbsurdTarget,dailyOneMix} from '../src/daily-variants.ts';
import {newImpossible,submitImpossible,impossibleStatus,type ImpossibleRun} from '../src/impossible.ts';
import {awaitingContinuation,continueGuessing,score} from '../src/domain.ts';
import {vocabulary} from '../src/words.ts';import {validUniqueClue} from '../src/one.ts';import type {Language} from '../src/language.ts';
for(const language of ['en','es-MX'] as Language[])for(const length of [4,5,6,7])test(`${language} ${length} daily mixes are deterministic and targets have a valid witness`,()=>{
 const date='2026-11-02',mix=dailyOneMix(date,length,language),words=vocabulary(length,language);assert.deepEqual(dailyOneMix(date,length,language),mix);assert.equal(mix.length,5);assert.equal(new Set(mix.map(p=>p.answer)).size,5);
 for(const pair of mix){assert.ok(words.allowed.has(pair.clue));assert.ok(validUniqueClue(pair.answer,pair.clue,words.answers));assert.ok(score(pair.answer,pair.clue).some(c=>c!=='exact'))}
 const {target,witness}=dailyAbsurdTarget(date,length,language);assert.equal(dailyAbsurdTarget(date,length,language).target,target);
 for(const difficulty of ['normal','hard','strict'] as const){let run:ImpossibleRun={...newImpossible(difficulty,length,language),target};for(const guess of witness){if(awaitingContinuation(run))run=continueGuessing(run);const result=submitImpossible(run,guess);assert.equal(result.error,undefined,`${language} ${length} ${difficulty} ${guess}`);run=result.run;}assert.equal(impossibleStatus(run),'won');assert.equal(run.answer,target)}
});
test('invalid date is rejected and different dates have independent mixes',()=>{assert.throws(()=>dailyOneMix('not-a-date',5,'en'));assert.notDeepEqual(dailyOneMix('2026-11-02',5,'en'),dailyOneMix('2026-11-03',5,'en'))});
test('legacy selection and new daily keys isolate every combination and date',async()=>{
 const {legacySelection,variantKey,modeFor,parseSelection}=await import('../src/variant-context.ts');
 assert.deepEqual(legacySelection('daily'),{rules:'conquest',schedule:'daily'});assert.deepEqual(legacySelection('impossible'),{rules:'absurd',schedule:'practice'});assert.deepEqual(legacySelection('one'),{rules:'one',schedule:'practice'});
 const old='notebook';for(const rules of ['conquest','absurd','one'] as const)assert.equal(variantKey(old,{rules,schedule:'practice'},'2026-11-02'),old);
 assert.equal(modeFor({rules:'conquest',schedule:'practice'}),'practice');assert.equal(modeFor({rules:'absurd',schedule:'daily'}),'impossible');
 assert.notEqual(variantKey(old,{rules:'absurd',schedule:'daily'},'2026-11-02'),variantKey(old,{rules:'absurd',schedule:'daily'},'2026-11-03'));
 assert.notEqual(variantKey(old,{rules:'one',schedule:'daily'},'2026-11-02',0),variantKey(old,{rules:'one',schedule:'daily'},'2026-11-02',1));
 assert.deepEqual(parseSelection('{bad',legacySelection('practice')),legacySelection('practice'));
});
test('daily round notebooks persist independently and roll over without altering practice',async()=>{
 const {variantKey}=await import('../src/variant-context.ts');const {emptySave,encode,decode}=await import('../src/persistence.ts');const {newRun,submit}=await import('../src/domain.ts');
 const date='2026-11-02',selection={rules:'one' as const,schedule:'daily' as const},base='notebook',mix=dailyOneMix(date,5,'en'),storage=new Map<string,string>();
 const practice=emptySave(date);practice.practice=submit(practice.practice,'CRANE').run;const old=encode(practice);storage.set(base,old);
 for(let i=0;i<5;i++){const save=emptySave(date);save.mode='one';save.one={...newRun(mix[i].answer),guesses:[mix[i].clue]};const guess=[...vocabulary().allowed].find(w=>w!==mix[i].clue&&w!==mix[i].answer)!;save.one=submit(save.one,guess).run;storage.set(variantKey(base,selection,date,i),encode(save))}
 for(let i=0;i<5;i++){const r=decode(storage.get(variantKey(base,selection,date,i))!,date);assert.equal(r.one.guesses.length,2);assert.equal(r.one.guesses[0],mix[i].clue)}
 assert.equal(storage.get(base),old);assert.equal(storage.has(variantKey(base,selection,'2026-11-03',0)),false);
});
test('target outcome and completion remain correct after restoration',async()=>{
 const {emptySave,encode,decode}=await import('../src/persistence.ts');const {initializeNotebookStats,beginStatsPuzzle,settleNotebookStats}=await import('../src/notebook-statistics.ts');
 const today='2026-11-02',chosen=dailyAbsurdTarget(today,5,'en');let other=dailyAbsurdTarget('2026-11-03',5,'en');if(other.target===chosen.target)other=dailyAbsurdTarget('2026-11-04',5,'en');assert.notEqual(other.target,chosen.target);
 const save=emptySave(today);initializeNotebookStats(save,true);save.mode='impossible';save.impossible={...newImpossible(),target:chosen.target};assert.equal(beginStatsPuzzle(save,'impossible','normal'),true);
 for(const guess of other.witness){if(awaitingContinuation(save.impossible))save.impossible=continueGuessing(save.impossible);const r=submitImpossible(save.impossible,guess);assert.equal(r.error,undefined);save.impossible=r.run;if(impossibleStatus(save.impossible)==='lost')break}
 assert.equal(impossibleStatus(save.impossible),'lost');settleNotebookStats(save);const restored=decode(encode(save),today,5,'en',chosen.target);assert.equal(impossibleStatus(restored.impossible),'lost');const record=restored.notebookStats?.records[restored.notebookStats.active.impossible];assert.equal(record?.won,false);assert.equal(record?.targetMiss,true);
});
