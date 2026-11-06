import filipinoReview from './data/filipino/review.json';
import {SPANISH_EXCLUSIONS} from './data/spanish/answer-exclusions.ts';
import fiveLetterCuration from './data/answer-curation.json';
import lengthCuration from './data/length-curation.json';
import extendedCuration from './data/extended-curation.json';
import {vocabulary,type WordLength} from './words.ts';
import {isEnglish,normalizeGuess,type DutchRules,type Language} from './language.ts';
export interface AnswerEligibility {possible:boolean;reason:string}
type Exclusion={word:string;reasons:{kind:string;lemma?:string;reason?:string}[]};
const spanishReasons=new Map<string,string>();
const spanishReasonText:Record<string,string>={frequency:'Below this list’s general-Spanish frequency cutoff (Zipf 3.5).','missing-frequency':'No frequency estimate meeting this list’s cutoff is available in the selected source.',plural:'Recorded as a plural form without a qualifying independent base-word sense.','verb-form':'Recorded as an inflected verb form without a qualifying independent base-word sense.',grammar:'No qualifying independent base-word sense is recorded; inflected forms do not become answers.',usage:'Recorded senses have usage labels excluded by this list’s policy (such as rare, outdated or offensive).',region:'Recorded qualifying senses are labelled for regions other than Mexico.','missing-sense':'No qualifying base-word sense is documented at this frequency cutoff in the selected dictionary snapshot.'};
for(const [reason,words]of Object.entries(SPANISH_EXCLUSIONS.reasonGroups))for(const word of words)spanishReasons.set(word,spanishReasonText[reason]);
for(const [word,reason]of Object.entries(SPANISH_EXCLUSIONS.reviewedReasons))spanishReasons.set(word,reason);
const exclusions=new Map<string,Exclusion>();
for(const entry of [...fiveLetterCuration.removed,...Object.values(lengthCuration).flatMap(data=>data.removed),...Object.values(extendedCuration).flatMap(data=>data.removed)])exclusions.set(entry.word,entry);
/** Static list membership, never the hidden answer or surviving clue candidates. */
export function answerEligibility(raw:string,length:WordLength,language:Language,dutchRules:DutchRules=2):AnswerEligibility {
 const word=normalizeGuess(raw,language,dutchRules),{answers,allowed}=vocabulary(length,language,dutchRules);
 if(answers.some(answer=>normalizeGuess(answer,language,dutchRules)===word))return {possible:true,reason:'On this language and length’s answer list. This does not say whether it still fits the clues.'};
 if(language==='nl-NL'&&allowed.has(word))return {possible:false,reason:'Valid guess; not selected by this list’s documented commonness, standalone-sense and Netherlands usage policy.'};
 if(language==='fil-PH'&&allowed.has(word)){const review=(filipinoReview as Record<string,{reason:string;exclude?:boolean}>)[word];return {possible:false,reason:`Valid guess; ${review?.exclude?review.reason:'not selected by this list’s conservative commonness and standalone-sense policy.'}`};}
 if(language==='es-MX'&&allowed.has(word))return {possible:false,reason:`Valid guess; ${spanishReasons.get(word)??'not selected by this list’s documented frequency and base-word policy.'}`};
 const excluded=isEnglish(language)&&word.length===length?exclusions.get(word):undefined;
 const reasons=excluded?.reasons.filter(reason=>(reason.kind==='plural'||reason.kind==='past')&&reason.lemma).map(reason=>`${reason.kind==='plural'?'plural noun':'past-tense verb'} form of ${reason.lemma!.toUpperCase()}`);
 const reviewed=excluded?.reasons.find(reason=>reason.kind==='reviewed'&&reason.reason)?.reason;
 if(allowed.has(word)&&reviewed)return {possible:false,reason:`Valid guess; ${reviewed}`};
 if(allowed.has(word)&&reasons?.length)return {possible:false,reason:`Valid guess; excluded as a ${reasons.join(' / ')} in the reviewed morphology data.`};
 return {possible:false,reason:allowed.has(word)?'Valid guess, but not selected for this language and length’s answer list.':'Not on this language and length’s answer list.'};
}
