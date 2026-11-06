import {usesAccentEquivalence,normalizeGuess,savedDutchRules,isLanguage,validLetters,languageLabel,type DutchRules,type Language} from './language.ts';
import {vocabulary,absurdDataset,isWordLength,isSupportedLength} from './words.ts';
import {newRun,score,submit,difficulty,awaitingContinuation,continueGuessing,setDifficulty,clueConstraintError,type Difficulty,type Run,type Clue,type Outcome} from './domain.ts';

export interface ImpossibleRun extends Run {version:1;variant:'impossible';candidates:string[];feedback:Clue[][];target?:string}
export interface ImpossibleSnapshot {dutchRules?:DutchRules;version:2;dataset:string;guesses:string[];draft:string;difficulty?:Difficulty;assisted?:boolean;gaveUp?:boolean;continuation?:'pending'|'unlimited';wordLength?:number;language?:Language}
export function isImpossible(run:Run):run is ImpossibleRun {return 'variant' in run&&run.variant==='impossible'}
const digit={absent:'0',elsewhere:'1',exact:'2'};
/** Largest bucket; ties avoid a win, then use ascending 0=absent, 1=elsewhere, 2=exact. */
export function largestBucket(candidates:readonly string[],guess:string,language:Language='en',dutchRules:DutchRules=2):{candidates:string[];feedback:Clue[]} {
 if(!candidates.length)throw new Error('Absurd needs at least one candidate.');
 const buckets=new Map<string,{candidates:string[];feedback:Clue[]}>();
 for(const answer of candidates){
  const feedback=score(answer,guess,language,dutchRules),key=feedback.map(clue=>digit[clue]).join('');
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
export function newImpossible(level:Difficulty='normal',length=5,language:Language='en',dutchRules:DutchRules=2):ImpossibleRun {
 const candidates=[...vocabulary(length,language).answers].sort();
 return {...newRun(candidates[0],level,language,dutchRules),version:1,variant:'impossible',candidates,feedback:[]};
}
export function impossibleStatus(run:ImpossibleRun):Outcome {
 return run.target&&!run.candidates.includes(run.target)?'lost':run.feedback.at(-1)?.every(clue=>clue==='exact')?(run.target&&run.answer!==run.target?'lost':'won'):run.gaveUp||run.guesses.length>=6&&!run.continuation?'lost':'playing';
}
export function submitImpossible(run:ImpossibleRun,raw:string):{run:ImpossibleRun;error?:string} {
 if(impossibleStatus(run)!=='playing')return {run,error:'This fieldnote is complete.'};
 if(awaitingContinuation(run))return {run,error:'Choose Keep guessing or Give up before another guess.'};
 // Basic dictionary checks precede clue validation against the actual adaptive feedback.
 const checked=submit({answer:run.candidates[0],guesses:run.guesses,draft:run.draft,language:run.language,dutchRules:run.dutchRules,...(run.continuation?{continuation:run.continuation}:{})},raw);
 if(checked.error)return {run,error:checked.error};
 const guess=checked.run.guesses.at(-1)!;
 const error=clueConstraintError(run,guess,run.feedback);if(error)return {run,error};
 const selected=largestBucket(run.candidates,guess,run.language,run.dutchRules);
 return {run:{...newRun(selected.candidates[0],difficulty(run),run.language,run.dutchRules),version:1,variant:'impossible',...(run.target?{target:run.target}:{}),guesses:checked.run.guesses,candidates:selected.candidates,feedback:[...run.feedback,selected.feedback],...(run.assisted?{assisted:true}:{}),...(run.continuation==='unlimited'?{continuation:'unlimited' as const}:checked.run.guesses.length===6&&!selected.feedback.every(clue=>clue==='exact')?{continuation:'pending' as const}:{})}};
}
export function setImpossibleDifficulty(run:ImpossibleRun,selected:Difficulty):{run:ImpossibleRun;error?:string} {
 const result=setDifficulty(run,selected,impossibleStatus(run));
 if(result.error)return {run,error:result.error};
 return {run:{...result.run,version:run.version,variant:run.variant,candidates:run.candidates,feedback:run.feedback}};
}
export function impossibleSnapshot(run:ImpossibleRun):ImpossibleSnapshot {return {...(run.language==='nl-NL'?{dutchRules:run.dutchRules??2}:{}),version:2,dataset:absurdDataset(run.answer.length,run.language),...(run.language?{language:run.language}:{}),...(run.answer.length===5?{}:{wordLength:run.answer.length}),difficulty:difficulty(run),guesses:[...run.guesses],draft:run.draft,...(run.assisted?{assisted:true}:{}),...(run.gaveUp?{gaveUp:true}:{}),...(run.continuation?{continuation:run.continuation}:{})}}
export function restoreImpossible(value:unknown):ImpossibleRun|null {
 if(typeof value!=='object'||value===null||Array.isArray(value))return null;
 const input=value as Record<string,unknown>;
 if(input.dutchRules!==undefined&&input.dutchRules!==1&&input.dutchRules!==2)return null;
 const language=input.language??'en';if(!isLanguage(language))return null;
 const length=input.wordLength??5;if(!isWordLength(length)||!isSupportedLength(length,language))return null;
 if(input.version!==2||input.dataset!==absurdDataset(length,language)||!Array.isArray(input.guesses)||input.guesses.length>vocabulary(length,language).allowed.size||input.guesses.length>6&&input.continuation!=='unlimited')return null;
 const selected:Difficulty=input.difficulty==='easy'||input.difficulty==='hard'||input.difficulty==='strict'?input.difficulty:'normal';
 let run=newImpossible(selected,length,language,savedDutchRules(input));
 for(const guess of input.guesses){
  if(typeof guess!=='string'||(!validLetters(guess,language)||guess.length!==length))return null;
  if(awaitingContinuation(run)&&input.continuation==='unlimited')run=continueGuessing(run);
  const next=submitImpossible(run,guess);if(next.error)return null;run=next.run;
 }
 if(run.continuation==='pending'&&input.continuation!=='pending'&&input.continuation!=='unlimited')delete run.continuation;
 if(run.continuation==='pending'&&input.continuation==='unlimited')run=continueGuessing(run);
 if(input.continuation==='pending'&&(run.guesses.length!==6||impossibleStatus(run)==='won'))return null;
 if(input.continuation==='unlimited'&&run.guesses.length<6)return null;
 const draft=typeof input.draft==='string'?usesAccentEquivalence(language,run.dutchRules)?normalizeGuess(input.draft,language,run.dutchRules):input.draft:'';
 if(impossibleStatus(run)==='playing'&&!awaitingContinuation(run)&&validLetters(draft,language)&&draft.length<=length)run.draft=draft;
 if(input.gaveUp===true&&impossibleStatus(run)==='playing')run.gaveUp=true;
 if(run.gaveUp)run.draft='';
 if(input.assisted===true)run.assisted=true;
 return run;
}
export function impossibleShare(run:ImpossibleRun):string {
 const glyph={exact:'■',elsewhere:'◩',absent:'□'};
 return `Lexi Conquest${run.language&&run.language!=='en'?` · ${languageLabel(run.language)}`:''} · Absurd · ${run.answer.length} letters · adaptive · ${difficulty(run)[0].toUpperCase()+difficulty(run).slice(1)}${run.assisted?' · Assisted':''}${run.gaveUp?' · Gave up':''}${run.continuation==='unlimited'?' · Extended play':''}\n${impossibleStatus(run)==='won'?run.guesses.length:'X'}/${run.continuation==='unlimited'?'∞':'6'}\n${run.feedback.map(row=>row.map(clue=>glyph[clue]).join('')).join('\n')}\n${run.candidates.length} possible ${run.candidates.length===1?'answer remains':'answers remain'}\n■ exact · ◩ elsewhere · □ absent`;
}
