import {ANSWERS,ALLOWED} from './words.ts';
import {dailyAnswer, DAY, newRun, status, validDate, type Run} from './domain.ts';
export const SAVE_KEY='morrowmark.v1';
export interface Save {
 version:1; date:string; daily:Run; practice:Run; mode:'daily'|'practice';
 results:Record<string,string[]>; settings:{contrast:boolean};
}
export function emptySave(date:string):Save {
 return {version:1,date,daily:newRun(dailyAnswer(date)),practice:newRun('APPLE'),mode:'daily',results:{},settings:{contrast:false}};
}
function object(value:unknown):value is Record<string,unknown> {return typeof value==='object' && value!==null && !Array.isArray(value)}
function validatedRun(value:unknown, answer:string):Run|null {
 if(!object(value)||!Array.isArray(value.guesses)||value.guesses.length>6) return null;
 const guesses:string[]=[];
 for(const guess of value.guesses){
  if(typeof guess!=='string'||!ALLOWED.has(guess)||guesses.includes(guess)||guesses.includes(answer)) return null;
  guesses.push(guess);
 }
 const draft=typeof value.draft==='string' && /^[A-Z]{0,5}$/.test(value.draft)?value.draft:'';
 const run={answer,guesses,draft}; if(status(run)!=='playing')run.draft=''; return run;
}
export function recordDaily(save:Save,date:string,run:Run):void {
 if(validDate(date) && run.answer===dailyAnswer(date) && status(run)!=='playing' && !save.results[date]) save.results[date]=[...run.guesses];
}
export function decode(raw:string|null,today:string):Save {
 const save=emptySave(today); if(!raw)return save;
 try{
  const value:unknown=JSON.parse(raw);
  if(!object(value)||value.version!==1)return save;
  if(object(value.results)) for(const [date,guesses] of Object.entries(value.results)){
   if(!validDate(date)||date>today)continue;
   const run=validatedRun({guesses},dailyAnswer(date));
   if(run && status(run)!=='playing')recordDaily(save,date,run);
  }
  if(validDate(value.date)&&value.date<=today){
   const run=validatedRun(value.daily,dailyAnswer(value.date));
   if(run){recordDaily(save,value.date,run);if(value.date===today)save.daily=run;}
  }
  // A terminal ledger entry is authoritative when a stale tab saved an unfinished run.
  if(save.results[today])save.daily={answer:dailyAnswer(today),guesses:[...save.results[today]],draft:''};
  if(object(value.practice)&&typeof value.practice.answer==='string'&&ANSWERS.includes(value.practice.answer)){
   save.practice=validatedRun(value.practice,value.practice.answer)??save.practice;
  }
  save.mode=value.mode==='practice'?'practice':'daily';
  save.settings.contrast=object(value.settings)&&value.settings.contrast===true;
  return save;
 }catch{return save}
}
export function statistics(results:Record<string,string[]>,today:string){
 const dates=Object.keys(results).filter(date=>date<=today).sort();
 const histogram=[0,0,0,0,0,0];let wins=0,best=0,chain=0,last='';
 for(const date of dates){
  if(results[date].includes(dailyAnswer(date))){
   wins++;histogram[results[date].length-1]++;
   chain=last&&Date.parse(date)-Date.parse(last)===DAY?chain+1:1;
   best=Math.max(best,chain);last=date;
  }else{chain=0;last='';}
 }
 const yesterday=new Date(Date.parse(today)-DAY).toISOString().slice(0,10);
 const current=last===today||last===yesterday?chain:0;
 return {played:dates.length,wins,percent:dates.length?Math.round(wins/dates.length*100):0,current,best,histogram};
}

/** Read external state before an action; a failing storage boundary must not freeze the UTC date. */
export function synchronize(previous:Save,today:string,read:()=>string|null):{save:Save;available:boolean}{
 try{return {save:decode(read(),today),available:true};}
 catch{return {save:decode(JSON.stringify(previous),today),available:false};}
}
