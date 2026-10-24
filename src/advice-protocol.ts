import {ANSWER_DATASET} from './words.ts';
import type {Observations} from './observations.ts';
export type AdviceKind='suboptimal'|'optimal';
export interface Suggestion {word:string;worstCaseLeft:number;guaranteedEliminations:number;expectedSurvivors?:number;directSolve?:boolean}
export interface AdviceResult {totalCandidates:number;eligibleWords:number;suggestions:Suggestion[]}
export interface AdviceRequest {key:string;observations:Observations;kind:AdviceKind}
export type AdviceReply={key:string;result:AdviceResult}|{key:string;error:string};
export function adviceKey(input:Observations,kind:AdviceKind='suboptimal'):string {return `${ANSWER_DATASET}:${kind}:${JSON.stringify([input.guesses,input.feedback])}`}
