import {score,status,type Run} from './domain.ts';
import {normalizeGuess,type Language,type DutchRules} from './language.ts';
import {smashStatus,type SmashRun} from './smashare.ts';
/** Positions are zero based; afterGuess is the number of rows visible at reveal time. */
export interface LetterHint {position:number;afterGuess:number}
export interface PublicLetterHint {position:number;letter:string}
type HintRun={letterHint?:LetterHint;letterHintInvalid?:true;letterHintUsed?:true;language?:Language;dutchRules?:DutchRules;answer:string|{merged:string};guesses:string[]};
const answerOf=(run:HintRun)=>typeof run.answer==='string'?run.answer:run.answer.merged;
export function publicLetterHint(run:HintRun):PublicLetterHint|undefined {
 return run.letterHint?{position:run.letterHint.position,letter:normalizeGuess(answerOf(run),run.language,run.dutchRules)[run.letterHint.position]}:undefined;
}
function nextPosition(run:HintRun):number {
 const answer=answerOf(run),feedback=run.guesses.map(guess=>score(answer,guess,run.language,run.dutchRules));
 return [...answer].findIndex((_,position)=>!feedback.some(row=>row[position]==='exact'));
}
export function canRevealLetterHint(run:Run):boolean {return !('variant' in run)&&status(run)==='playing'&&run.continuation!=='pending'&&!run.letterHint&&!run.letterHintInvalid&&!run.letterHintUsed&&nextPosition(run)>=0}
export function revealLetterHint<T extends Run>(run:T):T {return canRevealLetterHint(run)?{...run,assisted:true,letterHint:{position:nextPosition(run),afterGuess:run.guesses.length}}:run}
export function canRevealSmashLetterHint(run:SmashRun):boolean {return run.started!==false&&smashStatus(run)==='playing'&&run.continuation!=='pending'&&!run.letterHint&&!run.letterHintInvalid&&!run.letterHintUsed&&nextPosition(run)>=0}
export function revealSmashLetterHint(run:SmashRun):SmashRun {return canRevealSmashLetterHint(run)?{...run,assisted:true,letterHint:{position:nextPosition(run),afterGuess:run.guesses.length}}:run}
/** A malformed hint is quarantined, not forgotten: the round remains assisted and cannot reveal again. */
export function restoreLetterHint(value:Record<string,unknown>,length:number,guessCount:number):{letterHint?:LetterHint;letterHintInvalid?:true;letterHintUsed?:true;assisted?:true} {
 if(value.letterHint===undefined&&value.letterHintInvalid!==true)return value.letterHintUsed===true?{letterHintUsed:true,assisted:true}:{};
 const hint=value.letterHint;
 if(!value.letterHintInvalid&&hint&&typeof hint==='object'&&!Array.isArray(hint)){
  const {position,afterGuess}=hint as Record<string,unknown>;
  if(Number.isInteger(position)&&Number(position)>=0&&Number(position)<length&&Number.isInteger(afterGuess)&&Number(afterGuess)>=0&&Number(afterGuess)<=guessCount)return {letterHint:{position:Number(position),afterGuess:Number(afterGuess)},assisted:true};
 }
 return {letterHintInvalid:true,assisted:true};
}
export function matchesLetterHint(word:string,hint:PublicLetterHint|undefined,language?:Language,dutchRules?:DutchRules):boolean {return !hint||normalizeGuess(word,language,dutchRules)[hint.position]===hint.letter}
export function letterHintConstraintError(run:HintRun,guess:string):string|undefined {
 const hint=publicLetterHint(run);
 if(hint&&run.guesses.length>=run.letterHint!.afterGuess&&!matchesLetterHint(guess,hint,run.language,run.dutchRules))return `Letter hint: position ${hint.position+1} must be ${hint.letter}.`;
}

export function letterHintShareLabel(run:Pick<HintRun,'letterHint'|'letterHintInvalid'|'letterHintUsed'>):string {return run.letterHint||run.letterHintUsed?' · 1 letter hint':run.letterHintInvalid?' · Hint history unrecorded':''}
