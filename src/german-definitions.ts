import {definitionText,type DefinitionResult} from './definitions.ts';
import {normalizeGuess} from './language.ts';
type Entry={sourceWord:string;partOfSpeech:string;senses:string[]};
type Table=Record<string,Entry[]>;
const loaders:Record<number,()=>Promise<Table>>={
 3:()=>import('./data/german/definitions-3.json').then(module=>module.default as Table),
 4:()=>import('./data/german/definitions-4.json').then(module=>module.default as Table),
 5:()=>import('./data/german/definitions-5.json').then(module=>module.default as Table),
 6:()=>import('./data/german/definitions-6.json').then(module=>module.default as Table),
 7:()=>import('./data/german/definitions-7.json').then(module=>module.default as Table),
 8:()=>import('./data/german/definitions-8.json').then(module=>module.default as Table),
 9:()=>import('./data/german/definitions-9.json').then(module=>module.default as Table),
 10:()=>import('./data/german/definitions-10.json').then(module=>module.default as Table),
 11:()=>import('./data/german/definitions-11.json').then(module=>module.default as Table),
};
const pending=new Map<number,Promise<Table>>();
/** German senses stay local and distinct from English homographs. Noun source case matters. */
export async function germanDefinition(raw:string):Promise<DefinitionResult>{
 const word=normalizeGuess(raw,'de-DE'),length=word.length;
 let request=pending.get(length);
 if(!request&&loaders[length]){request=loaders[length]();pending.set(length,request);void request.catch(()=>{if(pending.get(length)===request)pending.delete(length)})}
 const entries=request?(await request)[word]??[]:[],originals=[...new Set(entries.map(entry=>entry.sourceWord))];
 return {
  word,
  entries:entries.map(entry=>({partOfSpeech:definitionText(entry.partOfSpeech),senses:entry.senses.map(sense=>definitionText(sense))})),
  sourceUrl:originals.length?`https://en.wiktionary.org/wiki/${encodeURIComponent(originals[0])}#German`:'./third-party/de-DE/NOTICE.txt',
  sourceLinks:originals.length?originals.map(source=>({label:`Wiktionary: ${source}`,url:`https://en.wiktionary.org/wiki/${encodeURIComponent(source)}#German`})):undefined,
  sourceLabel:'Wiktionary contributors · selected German senses · CC BY-SA 4.0',
  license:'CC-BY-SA-4.0',
  note:'Bundled English meanings for German (Germany). Ä, Ö, Ü and ß are distinct one-tile letters; capital ẞ is the same letter as ß, not SS. Source links preserve original spellings and noun capitalization. Labels may include other regions or uncommon senses; coverage is incomplete and not native-human reviewed.'
 };
}
