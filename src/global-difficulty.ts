import {isImpossible,impossibleStatus} from './impossible.ts';
import {difficulty,score,status,clueConstraintError,type Difficulty,type Run} from './domain.ts';
export function decodeGlobalDifficulty(raw:string|null,fallback:Difficulty='normal'):Difficulty {return raw==='easy'||raw==='normal'||raw==='hard'||raw==='strict'?raw:fallback}
/** A shared preference changes the active rules, never the guesses or answer. */
export function applyGlobalDifficulty<T extends Run>(run:T,selected:Difficulty):{run:T;error?:string} {
 if((isImpossible(run)?impossibleStatus(run):status(run))!=='playing')return {run};
 if(difficulty(run)===selected)return {run};
 const {hardMode,strictMode,easyMode,...rest}=run;
 const next={...rest,...(selected==='hard'?{hardMode:true}:selected==='strict'?{strictMode:true}:selected==='easy'?{easyMode:true,assisted:true}:{})} as T;
 if(selected==='hard'||selected==='strict'){
  const feedback=isImpossible(run)?run.feedback:run.guesses.map(guess=>score(run.answer,guess));
  for(let index=0;index<run.guesses.length;index++){
   const error=clueConstraintError({...next,guesses:run.guesses.slice(0,index)},run.guesses[index],feedback.slice(0,index));
   if(error)return {run,error:`Earlier guess ${index+1} (${run.guesses[index]}) does not meet ${selected==='hard'?'Hard':'Strict'} rules. ${error} Start this round over or choose another global difficulty.`};
  }
 }
 return {run:next};
}
