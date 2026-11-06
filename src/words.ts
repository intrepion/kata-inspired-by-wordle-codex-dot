import DUTCH from './data/dutch/vocabulary.json';
import FILIPINO from './data/filipino/vocabulary.json';
import {SPANISH_EXTENDED_VOCABULARY} from './data/spanish/extended-vocabulary.ts';
import {EXTENDED_VOCABULARY} from './data/extended-vocabulary.ts';
import {SPANISH_VOCABULARY} from './data/spanish/vocabulary.ts';
import {normalizeGuess,type DutchRules,type Language} from './language.ts';
import {ACCEPTED_GUESSES} from './data/scowl-guesses.ts';
import {CURATED_ANSWERS} from './data/scowl-answers.ts';
/** Independently sourced common-tier SCOWL words; see WORDS-LICENSE.md. */
export const PREVIOUS_ANSWER_DATASET='scowl-2020.12.07-common35-v1';
export const ANSWER_DATASET='scowl-2020.12.07-answers-v3';
export const ANSWERS=CURATED_ANSWERS;
export const ALLOWED=new Set(ACCEPTED_GUESSES);
export const ABSURD_DATASET='scowl-2020.12.07-absurd-v3';

import {LENGTH_VOCABULARY} from './data/length-vocabulary.ts';
export const WORD_LENGTHS=[3,4,5,6,7,8,9,10,11] as const;
export type WordLength=typeof WORD_LENGTHS[number];
export function isWordLength(value:unknown):value is WordLength {return WORD_LENGTHS.some(length=>length===value)}
const vocabularies=new Map<number,{answers:string[];allowed:Set<string>}>([[5,{answers:ANSWERS,allowed:ALLOWED}]]);
for(const length of [4,6,7] as const){const data=LENGTH_VOCABULARY[length];vocabularies.set(length,{answers:data.answers,allowed:new Set(data.guesses)})}
for(const [length,data] of Object.entries(EXTENDED_VOCABULARY))vocabularies.set(Number(length),{answers:data.answers,allowed:new Set(data.guesses)});
/** A fixed length chooses both pools together; accepted guesses never become answer candidates. */
const spanishVocabularies=new Map<number,{answers:string[];allowed:Set<string>}>();
for(const length of [4,5,6,7] as const){const data=SPANISH_VOCABULARY[length];spanishVocabularies.set(length,{answers:data.answers,allowed:new Set(data.guesses)})}
for(const [length,data] of Object.entries(SPANISH_EXTENDED_VOCABULARY))spanishVocabularies.set(Number(length),{answers:data.answers,allowed:new Set(data.guesses)});
const dutchVocabularies = new Map<number,{answers:string[];allowed:Set<string>}>();
for (const [length,data] of Object.entries(DUTCH)) dutchVocabularies.set(Number(length),{answers:data.answers,allowed:new Set(data.guesses)});
const filipinoVocabulary = {answers: FILIPINO.answers, allowed: new Set(FILIPINO.guesses)};
export function supportedLengths(language: Language): readonly WordLength[] {
 return language === 'fil-PH' ? [5] : language === 'nl-NL' ? WORD_LENGTHS.filter(length => dutchVocabularies.has(length)) : WORD_LENGTHS;
}
export function isSupportedLength(length: number, language: Language): boolean {
 return supportedLengths(language).some(value => value === length);
}
const foldedDutch = new Map<number,{answers:string[];allowed:Set<string>}>();
/** Preserve source iteration and answer ordering while accepting gameplay aliases. */
class DutchGuessSet extends Set<string> {
 private readonly aliases: Set<string>;
 constructor(words: Iterable<string>) {super(words);this.aliases=new Set([...this].map(word=>normalizeGuess(word,'nl-NL')))}
 override has(word:string):boolean {return this.aliases.has(normalizeGuess(word,'nl-NL'))}
}
export function vocabulary(length: number = 5, language: Language = 'en', dutchRules: DutchRules = 2): {answers: string[]; allowed: Set<string>} {
 if (!isSupportedLength(length, language)) throw new Error('This language and word length are not available.');
 const words = language === 'fil-PH' ? filipinoVocabulary : (language === 'es-MX' ? spanishVocabularies : language === 'nl-NL' ? dutchVocabularies : vocabularies).get(length);
 if (!words) throw new Error('This language and word length are not available.');
 if(language==='nl-NL'&&dutchRules===2){let folded=foldedDutch.get(length);if(!folded){folded={answers:words.answers,allowed:new DutchGuessSet(words.allowed)};foldedDutch.set(length,folded)}return folded}
 return words;
}
export function answerDataset(length: number = 5, language: Language = 'en'): string {
 if (language === 'nl-NL') return `nl-NL-wiktionary-wordfreq-${length}-v1`;
 if (language === 'fil-PH') return 'fil-PH-wiktionary-wordfreq-5-beta-v1';
 if (language === 'es-MX') return length >= 4 && length <= 7 ? `es-MX-wiktionary-wordfreq-${length}-v1` : `es-MX-wiktionary-wordfreq-extended-${length}-v1`;
 return length === 5 ? ANSWER_DATASET : `scowl-2020.12.07-${length}-answers-v${length===3?1:2}`;
}
export function absurdDataset(length: number = 5, language: Language = 'en'): string {
 if (language === 'nl-NL') return `nl-NL-wiktionary-wordfreq-absurd-${length}-v1`;
 if (language === 'fil-PH') return 'fil-PH-wiktionary-wordfreq-absurd-5-beta-v1';
 if (language === 'es-MX') return length >= 4 && length <= 7 ? `es-MX-wiktionary-wordfreq-absurd-${length}-v1` : `es-MX-wiktionary-wordfreq-extended-absurd-${length}-v1`;
 return length === 5 ? ABSURD_DATASET : `scowl-2020.12.07-${length}-absurd-v${length===3?1:2}`;
}
