import {ANSWERS} from './words.ts';
import {score,status,type Run,type Clue} from './domain.ts';
import {isImpossible,impossibleStatus} from './impossible.ts';
export interface Observations {guesses:string[];feedback:Clue[][];finished?:boolean}
/** Only public feedback crosses the advice boundary: never the selected answer or date. */
export function observedClues(run:Run):Observations {
 return {guesses:[...run.guesses],feedback:run.guesses.map((guess,row)=>isImpossible(run)?[...run.feedback[row]]:score(run.answer,guess)),finished:isImpossible(run)?impossibleStatus(run)!=='playing':status(run)!=='playing'};
}
export function possibleAnswers(input:Observations):string[] {
 return ANSWERS.filter(answer=>input.guesses.every((guess,row)=>score(answer,guess).every((clue,i)=>clue===input.feedback[row][i])));
}
