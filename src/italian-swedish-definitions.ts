import {definitionText,type DefinitionResult} from './definitions.ts';
import {normalizeGuess,normalizeSpelling} from './language.ts';
type Variety='it-IT'|'sv-SE';
type Entry={sourceWord:string;partOfSpeech:string;senses:string[]};
type Table=Record<string,Entry[]>;
const loaders:Record<Variety,Record<number,()=>Promise<Table>>>={
 'it-IT':{
  3:()=>import('./data/italian/definitions-3.json').then(module=>module.default as Table),
  4:()=>import('./data/italian/definitions-4.json').then(module=>module.default as Table),
  5:()=>import('./data/italian/definitions-5.json').then(module=>module.default as Table),
  6:()=>import('./data/italian/definitions-6.json').then(module=>module.default as Table),
  7:()=>import('./data/italian/definitions-7.json').then(module=>module.default as Table),
  8:()=>import('./data/italian/definitions-8.json').then(module=>module.default as Table),
  9:()=>import('./data/italian/definitions-9.json').then(module=>module.default as Table),
  10:()=>import('./data/italian/definitions-10.json').then(module=>module.default as Table),
  11:()=>import('./data/italian/definitions-11.json').then(module=>module.default as Table),
 },
 'sv-SE':{
  3:()=>import('./data/swedish/definitions-3.json').then(module=>module.default as Table),
  4:()=>import('./data/swedish/definitions-4.json').then(module=>module.default as Table),
  5:()=>import('./data/swedish/definitions-5.json').then(module=>module.default as Table),
  6:()=>import('./data/swedish/definitions-6.json').then(module=>module.default as Table),
  7:()=>import('./data/swedish/definitions-7.json').then(module=>module.default as Table),
  8:()=>import('./data/swedish/definitions-8.json').then(module=>module.default as Table),
  9:()=>import('./data/swedish/definitions-9.json').then(module=>module.default as Table),
  10:()=>import('./data/swedish/definitions-10.json').then(module=>module.default as Table),
  11:()=>import('./data/swedish/definitions-11.json').then(module=>module.default as Table),
 },
};
const pending=new Map<string,Promise<Table>>();
/** Same-origin definitions; exact Italian reveals keep their accented source senses. */
export async function italianSwedishDefinition(raw:string,variety:Variety):Promise<DefinitionResult>{
 const word=normalizeSpelling(raw,variety),key=normalizeGuess(raw,variety),cacheKey=variety+':'+key.length;
 let request=pending.get(cacheKey);
 if(!request&&loaders[variety][key.length]){request=loaders[variety][key.length]();pending.set(cacheKey,request);void request.catch(()=>{if(pending.get(cacheKey)===request)pending.delete(cacheKey)})}
 const matches=request?(await request)[key]??[]:[],exact=matches.filter(entry=>normalizeSpelling(entry.sourceWord,variety)===word);
 const entries=word!==key&&exact.length?exact:matches,originals=[...new Set(entries.map(entry=>entry.sourceWord))],name=variety==='it-IT'?'Italian':'Swedish';
 return {word,entries:entries.map(entry=>({partOfSpeech:definitionText(`${entry.sourceWord} · ${entry.partOfSpeech}`),senses:entry.senses.map(sense=>definitionText(sense))})),
 sourceUrl:originals.length?`https://en.wiktionary.org/wiki/${encodeURIComponent(originals[0])}#${name}`:`./third-party/${variety}/NOTICE.txt`,
 sourceLinks:originals.length?originals.map(source=>({label:`Wiktionary: ${source}`,url:`https://en.wiktionary.org/wiki/${encodeURIComponent(source)}#${name}`})):undefined,
 sourceLabel:`Wiktionary contributors · selected ${name} senses · CC BY-SA 4.0`,license:'CC-BY-SA-4.0',
 note:(variety==='it-IT'?'Italian (Italy): vowel accents do not affect play; reveals retain correct spelling. Plain guesses may show more than one accented headword.':'Swedish (Sweden): Å, Ä and Ö are distinct letters. This starter list excludes accented loanwords outside A–Z, Å, Ä, Ö rather than changing their spelling.')+' English meanings are bundled locally, with source usage labels. Coverage is incomplete and not native-human certified.'};
}
