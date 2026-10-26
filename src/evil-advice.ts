import type {Language} from './language.ts';
import {vocabulary} from './words.ts';
import {possibleAnswers,type Observations} from './observations.ts';
import {impossibleStatus,type ImpossibleRun} from './impossible.ts';

import type {AdviceResult,Suggestion,AdviceKind} from './advice-protocol.ts';
export {adviceKey} from './advice-protocol.ts';
export type {AdviceRequest,AdviceReply,AdviceResult,Suggestion} from './advice-protocol.ts';
const weights=[729,243,81,27,9,3,1];
const place=(length:number,index:number)=>weights[7-length+index];
const encode=(word:string)=>[...word].map(letter=>letter.charCodeAt(0)-65);
const dictionaries=new Map<string,{word:string;letters:number[]}[]>();
function dictionaryFor(length:number,language:Language){const key=`${language}:${length}`;let result=dictionaries.get(key);if(!result){result=[...vocabulary(length,language).allowed].sort().map(word=>({word,letters:encode(word)}));dictionaries.set(key,result)}return result}
/** Allocation-free encoding of the same exact-first, left-to-right duplicate scoring. */
export function feedbackCode(answer:readonly number[],guess:readonly number[]):number {
 let used=0,exact=0,code=0;
 for(let i=0;i<answer.length;i++)if(answer[i]===guess[i]){used|=1<<i;exact|=1<<i;code+=2*place(answer.length,i);}
 for(let i=0;i<answer.length;i++)if(!(exact&(1<<i)))for(let j=0;j<answer.length;j++)if(!(used&(1<<j))&&answer[j]===guess[i]){used|=1<<j;code+=place(answer.length,i);break;}
 return code;
}
/** Descending largest bucket, then alphabetical word: least guaranteed elimination first. */
function rankGuesses(run:Pick<ImpossibleRun,'guesses'|'feedback'|'candidates'|'language'>,kind:AdviceKind,limit=5):AdviceResult {
 const totalCandidates=run.candidates.length,length=run.candidates[0]?.length??run.guesses[0]?.length??5;
 if(totalCandidates===0||(kind==='suboptimal'&&totalCandidates===1))return {totalCandidates,eligibleWords:0,suggestions:[]};
 if(kind==='optimal'&&totalCandidates===1){const word=run.candidates[0];return {totalCandidates,eligibleWords:run.guesses.includes(word)?0:1,suggestions:run.guesses.includes(word)?[]:[{word,worstCaseLeft:1,guaranteedEliminations:0,expectedSurvivors:1,directSolve:true}]};}
 const candidateWords=new Set(run.candidates);
 const candidates=run.candidates.map(encode),guessed=new Set(run.guesses);
 const histories=run.guesses.map((word,row)=>({letters:encode(word),code:run.feedback[row].reduce((sum,clue,i)=>sum+place(length,i)*({absent:0,elsewhere:1,exact:2}[clue]),0)}));
 const buckets=new Uint16Array(3**length),ranked:Suggestion[]=[];let eligibleWords=0;
 for(const {word,letters} of dictionaryFor(length,run.language??'en')){
  if(guessed.has(word)||(kind==='suboptimal'&&histories.some(previous=>feedbackCode(letters,previous.letters)!==previous.code)))continue;
  eligibleWords++;buckets.fill(0);let largest=0,sumSquares=0;
  for(const answer of candidates){const count=++buckets[feedbackCode(answer,letters)];sumSquares+=2*count-1;if(count>largest)largest=count;}
  ranked.push({word,worstCaseLeft:largest,guaranteedEliminations:totalCandidates-largest,...(kind==='optimal'?{expectedSurvivors:sumSquares/totalCandidates}:{})});
 }
 ranked.sort((a,b)=>(kind==='suboptimal'?b.worstCaseLeft-a.worstCaseLeft:a.worstCaseLeft-b.worstCaseLeft||(a.expectedSurvivors!-b.expectedSurvivors!)||Number(candidateWords.has(b.word))-Number(candidateWords.has(a.word)))||(a.word<b.word?-1:a.word>b.word?1:0));
 return {totalCandidates,eligibleWords,suggestions:ranked.slice(0,Math.max(0,Math.min(5,limit)))};
}

/** Compatibility seam for Evil fixtures; the application uses observed-clue analysis below. */
export function notRecommended(run:ImpossibleRun,limit=5):AdviceResult {
 return impossibleStatus(run)!=='playing'?{totalCandidates:run.candidates.length,eligibleWords:0,suggestions:[]}:rankGuesses(run,'suboptimal',limit);
}
export function analyzeObservations(input:Observations,kind:AdviceKind):AdviceResult {
 const candidates=possibleAnswers(input);
 if(input.finished)return {totalCandidates:candidates.length,eligibleWords:0,suggestions:[]};
 return rankGuesses({...input,candidates},kind);
}
