import {answerDataset} from './words.ts';
import type {SmashObservations,SmashAdviceResult} from './smashare.ts';
export {analyzeSmashObservations,observedSmashClues,type SmashObservations,type SmashAdviceResult} from './smashare.ts';
export interface SmashAdviceRequest {key:string;observations:SmashObservations}
export type SmashAdviceReply={key:string;result:SmashAdviceResult}|{key:string;error:string};
export function smashAdviceKey(input:SmashObservations):string {
 return JSON.stringify([answerDataset(input.length,input.language),input.language,input.dutchRules??2,input.length,input.guesses,input.feedback]);
}
