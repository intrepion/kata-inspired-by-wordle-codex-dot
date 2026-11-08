import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRun,submit,dailyAnswer} from '../src/domain.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
import {initializeNotebookStats,beginStatsPuzzle,startStatsRound,recordCompletion,notebookStatistics,readNotebookStats,runLetterHintCount} from '../src/notebook-statistics.ts';
import {addSmashResult,readSmashResults,summarizeSmash} from '../src/smash-statistics.ts';
import {newSmashRun,dailySmashPair,submitSmash} from '../src/smashare.ts';
import {newLetroso,submitLetroso} from '../src/letroso.ts';
import {addLetrosoResult} from '../src/letroso-statistics.ts';
import {dailyOneMix} from '../src/daily-variants.ts';
import {dailyVariantStatistics} from '../src/daily-variant-statistics.ts';
import {variantKey} from '../src/variant-context.ts';
const today='2026-11-08';
test('letter-hint filters intersect assistance and difficulty without inventing turns or results',()=>{
 const save=emptySave(today);initializeNotebookStats(save,true);
 for(const hinted of [false,true]){save.practice=newRun('APPLE','easy');startStatsRound(save,'practice');beginStatsPuzzle(save,'practice','easy');if(hinted)Object.assign(save.practice,{letterHint:{position:0,afterGuess:0},assisted:true});save.practice=submit(save.practice,'APPLE').run;assert.equal(recordCompletion(save,'practice'),true);assert.equal(recordCompletion(save,'practice'),false)}
 const all=notebookStatistics(save,'practice','all',today);assert.equal(all.played,2);assert.equal(all.assisted,2);assert.deepEqual(all.histogram,[2,0,0,0,0,0]);
 for(const filter of ['with','without'] as const){const stats=notebookStatistics(save,'practice','easy',today,'assisted',filter);assert.equal(stats.played,1);assert.equal(stats.wins,1);assert.equal(notebookStatistics(save,'practice','easy',today,'unassisted',filter).played,0)}
 const before=JSON.stringify(save.notebookStats!.records);delete (save.practice as {letterHint?:unknown}).letterHint;assert.equal(recordCompletion(save,'practice'),false);assert.equal(JSON.stringify(save.notebookStats!.records),before);
 assert.equal(notebookStatistics(decode(encode(save),today),'practice','all',today,'all','with').played,1);
});
test('missing legacy metadata is zero, malformed metadata remains unknown without discarding totals',()=>{
 const save=emptySave(today);initializeNotebookStats(save,true);beginStatsPuzzle(save,'practice','normal');save.practice=submit(newRun('APPLE'),'APPLE').run;recordCompletion(save,'practice');
 const raw=JSON.parse(JSON.stringify(save.notebookStats)),id=raw.active.practice;delete raw.records[id].letterHints;save.notebookStats=readNotebookStats(raw,today);assert.equal(notebookStatistics(save,'practice','all',today,'all','without').played,1);
 for(const bad of [-1,2,'1',{},null]){raw.records[id].letterHints=bad;save.notebookStats=readNotebookStats(raw,today);assert.equal(notebookStatistics(save,'practice','all',today).played,1);assert.equal(notebookStatistics(save,'practice','all',today,'all','without').played,0);assert.equal(notebookStatistics(save,'practice','all',today,'all','unknown').played,1);save.notebookStats=readNotebookStats(JSON.parse(JSON.stringify(save.notebookStats)),today);assert.equal(notebookStatistics(save,'practice','all',today).unknownLetterHints,1)}
});
test('invalid run hints settle as unknown, and first terminal count is immutable',()=>{
 const save=emptySave(today);initializeNotebookStats(save,true);beginStatsPuzzle(save,'practice','normal');save.practice=Object.assign(submit(newRun('APPLE'),'APPLE').run,{letterHintInvalid:true,assisted:true});recordCompletion(save,'practice');assert.equal(notebookStatistics(save,'practice','all',today,'assisted','unknown').played,1);Object.assign(save.practice,{letterHintInvalid:false,letterHint:{position:0,afterGuess:0}});assert.equal(recordCompletion(save,'practice'),false);assert.equal(notebookStatistics(save,'practice','all',today,'all','unknown').played,1);
});
test('One built-in clue is not a letter hint; daily variant storage preserves filter intersections',()=>{
 const entries=new Map<string,string>();for(let round=0;round<2;round++){const save=emptySave(today),pair=dailyOneMix(today,5,'en')[round];initializeNotebookStats(save,true);beginStatsPuzzle(save,'one','easy');save.one={...newRun(pair.answer,'easy'),guesses:[pair.clue,pair.answer],...(round?{letterHint:{position:0,afterGuess:1},assisted:true}:{})};recordCompletion(save,'one');entries.set(variantKey('test',{rules:'one',schedule:'daily'},today,round),encode(save))}
 const storage={get length(){return entries.size},key:(i:number)=>[...entries.keys()][i]??null,getItem:(key:string)=>entries.get(key)??null};
 for(const filter of ['with','without'] as const){const result=dailyVariantStatistics(storage,'test','one',today,5,'en','easy','assisted',filter);assert.equal(result.played,1);assert.deepEqual(result.histogram,[0,1,0,0,0,0])}
});
test('Daily date streak semantics remain intact across hint filters',()=>{
 const save=emptySave('2026-11-07');initializeNotebookStats(save,true);beginStatsPuzzle(save,'daily','normal');save.daily=submit(save.daily,save.daily.answer).run;recordCompletion(save,'daily');save.date=today;save.dailyDate=today;save.daily=Object.assign(newRun(dailyAnswer(today)),{letterHint:{position:0,afterGuess:0},assisted:true});beginStatsPuzzle(save,'daily','normal');save.daily=submit(save.daily,save.daily.answer).run;recordCompletion(save,'daily');assert.equal(notebookStatistics(save,'daily','all',today).current,2);assert.equal(notebookStatistics(save,'daily','all',today,'all','without').current,0);assert.equal(notebookStatistics(save,'daily','all',today,'all','with').current,1);
});
test('Smashare and Letroso share hint filtering without confusing Easy assistance',()=>{
 const pair=dailySmashPair(today,5,'en');let records=addSmashResult([],'plain',today,submitSmash(newSmashRun(pair,'en','easy'),pair.merged).run);
 const hinted=Object.assign(submitSmash(newSmashRun(pair,'en','easy'),pair.merged).run,{letterHint:{position:0,afterGuess:0},assisted:true});records=addSmashResult(records,'hinted',today,hinted);assert.equal(addSmashResult(records,'hinted',today,hinted),records);
 for(const filter of ['with','without'] as const)assert.equal(summarizeSmash(records,'easy','assisted',today,filter).played,1);
 const old=JSON.parse(JSON.stringify(records));delete old[0].letterHints;old[1].letterHints='invalid';const restored=readSmashResults(JSON.stringify(old));assert.equal(summarizeSmash(restored,'all','all',today).played,2);assert.equal(summarizeSmash(restored,'all','all',today,'without').played,1);assert.equal(summarizeSmash(readSmashResults(JSON.stringify(restored)),'all','all',today,'unknown').played,1);
 const letroso=addLetrosoResult([],'letroso',today,submitLetroso(newLetroso('APPLE','en','easy'),'APPLE').run);assert.equal(summarizeSmash(letroso,'easy','assisted',today,'without').played,1);assert.equal(summarizeSmash(letroso,'all','all',today,'with').played,0);
});

