import {DAY,dailyAnswer,difficulty,status,validDate,type Difficulty,type Run} from './domain.ts';
import {isImpossible,impossibleStatus} from './impossible.ts';
import type {Save} from './persistence.ts';
export type StatsMode='daily'|'practice'|'impossible';
export type StatsDifficulty=Difficulty|'legacy';
export type AssistanceFilter='all'|'assisted'|'unassisted'|'unknown';
export interface Completion {mode:StatsMode;date:string|null;difficulty:StatsDifficulty;assisted:boolean|null;won:boolean;turns:number;order:number;gaveUp?:boolean;extended?:boolean}
export interface NotebookStats {version:1;nextId:number;nextOrder:number;active:Record<StatsMode,string>;records:Record<string,Completion>;exposure:Record<StatsMode,StatsDifficulty|null>;setupPending?:Partial<Record<StatsMode,boolean>>}
const levels=['easy','normal','hard','strict','legacy'];
const modes:StatsMode[]=['daily','practice','impossible'];
const terminal=(run:Run)=>isImpossible(run)?impossibleStatus(run):status(run);
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const positive=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0;
function validId(id:string,mode:StatsMode){return mode==='daily'?id.startsWith('daily:')&&validDate(id.slice(6)):new RegExp(`^${mode}:[1-9][0-9]*$`).test(id)&&Number.isSafeInteger(Number(id.split(':')[1]))}
/** Additive validation: old notebooks keep their original schema, histories and preferences. */
export function readNotebookStats(raw:unknown,today:string):NotebookStats|undefined {
 if(!object(raw)||raw.version!==1||!object(raw.records)||!object(raw.active))return;
 const records:Record<string,Completion>={};let maxId=0,maxOrder=0;
 for(const [id,v] of Object.entries(raw.records)){
  if(!object(v)||!modes.includes(v.mode as StatsMode)||!validId(id,v.mode as StatsMode)||!levels.includes(v.difficulty as string)||typeof v.won!=='boolean'||!Number.isSafeInteger(v.turns)||Number(v.turns)<0||Number(v.turns)>6&&v.extended!==true||(v.gaveUp===true?v.won:(Number(v.turns)<1||!v.won&&(v.turns!==6||v.extended===true)))||!positive(v.order))continue;
  if(v.assisted!==null&&typeof v.assisted!=='boolean')continue;
  if(v.date!==null&&(!validDate(v.date)||v.date>today))continue;
  if(v.mode==='daily'&&(v.date===null||id!=='daily:'+v.date))continue;
  if(v.date===null&&v.difficulty!=='legacy')continue;
  records[id]={mode:v.mode as StatsMode,date:v.date as string|null,difficulty:v.difficulty as StatsDifficulty,assisted:v.assisted as boolean|null,won:v.won,turns:Number(v.turns),order:v.order,...(v.gaveUp===true?{gaveUp:true}:{}),...(v.extended===true?{extended:true}:{})};
  maxOrder=Math.max(maxOrder,v.order);if(v.mode!=='daily')maxId=Math.max(maxId,Number(id.split(':')[1]));
 }
 const active={} as Record<StatsMode,string>;
 for(const mode of modes){const id=raw.active[mode];if(typeof id==='string'&&validId(id,mode)){active[mode]=id;if(mode!=='daily')maxId=Math.max(maxId,Number(id.split(':')[1]))}}
 const exposure={} as NotebookStats['exposure'];for(const mode of modes){const value=object(raw.exposure)?raw.exposure[mode]:undefined;exposure[mode]=value===null?null:levels.includes(value as string)?value as StatsDifficulty:'legacy'}
 const setupPending:Partial<Record<StatsMode,boolean>>={};if(object(raw.setupPending))for(const mode of modes)if(raw.setupPending[mode]===true)setupPending[mode]=true;
 return {version:1,exposure,...(Object.keys(setupPending).length?{setupPending}:{}),nextId:Math.max(maxId+1,positive(raw.nextId)?raw.nextId:1),nextOrder:Math.max(maxOrder+1,positive(raw.nextOrder)?raw.nextOrder:1),active,records};
}
/** Migrate only what the previous save actually retained; never infer old difficulty. */
export function initializeNotebookStats(save:Save,fresh=false):boolean {
 if(save.notebookStats)return false;
 const data:NotebookStats={version:1,nextId:3,nextOrder:1,active:{daily:'daily:'+(save.dailyDate??save.date),practice:'practice:1',impossible:'impossible:2'},records:{},exposure:{daily:fresh?null:'legacy',practice:fresh?null:'legacy',impossible:fresh?null:'legacy'}};save.notebookStats=data;
 const previous={...save.history};for(const [date,guesses] of Object.entries(save.results))previous[date]={won:guesses.includes(dailyAnswer(date,save.daily.answer.length,save.language)),turns:guesses.length,...(save.history[date]?.gaveUp?{gaveUp:true}:{}),...(save.history[date]?.extended?{extended:true}:{})};
 if(terminal(save.daily)!=='playing')previous[(save.dailyDate??save.date)]={won:terminal(save.daily)==='won',turns:save.daily.guesses.length,...(save.daily.gaveUp?{gaveUp:true}:{}),...(save.daily.continuation==='unlimited'?{extended:true}:{})};
 for(const date of Object.keys(previous).sort())if(validDate(date)&&date<=save.date){const value=previous[date];data.records['daily:'+date]={mode:'daily',date,difficulty:'legacy',assisted:null,won:value.won,turns:value.turns,order:data.nextOrder++,...(value.gaveUp?{gaveUp:true}:{}),...(value.extended?{extended:true}:{})}}
 if(save.daily.assisted===true&&data.records['daily:'+(save.dailyDate??save.date)])data.records['daily:'+(save.dailyDate??save.date)].assisted=true;
 for(const mode of ['practice','impossible'] as const){const run=save[mode];if(terminal(run)!=='playing')data.records[data.active[mode]]={mode,date:null,difficulty:'legacy',assisted:run.assisted===true?true:null,won:terminal(run)==='won',turns:run.guesses.length,order:data.nextOrder++,...(run.gaveUp?{gaveUp:true}:{}),...(run.continuation==='unlimited'?{extended:true}:{})}}
 return true;
}
/** Explicit starts distinguish identical replayed words/rows. Unfinished restarts add no result. */
export function startStatsRound(save:Save,mode:StatsMode,selected:Difficulty=difficulty(save[mode])):void {
 initializeNotebookStats(save);const data=save.notebookStats!;
 if(mode==='daily'&&data.active.daily==='daily:'+(save.dailyDate??save.date))return;
 data.active[mode]=mode==='daily'?'daily:'+(save.dailyDate??save.date):`${mode}:${data.nextId++}`;data.exposure[mode]=null;if(data.setupPending)delete data.setupPending[mode];
}
/** Selecting options is not exposure. Only explicit Start fixes a fresh baseline. */
export function puzzleNeedsStart(save:Save,mode:StatsMode=save.mode):boolean {initializeNotebookStats(save);const data=save.notebookStats!;if(mode==='daily'&&data.active.daily!=='daily:'+(save.dailyDate??save.date)){data.active.daily='daily:'+(save.dailyDate??save.date);data.exposure.daily=null}return data.exposure[mode]===null||data.setupPending?.[mode]===true}
export function beginStatsPuzzle(save:Save,mode:StatsMode,selected:Difficulty):boolean {
 if(!puzzleNeedsStart(save,mode)||save[mode].guesses.length)return false;
 const data=save.notebookStats!;if(data.setupPending)delete data.setupPending[mode];if(data.exposure[mode]===null)data.exposure[mode]=selected;else observeStatsDifficulty(save,mode,selected);return true;
}
/** Restart confirmation retains prior exposure/assistance; it is not a fresh game. */
export function requireStatsSetup(save:Save,mode:StatsMode):void {initializeNotebookStats(save);(save.notebookStats!.setupPending??={})[mode]=true}
/** Exposure includes zero-guess views and only ever becomes easier. Easy is the absolute minimum even when earlier exposure is unknown. */
export function observeStatsDifficulty(save:Save,mode:StatsMode,selected:Difficulty):boolean {
 initializeNotebookStats(save);const data=save.notebookStats!;if(terminal(save[mode])!=='playing')return false;
 if(mode==='daily'&&data.active.daily!=='daily:'+(save.dailyDate??save.date)){data.active.daily='daily:'+(save.dailyDate??save.date);data.exposure.daily=null}
 const previous=data.exposure[mode];if(previous===null)return false;const rank={easy:0,normal:1,hard:2,strict:3};
 const next=previous==='legacy'?(selected==='easy'?'easy':'legacy'):rank[selected]<rank[previous]?selected:previous;
 if(next===previous)return false;data.exposure[mode]=next;return true;
}
/** The first terminal result is immutable. Daily has at most one result per UTC date. */
export function recordCompletion(save:Save,mode:StatsMode,date=mode==='daily'?(save.dailyDate??save.date):save.date,run:Run=save[mode]):boolean {
 const data=save.notebookStats;if(!data||terminal(run)==='playing'||!validDate(date))return false;
 if((run.language??'en')!==(save.language??'en')||run.answer.length!==save.daily.answer.length||(mode==='impossible')!==isImpossible(run))return false;
 if(mode==='daily'&&run.answer!==dailyAnswer(date,run.answer.length,run.language))return false;
 const id=mode==='daily'?'daily:'+date:data.active[mode];if(!id||data.records[id])return false;
 data.records[id]={mode,date,difficulty:data.exposure[mode]??'legacy',assisted:run.assisted===true||data.exposure[mode]==='easy'?true:data.exposure[mode]==='legacy'||data.exposure[mode]===null?null:false,won:terminal(run)==='won',turns:run.guesses.length,order:data.nextOrder++,...(run.gaveUp?{gaveUp:true}:{}),...(run.continuation==='unlimited'?{extended:true}:{})};return true;
}
/** Call before saving; restoration also settles interrupted terminal saves idempotently. */
export function settleNotebookStats(save:Save):void {
 initializeNotebookStats(save);const data=save.notebookStats!;if(data.active.daily!=='daily:'+(save.dailyDate??save.date)){data.active.daily='daily:'+(save.dailyDate??save.date);data.exposure.daily=null}
 for(const mode of modes){if(!data.active[mode])startStatsRound(save,mode);recordCompletion(save,mode)}
}
export function notebookStatistics(save:Save,mode:StatsMode,selected:StatsDifficulty|'all',today:string,assistance:AssistanceFilter='all') {
 initializeNotebookStats(save);
 const results=Object.values(save.notebookStats!.records).filter(r=>r.mode===mode&&(selected==='all'||r.difficulty===selected)&&(r.date===null||r.date<=today)&&(assistance==='all'||assistance==='unknown'&&r.assisted===null||assistance==='assisted'&&r.assisted===true||assistance==='unassisted'&&r.assisted===false)).sort((a,b)=>mode==='daily'?(a.date??'').localeCompare(b.date??''):a.order-b.order);
 const histogram=[0,0,0,0,0,0];let wins=0,current=0,best=0,last='';
 for(const r of results){if(r.won){wins++;if(r.turns<=6)histogram[r.turns-1]++;current=mode==='daily'?(last&&Date.parse(r.date!)-Date.parse(last)===DAY?current+1:1):current+1;best=Math.max(best,current);last=r.date??''}else{current=0;last=''}}
 if(mode==='daily'){const yesterday=new Date(Date.parse(today)-DAY).toISOString().slice(0,10);if(last!==today&&last!==yesterday||last===yesterday&&Object.values(save.notebookStats!.records).some(r=>r.mode==='daily'&&r.date===today)&&!results.some(r=>r.date===today))current=0}
 return {played:results.length,wins,withinSixWins:results.filter(r=>r.won&&r.turns<=6).length,extendedWins:results.filter(r=>r.won&&r.turns>6).length,extendedPlayed:results.filter(r=>r.extended).length,losses:results.length-wins,gaveUp:results.filter(r=>r.gaveUp===true).length,percent:results.length?Math.round(100*wins/results.length):0,current,best,histogram,assisted:results.filter(r=>r.assisted===true).length,unknownAssistance:results.filter(r=>r.assisted===null).length,legacy:results.filter(r=>r.difficulty==='legacy').length};
}
