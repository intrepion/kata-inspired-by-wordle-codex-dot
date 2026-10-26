import {isLanguage,validLetters,type Language} from './language.ts';
import {vocabulary,absurdDataset,isWordLength} from './words.ts';
import {newRun,score,submit,difficulty,setDifficulty,clueConstraintError,type Difficulty,type Run,type Clue,type Outcome} from './domain.ts';

export interface ImpossibleRun extends Run {version:1;variant:'impossible';candidates:string[];feedback:Clue[][]}
export interface ImpossibleSnapshot {version:2;dataset:string;guesses:string[];draft:string;difficulty?:Difficulty;assisted?:boolean;gaveUp?:boolean;wordLength?:number;language?:Language}
export function isImpossible(run:Run):run is ImpossibleRun {return 'variant' in run&&run.variant==='impossible'}
const digit={absent:'0',elsewhere:'1',exact:'2'};
/** Largest bucket; ties avoid a win, then use ascending 0=absent, 1=elsewhere, 2=exact. */
export function largestBucket(candidates:readonly string[],guess:string):{candidates:string[];feedback:Clue[]} {
 if(!candidates.length)throw new Error('Absurd needs at least one candidate.');
 const buckets=new Map<string,{candidates:string[];feedback:Clue[]}>();
 for(const answer of candidates){
  const feedback=score(answer,guess),key=feedback.map(clue=>digit[clue]).join('');
  let bucket=buckets.get(key);if(!bucket){bucket={candidates:[],feedback};buckets.set(key,bucket);}
  bucket.candidates.push(answer);
 }
 const key=[...buckets.keys()].sort((a,b)=>{
  const difference=buckets.get(b)!.candidates.length-buckets.get(a)!.candidates.length;
  if(difference)return difference;
  if(a==='2'.repeat(guess.length))return 1;if(b==='2'.repeat(guess.length))return -1;
  return a<b?-1:a>b?1:0;
 })[0];
 const chosen=buckets.get(key)!;
 return {...chosen,candidates:[...chosen.candidates].sort()};
}
export function newImpossible(level:Difficulty='normal',length=5,language:Language='en'):ImpossibleRun {
 const candidates=[...vocabulary(length,language).answers].sort();
 return {...newRun(candidates[0],level,language),version:1,variant:'impossible',candidates,feedback:[]};
}
export function impossibleStatus(run:ImpossibleRun):Outcome {
 return run.feedback.at(-1)?.every(clue=>clue==='exact')?'won':run.gaveUp||run.guesses.length>=6?'lost':'playing';
}
export function submitImpossible(run:ImpossibleRun,raw:string):{run:ImpossibleRun;error?:string} {
 if(impossibleStatus(run)!=='playing')return {run,error:'This fieldnote is complete.'};
 // Basic dictionary checks precede clue validation against the actual adaptive feedback.
 const checked=submit({answer:run.candidates[0],guesses:run.guesses,draft:run.draft,language:run.language},raw);
 if(checked.error)return {run,error:checked.error};
 const guess=checked.run.guesses.at(-1)!;
 const error=clueConstraintError(run,guess,run.feedback);if(error)return {run,error};
 const selected=largestBucket(run.candidates,guess);
 return {run:{...newRun(selected.candidates[0],difficulty(run),run.language),version:1,variant:'impossible',guesses:checked.run.guesses,candidates:selected.candidates,feedback:[...run.feedback,selected.feedback],...(run.assisted?{assisted:true}:{})}};
}
export function setImpossibleDifficulty(run:ImpossibleRun,selected:Difficulty):{run:ImpossibleRun;error?:string} {
 const result=setDifficulty(run,selected,impossibleStatus(run));
 if(result.error)return {run,error:result.error};
 return {run:{...result.run,version:run.version,variant:run.variant,candidates:run.candidates,feedback:run.feedback}};
}
export function impossibleSnapshot(run:ImpossibleRun):ImpossibleSnapshot {return {version:2,dataset:absurdDataset(run.answer.length,run.language),...(run.language?{language:run.language}:{}),...(run.answer.length===5?{}:{wordLength:run.answer.length}),difficulty:difficulty(run),guesses:[...run.guesses],draft:run.draft,...(run.assisted?{assisted:true}:{}),...(run.gaveUp?{gaveUp:true}:{})}}
export function restoreImpossible(value:unknown):ImpossibleRun|null {
 if(typeof value!=='object'||value===null||Array.isArray(value))return null;
 const input=value as Record<string,unknown>;
 const language=input.language??'en';if(!isLanguage(language))return null;
 const length=input.wordLength??5;if(!isWordLength(length))return null;
 if(input.version!==2||input.dataset!==absurdDataset(length,language)||!Array.isArray(input.guesses)||input.guesses.length>6)return null;
 const selected:Difficulty=input.difficulty==='easy'||input.difficulty==='hard'||input.difficulty==='strict'?input.difficulty:'normal';
 let run=newImpossible(selected,length,language);
 for(const guess of input.guesses){
  if(typeof guess!=='string'||(!validLetters(guess,language)||guess.length!==length))return null;
  const next=submitImpossible(run,guess);if(next.error)return null;run=next.run;
 }
 if(impossibleStatus(run)==='playing'&&typeof input.draft==='string'&&validLetters(input.draft,language)&&input.draft.length<=length)run.draft=input.draft;
 if(input.gaveUp===true&&impossibleStatus(run)==='playing')run.gaveUp=true;
 if(run.gaveUp)run.draft='';
 if(input.assisted===true)run.assisted=true;
 return run;
}
export function impossibleShare(run:ImpossibleRun):string {
 const glyph={exact:'■',elsewhere:'◩',absent:'□'};
 return `Lexi Conquest${run.language==='es-MX'?' · Español (México)':''} · Absurd · ${run.answer.length} letters · adaptive · ${difficulty(run)[0].toUpperCase()+difficulty(run).slice(1)}${run.assisted?' · Assisted':''}${run.gaveUp?' · Gave up':''}\n${impossibleStatus(run)==='won'?run.guesses.length:'X'}/6\n${run.feedback.map(row=>row.map(clue=>glyph[clue]).join('')).join('\n')}\n${run.candidates.length} possible ${run.candidates.length===1?'answer remains':'answers remain'}\n■ exact · ◩ elsewhere · □ absent`;
}
