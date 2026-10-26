import {normalizeGuess,validLetters,type Language} from './language.ts';
export type Clue = 'absent' | 'elsewhere' | 'exact';
export function score(answer:string, guess:string):Clue[] {
 const clues:Clue[]=Array(answer.length).fill('absent');
 const remaining=new Map<string,number>();
 for(let i=0;i<answer.length;i++) {
  if(answer[i]===guess[i]) clues[i]='exact';
  else remaining.set(answer[i],(remaining.get(answer[i])??0)+1);
 }
 for(let i=0;i<answer.length;i++) if(clues[i]!=='exact' && (remaining.get(guess[i])??0)>0){
  clues[i]='elsewhere'; remaining.set(guess[i],remaining.get(guess[i])!-1);
 }
 return clues;
}

import {vocabulary} from './words.ts';
export interface Run {answer:string; guesses:string[]; draft:string; language?:Language; hardMode?:boolean;strictMode?:boolean;easyMode?:boolean;assisted?:boolean}
export type Outcome = 'playing'|'won'|'lost';
export const DAY=86_400_000;
export function dateKey(now:Date):string {return now.toISOString().slice(0,10)}
export function validDate(value:unknown):value is string {
 return typeof value==='string' && /^20\d{2}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && dateKey(new Date(value))===value;
}
export function dayIndex(date:string):number {return Math.floor((Date.parse(date)-Date.parse('2026-01-01'))/DAY)}
export function dailyAnswer(date:string,length=5,language:Language='en'):string {const ANSWERS=vocabulary(length,language).answers;const n=dayIndex(date);return ANSWERS[((n%ANSWERS.length)+ANSWERS.length)%ANSWERS.length]}
export type Difficulty='easy'|'normal'|'hard'|'strict';
export function difficulty(run:Pick<Run,'hardMode'|'strictMode'|'easyMode'>):Difficulty {return run.strictMode?'strict':run.hardMode?'hard':run.easyMode?'easy':'normal'}
export function newRun(answer:string,mode:boolean|Difficulty=false,language:Language='en'):Run {
 const selected=mode===true?'hard':mode===false?'normal':mode;
 return {answer,guesses:[],draft:'',...(language==='en'?{}:{language}),...(selected==='strict'?{strictMode:true}:selected==='hard'?{hardMode:true}:selected==='easy'?{easyMode:true,assisted:true}:{})};
}
export function status(run:Run):Outcome {return run.guesses.includes(run.answer)?'won':run.guesses.length>=6?'lost':'playing'}
export function submit(run:Run, raw:string):{run:Run;error?:string} {
 if(status(run)!=='playing') return {run,error:'This fieldnote is complete.'};
 const language=run.language??'en',guess=normalizeGuess(raw,language);
 if(!validLetters(guess,language)||guess.length!==run.answer.length) return {run,error:run.answer.length===5?'Use all five letters.':`Use all ${run.answer.length} letters.`};
 const ALLOWED=vocabulary(run.answer.length,language).allowed;
 if(!ALLOWED.has(guess)) return {run,error:'That word is outside our field guide.'};
 if(run.guesses.includes(guess)) return {run,error:'Already noted. Try a different word.'};
 if(run.strictMode||run.hardMode){const error=clueConstraintError(run,guess,run.guesses.map(previous=>score(run.answer,previous)));if(error)return {run,error};}
 return {run:{...run,guesses:[...run.guesses,guess],draft:''}};
}
export function clueConstraintError(run:Pick<Run,'guesses'|'hardMode'|'strictMode'>,guess:string,feedback:readonly (readonly Clue[])[]):string|undefined {
 return run.strictMode?strictModeError(run,guess,feedback):run.hardMode?hardModeError(run,guess,feedback):undefined;
}
/** NYT-style positive hints: no gray exclusions or forbidden yellow positions. */
function hardModeError(run:Pick<Run,'guesses'>,guess:string,feedback:readonly (readonly Clue[])[]):string|undefined {
 const previous=run.guesses.at(-1);if(!previous)return;
 const clues=feedback[run.guesses.length-1];
 for(let i=0;i<previous.length;i++)if(clues[i]==='exact'&&guess[i]!==previous[i])return `Hard mode: position ${i+1} must be ${previous[i]}.`;
 const required=new Map<string,number>();
 for(let i=0;i<previous.length;i++)if(clues[i]!=='absent')required.set(previous[i],(required.get(previous[i])??0)+1);
 for(const [letter,count] of required){
  const actual=[...guess].filter(value=>value===letter).length;
  if(actual<count)return count===1?`Hard mode: include ${letter}.`:`Hard mode: include at least ${count} ${letter}s.`;
 }
}
/** A candidate must reproduce every observed row when treated as the hypothetical answer. */
function strictModeError(run:Pick<Run,'guesses'>,guess:string,feedback:readonly (readonly Clue[])[]):string|undefined {
 for(const [row,previous] of run.guesses.entries()){
  const clues=feedback[row],hypothetical=score(guess,previous);
  if(clues.every((clue,i)=>clue===hypothetical[i]))continue;
  const note=`(fieldnote ${row+1})`;
  const counts=new Map<string,number>();
  for(let i=0;i<previous.length;i++)counts.set(previous[i],(counts.get(previous[i])??0)+(clues[i]==='absent'?0:1));
  for(let i=0;i<previous.length;i++)if(clues[i]==='exact'&&guess[i]!==previous[i])return `Strict mode: position ${i+1} must be ${previous[i]} ${note}.`;
  for(let i=0;i<previous.length;i++)if(clues[i]!=='exact'&&guess[i]===previous[i]&&(counts.get(previous[i])??0)>0)return `Strict mode: ${previous[i]} cannot be in position ${i+1} ${note}.`;
  for(const [letter,minimum] of counts){
   const actual=[...guess].filter(value=>value===letter).length;
   if(actual<minimum)return `Strict mode: include at least ${minimum} ${letter}${minimum===1?'':'s'} ${note}.`;
   const hasGray=[...previous].some((value,i)=>value===letter&&clues[i]==='absent');
   if(hasGray&&actual>minimum)return minimum===0?`Strict mode: ${letter} was ruled out ${note}.`:`Strict mode: use exactly ${minimum} ${letter}${minimum===1?'':'s'} ${note}.`;
  }
  return `Strict mode: that word conflicts with fieldnote ${row+1}.`;
 }
}
export function setDifficulty(run:Run,selected:Difficulty,outcome:Outcome=status(run)):{run:Run;error?:string} {
 const current=difficulty(run),rank={easy:0,normal:0,hard:1,strict:2};
 if(selected===current)return {run};
 if(selected==='easy'&&outcome!=='playing')return {run,error:'Easy can only be enabled for an unfinished puzzle.'};
 if(run.guesses.length&&rank[selected]>rank[current])return {run,error:`${selected==='strict'?'Strict':'Hard'} mode can only be enabled before the first accepted guess.`};
 const {hardMode,strictMode,easyMode,...rest}=run;
 return {run:{...rest,...(selected==='strict'?{strictMode:true}:selected==='hard'?{hardMode:true}:selected==='easy'?{easyMode:true,assisted:true}:{})}};
}
export function setHardMode(run:Run,enabled:boolean):{run:Run;error?:string} {return setDifficulty(run,enabled?'hard':'normal')}
export function keyboardClues(run:Run):Record<string,Clue> {
 const result:Record<string,Clue>={}; const rank={absent:0,elsewhere:1,exact:2};
 for(const guess of run.guesses) score(run.answer,guess).forEach((clue,i)=>{
  if(result[guess[i]]===undefined || rank[clue]>rank[result[guess[i]]]) result[guess[i]]=clue;
 });
 return result;
}
export function rollover(previousDate:string,run:Run,date:string):Run {return previousDate===date?run:newRun(dailyAnswer(date,run.answer.length,run.language),difficulty(run),run.language)}
export function choosePractice(previous:string, random=Math.random,mode:boolean|Difficulty=false,length=previous.length,language:Language='en'):Run {
 const ANSWERS=vocabulary(length,language).answers;const choices=ANSWERS.filter(word=>word!==previous);
 const n=Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)));
 return newRun(choices[n],mode,language);
}
export function shareText(date:string, run:Run):string {
 const glyph={exact:'■',elsewhere:'◩',absent:'□'};
 return `Morrowmark${run.language==='es-MX'?' · Español (México)':''} · ${date} UTC · ${run.answer.length} letters${difficulty(run)==='normal'?'':` · ${difficulty(run)==='strict'?'Strict':difficulty(run)==='easy'?'Easy':'Hard'}`}${run.assisted?' · Assisted':''}\n${status(run)==='won'?run.guesses.length:'X'}/6\n${run.guesses.map(g=>score(run.answer,g).map(c=>glyph[c]).join('')).join('\n')}\n■ exact · ◩ elsewhere · □ absent`;
}
