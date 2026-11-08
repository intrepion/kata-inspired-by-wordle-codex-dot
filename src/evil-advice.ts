import {normalizeGuess,type Language,type DutchRules} from './language.ts';
import {vocabulary} from './words.ts';
import {possibleAnswers,type Observations} from './observations.ts';
import {impossibleStatus,type ImpossibleRun} from './impossible.ts';

import type {AdviceResult,Suggestion,AdviceKind} from './advice-protocol.ts';
export {adviceKey} from './advice-protocol.ts';
export type {AdviceRequest,AdviceReply,AdviceResult,Suggestion} from './advice-protocol.ts';
// Every supported 3–11-letter pool needs a complete ternary clue code.
const weights=Array.from({length:11},(_,index)=>3**(10-index));
const place=(length:number,index:number)=>weights[weights.length-length+index];
const encode=(word:string)=>[...word].map(letter=>letter.codePointAt(0)!);
const dictionaries=new Map<string,{word:string;letters:number[]}[]>();
function dictionaryFor(length:number,language:Language,dutchRules:DutchRules){const key=`${language}:${length}:${dutchRules}`;let result=dictionaries.get(key);if(!result){const seen=new Set<string>();result=[...vocabulary(length,language,dutchRules).allowed].sort().flatMap(word=>{const gameplay=normalizeGuess(word,language,dutchRules);if(seen.has(gameplay))return [];seen.add(gameplay);return [{word,letters:encode(gameplay)}]});dictionaries.set(key,result)}return result}
/** Allocation-free encoding of the same exact-first, left-to-right duplicate scoring. */
export function feedbackCode(answer:readonly number[],guess:readonly number[]):number {
 let used=0,exact=0,code=0;
 for(let i=0;i<answer.length;i++)if(answer[i]===guess[i]){used|=1<<i;exact|=1<<i;code+=2*place(answer.length,i);}
 for(let i=0;i<answer.length;i++)if(!(exact&(1<<i)))for(let j=0;j<answer.length;j++)if(!(used&(1<<j))&&answer[j]===guess[i]){used|=1<<j;code+=place(answer.length,i);break;}
 return code;
}
/** Descending largest bucket, then alphabetical word: least guaranteed elimination first. */
function rankGuesses(run:Pick<ImpossibleRun,'guesses'|'feedback'|'candidates'|'language'|'dutchRules'>,kind:AdviceKind,limit=5):AdviceResult {
 const language=run.language??'en',dutchRules=run.dutchRules??2,gameplay=(word:string)=>normalizeGuess(word,language,dutchRules);
 const guessed=new Set(run.guesses.map(gameplay));
 const totalCandidates=run.candidates.length,length=run.candidates[0]?.length??run.guesses[0]?.length??5;
 if(totalCandidates===0||(kind==='suboptimal'&&totalCandidates===1))return {totalCandidates,eligibleWords:0,suggestions:[]};
 if(kind==='optimal'&&totalCandidates===1){const word=run.candidates[0];return {totalCandidates,eligibleWords:guessed.has(gameplay(word))?0:1,suggestions:guessed.has(gameplay(word))?[]:[{word,worstCaseLeft:1,guaranteedEliminations:0,expectedSurvivors:1,directSolve:true}]};}
 const candidateWords=new Set(run.candidates.map(gameplay));
 const candidates=run.candidates.map(word=>encode(gameplay(word)));
 const histories=run.guesses.map((word,row)=>({letters:encode(gameplay(word)),code:run.feedback[row].reduce((sum,clue,i)=>sum+place(length,i)*({absent:0,elsewhere:1,exact:2}[clue]),0)}));
 const eligible=dictionaryFor(length,language,dutchRules).filter(({word,letters})=>!guessed.has(gameplay(word))&&!(kind==='suboptimal'&&histories.some(previous=>feedbackCode(letters,previous.letters)!==previous.code)));
 // Bound quadratic letter comparisons, not the answer pool. Affordable analyses
 // retain the complete ranking; long/large dictionaries use a reproducible shortlist.
 const comparisonBudget=Math.floor(25_000_000*25/(length*length));
 const shortlistSize=Math.max(5,Math.min(256,Math.floor(comparisonBudget/totalCandidates)));
 let evaluated=eligible;
 if(eligible.length*totalCandidates>comparisonBudget){
  const selected=new Set<(typeof eligible)[number]>();
  const sample=(words:typeof eligible,count:number)=>{for(let i=0;i<Math.min(count,words.length);i++)selected.add(words[Math.floor(i*words.length/Math.min(count,words.length))]);};
  // Include possible direct answers as well as exploratory dictionary guesses.
  sample(eligible.filter(({word})=>candidateWords.has(gameplay(word))),Math.floor(shortlistSize/2));
  sample(eligible,shortlistSize-selected.size);
  for(const entry of eligible){if(selected.size>=shortlistSize)break;selected.add(entry);}
  evaluated=[...selected];
 }
 const buckets=new Uint32Array(3**length),touched:number[]=[],ranked:Suggestion[]=[];
 for(const {word,letters} of evaluated){
  for(const code of touched)buckets[code]=0;touched.length=0;
  let largest=0,sumSquares=0;
  for(const answer of candidates){const code=feedbackCode(answer,letters),count=++buckets[code];if(count===1)touched.push(code);sumSquares+=2*count-1;if(count>largest)largest=count;}
  ranked.push({word,worstCaseLeft:largest,guaranteedEliminations:totalCandidates-largest,...(kind==='optimal'?{expectedSurvivors:sumSquares/totalCandidates}:{})});
 }
 ranked.sort((a,b)=>(kind==='suboptimal'?b.worstCaseLeft-a.worstCaseLeft:a.worstCaseLeft-b.worstCaseLeft||(a.expectedSurvivors!-b.expectedSurvivors!)||Number(candidateWords.has(gameplay(b.word)))-Number(candidateWords.has(gameplay(a.word))))||(a.word<b.word?-1:a.word>b.word?1:0));
 return {totalCandidates,eligibleWords:eligible.length,...(evaluated.length<eligible.length?{evaluatedWords:evaluated.length}:{}),suggestions:ranked.slice(0,Math.max(0,Math.min(5,limit)))};
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
