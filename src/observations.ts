import type {Language} from './language.ts';
import {vocabulary,answerDataset} from './words.ts';
import {score,status,type Run,type Clue} from './domain.ts';
import {isImpossible,impossibleStatus} from './impossible.ts';
export interface Observations {guesses:string[];feedback:Clue[][];finished?:boolean;wordLength?:number;language?:Language}
/** Only public feedback crosses the advice boundary: never the selected answer or date. */
export function observedClues(run:Run):Observations {
 return {...(run.language?{language:run.language}:{}),...(run.answer.length===5?{}:{wordLength:run.answer.length}),guesses:[...run.guesses],feedback:run.guesses.map((guess,row)=>isImpossible(run)?[...run.feedback[row]]:score(run.answer,guess)),finished:isImpossible(run)?impossibleStatus(run)!=='playing':status(run)!=='playing'};
}
export function possibleAnswers(input:Observations):string[] {
 return vocabulary(input.wordLength??5,input.language).answers.filter(answer=>input.guesses.every((guess,row)=>score(answer,guess).every((clue,i)=>clue===input.feedback[row][i])));
}
/** Count only the selected possible-answer list, using public rows, without ranking guesses. */
const remainingCounts=new Map<string,number>();
export function remainingAnswerCount(input:Observations):number {
 const key=JSON.stringify([answerDataset(input.wordLength??5,input.language),input.language??'en',input.wordLength??5,input.guesses,input.feedback]),cached=remainingCounts.get(key);
 if(cached!==undefined)return cached;
 const count=possibleAnswers(input).length;
 if(remainingCounts.size>=24)remainingCounts.delete(remainingCounts.keys().next().value!);
 remainingCounts.set(key,count);return count;
}
