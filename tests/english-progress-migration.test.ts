import {test} from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {previousEnglishAnswers,previousEnglishDataset} from '../src/legacy-english.ts';
import {notebookDailyAnswer,legacyDailyLabel,LEGACY_DAILY_SCHEDULE} from '../src/daily-schedule.ts';
import {emptySave,encode,decode,recordDaily,statistics} from '../src/persistence.ts';
import {newRun,submit,status,DAY,dateKey,difficulty,score} from '../src/domain.ts';
import {answerDataset,vocabulary} from '../src/words.ts';
import {initializeNotebookStats,beginStatsPuzzle,settleNotebookStats,notebookStatistics} from '../src/notebook-statistics.ts';
import {dailyVariantRecords} from '../src/daily-variant-statistics.ts';
import {activeSaveKeyForPath,saveKeyForPath,preserveEnglishStorageForUpdate} from '../src/site.ts';
const lengths=[4,5,6,7,8,9,10,11];
const after=(n:number)=>dateKey(new Date(Date.parse('2026-11-01')+n*DAY));
const oldAnswer=(date:string,length:number,alphabetical=false)=>notebookDailyAnswer({englishAnswerSchedules:{[date]:'previous'},...(alphabetical?{dailySchedules:{[date]:LEGACY_DAILY_SCHEDULE}}:{})},date,length);
function oldNotebook(length:number,date:string){const save=emptySave(date,'hard',length);save.dataset=previousEnglishDataset(length)!;save.daily=newRun(oldAnswer(date,length),'hard');save.englishAnswerSchedules={[date]:'previous'};save.settings.contrast=true;save.settings.suboptimal=true;initializeNotebookStats(save,true);beginStatsPuzzle(save,'daily','hard');return save}
function rawPrevious(save:ReturnType<typeof emptySave>){const raw=JSON.parse(encode(save));delete raw.englishAnswerSchedules;raw.impossible.dataset=save.daily.answer.length===5?'scowl-2020.12.07-absurd-v2':`scowl-2020.12.07-${save.daily.answer.length}-absurd-v1`;return JSON.stringify(raw)}
test('frozen historical answer orders reproduce published whole-cycle vectors rather than the new schedule',()=>{
 const expected:Record<number,string>={4:'208c9e3c6c09cc961c784cfde4b03aa87e3a275c91a404482eac4ad37267fb7b',5:'964501f070d1ad2910c91027ca47b1706613b4511970e3b21cd63985487f275f',6:'1807037e26d77d602bdad511bc26328028ead644611843482f7161bbe7be3fd7',7:'4676b9efaca7f4e17641d0f37220ebdff7d8085785a9243962d2a00b490b8955'};
 for(const length of [4,5,6,7])assert.equal(createHash('sha256').update(previousEnglishAnswers(length)!.map((_,i)=>oldAnswer(after(i),length)).join('\n')).digest('hex'),expected[length]);
});
test('all affected lengths preserve compatible daily clues, drafts, history and settings across repeated reload and rollover',()=>{
 for(const length of lengths){
  const {answers,allowed}=vocabulary(length),index=previousEnglishAnswers(length)!.findIndex((_,i)=>answers.includes(oldAnswer(after(i),length))),date=after(index),old=oldNotebook(length,date),answer=old.daily.answer;
  const guess=[...allowed].find(w=>w!==answer)!;old.daily=submit(old.daily,guess).run;old.daily.draft=answer.slice(0,2);
  let restored=decode(rawPrevious(old),date,length);assert.equal(restored.dataset,answerDataset(length));assert.equal(restored.daily.answer,answer);assert.deepEqual(restored.daily,old.daily);assert.deepEqual(score(restored.daily.answer,guess),score(answer,guess));assert.deepEqual(restored.settings,old.settings);assert.equal(legacyDailyLabel(restored,date),'Previous English answer list');
  restored=decode(encode(restored),date,length);assert.deepEqual(restored.daily,old.daily);restored.daily=submit(restored.daily,answer).run;recordDaily(restored,date,restored.daily);settleNotebookStats(restored);
  const next=dateKey(new Date(Date.parse(date)+DAY)),rolled=decode(encode(restored),next,length);assert.equal(notebookStatistics(rolled,'daily','all',next).wins,1);assert.equal(statistics(rolled.results,next,rolled.history,length).wins,1);assert.equal(rolled.history[date].turns,2);assert.equal(legacyDailyLabel(rolled,next),'');
 }
});
test('removed live daily answers restart without replaying clues while completed removed answers retain their exact board and outcome',()=>{
 for(const length of lengths){const answers=vocabulary(length).answers,index=previousEnglishAnswers(length)!.findIndex((_,i)=>!answers.includes(oldAnswer(after(i),length)));assert.ok(index>=0);const date=after(index),old=oldNotebook(length,date),answer=old.daily.answer;
  const guess=vocabulary(length).answers.find(w=>w!==answer)!;old.daily=submit(old.daily,guess).run;
  const live=decode(rawPrevious(old),date,length);assert.notEqual(live.daily.answer,answer);assert.deepEqual(live.daily.guesses,[]);assert.equal(live.notebookStats!.exposure.daily,null);assert.deepEqual(decode(encode(live),date,length),live);
  old.daily=submit(old.daily,answer).run;recordDaily(old,date,old.daily);settleNotebookStats(old);const done=decode(rawPrevious(old),date,length);assert.equal(done.daily.answer,answer);assert.equal(status(done.daily),'won');assert.deepEqual(done.daily.guesses,old.daily.guesses);assert.equal(notebookStatistics(done,'daily','all',date).wins,1);assert.deepEqual(decode(encode(done),date,length),done);
 }
});
test('alphabetical-era history uses its original order and never a raw saved answer',()=>{
 const date='2026-11-02',old=oldNotebook(5,date),raw=JSON.parse(rawPrevious(old));delete raw.dailyScheduleVersion;raw.daily.answer='XXXXX';raw.daily.guesses=[];raw.daily.draft='';
 const restored=decode(JSON.stringify(raw),date);assert.equal(restored.daily.answer,oldAnswer(date,5,true));assert.notEqual(restored.daily.answer,'XXXXX');
});
test('compatible practice survives; removed practice restarts only if unfinished, with historical stats intact',()=>{
 const date='2026-11-06',old=oldNotebook(5,date),removed=previousEnglishAnswers(5)!.find(w=>!vocabulary().answers.includes(w))!;
 old.practice=newRun('APPLE','easy');old.practice=submit(old.practice,'ALLEY').run;const kept=decode(rawPrevious(old),date);assert.deepEqual(kept.practice,old.practice);
 old.practice=newRun(removed,'strict');beginStatsPuzzle(old,'practice','strict');const fresh=decode(rawPrevious(old),date);assert.notEqual(fresh.practice.answer,removed);assert.equal(fresh.notebookStats!.exposure.practice,null);
 old.practice=submit(old.practice,removed).run;settleNotebookStats(old);const complete=decode(rawPrevious(old),date);assert.equal(complete.practice.answer,removed);assert.equal(status(complete.practice),'won');assert.equal(notebookStatistics(complete,'practice','all',date).wins,1);
});
test('old Absurd guesses never replay under the changed pool and completed practice statistics cannot count twice',()=>{
 const date='2026-11-06',old=oldNotebook(5,date);old.mode='impossible';const raw=JSON.parse(rawPrevious(old));raw.impossible.guesses=['AUDIO'];raw.impossible.draft='PAS';raw.notebookStats.records['impossible:2']={mode:'impossible',date,difficulty:'normal',assisted:false,won:true,turns:5,order:1};raw.notebookStats.nextOrder=2;
 const restored=decode(JSON.stringify(raw),date);assert.deepEqual(restored.impossible.guesses,[]);assert.equal(notebookStatistics(restored,'impossible','all',date).wins,1);assert.notEqual(restored.notebookStats!.active.impossible,'impossible:2');assert.deepEqual(decode(encode(restored),date),restored);
 const daily=decode(JSON.stringify(raw),date,5,'en','APPLE');assert.equal(daily.notebookStats!.active.impossible,'impossible:2');assert.equal(notebookStatistics(daily,'impossible','all',date).played,1);
});
test('completed daily variant ledgers remain single-counted in copied notebooks',()=>{
 const date='2026-11-06',old=oldNotebook(5,date),raw=JSON.parse(rawPrevious(old));raw.notebookStats.records['impossible:2']={mode:'impossible',date,difficulty:'hard',assisted:false,won:true,turns:4,order:1};raw.notebookStats.nextOrder=2;
 const data=new Map<string,string>([[saveKeyForPath('/')+'.absurd-daily.v1.'+date,JSON.stringify(raw)]]);const storage={get length(){return data.size},key:(i:number)=>[...data.keys()][i]??null,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 preserveEnglishStorageForUpdate(storage,'/');for(let i=0;i<3;i++)assert.equal(dailyVariantRecords(storage,activeSaveKeyForPath('/'),'absurd',date,5,'en').length,1);assert.equal(data.size,3);
});
import {uniqueCluePairs} from '../src/one.ts';
import {makeSmashPair,newSmashRun,submitSmash,restoreSmashRun} from '../src/smashare.ts';
import {newLetroso,submitLetroso,restoreLetroso} from '../src/letroso.ts';
import {readSmashResults,summarizeSmash} from '../src/smash-statistics.ts';
test('One possibility preserves compatible given clues and completed removed answers, but not a live removed answer',()=>{
 const date='2026-11-06',old=oldNotebook(5,date),previous=previousEnglishAnswers(5)!,current=vocabulary(),pairs=uniqueCluePairs(previous,[...current.allowed]),kept=pairs.find(p=>current.answers.includes(p.answer))!,removed=pairs.find(p=>!current.answers.includes(p.answer))!;assert.ok(removed);
 old.one={...newRun(kept.answer,'strict'),guesses:[kept.clue]};old.mode='one';assert.deepEqual(decode(rawPrevious(old),date).one,old.one);
 old.one={...newRun(removed.answer),guesses:[removed.clue]};old.notebookStats!.exposure.one='easy';const fresh=decode(rawPrevious(old),date);assert.deepEqual(fresh.one.guesses,[]);assert.equal(fresh.notebookStats!.exposure.one,null);
 old.one=submit(old.one,removed.answer).run;const completed=decode(rawPrevious(old),date);assert.equal(status(completed.one),'won');assert.deepEqual(completed.one,old.one);assert.equal(notebookStatistics(completed,'one','all',date).wins,1);assert.deepEqual(decode(encode(completed),date),completed);
});
test('Smashare keeps an eligible original pair exactly; removed pairs stay in originals and recorded ledgers carry forward',()=>{
 const previous=previousEnglishAnswers(5)!,current=vocabulary();
 let legacyPair;outer:for(const removed of previous.filter(w=>!current.answers.includes(w)))for(const first of previous){legacyPair=makeSmashPair(first,removed)??makeSmashPair(removed,first);if(legacyPair)break outer}assert.ok(legacyPair);
 const keptPair=makeSmashPair('LEMON','APPLE')!;assert.ok(keptPair);let kept=newSmashRun(keptPair,'en','strict');kept=submitSmash(kept,keptPair.merged).run;assert.deepEqual(restoreSmashRun(kept,'en',5),kept);
 const removedRun={...kept,answer:legacyPair,guesses:[legacyPair!.merged]};assert.equal(restoreSmashRun(removedRun,'en',5),undefined);
 const root=saveKeyForPath('/'),key=root+'.smashare.v1.daily.2026-11-06.game',statsKey=root+'.smashare-stats.v1.daily',records=[{id:'2026-11-06',date:'2026-11-06',won:true,turns:1,difficulty:'strict',assisted:false,gaveUp:false,extended:false}],data=new Map([[key,JSON.stringify(removedRun)],[statsKey,JSON.stringify(records)]]);const storage={get length(){return data.size},key:(i:number)=>[...data.keys()][i]??null,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 preserveEnglishStorageForUpdate(storage,'/');assert.equal(data.get(key),JSON.stringify(removedRun));const copied=readSmashResults(data.get(activeSaveKeyForPath('/')+'.smashare-stats.v1.daily')!);assert.equal(summarizeSmash(copied,'all','all','2026-11-06').wins,1);
});
test('Letroso keeps eligible fixed answers and guesses, while removed-answer data and statistics remain separately recoverable',()=>{
 let kept=newLetroso('APPLE','en','hard');kept=submitLetroso(kept,'ALLEY').run;assert.deepEqual(restoreLetroso(kept,'en',5),kept);
 const removed=previousEnglishAnswers(5)!.find(w=>!vocabulary().answers.includes(w))!,legacy={...kept,answer:removed};assert.equal(restoreLetroso(legacy,'en',5),undefined);
 const root=saveKeyForPath('/'),key=root+'.letroso-hidden.v2.practice.game',statsKey=root+'.letroso-stats.v1.practice',records=[{id:'legacy-round',date:'2026-11-05',won:true,turns:3,difficulty:'hard',assisted:false,gaveUp:false,extended:false}],data=new Map([[key,JSON.stringify(legacy)],[statsKey,JSON.stringify(records)]]);const storage={get length(){return data.size},key:(i:number)=>[...data.keys()][i]??null,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 preserveEnglishStorageForUpdate(storage,'/');assert.equal(data.get(key),JSON.stringify(legacy));assert.equal(data.get(activeSaveKeyForPath('/')+'.letroso-stats.v1.practice'),JSON.stringify(records));
});
test('removed legacy live rounds without the newer statistics extension still require a fresh Start',()=>{
 const length=5,answers=vocabulary().answers,index=previousEnglishAnswers(5)!.findIndex((_,i)=>!answers.includes(oldAnswer(after(i),5))),date=after(index),raw=JSON.parse(rawPrevious(oldNotebook(length,date)));delete raw.notebookStats;const restored=decode(JSON.stringify(raw),date);assert.equal(restored.notebookStats!.exposure.daily,null);assert.equal(restored.notebookStats!.exposure.impossible,null);
});
test('invalid practice or One answer lengths cannot discard valid daily progress or preferences',()=>{
 const date='2026-11-06',raw=JSON.parse(encode(emptySave(date,'strict')));raw.settings.contrast=true;raw.practice.answer='X';raw.one={answer:'TOOLONGFORTHISROUND',guesses:[]};const restored=decode(JSON.stringify(raw),date);assert.equal(restored.settings.contrast,true);assert.equal(difficulty(restored.daily),'strict');
});

test('a terminal old-answer ledger wins over stale unfinished removed-answer boards without changing its clues',()=>{
 const date='2027-12-27',old=oldNotebook(5,date),answer=old.daily.answer;assert.equal(answer,'FECES');old.results[date]=[answer];old.history[date]={won:true,turns:1};
 let restored=decode(rawPrevious(old),date);for(let reload=0;reload<3;reload++){assert.equal(restored.daily.answer,answer);assert.deepEqual(restored.daily.guesses,[answer]);assert.equal(status(restored.daily),'won');assert.deepEqual(restored.results[date],[answer]);assert.equal(restored.englishAnswerSchedules?.[date],'previous');restored=decode(encode(restored),date)}
});
