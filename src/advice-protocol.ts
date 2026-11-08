import {answerDataset} from './words.ts';
import type {Observations} from './observations.ts';
export type AdviceKind='suboptimal'|'optimal';
export interface Suggestion {word:string;worstCaseLeft:number;guaranteedEliminations:number;expectedSurvivors?:number;directSolve?:boolean}
export interface AdviceResult {totalCandidates:number;eligibleWords:number;/** Present only for shortlisted rankings; scores still use every survivor. */evaluatedWords?:number;suggestions:Suggestion[]}
export interface AdviceRequest {key:string;observations:Observations;kind:AdviceKind}
export type AdviceReply={key:string;result:AdviceResult}|{key:string;error:string};
export function adviceKey(input:Observations,kind:AdviceKind='suboptimal'):string {return `${answerDataset(input.wordLength??5,input.language)}${input.language==='nl-NL'?`:rules${input.dutchRules??2}`:''}:${kind}:${JSON.stringify([input.guesses,input.feedback,input.letterHint])}`}
