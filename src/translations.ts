import {normalizeGuess,type Language} from './language.ts';
export interface TranslationSense {partOfSpeech:string;senseIndex:string;english:string[];tags:string[];sourceLinks?:{label:string;url:string}[]}
export interface WordTranslation {word:string;senses:TranslationSense[];sourceUrl:string;sourceLinks?:{label:string;url:string}[];license:'CC-BY-SA-4.0'|'GPL-2.0'|'CC-BY-3.0 + WordNet'|'CC-BY-SA-4.0 + CC-BY-3.0 + WordNet';kind:'sourced-equivalents'|'derived-forms'|'english-wiktionary'|'reviewed-wordnet'|'reviewed-spanish'}
export type TranslationState={phase:'ready';entry:WordTranslation}|{phase:'missing'}|{phase:'error'};
export type TranslationTable=Record<string,TranslationSense[]>;
const loaders:Record<number,()=>Promise<TranslationTable>>={
 4:()=>import('./data/spanish/translations/4.json').then(m=>m.default),
 5:()=>import('./data/spanish/translations/5.json').then(m=>m.default),
 6:()=>import('./data/spanish/translations/6.json').then(m=>m.default),
 7:()=>import('./data/spanish/translations/7.json').then(m=>m.default),
};
type EnglishTable=Record<string,{sourceUrl:string;sourceLinks?:{label:string;url:string}[];senses:TranslationSense[]}>;
type TranslationBundle={sourced:TranslationTable;derived:TranslationTable;english?:EnglishTable;spanishReviewed?:EnglishTable;wordnet?:TranslationTable;failed?:boolean};
const morphLoaders:Record<number,()=>Promise<TranslationTable>>={
 4:()=>import('./data/spanish/morph-translations/4.json').then(m=>m.default),
 5:()=>import('./data/spanish/morph-translations/5.json').then(m=>m.default),
 6:()=>import('./data/spanish/morph-translations/6.json').then(m=>m.default),
 7:()=>import('./data/spanish/morph-translations/7.json').then(m=>m.default),
};
// Keep the generated-data boundary typed without asking TypeScript to infer
// tens of thousands of JSON object properties. Vite expands this fixed local
// directory/extension to the same four lazy chunks; Node/tsx loads them too.
async function loadEnglishTable(length:number):Promise<EnglishTable>{
 if(![4,5,6,7].includes(length))return {};
 return import(`./data/spanish/english-translations/${length}.json`).then(m=>m.default as EnglishTable);
}
const englishLoaders:Record<number,()=>Promise<EnglishTable>>={
 4:()=>loadEnglishTable(4),5:()=>loadEnglishTable(5),6:()=>loadEnglishTable(6),7:()=>loadEnglishTable(7),
};
const wordnetLoaders:Record<number,()=>Promise<TranslationTable>>={
 4:()=>import('./data/spanish/wordnet-translations/4.json').then(m=>m.default),
 5:()=>import('./data/spanish/wordnet-translations/5.json').then(m=>m.default),
 6:()=>import('./data/spanish/wordnet-translations/6.json').then(m=>m.default),
 7:()=>import('./data/spanish/wordnet-translations/7.json').then(m=>m.default),
};
const spanishReviewedLoaders:Record<number,()=>Promise<EnglishTable>>={
 4:()=>import('./data/spanish/spanish-derived-translations/4.json').then(m=>m.default),
 5:()=>import('./data/spanish/spanish-derived-translations/5.json').then(m=>m.default),
 6:()=>import('./data/spanish/spanish-derived-translations/6.json').then(m=>m.default),
 7:()=>import('./data/spanish/spanish-derived-translations/7.json').then(m=>m.default),
};
async function loadBundle(length:number):Promise<TranslationBundle>{
 const [source,morph,english,wordnet,spanish]=await Promise.allSettled([loaders[length](),morphLoaders[length](),englishLoaders[length](),wordnetLoaders[length](),spanishReviewedLoaders[length]()]);
 return {sourced:source.status==='fulfilled'?source.value:{},derived:morph.status==='fulfilled'?morph.value:{},english:english.status==='fulfilled'?english.value:{},wordnet:wordnet.status==='fulfilled'?wordnet.value:{},spanishReviewed:spanish.status==='fulfilled'?spanish.value:{},failed:[source,morph,english,wordnet,spanish].some(result=>result.status==='rejected')};
}
/** Local static chunks only: no lookup word, puzzle state or history goes to a translation service. */
export class TranslationClient {
 private tables=new Map<number,TranslationBundle>();private pending=new Map<number,Promise<TranslationTable|TranslationBundle>>();private failures=new Set<number>();
 constructor(private load:(length:number)=>Promise<TranslationTable|TranslationBundle>=loadBundle){}
 peek(raw:string,language:Language):TranslationState|null {
  const word=normalizeGuess(raw,language);if(language!=='es-MX'||! /^[A-ZÁÉÍÓÚÜÑ]{4,7}$/.test(word))return {phase:'missing'};
  const table=this.tables.get(word.length);if(!table)return this.failures.has(word.length)?{phase:'error'}:null;
  const english=table.english?.[word],sourced=table.sourced[word],spanish=table.spanishReviewed?.[word],derived=table.derived[word],wordnet=table.wordnet?.[word];
  const linked=english??(!sourced?spanish:undefined),senses=english?.senses??sourced??spanish?.senses??derived??wordnet;
  const addedWordnet=!english&&!sourced&&!spanish&&!derived&&wordnet?.some(s=>s.tags.includes('model-reviewed aligned lexical meaning'));
  const wordnetLinks=addedWordnet?[...new Map(wordnet!.flatMap(s=>s.sourceLinks??[]).map(link=>[link.url,link])).values()]:undefined;
  const sourceLinks=linked?.sourceLinks??wordnetLinks;
  if(!senses)return table.failed?{phase:'error'}:{phase:'missing'};
  return {phase:'ready',entry:{word,senses:structuredClone(senses),...(sourceLinks?{sourceLinks:structuredClone(sourceLinks)}:{}),sourceUrl:english?english.sourceUrl:sourced?'https://es.wiktionary.org/wiki/'+encodeURIComponent(word.toLocaleLowerCase('es-MX')):spanish?spanish.sourceUrl:derived?'./third-party/apertium-translations/NOTICE.txt':'./third-party/wordnet-translations/NOTICE.txt',license:english||sourced||spanish?'CC-BY-SA-4.0':derived?'GPL-2.0':addedWordnet?'CC-BY-SA-4.0 + CC-BY-3.0 + WordNet':'CC-BY-3.0 + WordNet',kind:english?'english-wiktionary':sourced?'sourced-equivalents':spanish?'reviewed-spanish':derived?'derived-forms':'reviewed-wordnet'}};
 }
 async lookup(raw:string,language:Language):Promise<TranslationState>{
  const cached=this.peek(raw,language);if(cached)return cached;
  const length=normalizeGuess(raw,language).length;
  let promise=this.pending.get(length);if(!promise){promise=Promise.resolve().then(()=>this.load(length));this.pending.set(length,promise)}
  try{const result=await promise;this.tables.set(length,'sourced' in result&&'derived' in result?result as TranslationBundle:{sourced:result as TranslationTable,derived:{}})}catch{this.failures.add(length)}finally{if(this.pending.get(length)===promise)this.pending.delete(length)}
  return this.peek(raw,language)!;
 }
}
/** Opaque Wiktionary template abbreviations are retained in the audit, not presented as usage advice. */
export function translationUsage(tags:readonly string[]):string[]{return tags.filter(tag=>! /^(?:ut[a-z]+|u\.?t\.?(?:c\.?)?[a-z.]*)$/i.test(tag.replace(/^(?:source use|form source use):\s*/i,''))).map(tag=>tag==='dictionary gloss'?'dictionary meaning':tag==='automatically rendered'?'derived form':tag)}
export function translationPartOfSpeech(pos:string):string {return ({name:'proper name',adj:'adjective',adv:'adverb',intj:'interjection',conj:'conjunction',prep:'preposition',pron:'pronoun',det:'determiner'} as Record<string,string>)[pos]??pos}
