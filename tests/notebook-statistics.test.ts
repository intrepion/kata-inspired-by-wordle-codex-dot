import {giveUp,awaitingContinuation,continueGuessing} from '../src/domain.ts';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {emptySave,decode,encode} from '../src/persistence.ts';import {newRun,submit} from '../src/domain.ts';
import {initializeNotebookStats,recordCompletion,startStatsRound,notebookStatistics,observeStatsDifficulty,beginStatsPuzzle,puzzleNeedsStart} from '../src/notebook-statistics.ts';
const today='2026-10-26';
test('completed Practice rounds count once across reloads and distinct new rounds count separately',()=>{
 const save=emptySave(today);initializeNotebookStats(save,true);beginStatsPuzzle(save,'practice','hard');save.practice=submit(newRun('APPLE','hard'),'APPLE').run;recordCompletion(save,'practice',today);recordCompletion(save,'practice',today);
 let restored=decode(encode(save),today);recordCompletion(restored,'practice',today);assert.equal(notebookStatistics(restored,'practice','hard',today).played,1);assert.equal(notebookStatistics(restored,'daily','all',today).played,0);
 restored.practice=newRun('APPLE','normal');startStatsRound(restored,'practice','normal');beginStatsPuzzle(restored,'practice','normal');restored.practice=submit(restored.practice,'APPLE').run;recordCompletion(restored,'practice',today);assert.equal(notebookStatistics(restored,'practice','all',today).played,2);assert.equal(notebookStatistics(restored,'practice','normal',today).wins,1);
});

test('Easy exposure before the first guess survives reload and cannot be upgraded for statistics',()=>{
 let save=emptySave(today);initializeNotebookStats(save,true);beginStatsPuzzle(save,'practice','easy');save=decode(encode(save),today);observeStatsDifficulty(save,'practice','strict');save.practice=submit(newRun('APPLE','strict'),'APPLE').run;recordCompletion(save,'practice',today);assert.equal(notebookStatistics(save,'practice','easy',today).wins,1);assert.equal(notebookStatistics(save,'practice','strict',today).played,0);
});

test('setup choices do not establish exposure, explicit Start is idempotent and Easy-start is sticky',()=>{
 let save=emptySave(today,'easy');initializeNotebookStats(save,true);observeStatsDifficulty(save,'practice','easy');assert.equal(puzzleNeedsStart(save,'practice'),true);assert.equal(beginStatsPuzzle(save,'practice','strict'),true);assert.equal(beginStatsPuzzle(save,'practice','easy'),false);assert.equal(save.notebookStats!.exposure.practice,'strict');
 startStatsRound(save,'practice');assert.equal(puzzleNeedsStart(save,'practice'),true);beginStatsPuzzle(save,'practice','easy');observeStatsDifficulty(save,'practice','strict');save=decode(encode(save),today);assert.equal(puzzleNeedsStart(save,'practice'),false);assert.equal(save.notebookStats!.exposure.practice,'easy');
});

