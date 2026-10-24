import {ACCEPTED_GUESSES} from './data/scowl-guesses.ts';
import {CURATED_ANSWERS} from './data/scowl-answers.ts';
/** Independently sourced common-tier SCOWL words; see WORDS-LICENSE.md. */
export const ANSWER_DATASET='scowl-2020.12.07-common35-v1';
export const ANSWERS=CURATED_ANSWERS;
export const ALLOWED=new Set(ACCEPTED_GUESSES);
export const ABSURD_DATASET='scowl-2020.12.07-absurd35-v1';
