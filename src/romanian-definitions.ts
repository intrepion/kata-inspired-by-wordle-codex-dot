import {definitionText,type DefinitionResult} from './definitions.ts';
import {normalizeGuess} from './language.ts';
type Entry={sourceWord:string;partOfSpeech:string;senses:string[]};
type Table=Record<string,Entry[]>;
const loaders:Record<number,()=>Promise<Table>>={
 3:()=>import('./data/romanian/definitions-3.json').then(module=>module.default as Table),
 4:()=>import('./data/romanian/definitions-4.json').then(module=>module.default as Table),
 5:()=>import('./data/romanian/definitions-5.json').then(module=>module.default as Table),
 6:()=>import('./data/romanian/definitions-6.json').then(module=>module.default as Table),
 7:()=>import('./data/romanian/definitions-7.json').then(module=>module.default as Table),
 8:()=>import('./data/romanian/definitions-8.json').then(module=>module.default as Table),
 9:()=>import('./data/romanian/definitions-9.json').then(module=>module.default as Table),
 10:()=>import('./data/romanian/definitions-10.json').then(module=>module.default as Table),
 11:()=>import('./data/romanian/definitions-11.json').then(module=>module.default as Table),
};
const pending=new Map<number,Promise<Table>>();
/** Romanian senses stay local and distinct from English homographs. Ă, Â, Î, Ș and Ț remain distinct letters; legacy Ş/Ţ map to Ș/Ț. */
export async function romanianDefinition(raw:string):Promise<DefinitionResult>{
 const word=normalizeGuess(raw,'ro-RO'),length=word.length;
 let request=pending.get(length);
 if(!request&&loaders[length]){request=loaders[length]();pending.set(length,request);void request.catch(()=>{if(pending.get(length)===request)pending.delete(length)})}
 const entries=request?(await request)[word]??[]:[],originals=[...new Set(entries.map(entry=>entry.sourceWord))];
 return {
  word,
  entries:entries.map(entry=>({partOfSpeech:definitionText(entry.partOfSpeech),senses:entry.senses.map(sense=>definitionText(sense))})),
  sourceUrl:originals.length?`https://en.wiktionary.org/wiki/${encodeURIComponent(originals[0])}#Romanian`:'./third-party/ro-RO/NOTICE.txt',
  sourceLinks:originals.length?originals.map(source=>({label:`Wiktionary: ${source}`,url:`https://en.wiktionary.org/wiki/${encodeURIComponent(source)}#Romanian`})):undefined,
  sourceLabel:'Wiktionary contributors · selected Romanian senses · CC BY-SA 4.0',
  license:'CC-BY-SA-4.0',
  note:'Bundled English meanings for Romanian (Romania). Ă, Â, Î, Ș and Ț are distinct one-tile letters. Legacy Ş/Ţ are aliases for Ș/Ț, not plain S/T. Hyphenated and apostrophized words are excluded rather than respelled. Source labels may include uncommon or regional senses; this starter selection is incomplete and not native-human reviewed.'
 };
}
