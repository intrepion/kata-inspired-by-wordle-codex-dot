import {definitionText,type DefinitionResult} from './definitions.ts';
import {normalizeGuess,normalizeSpelling} from './language.ts';
export type PortugueseVariety='pt-BR'|'pt-PT';
type Entry={sourceWord:string;partOfSpeech:string;senses:string[]};
type Table=Record<string,Entry[]>;
const loaders:Record<PortugueseVariety,Record<number,()=>Promise<Table>>>={
 'pt-BR':{
  3:()=>import('./data/portuguese/definitions-br-3.json').then(module=>module.default as Table),
  4:()=>import('./data/portuguese/definitions-br-4.json').then(module=>module.default as Table),
  5:()=>import('./data/portuguese/definitions-br-5.json').then(module=>module.default as Table),
  6:()=>import('./data/portuguese/definitions-br-6.json').then(module=>module.default as Table),
  7:()=>import('./data/portuguese/definitions-br-7.json').then(module=>module.default as Table),
  8:()=>import('./data/portuguese/definitions-br-8.json').then(module=>module.default as Table),
  9:()=>import('./data/portuguese/definitions-br-9.json').then(module=>module.default as Table),
  10:()=>import('./data/portuguese/definitions-br-10.json').then(module=>module.default as Table),
  11:()=>import('./data/portuguese/definitions-br-11.json').then(module=>module.default as Table),
 },
 'pt-PT':{
  3:()=>import('./data/portuguese/definitions-pt-3.json').then(module=>module.default as Table),
  4:()=>import('./data/portuguese/definitions-pt-4.json').then(module=>module.default as Table),
  5:()=>import('./data/portuguese/definitions-pt-5.json').then(module=>module.default as Table),
  6:()=>import('./data/portuguese/definitions-pt-6.json').then(module=>module.default as Table),
  7:()=>import('./data/portuguese/definitions-pt-7.json').then(module=>module.default as Table),
  8:()=>import('./data/portuguese/definitions-pt-8.json').then(module=>module.default as Table),
  9:()=>import('./data/portuguese/definitions-pt-9.json').then(module=>module.default as Table),
  10:()=>import('./data/portuguese/definitions-pt-10.json').then(module=>module.default as Table),
  11:()=>import('./data/portuguese/definitions-pt-11.json').then(module=>module.default as Table),
 },
};
const pending=new Map<string,Promise<Table>>();
/** Exact accented reveals retain their own meaning; plain guesses may have several spellings. */
export async function portugueseDefinition(raw:string,variety:PortugueseVariety):Promise<DefinitionResult>{
 const word=normalizeSpelling(raw,variety),key=normalizeGuess(raw,variety),cacheKey=variety+':'+key.length;
 let request=pending.get(cacheKey);
 if(!request&&loaders[variety][key.length]){request=loaders[variety][key.length]();pending.set(cacheKey,request);void request.catch(()=>{if(pending.get(cacheKey)===request)pending.delete(cacheKey)})}
 const matches=request?(await request)[key]??[]:[];
 const exact=matches.filter(entry=>normalizeSpelling(entry.sourceWord,variety)===word);
 const entries=word!==key&&exact.length?exact:matches;
 const originals=[...new Set(entries.map(entry=>entry.sourceWord))];
 return {
  word,
  entries:entries.map(entry=>({partOfSpeech:definitionText(`${entry.sourceWord} · ${entry.partOfSpeech}`),senses:entry.senses.map(sense=>definitionText(sense))})),
  sourceUrl:originals.length?`https://en.wiktionary.org/wiki/${encodeURIComponent(originals[0])}#Portuguese`:'./third-party/pt/NOTICE.txt',
  sourceLinks:originals.length?originals.map(source=>({label:`Wiktionary: ${source}`,url:`https://en.wiktionary.org/wiki/${encodeURIComponent(source)}#Portuguese`})):undefined,
  sourceLabel:'Wiktionary contributors · selected Portuguese senses · CC BY-SA 4.0',
  license:'CC-BY-SA-4.0',
  note:`Bundled English meanings for Portuguese (${variety==='pt-BR'?'Brazil':'Portugal'}). Accents and ç do not affect play; source links and reveals preserve spelling. Plain input may combine several accented headwords. Reviewed regional meanings appear first and usage labels are retained; coverage is a regional starter selection, not exhaustive or native-human certified.`
 };
}
