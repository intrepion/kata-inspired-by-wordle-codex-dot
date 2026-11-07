import {definitionText,type DefinitionResult} from './definitions.ts';
import {normalizeGuess} from './language.ts';
type Entry={sourceWord:string;partOfSpeech:string;senses:string[]};
type Table=Record<string,Entry[]>;
const loaders:Record<number,()=>Promise<Table>>={
 3:()=>import('./data/russian/definitions-3.json').then(module=>module.default as Table),
 4:()=>import('./data/russian/definitions-4.json').then(module=>module.default as Table),
 5:()=>import('./data/russian/definitions-5.json').then(module=>module.default as Table),
 6:()=>import('./data/russian/definitions-6.json').then(module=>module.default as Table),
 7:()=>import('./data/russian/definitions-7.json').then(module=>module.default as Table),
 8:()=>import('./data/russian/definitions-8.json').then(module=>module.default as Table),
 9:()=>import('./data/russian/definitions-9.json').then(module=>module.default as Table),
 10:()=>import('./data/russian/definitions-10.json').then(module=>module.default as Table),
 11:()=>import('./data/russian/definitions-11.json').then(module=>module.default as Table),
};
const pending=new Map<number,Promise<Table>>();
/** Russian senses stay local and distinct from English homographs. Й and Ё remain distinct letters. */
export async function russianDefinition(raw:string):Promise<DefinitionResult>{
 const word=normalizeGuess(raw,'ru-RU'),length=word.length;
 let request=pending.get(length);
 if(!request&&loaders[length]){request=loaders[length]();pending.set(length,request);void request.catch(()=>{if(pending.get(length)===request)pending.delete(length)})}
 const entries=request?(await request)[word]??[]:[],originals=[...new Set(entries.map(entry=>entry.sourceWord))];
 return {
  word,
  entries:entries.map(entry=>({partOfSpeech:definitionText(entry.partOfSpeech),senses:entry.senses.map(sense=>definitionText(sense))})),
  sourceUrl:originals.length?`https://en.wiktionary.org/wiki/${encodeURIComponent(originals[0])}#Russian`:'./third-party/ru-RU/NOTICE.txt',
  sourceLinks:originals.length?originals.map(source=>({label:`Wiktionary: ${source}`,url:`https://en.wiktionary.org/wiki/${encodeURIComponent(source)}#Russian`})):undefined,
  sourceLabel:'Wiktionary contributors · selected Russian senses · CC BY-SA 4.0',
  license:'CC-BY-SA-4.0',
  note:'Bundled English meanings for Russian (Russia). Й and И, and Ё and Е are distinct one-tile letters. The 33-letter Cyrillic alphabet includes Ъ and Ь; Latin lookalikes and transliterations are not aliases. Source labels may include uncommon or regional senses; coverage is incomplete and not native-human reviewed.'
 };
}
