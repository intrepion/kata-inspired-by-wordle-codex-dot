import {newImpossible,restoreImpossible,impossibleSnapshot,type ImpossibleRun} from './impossible.ts';
import {ANSWERS,ALLOWED,ANSWER_DATASET,PREVIOUS_ANSWER_DATASET} from './words.ts';
import {dailyAnswer, difficulty, DAY, newRun, status, submit, validDate, type Run,type Difficulty} from './domain.ts';
export const SAVE_KEY='morrowmark.v1';
export interface HistoricalResult {won:boolean;turns:number}
export interface Save {
 version:3; dataset:string; history:Record<string,HistoricalResult>; date:string; daily:Run; practice:Run; mode:'daily'|'practice'|'impossible'; impossible:ImpossibleRun;
 results:Record<string,string[]>; settings:{contrast:boolean;hardMode:boolean;strictMode?:boolean;easyMode?:boolean;suboptimal?:boolean};
}
export function emptySave(date:string,mode:boolean|Difficulty=false):Save {
 return {version:3,dataset:ANSWER_DATASET,history:{},date,daily:newRun(dailyAnswer(date),mode),practice:newRun('APPLE',mode),mode:'daily',impossible:newImpossible(),results:{},settings:{contrast:false,hardMode:mode===true||mode==='hard',...(mode==='strict'?{strictMode:true}:mode==='easy'?{easyMode:true}:{})}};
}
function object(value:unknown):value is Record<string,unknown> {return typeof value==='object' && value!==null && !Array.isArray(value)}
function storedMode(value:unknown):Save['mode'] {return value==='evil'||value==='absurd'?'impossible':value==='practice'||value==='impossible'?value:'daily'}
function storedDifficulty(value:Record<string,unknown>):Difficulty {return value.difficulty==='easy'||value.difficulty==='hard'||value.difficulty==='strict'||value.difficulty==='normal'?value.difficulty:value.strictMode===true?'strict':value.hardMode===true?'hard':value.easyMode===true?'easy':'normal'}
function validatedRun(value:unknown, answer:string):Run|null {
 if(!object(value)||!Array.isArray(value.guesses)||value.guesses.length>6) return null;
 const guesses:string[]=[];
 for(const guess of value.guesses){
  if(typeof guess!=='string'||!ALLOWED.has(guess)||guesses.includes(guess)||guesses.includes(answer)) return null;
  guesses.push(guess);
 }
 const draft=typeof value.draft==='string' && /^[A-Z]{0,5}$/.test(value.draft)?value.draft:'';
 const run:Run={answer,guesses,draft,...(value.assisted===true||value.easyMode===true||value.difficulty==='easy'?{assisted:true}:{})}; if(status(run)!=='playing')run.draft='';
 const selected=storedDifficulty(value);
 if(selected==='easy')run.easyMode=true;
 if(selected==='strict'||selected==='hard'){
  let replay=newRun(answer,selected);
  for(const guess of guesses){const next=submit(replay,guess);if(next.error)return run;replay=next.run;}
  if(selected==='strict')run.strictMode=true;else run.hardMode=true;
 }
 return run;
}
export function recordDaily(save:Save,date:string,run:Run):void {
 if('variant' in run&&run.variant==='impossible')return;
 if(validDate(date) && run.answer===dailyAnswer(date) && status(run)!=='playing' && !save.results[date]) {save.results[date]=[...run.guesses];save.history[date]={won:status(run)==='won',turns:run.guesses.length};}
}
export function decode(raw:string|null,today:string):Save {
 const save=emptySave(today); if(!raw)return save;
 try{
  const value:unknown=JSON.parse(raw);
  if(!object(value)||value.version!==3)return save;
  const replacedGuide=value.dataset===PREVIOUS_ANSWER_DATASET;
  if(value.dataset!==ANSWER_DATASET&&!replacedGuide)return save;
  save.settings.hardMode=object(value.settings)&&(value.settings.hardMode===true||value.settings.difficulty==='hard');
  if(object(value.settings)&&(value.settings.easyMode===true||value.settings.difficulty==='easy')){save.settings.easyMode=true;save.settings.hardMode=false;}
  if(object(value.settings)&&value.settings.suboptimal===true)save.settings.suboptimal=true;
  if(object(value.settings)&&(value.settings.strictMode===true||value.settings.difficulty==='strict')){save.settings.strictMode=true;save.settings.hardMode=false;delete save.settings.easyMode;}
  save.daily=newRun(dailyAnswer(today),difficulty(save.settings));
  save.practice=newRun('APPLE',difficulty(save.settings));
  save.settings.contrast=object(value.settings)&&value.settings.contrast===true;
  if(replacedGuide){
   // Read only preferences from the known previous guide, never its clues, answers or outcomes.
   save.daily=newRun(dailyAnswer(today),validDate(value.date)&&value.date===today&&object(value.daily)?storedDifficulty(value.daily):difficulty(save.settings));
   save.practice=newRun('APPLE',object(value.practice)?storedDifficulty(value.practice):difficulty(save.settings));
   const adaptive=object(value.impossible)?value.impossible:object(value.absurd)?value.absurd:object(value.evil)?value.evil:null;
   save.impossible=newImpossible(adaptive?storedDifficulty(adaptive):'normal');save.mode=storedMode(value.mode);
   return save;
  }
  if(object(value.history))for(const [date,result] of Object.entries(value.history)){
   if(validDate(date)&&date<=today&&object(result)&&typeof result.won==='boolean'&&Number.isInteger(result.turns)&&Number(result.turns)>=1&&Number(result.turns)<=6&&(result.won||result.turns===6))save.history[date]={won:result.won,turns:Number(result.turns)};
  }
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
  if(save.results[today]){
   const guesses=save.results[today];
   const matching=save.daily.guesses.length===guesses.length&&save.daily.guesses.every((guess,i)=>guess===guesses[i]);
   save.daily={...newRun(dailyAnswer(today),matching?difficulty(save.daily):'normal'),guesses:[...guesses],...(matching&&save.daily.assisted?{assisted:true}:{})};
  }
  if(object(value.practice)&&typeof value.practice.answer==='string'&&ANSWERS.includes(value.practice.answer)){
   save.practice=validatedRun(value.practice,value.practice.answer)??save.practice;
  }
  save.impossible=restoreImpossible(value.impossible)??restoreImpossible(value.absurd)??restoreImpossible(value.evil)??newImpossible();
  save.mode=storedMode(value.mode);
  save.settings.contrast=object(value.settings)&&value.settings.contrast===true;
  return save;
 }catch{return save}
}
export function statistics(results:Record<string,string[]>,today:string,history:Record<string,HistoricalResult>={}){
 const outcomes={...history};for(const [date,guesses] of Object.entries(results))outcomes[date]={won:guesses.includes(dailyAnswer(date)),turns:guesses.length};
 const dates=Object.keys(outcomes).filter(date=>date<=today).sort();
 const histogram=[0,0,0,0,0,0];let wins=0,best=0,chain=0,last='';
 for(const date of dates){
  if(outcomes[date].won){
   wins++;histogram[outcomes[date].turns-1]++;
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
 catch{return {save:decode(encode(previous),today),available:false};}
}

/** Persist adaptive guesses only; candidates, feedback and the representative are reconstructed. */
export function encode(save:Save):string {return JSON.stringify({...save,impossible:impossibleSnapshot(save.impossible)})}