import {dailyAnswer} from '../src/domain.ts';import {newImpossible,submitImpossible} from '../src/impossible.ts';import {vocabulary} from '../src/words.ts';
test('legacy daily totals and only the last completed other rounds migrate without invented dimensions',()=>{
 const old=emptySave(today);old.history['2026-10-24']={won:true,turns:2};old.results['2026-10-25']=[dailyAnswer('2026-10-25')];old.practice=submit(newRun('APPLE','strict'),'APPLE').run;
 const restored=decode(encode(old),today);const before=encode(restored);initializeNotebookStats(restored);assert.equal(notebookStatistics(restored,'daily','legacy',today).wins,2);assert.equal(notebookStatistics(restored,'practice','legacy',today).wins,1);assert.equal(notebookStatistics(restored,'practice','strict',today).played,0);assert.equal(notebookStatistics(restored,'impossible','all',today).played,0);assert.equal(notebookStatistics(restored,'practice','all',today).unknownAssistance,1);const known=decode(encode(old),today);known.practice.assisted=true;initializeNotebookStats(known);assert.equal(notebookStatistics(known,'practice','legacy',today,'assisted').wins,1);
 assert.equal(puzzleNeedsStart(restored,'daily'),false);observeStatsDifficulty(restored,'daily','hard');assert.equal(restored.notebookStats!.exposure.daily,'legacy');observeStatsDifficulty(restored,'daily','easy');assert.equal(restored.notebookStats!.exposure.daily,'easy');assert.ok(before.includes('2026-10-24'));assert.deepEqual(restored.practice,old.practice);
});
test('all modes, languages, lengths and levels keep independent completion counts and survive reload',()=>{
 for(const language of ['en','es-MX'] as const)for(const length of [4,5,6,7])for(const level of ['easy','normal','hard','strict'] as const){const save=emptySave(today,false,length,language);initializeNotebookStats(save,true);
 for(const mode of ['daily','practice'] as const){beginStatsPuzzle(save,mode,level);save[mode]=submit(newRun(mode==='daily'?dailyAnswer(today,length,language):vocabulary(length,language).answers[0],level,language),mode==='daily'?dailyAnswer(today,length,language):vocabulary(length,language).answers[0]).run;recordCompletion(save,mode,today);assert.equal(notebookStatistics(save,mode,level,today).wins,1)}
 beginStatsPuzzle(save,'impossible',level);let adaptive=newImpossible(level,length,language);for(let i=0;i<6;i++){const next=submitImpossible(adaptive,adaptive.candidates[0]);assert.equal(next.error,undefined);adaptive=next.run;if(adaptive.feedback.at(-1)?.every(c=>c==='exact'))break}save.impossible=awaitingContinuation(adaptive)?giveUp(adaptive):adaptive;recordCompletion(save,'impossible',today);assert.equal(notebookStatistics(save,'impossible',level,today).played,1);
 const restored=decode(encode(save),today,length,language);assert.equal(notebookStatistics(restored,'daily',level,today).wins,1);assert.equal(notebookStatistics(restored,'practice',level,today).wins,1);assert.equal(notebookStatistics(restored,'daily',level==='easy'?'normal':'easy',today).played,0);
 }
});
test('Absurd completion uses its persisted identity, actual adaptive outcome and easiest baseline',()=>{
 const save=emptySave(today);initializeNotebookStats(save,true);beginStatsPuzzle(save,'impossible','hard');observeStatsDifficulty(save,'impossible','easy');observeStatsDifficulty(save,'impossible','strict');
 let run=newImpossible();for(let i=0;i<6;i++){const guess=['AUDIO','ENTRY','BEACH','VALVE','GAFFE'][i]??run.candidates[0];const next=submitImpossible(run,guess);assert.equal(next.error,undefined);run=next.run}save.impossible=giveUp(run);assert.equal(recordCompletion(save,'impossible',today),true);const stats=notebookStatistics(save,'impossible','easy',today);assert.equal(stats.played,1);assert.equal(stats.wins+stats.losses,1);assert.equal(notebookStatistics(save,'practice','all',today).played,0);
 const restored=decode(encode(save),today);recordCompletion(restored,'impossible',today);assert.equal(notebookStatistics(restored,'impossible','all',today).played,1);
});
test('Daily and replayable streaks have distinct date versus completed-round semantics',()=>{
 const save=emptySave('2026-10-24');initializeNotebookStats(save,true);
 for(const date of ['2026-10-24','2026-10-25']){save.date=date;save.daily=newRun(dailyAnswer(date),'strict');beginStatsPuzzle(save,'daily','strict');
 save.daily=submit(save.daily,save.daily.answer).run;recordCompletion(save,'daily',date)}
 assert.equal(notebookStatistics(save,'daily','strict',today).current,2);assert.equal(notebookStatistics(save,'daily','strict','2026-10-28').current,0);assert.equal(notebookStatistics(save,'daily','strict',today).best,2);
 for(let i=0;i<3;i++){save.practice=newRun('APPLE');startStatsRound(save,'practice');beginStatsPuzzle(save,'practice','normal');save.practice=submit(save.practice,'APPLE').run;recordCompletion(save,'practice',today)}assert.equal(notebookStatistics(save,'practice','normal','2026-11-01').current,3);
 save.practice=newRun('APPLE');startStatsRound(save,'practice');beginStatsPuzzle(save,'practice','normal');for(const guess of ['CRANE','SHOUT','MIGHT','BERRY','LEVEL','AUDIO'])save.practice=submit(save.practice,guess).run;save.practice=giveUp(save.practice);recordCompletion(save,'practice',today);const stats=notebookStatistics(save,'practice','normal',today);assert.equal(stats.losses,1);assert.equal(stats.current,0);assert.equal(stats.best,3);assert.deepEqual(stats.histogram,[3,0,0,0,0,0]);
});
test('difficulty exposure is monotone, abandoned rounds do not count and completed records are immutable',()=>{
 let save=emptySave(today);initializeNotebookStats(save,true);beginStatsPuzzle(save,'practice','hard');observeStatsDifficulty(save,'practice','easy');observeStatsDifficulty(save,'practice','strict');save=decode(encode(save),today);assert.equal(save.notebookStats!.exposure.practice,'easy');
 save.practice=newRun('APPLE','strict');startStatsRound(save,'practice');beginStatsPuzzle(save,'practice','strict');assert.equal(save.notebookStats!.exposure.practice,'strict');assert.equal(notebookStatistics(save,'practice','all',today).played,0);save.practice=submit(save.practice,'APPLE').run;recordCompletion(save,'practice',today);const entry=JSON.stringify(save.notebookStats!.records);observeStatsDifficulty(save,'practice','easy');save.practice.easyMode=true;recordCompletion(save,'practice',today);assert.equal(JSON.stringify(save.notebookStats!.records),entry);
});
test('additive schema rejects malformed results, preserves existing preferences and settles interrupted completion once',()=>{
 const save=emptySave(today);save.settings.contrast=true;initializeNotebookStats(save,true);beginStatsPuzzle(save,'practice','normal');save.practice=submit(newRun('APPLE'),'APPLE').run;
 const restored=decode(encode(save),today);assert.equal(notebookStatistics(restored,'practice','normal',today).wins,1);assert.equal(restored.settings.contrast,true);assert.equal(notebookStatistics(decode(encode(restored),today),'practice','normal',today).played,1);
 const raw=JSON.parse(encode(restored));raw.notebookStats.records.bad={mode:'practice',date:today,won:true,turns:0,order:2,difficulty:'strict',assisted:false};const clean=decode(JSON.stringify(raw),today);assert.equal(notebookStatistics(clean,'practice','all',today).played,1);
});

