import {vocabulary} from './words.ts';
import {score,status,type Run,type Clue} from './domain.ts';
import {isImpossible,impossibleStatus} from './impossible.ts';
export interface Observations {guesses:string[];feedback:Clue[][];finished?:boolean;wordLength?:number}
/** Only public feedback crosses the advice boundary: never the selected answer or date. */
export function observedClues(run:Run):Observations {
 return {...(run.answer.length===5?{}:{wordLength:run.answer.length}),guesses:[...run.guesses],feedback:run.guesses.map((guess,row)=>isImpossible(run)?[...run.feedback[row]]:score(run.answer,guess)),finished:isImpossible(run)?impossibleStatus(run)!=='playing':status(run)!=='playing'};
}
export function possibleAnswers(input:Observations):string[] {
 return vocabulary(input.wordLength??5).answers.filter(answer=>input.guesses.every((guess,row)=>score(answer,guess).every((clue,i)=>clue===input.feedback[row][i])));
}
