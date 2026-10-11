export type Clue = 'absent' | 'elsewhere' | 'exact';
export function score(answer:string, guess:string):Clue[] {
 const clues:Clue[]=Array(5).fill('absent');
 const remaining=new Map<string,number>();
 for(let i=0;i<5;i++) {
  if(answer[i]===guess[i]) clues[i]='exact';
  else remaining.set(answer[i],(remaining.get(answer[i])??0)+1);
 }
 for(let i=0;i<5;i++) if(clues[i]!=='exact' && (remaining.get(guess[i])??0)>0){
  clues[i]='elsewhere'; remaining.set(guess[i],remaining.get(guess[i])!-1);
 }
 return clues;
}

import {ANSWERS, ALLOWED} from './words.ts';
export interface Run {answer:string; guesses:string[]; draft:string}
export type Outcome = 'playing'|'won'|'lost';
export const DAY=86_400_000;
export function dateKey(now:Date):string {return now.toISOString().slice(0,10)}
export function validDate(value:unknown):value is string {
 return typeof value==='string' && /^20\d{2}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && dateKey(new Date(value))===value;
}
export function dayIndex(date:string):number {return Math.floor((Date.parse(date)-Date.parse('2026-01-01'))/DAY)}
export function dailyAnswer(date:string):string {const n=dayIndex(date);return ANSWERS[((n%ANSWERS.length)+ANSWERS.length)%ANSWERS.length]}
export function newRun(answer:string):Run {return {answer,guesses:[],draft:''}}
export function status(run:Run):Outcome {return run.guesses.includes(run.answer)?'won':run.guesses.length>=6?'lost':'playing'}
export function submit(run:Run, raw:string):{run:Run;error?:string} {
 if(status(run)!=='playing') return {run,error:'This fieldnote is complete.'};
 const guess=raw.toUpperCase();
 if(!/^[A-Z]{5}$/.test(guess)) return {run,error:'Use all five letters.'};
 if(!ALLOWED.has(guess)) return {run,error:'That word is outside our field guide.'};
 if(run.guesses.includes(guess)) return {run,error:'Already noted. Try a different word.'};
 return {run:{...run,guesses:[...run.guesses,guess],draft:''}};
}
export function keyboardClues(run:Run):Record<string,Clue> {
 const result:Record<string,Clue>={}; const rank={absent:0,elsewhere:1,exact:2};
 for(const guess of run.guesses) score(run.answer,guess).forEach((clue,i)=>{
  if(result[guess[i]]===undefined || rank[clue]>rank[result[guess[i]]]) result[guess[i]]=clue;
 });
 return result;
}
export function rollover(previousDate:string,run:Run,date:string):Run {return previousDate===date?run:newRun(dailyAnswer(date))}
export function choosePractice(previous:string, random=Math.random):Run {
 const choices=ANSWERS.filter(word=>word!==previous);
 const n=Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)));
 return newRun(choices[n]);
}
export function shareText(date:string, run:Run):string {
 const glyph={exact:'■',elsewhere:'◩',absent:'□'};
 return `Morrowmark · ${date} UTC\n${status(run)==='won'?run.guesses.length:'X'}/6\n${run.guesses.map(g=>score(run.answer,g).map(c=>glyph[c]).join('')).join('\n')}\n■ exact · ◩ elsewhere · □ absent`;
}