import {requireStatsSetup} from '../src/notebook-statistics.ts';
test('restarting the same exposed puzzle requires confirmation but cannot reset the easiest baseline',()=>{
 let save=emptySave(today);initializeNotebookStats(save,true);beginStatsPuzzle(save,'practice','easy');save.practice={...newRun('APPLE','strict'),assisted:true};requireStatsSetup(save,'practice');save=decode(encode(save),today);assert.equal(puzzleNeedsStart(save,'practice'),true);assert.equal(beginStatsPuzzle(save,'practice','strict'),true);assert.equal(save.notebookStats!.exposure.practice,'easy');assert.equal(save.practice.assisted,true);save.practice=submit(save.practice,'APPLE').run;recordCompletion(save,'practice',today);assert.equal(notebookStatistics(save,'practice','easy',today,'assisted').wins,1);assert.equal(notebookStatistics(save,'practice','easy',today,'unassisted').played,0);
});
test('daily replay cannot double-count or relabel a terminal record, and rollover starts unexposed',()=>{
 let save=emptySave('2026-10-25');initializeNotebookStats(save,true);beginStatsPuzzle(save,'daily','hard');save.daily=submit(newRun(dailyAnswer(save.date),'hard'),dailyAnswer(save.date)).run;recordCompletion(save,'daily',save.date);const record=JSON.stringify(save.notebookStats!.records);startStatsRound(save,'daily');observeStatsDifficulty(save,'daily','easy');recordCompletion(save,'daily',save.date);assert.equal(JSON.stringify(save.notebookStats!.records),record);save=decode(encode(save),today);assert.equal(puzzleNeedsStart(save,'daily'),true);assert.equal(notebookStatistics(save,'daily','hard',today).wins,1);
});
test('a completed Daily in another difficulty ends the filtered current streak without changing overall history',()=>{
 let save=emptySave('2026-10-25');initializeNotebookStats(save,true);beginStatsPuzzle(save,'daily','strict');save.daily=submit(newRun(dailyAnswer(save.date),'strict'),dailyAnswer(save.date)).run;recordCompletion(save,'daily');save=decode(encode(save),today);assert.equal(notebookStatistics(save,'daily','strict',today).current,1);beginStatsPuzzle(save,'daily','normal');save.daily=submit(newRun(dailyAnswer(today)),dailyAnswer(today)).run;recordCompletion(save,'daily');assert.equal(notebookStatistics(save,'daily','strict',today).current,0);assert.equal(notebookStatistics(save,'daily','all',today).current,2);
});
test('started zero-guess exposure survives mode navigation for every variant, and setup reload remains unstarted',()=>{
 let save=emptySave(today);initializeNotebookStats(save,true);save=decode(encode(save),today);assert.equal(puzzleNeedsStart(save,'daily'),true);assert.equal(puzzleNeedsStart(save,'practice'),true);assert.equal(puzzleNeedsStart(save,'impossible'),true);
 for(const mode of ['daily','practice','impossible'] as const){save.mode=mode;beginStatsPuzzle(save,mode,'hard');observeStatsDifficulty(save,mode,'easy');observeStatsDifficulty(save,mode,'strict');save=decode(encode(save),today);assert.equal(puzzleNeedsStart(save,mode),false);assert.equal(save.notebookStats!.exposure[mode],'easy')}
 for(const mode of ['daily','practice','impossible'] as const)assert.equal(save.notebookStats!.exposure[mode],'easy');
});
