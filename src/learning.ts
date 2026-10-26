import {ADDITIONAL_TEACHING} from './data/spanish/additional-teaching.ts';
import {SPANISH_LEARNING} from './data/spanish/learning.ts';
import {normalizeGuess,type Language} from './language.ts';
export interface LearningEntry {word:string;partOfSpeech:string;translation:string;example:string;exampleTranslation:string;answer:boolean;definition:string;definitionPartOfSpeech:string;sourceUrl:string;sourceRevision:number|null;review:'independent-model';authorship:'AI-authored';license:'CC-BY-SA-4.0'}
/** Preserved dictionary-backed archive; authored supplemental teaching is deliberately excluded from definition lookups. */
export function learningFor(raw:string,language:Language='en'):LearningEntry|null {return language==='es-MX'?SPANISH_LEARNING[normalizeGuess(raw,language)]??null:null}
export type TeachingText=Partial<Pick<LearningEntry,'translation'|'example'|'exampleTranslation'>>;
export interface TeachingField {label:string;value:string;language:Language}
/** Missing learning content is omitted; definitions remain a separate source-backed section. */
export function teachingFields(lesson:TeachingText|null):TeachingField[]{
 const fields:TeachingField[]=[
  {label:'English translation',value:lesson?.translation?.trim()??'',language:'en'},
  {label:'Spanish example · Mexico learner context',value:lesson?.example?.trim()??'',language:'es-MX'},
  {label:'English sentence translation',value:lesson?.exampleTranslation?.trim()??'',language:'en'},
 ];
 return fields.filter(field=>field.value.length>0);
}

export interface TeachingEntry {word:string;translation:string;example:string;exampleTranslation:string}
/** Authored teaching is separate from dictionary-backed meanings and never supplies invented source attribution. */
export function teachingFor(raw:string,language:Language='en'):TeachingEntry|null {if(language!=='es-MX')return null;return learningFor(raw,language)??ADDITIONAL_TEACHING[normalizeGuess(raw,language)]??null}
export const SPANISH_TEACHING_TOTAL=Object.keys(SPANISH_LEARNING).length+Object.keys(ADDITIONAL_TEACHING).length;
