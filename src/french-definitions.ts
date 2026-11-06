import {definitionText,type DefinitionResult} from './definitions.ts';
import {frenchGuessKey,frenchTileSpelling} from './french-orthography.ts';
import primarySenses from './data/french/regional-primary-senses.json';
export type FrenchVariety='fr-CA'|'fr-FR';
type Entry={sourceWord:string;partOfSpeech:string;senses:string[]};
type Table=Record<string,Entry[]>;
const loaders:Record<number,()=>Promise<Table>>={
 3:()=>import('./data/french/definitions-3.json').then(module=>module.default as Table),
 4:()=>import('./data/french/definitions-4.json').then(module=>module.default as Table),
 5:()=>import('./data/french/definitions-5.json').then(module=>module.default as Table),
 6:()=>import('./data/french/definitions-6.json').then(module=>module.default as Table),
 7:()=>import('./data/french/definitions-7.json').then(module=>module.default as Table),
 8:()=>import('./data/french/definitions-8.json').then(module=>module.default as Table),
 9:()=>import('./data/french/definitions-9.json').then(module=>module.default as Table),
 10:()=>import('./data/french/definitions-10.json').then(module=>module.default as Table),
 11:()=>import('./data/french/definitions-11.json').then(module=>module.default as Table),
};
type Index={exact:Table;folded:Map<string,Entry[]>};
const pending=new Map<number,Promise<Index>>();
function indexTable(exact:Table):Index {
 const folded=new Map<string,Entry[]>();
 for(const [word,entries] of Object.entries(exact)){
  const key=frenchGuessKey(word);
  folded.set(key,[...(folded.get(key)??[]),...entries]);
 }
 return {exact,folded};
}
type PrimarySense={sourceWord:string;partOfSpeech:string;gloss:string};
const unlabel=(sense:string)=>sense.replace(/^\[[^\]]+\] /,'');
/** Only explicitly reviewed regional meanings move first; all other source order stays. */
function orderEntries(entries:Entry[],primary:PrimarySense|undefined):Entry[]{
 if(!primary)return entries;
 const matches=(entry:Entry)=>entry.sourceWord===primary.sourceWord&&entry.partOfSpeech===primary.partOfSpeech;
 const ordered=entries.map(entry=>matches(entry)?{...entry,senses:[...entry.senses].sort((a,b)=>Number(unlabel(b)===primary.gloss)-Number(unlabel(a)===primary.gloss))}:entry);
 return ordered.sort((a,b)=>Number(matches(b)&&b.senses.some(sense=>unlabel(sense)===primary.gloss))-Number(matches(a)&&a.senses.some(sense=>unlabel(sense)===primary.gloss)));
}
/** Bundle English meanings of French words; never substitute English homographs. */
export async function frenchDefinition(raw:string,variety:FrenchVariety='fr-FR'):Promise<DefinitionResult> {
 const word=frenchTileSpelling(raw),key=frenchGuessKey(word),length=key.length;
 let request=pending.get(length);
 if(!request&&loaders[length]){
  request=loaders[length]().then(indexTable);pending.set(length,request);
  void request.catch(()=>{if(pending.get(length)===request)pending.delete(length);});
 }
 const table=request?await request:undefined;
 const matches=table?(word!==key&&table.exact[word]?table.exact[word]:[...(table.exact[word]??[]),...(table.folded.get(key)??[])]):[];
 const primary=(primarySenses[variety] as Record<string,PrimarySense>)[key];
 const entries=orderEntries([...new Map(matches.map(entry=>[JSON.stringify(entry),entry])).values()],primary);
 const originals=[...new Set(entries.map(entry=>entry.sourceWord))];
 const sourceWord=originals[0]??raw.toLocaleLowerCase('fr');
 return {
  word,
  entries:entries.map(entry=>({partOfSpeech:definitionText(entry.partOfSpeech),senses:entry.senses.map(sense=>definitionText(sense))})),
  sourceUrl:entries.length?`https://en.wiktionary.org/wiki/${encodeURIComponent(sourceWord)}#French`:'./third-party/fr/NOTICE.txt',
  sourceLinks:originals.length?originals.map(source=>({label:`Wiktionary: ${source}`,url:`https://en.wiktionary.org/wiki/${encodeURIComponent(source)}#French`})):undefined,
  sourceLabel:'Wiktionary contributors · selected French senses · CC BY-SA 4.0',
  license:'CC-BY-SA-4.0',
  note:`Bundled English meanings for French (${variety==='fr-CA'?'Canada':'France'}). Reviewed regional meanings appear first; source labels and other regions’ meanings are retained. Accents and ç do not affect play; Œ/OE and Æ/AE use two tiles. Plain input may combine accent-equivalent spellings; links preserve originals. Starter regional coverage, not an exhaustive or native-human-reviewed dictionary.`
 };
}
