import {validLetters,type Language} from './language.ts';
import {newImpossible,restoreImpossible,impossibleSnapshot,type ImpossibleRun} from './impossible.ts';
import {vocabulary,answerDataset,PREVIOUS_ANSWER_DATASET} from './words.ts';
import {dailyAnswer, difficulty, DAY, newRun, status, submit, validDate, type Run,type Difficulty} from './domain.ts';
export const SAVE_KEY='morrowmark.v1';
export interface HistoricalResult {won:boolean;turns:number}
export interface Save {
 version:3; dataset:string; language?:Language; history:Record<string,HistoricalResult>; date:string; daily:Run; practice:Run; mode:'daily'|'practice'|'impossible'; impossible:ImpossibleRun;
 results:Record<string,string[]>; settings:{contrast:boolean;hardMode:boolean;strictMode?:boolean;easyMode?:boolean;suboptimal?:boolean};
}
export function emptySave(date:string,mode:boolean|Difficulty=false,length=5,language:Language='en'):Save {
 return {version:3,dataset:answerDataset(length,language),...(language==='en'?{}:{language}),history:{},date,daily:newRun(dailyAnswer(date,length,language),mode,language),practice:newRun(language==='en'&&length===5?'APPLE':vocabulary(length,language).answers[0],mode,language),mode:'daily',impossible:newImpossible('normal',length,language),results:{},settings:{contrast:false,hardMode:mode===true||mode==='hard',...(mode==='strict'?{strictMode:true}:mode==='easy'?{easyMode:true}:{})}};
}
function object(value:unknown):value is Record<string,unknown> {return typeof value==='object' && value!==null && !Array.isArray(value)}
function storedMode(value:unknown):Save['mode'] {return value==='evil'||value==='absurd'?'impossible':value==='practice'||value==='impossible'?value:'daily'}
function storedDifficulty(value:Record<string,unknown>):Difficulty {return value.difficulty==='easy'||value.difficulty==='hard'||value.difficulty==='strict'||value.difficulty==='normal'?value.difficulty:value.strictMode===true?'strict':value.hardMode===true?'hard':value.easyMode===true?'easy':'normal'}
function validatedRun(value:unknown, answer:string,language:Language='en'):Run|null {
 if(!object(value)||!Array.isArray(value.guesses)||value.guesses.length>6) return null;
 const ALLOWED=vocabulary(answer.length,language).allowed;
 const guesses:string[]=[];
 for(const guess of value.guesses){
  if(typeof guess!=='string'||!ALLOWED.has(guess)||guesses.includes(guess)||guesses.includes(answer)) return null;
  guesses.push(guess);
 }
 const draft=typeof value.draft==='string' && validLetters(value.draft,language)&&value.draft.length<=answer.length?value.draft:'';
 const run:Run={answer,guesses,draft,...(language==='en'?{}:{language}),...(value.assisted===true||value.easyMode===true||value.difficulty==='easy'?{assisted:true}:{})}; if(status(run)!=='playing')run.draft='';
 const selected=storedDifficulty(value);
 if(selected==='easy')run.easyMode=true;
 if(selected==='strict'||selected==='hard'){
  let replay=newRun(answer,selected,language);
  for(const guess of guesses){const next=submit(replay,guess);if(next.error)return run;replay=next.run;}
  if(selected==='strict')run.strictMode=true;else run.hardMode=true;
 }
 return run;
}
export function recordDaily(save:Save,date:string,run:Run):void {
 if('variant' in run&&run.variant==='impossible')return;
 if((run.language??'en')===(save.language??'en')&&run.answer.length===save.daily.answer.length&&validDate(date) && run.answer===dailyAnswer(date,run.answer.length,run.language) && status(run)!=='playing' && !save.results[date]) {save.results[date]=[...run.guesses];save.history[date]={won:status(run)==='won',turns:run.guesses.length};}
}
export function decode(raw:string|null,today:string,length=5,language:Language='en'):Save {
 const {answers:ANSWERS}=vocabulary(length,language);const save=emptySave(today,false,length,language); if(!raw)return save;
 try{
  const value:unknown=JSON.parse(raw);
  if(!object(value)||value.version!==3)return save;
  if((value.language!==undefined&&value.language!==language)||(language==='es-MX'&&value.language!=='es-MX'))return save;
  const replacedGuide=(language==='en'&&length===5&&value.dataset===PREVIOUS_ANSWER_DATASET)||(language==='es-MX'&&(value.dataset===`es-MX-rla2.9-starter-${length}-v1`||value.dataset===`es-MX-rla2.9-common-${length}-v2`));
  if(value.dataset!==answerDataset(length,language)&&!replacedGuide)return save;
  save.settings.hardMode=object(value.settings)&&(value.settings.hardMode===true||value.settings.difficulty==='hard');
  if(object(value.settings)&&(value.settings.easyMode===true||value.settings.difficulty==='easy')){save.settings.easyMode=true;save.settings.hardMode=false;}
  if(object(value.settings)&&value.settings.suboptimal===true)save.settings.suboptimal=true;
  if(object(value.settings)&&(value.settings.strictMode===true||value.settings.difficulty==='strict')){save.settings.strictMode=true;save.settings.hardMode=false;delete save.settings.easyMode;}
  save.daily=newRun(dailyAnswer(today,length,language),difficulty(save.settings),language);
  save.practice=newRun(language==='en'&&length===5?'APPLE':ANSWERS[0],difficulty(save.settings),language);
  save.settings.contrast=object(value.settings)&&value.settings.contrast===true;
  if(replacedGuide){
   // Read only preferences from the known previous guide, never its clues, answers or outcomes.
   save.daily=newRun(dailyAnswer(today,length,language),validDate(value.date)&&value.date===today&&object(value.daily)?storedDifficulty(value.daily):difficulty(save.settings),language);
   save.practice=newRun(language==='en'&&length===5?'APPLE':ANSWERS[0],object(value.practice)?storedDifficulty(value.practice):difficulty(save.settings),language);
   const adaptive=object(value.impossible)?value.impossible:object(value.absurd)?value.absurd:object(value.evil)?value.evil:null;
   save.impossible=newImpossible(adaptive?storedDifficulty(adaptive):'normal',length,language);save.mode=storedMode(value.mode);
   return save;
  }
  if(object(value.history))for(const [date,result] of Object.entries(value.history)){
   if(validDate(date)&&date<=today&&object(result)&&typeof result.won==='boolean'&&Number.isInteger(result.turns)&&Number(result.turns)>=1&&Number(result.turns)<=6&&(result.won||result.turns===6))save.history[date]={won:result.won,turns:Number(result.turns)};
  }
  if(object(value.results)) for(const [date,guesses] of Object.entries(value.results)){
   if(!validDate(date)||date>today)continue;
   const run=validatedRun({guesses},dailyAnswer(date,length,language),language);
   if(run && status(run)!=='playing')recordDaily(save,date,run);
  }
  if(validDate(value.date)&&value.date<=today){
   const run=validatedRun(value.daily,dailyAnswer(value.date,length,language),language);
   if(run){recordDaily(save,value.date,run);if(value.date===today)save.daily=run;}
  }
  // A terminal ledger entry is authoritative when a stale tab saved an unfinished run.
  if(save.results[today]){
   const guesses=save.results[today];
   const matching=save.daily.guesses.length===guesses.length&&save.daily.guesses.every((guess,i)=>guess===guesses[i]);
   save.daily={...newRun(dailyAnswer(today,length,language),matching?difficulty(save.daily):'normal',language),guesses:[...guesses],...(matching&&save.daily.assisted?{assisted:true}:{})};
  }
  if(object(value.practice)&&typeof value.practice.answer==='string'&&ANSWERS.includes(value.practice.answer)){
   save.practice=validatedRun(value.practice,value.practice.answer,language)??save.practice;
  }
  const adaptive=restoreImpossible(value.impossible)??restoreImpossible(value.absurd)??restoreImpossible(value.evil);
  save.impossible=adaptive?.answer.length===length&&(adaptive.language??'en')===language?adaptive:newImpossible('normal',length,language);
  save.mode=storedMode(value.mode);
  save.settings.contrast=object(value.settings)&&value.settings.contrast===true;
  return save;
 }catch{return save}
}
export function statistics(results:Record<string,string[]>,today:string,history:Record<string,HistoricalResult>={},length=5,language:Language='en'){
 const outcomes={...history};for(const [date,guesses] of Object.entries(results))outcomes[date]={won:guesses.includes(dailyAnswer(date,length,language)),turns:guesses.length};
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
export function synchronize(previous:Save,today:string,read:()=>string|null,length=previous.daily.answer.length,language:Language=previous.language??'en'):{save:Save;available:boolean}{
 try{return {save:decode(read(),today,length,language),available:true};}
 catch{return {save:decode(encode(previous),today,length,language),available:false};}
}

/** Persist adaptive guesses only; candidates, feedback and the representative are reconstructed. */
export function encode(save:Save):string {return JSON.stringify({...save,impossible:impossibleSnapshot(save.impossible)})}
