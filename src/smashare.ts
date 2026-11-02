import {score,validDate,type Clue} from './domain.ts';
import {answerDataset,vocabulary} from './words.ts';
import {normalizeGuess,validLetters,type Language} from './language.ts';

/** Word 1 starts with the two letters that end word 2. The displayed merge reads word 2, then word 1. */
export type SmashPair={first:string;second:string;merged:string};
export function makeSmashPair(first:string,second:string):SmashPair|undefined {
 if(first.length!==second.length||first.length<3||first.slice(0,2)!==second.slice(-2)||first===second)return;
 return {first,second,merged:second+first.slice(2)};
}
export function parseSmashGuess(raw:string,length:number,language:Language):SmashPair|undefined {
 const merged=normalizeGuess(raw,language);
 if(!validLetters(merged,language)||merged.length!==2*length-2)return;
 const second=merged.slice(0,length),first=merged.slice(length-2);
 const allowed=vocabulary(length,language).allowed;
 return allowed.has(first)&&allowed.has(second)?makeSmashPair(first,second):undefined;
}
function hash(value:string):number {let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
type Group={second:string;firsts:string[]};
const cache=new Map<string,{groups:Group[];total:number}>();
function candidates(length:number,language:Language){
 const key=answerDataset(length,language),old=cache.get(key);if(old)return old;
 const answers=[...vocabulary(length,language).answers].sort(),prefixes=new Map<string,string[]>();
 for(const word of answers){const key=word.slice(0,2),group=prefixes.get(key)??[];group.push(word);prefixes.set(key,group)}
 const groups:Group[]=[];let total=0;
 for(const second of answers){const firsts=(prefixes.get(second.slice(-2))??[]).filter(first=>first!==second);if(firsts.length){groups.push({second,firsts});total+=firsts.length}}
 const result={groups,total};cache.set(key,result);return result;
}
export function smashPairCount(length:number,language:Language):number {return candidates(length,language).total}
function selectPair(index:number,length:number,language:Language):SmashPair {
 const {groups,total}=candidates(length,language);if(!total)throw new Error('No valid Smashare pairs for this language and length.');
 let offset=index%total;for(const group of groups){if(offset<group.firsts.length)return makeSmashPair(group.firsts[offset],group.second)!;offset-=group.firsts.length}
 throw new Error('Invalid pair index.');
}
export function dailySmashPair(date:string,length:number,language:Language):SmashPair {
 if(!validDate(date))throw new Error('Invalid UTC date.');
 return selectPair(hash(`smashare-v1|${date}|${language}|${length}|${answerDataset(length,language)}`),length,language);
}
export function practiceSmashPair(length:number,language:Language,random=Math.random):SmashPair {
 const {total}=candidates(length,language);if(!total)throw new Error('No valid Smashare pairs for this language and length.');
 return selectPair(Math.min(total-1,Math.max(0,Math.floor(random()*total))),length,language);
}
/** The shared seam is scored once as part of the merged string. */
export function scoreSmash(answer:SmashPair,guess:SmashPair):Clue[] {return score(answer.merged,guess.merged)}

import {clueConstraintError,type Difficulty} from './domain.ts';
export interface SmashRun {answer:SmashPair;guesses:string[];draft:string;language:Language;length:number;difficulty:Difficulty;roundId?:string;easiest?:Difficulty;assisted?:boolean;continuation?:'pending'|'unlimited';gaveUp?:boolean}
export function newSmashRun(answer:SmashPair,language:Language,difficulty:Difficulty='normal'):SmashRun {
 const length=answer.first.length,rebuilt=makeSmashPair(answer.first,answer.second);
 if(!rebuilt||rebuilt.merged!==answer.merged||!vocabulary(length,language).answers.includes(answer.first)||!vocabulary(length,language).answers.includes(answer.second))throw new Error('Invalid Smashare answer pair.');
 return {answer:rebuilt,guesses:[],draft:'',language,length,difficulty,easiest:difficulty,assisted:difficulty==='easy'};
}
export function smashStatus(run:SmashRun):'playing'|'won'|'lost' {
 return run.guesses.includes(run.answer.merged)?'won':run.gaveUp||run.guesses.length>=6&&!run.continuation?'lost':'playing';
}
export function submitSmash(run:SmashRun,raw:string):{run:SmashRun;error?:string} {
 if(smashStatus(run)!=='playing')return {run,error:'This fieldnote is complete.'};
 if(run.continuation==='pending')return {run,error:'Choose Keep guessing or Give up before another guess.'};
 const guess=parseSmashGuess(raw,run.length,run.language);
 if(!guess)return {run,error:`Use two different ${run.length}-letter dictionary words joined at the shared two letters.`};
 if(run.guesses.includes(guess.merged))return {run,error:'Already noted. Try a different pair.'};
 if(run.difficulty==='hard'||run.difficulty==='strict'){
  const constraint={guesses:run.guesses,hardMode:run.difficulty==='hard',strictMode:run.difficulty==='strict'};
  const error=clueConstraintError(constraint,guess.merged,run.guesses.map(previous=>score(run.answer.merged,previous)));if(error)return {run,error};
 }
 const guesses=[...run.guesses,guess.merged];
 return {run:{...run,guesses,draft:'',...(guesses.length===6&&guess.merged!==run.answer.merged?{continuation:'pending' as const}:{})}};
}
/** Restore only an eligible pair and an entirely valid replay; ignore serialized derived feedback. */
export function restoreSmashRun(raw:unknown,language:Language,length:number,expected?:SmashPair):SmashRun|undefined {
 try{
  if(!raw||typeof raw!=='object')return;
  const value=raw as Record<string,unknown>,answer=value.answer as SmashPair;
  if(!answer||typeof answer.first!=='string'||typeof answer.second!=='string'||typeof answer.merged!=='string')return;
  if(expected&&(answer.first!==expected.first||answer.second!==expected.second||answer.merged!==expected.merged))return;
  if(value.language!==language||value.length!==length||!['easy','normal','hard','strict'].includes(String(value.difficulty))||!Array.isArray(value.guesses)||typeof value.draft!=='string')return;
  let run=newSmashRun(answer,language,value.difficulty as Difficulty);
  for(const guess of value.guesses){if(typeof guess!=='string')return;if(run.continuation==='pending'&&value.continuation==='unlimited')run={...run,continuation:'unlimited'};const result=submitSmash(run,guess);if(result.error)return;run=result.run}
  if(value.continuation==='unlimited'){if(run.continuation!=='pending'&&run.guesses.length<6)return;run={...run,continuation:'unlimited'}}
  else if(value.continuation!==undefined&&value.continuation!==run.continuation)return;
  if(value.gaveUp===true){if(smashStatus(run)!=='playing')return;run={...run,gaveUp:true}}
  else if(value.gaveUp!==undefined&&value.gaveUp!==false)return;
  const draft=normalizeGuess(value.draft,language);if(draft!==value.draft||draft.length>2*length-2||draft&&!validLetters(draft,language)||smashStatus(run)!=='playing'&&draft)return;
  if(value.easiest!==undefined&&!['easy','normal','hard','strict'].includes(String(value.easiest)))return;
  if(value.assisted!==undefined&&typeof value.assisted!=='boolean')return;
  if(value.roundId!==undefined&&(typeof value.roundId!=='string'||value.roundId.length>100))return;
  if(value.easiest===undefined)delete run.easiest;if(value.assisted===undefined)delete run.assisted;
  return {...run,draft,...(typeof value.roundId==='string'?{roundId:value.roundId}:{}),...(value.easiest?{easiest:value.easiest as Difficulty}:{}),...(value.assisted===true?{assisted:true}:{})};
 }catch{return}
}

/** Candidate suggestions use only the clues already revealed, never the hidden answer. */
export function suggestSmash(run:SmashRun,limit=5,budget=30000):{pairs:SmashPair[];scanned:number;truncated:boolean} {
 const observations=run.guesses.map(guess=>({guess,clues:score(run.answer.merged,guess).join(',')}));
 const {groups,total}=candidates(run.length,run.language);const pairs:SmashPair[]=[];let scanned=0;
 for(const group of groups)for(const first of group.firsts){
  if(scanned>=budget)return {pairs,scanned,truncated:scanned<total};scanned++;
  const pair=makeSmashPair(first,group.second)!;if(run.guesses.includes(pair.merged))continue;
  if(observations.every(({guess,clues})=>score(pair.merged,guess).join(',')===clues))pairs.push(pair);
  if(pairs.length>=limit)return {pairs,scanned,truncated:scanned<total};
 }
 return {pairs,scanned,truncated:false};
}
export function changeSmashDifficulty(run:SmashRun,selected:Difficulty):{run:SmashRun;error?:string} {
 if(smashStatus(run)!=='playing')return {run,error:'This round is complete.'};
 if(selected==='hard'||selected==='strict'){
  const feedback=run.guesses.map(guess=>score(run.answer.merged,guess));
  for(let i=0;i<run.guesses.length;i++){
   const error=clueConstraintError({guesses:run.guesses.slice(0,i),hardMode:selected==='hard',strictMode:selected==='strict'},run.guesses[i],feedback.slice(0,i));
   if(error)return {run,error:`Earlier guess ${i+1} does not meet ${selected} rules. ${error} Choose a compatible difficulty to continue.`};
  }
 }
 const rank={easy:0,normal:1,hard:2,strict:3};const previous=run.easiest;const easiest=previous===undefined?(selected==='easy'?'easy':undefined):rank[selected]<rank[previous]?selected:previous;
 return {run:{...run,difficulty:selected,...(easiest?{easiest}:{}),...(selected==='easy'?{assisted:true}:{})}};
}
