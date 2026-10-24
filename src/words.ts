import {ACCEPTED_GUESSES} from './data/scowl-guesses.ts';
import {CURATED_ANSWERS} from './data/scowl-answers.ts';
/** Independently sourced common-tier SCOWL words; see WORDS-LICENSE.md. */
export const PREVIOUS_ANSWER_DATASET='scowl-2020.12.07-common35-v1';
export const ANSWER_DATASET='scowl-2020.12.07-answers-v2';
export const ANSWERS=CURATED_ANSWERS;
export const ALLOWED=new Set(ACCEPTED_GUESSES);
export const ABSURD_DATASET='scowl-2020.12.07-absurd-v2';

import {LENGTH_VOCABULARY} from './data/length-vocabulary.ts';
export const WORD_LENGTHS=[4,5,6,7] as const;
export type WordLength=typeof WORD_LENGTHS[number];
export function isWordLength(value:unknown):value is WordLength {return WORD_LENGTHS.some(length=>length===value)}
const vocabularies=new Map<number,{answers:string[];allowed:Set<string>}>([[5,{answers:ANSWERS,allowed:ALLOWED}]]);
for(const length of [4,6,7] as const){const data=LENGTH_VOCABULARY[length];vocabularies.set(length,{answers:data.answers,allowed:new Set(data.guesses)})}
/** A fixed length chooses both pools together; accepted guesses never become answer candidates. */
export function vocabulary(length:number=5):{answers:string[];allowed:Set<string>}{const words=vocabularies.get(length);if(!words)throw new Error('Choose 4, 5, 6 or 7 letters.');return words}
export function answerDataset(length:number=5):string {return length===5?ANSWER_DATASET:`scowl-2020.12.07-${length}-answers-v1`}
export function absurdDataset(length:number=5):string {return length===5?ABSURD_DATASET:`scowl-2020.12.07-${length}-absurd-v1`}
