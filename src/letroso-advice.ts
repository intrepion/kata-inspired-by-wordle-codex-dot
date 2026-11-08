import {normalizeGuess,type Language,type DutchRules} from './language.ts';
import {answerDataset,supportedLengths,vocabulary} from './words.ts';
import {orderFeedback,letrosoStatus,type LetrosoRun,type OrderTile} from './letroso.ts';

/** This boundary deliberately excludes the hidden answer and its length. */
export interface LetrosoObservations {language:Language;dutchRules?:DutchRules;guesses:string[];feedback:OrderTile[][];finished:boolean}
export interface LetrosoSuggestion {word:string;worstCaseLeft:number;guaranteedEliminations:number;expectedSurvivors:number;directSolve?:boolean}
export interface LetrosoAdviceResult {totalCandidates:number;rankedCandidates:number;shortlisted:boolean;suggestions:LetrosoSuggestion[]}
export interface LetrosoAdviceRequest {key:string;observations:LetrosoObservations}
export type LetrosoAdviceReply={key:string;result:LetrosoAdviceResult}|{key:string;error:string};
export function observedLetrosoClues(run:LetrosoRun):LetrosoObservations {
 return {language:run.language,...(run.language==='nl-NL'?{dutchRules:run.dutchRules??2}:{}),guesses:[...run.guesses],feedback:run.guesses.map(guess=>orderFeedback(run.answer,guess,run.language,run.dutchRules)),finished:letrosoStatus(run)!=='playing'};
}
/** Four tile states plus the two boundary flags fit exactly in 24 bits for 11 letters. */
export function letrosoFeedbackCode(tiles:readonly OrderTile[]):number {
 let code=0;for(const tile of tiles)code=code*4+(tile.kind==='absent'?0:tile.kind==='present'?1:tile.joinPrevious?3:2);
 return code*4+Number(!!tiles[0]?.start)*2+Number(!!tiles.at(-1)?.end);
}
export function letrosoAdviceKey(input:LetrosoObservations):string {
 return JSON.stringify([supportedLengths(input.language).map(length=>answerDataset(length,input.language)),input.language,input.dutchRules??2,input.guesses,input.feedback.map(letrosoFeedbackCode)]);
}
interface Candidate {word:string;play:string}
function answerPool(input:LetrosoObservations):string[] {return supportedLengths(input.language).flatMap(length=>vocabulary(length,input.language,input.dutchRules).answers)}
/** No scan budget: every supported length is searched, and accent aliases count once. */
function filterCandidates(input:LetrosoObservations,pool:readonly string[]):Candidate[] {
 const normalize=(word:string)=>normalizeGuess(word,input.language,input.dutchRules),seen=new Set<string>(),guessed=new Set(input.guesses.map(normalize));
 const history=input.guesses.map((guess,i)=>({guess:normalize(guess),code:letrosoFeedbackCode(input.feedback[i])}));
 return pool.flatMap(word=>{
  const play=normalize(word);if(seen.has(play)||guessed.has(play))return [];seen.add(play);
  return history.every(row=>letrosoFeedbackCode(orderFeedback(play,row.guess))===row.code)?[{word,play}]:[];
 });
}
export function possibleLetrosoAnswers(input:LetrosoObservations,pool:readonly string[]=answerPool(input)):string[] {return filterCandidates(input,pool).map(candidate=>candidate.word)}
const alphabetical=(a:Candidate,b:Candidate)=>a.play<b.play?-1:a.play>b.play?1:a.word<b.word?-1:a.word>b.word?1:0;
/** Large pools use a deterministic, length-diverse guess shortlist, never sampled answers.
 * Letter-count uncertainty is only a shortlist heuristic; every displayed score below
 * is calculated with the real order/join/boundary feedback against ALL survivors. */
function shortlist(candidates:Candidate[]):Candidate[] {
 if(candidates.length<=256)return candidates;
 const frequencies=new Map<string,number>();
 const features=(play:string)=>{const counts=new Map<string,number>();return [...play].map(letter=>{const count=(counts.get(letter)??0)+1;counts.set(letter,count);return `${letter}:${count}`})};
 for(const candidate of candidates)for(const feature of features(candidate.play))frequencies.set(feature,(frequencies.get(feature)??0)+1);
 const score=(candidate:Candidate)=>features(candidate.play).reduce((sum,feature)=>{const p=frequencies.get(feature)!/candidates.length;return sum+4*p*(1-p)},0);
 const scored=candidates.map(candidate=>({candidate,score:score(candidate)})).sort((a,b)=>b.score-a.score||alphabetical(a.candidate,b.candidate));
 const groups=new Map<number,Candidate[]>();for(const {candidate} of scored){let group=groups.get(candidate.play.length);if(!group){group=[];groups.set(candidate.play.length,group)}group.push(candidate)}
 // Bound ranking cost, with at least two choices per surviving length. Even the
 // largest dictionaries stay off the UI thread and can be cancelled immediately.
 const limit=Math.max(groups.size*2,Math.min(64,Math.floor(500_000/candidates.length)));
 const selected=new Set<Candidate>();for(const group of groups.values())for(const candidate of group.slice(0,Math.max(2,Math.floor(limit/groups.size))))selected.add(candidate);
 for(const {candidate} of scored){if(selected.size>=limit)break;selected.add(candidate)}
 return [...selected];
}
/** Rank possible answers by one-step worst-case remainder, not a global solve strategy. */
export function analyzeLetrosoObservations(input:LetrosoObservations,pool:readonly string[]=answerPool(input)):LetrosoAdviceResult {
 if(input.finished)return {totalCandidates:0,rankedCandidates:0,shortlisted:false,suggestions:[]};
 const candidates=filterCandidates(input,pool),totalCandidates=candidates.length;
 if(totalCandidates===0)return {totalCandidates,rankedCandidates:0,shortlisted:false,suggestions:[]};
 if(totalCandidates===1)return {totalCandidates,rankedCandidates:1,shortlisted:false,suggestions:[{word:candidates[0].word,worstCaseLeft:1,guaranteedEliminations:0,expectedSurvivors:1,directSolve:true}]};
 const guesses=shortlist(candidates),ranked=guesses.map(guess=>{
  const buckets=new Map<number,number>();let worstCaseLeft=0,sumSquares=0;
  for(const answer of candidates){const code=letrosoFeedbackCode(orderFeedback(answer.play,guess.play)),count=(buckets.get(code)??0)+1;buckets.set(code,count);sumSquares+=2*count-1;worstCaseLeft=Math.max(worstCaseLeft,count)}
  return {word:guess.word,worstCaseLeft,guaranteedEliminations:totalCandidates-worstCaseLeft,expectedSurvivors:sumSquares/totalCandidates};
 });
 ranked.sort((a,b)=>a.worstCaseLeft-b.worstCaseLeft||a.expectedSurvivors-b.expectedSurvivors||(a.word<b.word?-1:a.word>b.word?1:0));
 return {totalCandidates,rankedCandidates:guesses.length,shortlisted:guesses.length<totalCandidates,suggestions:ranked.slice(0,5)};
}
