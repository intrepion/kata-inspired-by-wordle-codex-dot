import {publicLetterHint,matchesLetterHint,type PublicLetterHint} from './letter-hints.ts';
import type {Language,DutchRules} from './language.ts';
import {vocabulary,answerDataset} from './words.ts';
import {score,status,type Run,type Clue} from './domain.ts';
import {isImpossible,impossibleStatus} from './impossible.ts';
export interface Observations {letterHint?:PublicLetterHint;dutchRules?:DutchRules;guesses:string[];feedback:Clue[][];finished?:boolean;wordLength?:number;language?:Language}
/** Only public feedback crosses the advice boundary: never the selected answer or date. */
export function observedClues(run:Run):Observations {
 return {...(publicLetterHint(run)?{letterHint:publicLetterHint(run)}:{}),...(run.language==='nl-NL'?{dutchRules:run.dutchRules??2}:{}),...(run.language?{language:run.language}:{}),...(run.answer.length===5?{}:{wordLength:run.answer.length}),guesses:[...run.guesses],feedback:run.guesses.map((guess,row)=>isImpossible(run)?[...run.feedback[row]]:score(run.answer,guess,run.language,run.dutchRules)),finished:isImpossible(run)?impossibleStatus(run)!=='playing':status(run)!=='playing'};
}
export function possibleAnswers(input:Observations):string[] {
 return vocabulary(input.wordLength??5,input.language,input.dutchRules).answers.filter(answer=>matchesLetterHint(answer,input.letterHint,input.language,input.dutchRules)&&input.guesses.every((guess,row)=>score(answer,guess,input.language,input.dutchRules).every((clue,i)=>clue===input.feedback[row][i])));
}
/** Count only the selected possible-answer list, using public rows, without ranking guesses. */
const remainingCounts=new Map<string,number>();
export function remainingAnswerCount(input:Observations):number {
 const key=JSON.stringify([answerDataset(input.wordLength??5,input.language),input.language??'en',input.dutchRules??2,input.wordLength??5,input.guesses,input.feedback,input.letterHint]),cached=remainingCounts.get(key);
 if(cached!==undefined)return cached;
 const count=possibleAnswers(input).length;
 if(remainingCounts.size>=24)remainingCounts.delete(remainingCounts.keys().next().value!);
 remainingCounts.set(key,count);return count;
}