test('authoritative known-use marker survives completion recording and summary without a position',()=>{
 assert.equal(runLetterHintCount({letterHintUsed:true}),1);assert.equal(runLetterHintCount({letterHintUsed:true,letterHintInvalid:true}),1);assert.equal(runLetterHintCount({letterHint:{position:0,afterGuess:0},letterHintInvalid:true}),1);assert.equal(runLetterHintCount({letterHintInvalid:true}),null);
 const save=emptySave(today);initializeNotebookStats(save,true);beginStatsPuzzle(save,'practice','normal');save.practice=Object.assign(submit(newRun('APPLE'),'APPLE').run,{letterHintUsed:true as const,assisted:true});assert.equal(recordCompletion(save,'practice'),true);assert.equal(recordCompletion(save,'practice'),false);
 const restored=decode(encode(save),today);assert.equal(recordCompletion(restored,'practice'),false);assert.equal(notebookStatistics(restored,'practice','normal',today,'assisted','with').played,1);assert.equal(notebookStatistics(restored,'practice','all',today,'all','without').played,0);assert.equal(notebookStatistics(restored,'practice','all',today).unknownLetterHints,0);
 const pair=dailySmashPair(today,5,'en'),run=Object.assign(submitSmash(newSmashRun(pair,'en','normal'),pair.merged).run,{letterHintUsed:true as const,assisted:true}),records=addSmashResult([],'known',today,run);assert.equal(addSmashResult(records,'known',today,run),records);assert.equal(summarizeSmash(readSmashResults(JSON.stringify(records)),'all','assisted',today,'with').played,1);
});
