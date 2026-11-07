import ITALIAN from './data/italian/vocabulary.json';
import SWEDISH from './data/swedish/vocabulary.json';
import RUSSIAN from './data/russian/vocabulary.json';
import PORTUGUESE_BR from './data/portuguese/vocabulary-br.json';
import PORTUGUESE_PT from './data/portuguese/vocabulary-pt.json';
import GERMAN from './data/german/vocabulary.json';
import FRENCH_FR from './data/french/vocabulary-fr-FR.json';
import FRENCH_CA from './data/french/vocabulary-fr-CA.json';
import SPAIN from './data/spanish-spain/vocabulary.json';
import ENGLISH_VARIETIES from './data/english-varieties.json';
import DUTCH from './data/dutch/vocabulary.json';
import FILIPINO from './data/filipino/vocabulary.json';
import {SPANISH_EXTENDED_VOCABULARY} from './data/spanish/extended-vocabulary.ts';
import {EXTENDED_VOCABULARY} from './data/extended-vocabulary.ts';
import {SPANISH_VOCABULARY} from './data/spanish/vocabulary.ts';
import {normalizeGuess,isFrench,isPortuguese,usesAccentEquivalence,type DutchRules,type Language} from './language.ts';
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
const addedVocabularies=new Map<string,Map<number,{answers:string[];allowed:Set<string>}>>();
for(const [locale,source]of [['it-IT',ITALIAN],['sv-SE',SWEDISH]] as const)addedVocabularies.set(locale,new Map(Object.entries(source).map(([length,data])=>[Number(length),{answers:data.answers,allowed:new Set(data.guesses)}])));
const russianVocabularies = new Map<number,{answers:string[];allowed:Set<string>}>();
for (const [length,data] of Object.entries(RUSSIAN)) russianVocabularies.set(Number(length),{answers:data.answers,allowed:new Set(data.guesses)});
const germanVocabularies = new Map<number,{answers:string[];allowed:Set<string>}>();
for (const [length,data] of Object.entries(GERMAN)) germanVocabularies.set(Number(length),{answers:data.answers,allowed:new Set(data.guesses)});
const dutchVocabularies = new Map<number,{answers:string[];allowed:Set<string>}>();
for (const [length,data] of Object.entries(DUTCH)) dutchVocabularies.set(Number(length),{answers:data.answers,allowed:new Set(data.guesses)});
const englishVarieties=new Map<string,Map<number,{answers:string[];allowed:Set<string>}>>();
for(const [locale,lengths]of Object.entries(ENGLISH_VARIETIES))englishVarieties.set(locale,new Map(Object.entries(lengths).map(([length,data])=>[Number(length),{answers:data.answers,allowed:new Set(data.guesses)}])));
const spainVocabularies=new Map<number,{answers:string[];allowed:Set<string>}>();
for(const [length,data]of Object.entries(SPAIN))spainVocabularies.set(Number(length),{answers:data.answers,allowed:new Set(data.guesses)});
const frenchVocabularies=new Map<string,Map<number,{answers:string[];allowed:Set<string>}>>();
for(const [locale,source]of [['fr-FR',FRENCH_FR],['fr-CA',FRENCH_CA]] as const)frenchVocabularies.set(locale,new Map(Object.entries(source).map(([length,data])=>[Number(length),{answers:data.answers,allowed:new Set(data.guesses)}])));
const portugueseVocabularies=new Map<string,Map<number,{answers:string[];allowed:Set<string>}>>();
for(const [locale,source]of [['pt-BR',PORTUGUESE_BR],['pt-PT',PORTUGUESE_PT]] as const)portugueseVocabularies.set(locale,new Map(Object.entries(source).map(([length,data])=>[Number(length),{answers:data.answers,allowed:new Set(data.guesses)}])));
const filipinoVocabulary = {answers: FILIPINO.answers, allowed: new Set(FILIPINO.guesses)};
export function supportedLengths(language: Language): readonly WordLength[] {
 return language === 'ru-RU' ? WORD_LENGTHS.filter(length => russianVocabularies.has(length)) : language === 'de-DE' ? WORD_LENGTHS.filter(length => germanVocabularies.has(length)) : language === 'fil-PH' ? [5] : language === 'nl-NL' ? WORD_LENGTHS.filter(length => dutchVocabularies.has(length)) : WORD_LENGTHS;
}
export function isSupportedLength(length: number, language: Language): boolean {
 return supportedLengths(language).some(value => value === length);
}
const foldedVocabularies = new Map<string,{answers:string[];allowed:Set<string>}>();
/** Preserve source iteration and answer ordering while accepting gameplay aliases. */
class EquivalentGuessSet extends Set<string> {
 private readonly aliases: Set<string>;
 constructor(words: Iterable<string>,private language:Language) {super(words);this.aliases=new Set([...this].map(word=>normalizeGuess(word,language)))}
 override has(word:string):boolean {return this.aliases.has(normalizeGuess(word,this.language))}
}
export function vocabulary(length: number = 5, language: Language = 'en', dutchRules: DutchRules = 2): {answers: string[]; allowed: Set<string>} {
 if (!isSupportedLength(length, language)) throw new Error('This language and word length are not available.');
 const words = addedVocabularies.has(language) ? addedVocabularies.get(language)!.get(length) : portugueseVocabularies.has(language) ? portugueseVocabularies.get(language)!.get(length) : frenchVocabularies.has(language) ? frenchVocabularies.get(language)!.get(length) : englishVarieties.has(language) ? englishVarieties.get(language)!.get(length) : language === 'fil-PH' ? filipinoVocabulary : (language === 'ru-RU' ? russianVocabularies : language === 'de-DE' ? germanVocabularies : language === 'es-ES' ? spainVocabularies : language === 'es-MX' ? spanishVocabularies : language === 'nl-NL' ? dutchVocabularies : vocabularies).get(length);
 if (!words) throw new Error('This language and word length are not available.');
 if(usesAccentEquivalence(language,dutchRules)){const key=language+':'+length;let folded=foldedVocabularies.get(key);if(!folded){folded={answers:words.answers,allowed:new EquivalentGuessSet(words.allowed,language)};foldedVocabularies.set(key,folded)}return folded}
 return words;
}
export function answerDataset(length: number = 5, language: Language = 'en'): string {
 if(englishVarieties.has(language))return `${language}-scowl-2020.12.07-${length}-answers-v1`;
 if(isPortuguese(language))return `${language}-regional-wiktionary-${length}-v1`;
 if(isFrench(language))return `${language}-wiktionary-wordfreq-${length}-v1`;
 if(language==='es-ES')return `es-ES-rla-2.9-wiktionary-wordfreq-${length}-v1`;
 if(addedVocabularies.has(language))return `${language}-wiktionary-wordfreq-${length}-v1`;
 if (language === 'ru-RU') return `ru-RU-wiktionary-wordfreq-${length}-v1`;
 if (language === 'de-DE') return `de-DE-wiktionary-wordfreq-${length}-v1`;
 if (language === 'nl-NL') return `nl-NL-wiktionary-wordfreq-${length}-v1`;
 if (language === 'fil-PH') return 'fil-PH-wiktionary-wordfreq-5-beta-v1';
 if (language === 'es-MX') return length >= 4 && length <= 7 ? `es-MX-wiktionary-wordfreq-${length}-v1` : `es-MX-wiktionary-wordfreq-extended-${length}-v1`;
 return length === 5 ? ANSWER_DATASET : `scowl-2020.12.07-${length}-answers-v${length===3?1:2}`;
}
export function absurdDataset(length: number = 5, language: Language = 'en'): string {
 if(englishVarieties.has(language))return `${language}-scowl-2020.12.07-${length}-absurd-v1`;
 if(isPortuguese(language))return `${language}-regional-wiktionary-absurd-${length}-v1`;
 if(isFrench(language))return `${language}-wiktionary-wordfreq-absurd-${length}-v1`;
 if(language==='es-ES')return `es-ES-rla-2.9-wiktionary-wordfreq-absurd-${length}-v1`;
 if(addedVocabularies.has(language))return `${language}-wiktionary-wordfreq-absurd-${length}-v1`;
 if (language === 'ru-RU') return `ru-RU-wiktionary-wordfreq-absurd-${length}-v1`;
 if (language === 'de-DE') return `de-DE-wiktionary-wordfreq-absurd-${length}-v1`;
 if (language === 'nl-NL') return `nl-NL-wiktionary-wordfreq-absurd-${length}-v1`;
 if (language === 'fil-PH') return 'fil-PH-wiktionary-wordfreq-absurd-5-beta-v1';
 if (language === 'es-MX') return length >= 4 && length <= 7 ? `es-MX-wiktionary-wordfreq-absurd-${length}-v1` : `es-MX-wiktionary-wordfreq-extended-absurd-${length}-v1`;
 return length === 5 ? ABSURD_DATASET : `scowl-2020.12.07-${length}-absurd-v${length===3?1:2}`;
}
