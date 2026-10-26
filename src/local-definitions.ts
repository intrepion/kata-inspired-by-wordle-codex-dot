import {definitionText,type DefinitionResult} from './definitions.ts';
import {teachingFor} from './learning.ts';
import {TranslationClient} from './translations.ts';
import type {Language} from './language.ts';
type Table=Record<string,{partOfSpeech:string;senses:string[]}[]>;
const loaders:Record<number,()=>Promise<Table>>={
 4:()=>import('./data/definitions/4.json').then(m=>m.default),
 5:()=>import('./data/definitions/5.json').then(m=>m.default),
 6:()=>import('./data/definitions/6.json').then(m=>m.default),
 7:()=>import('./data/definitions/7.json').then(m=>m.default),
};
const pending=new Map<number,Promise<Table>>();const translations=new TranslationClient();
/** Same-origin static chunks only. Source links are attribution, never fetched here. */
export async function localDefinition(word:string,language:Language):Promise<DefinitionResult>{
 if(language==='es-MX'){
  const teaching=teachingFor(word,language);
  if(teaching?.translation.trim())return {word,entries:[{partOfSpeech:'English meaning · reviewed learning material',senses:[definitionText(teaching.translation)]}],sourceUrl:'./third-party/spanish-teaching/NOTICE.txt',sourceLabel:'AI-authored teaching · independently model-reviewed · CC BY-SA 4.0',license:'CC-BY-SA-4.0',note:'Original learning material, not a dictionary quotation or human/native-certified translation.'};
  const result=await translations.lookup(word,language);
  if(result.phase==='error')throw Error('Bundled meanings could not load');
  if(result.phase==='missing')return {word,entries:[],sourceUrl:'./third-party/english-wiktionary-translations/NOTICE.txt',sourceLabel:'Bundled meanings · coverage and notices'};
  const entry=result.entry;
  return {word,entries:entry.senses.map(s=>({partOfSpeech:definitionText([s.partOfSpeech,...s.tags].join(' · ')),senses:s.english.map(v=>definitionText(v)).filter(Boolean)})).filter(e=>e.senses.length),sourceUrl:entry.sourceUrl,sourceLinks:entry.sourceLinks,sourceLabel:entry.kind==='derived-forms'?'Apertium + AGID · GPL v2-derived data':entry.kind==='reviewed-wordnet'?'MCR + WordNet · source notices':'Wiktionary contributors · CC BY-SA 4.0',license:entry.license,note:'Bundled English meaning or labelled grammatical reading; not every sense or Mexican usage.'};
 }
 let table=pending.get(word.length);if(!table){table=loaders[word.length]();pending.set(word.length,table);void table.catch(()=>{if(pending.get(word.length)===table)pending.delete(word.length)})}
 const entries=(await table)[word]??[];
 return {word,entries:entries.map(e=>({partOfSpeech:definitionText(e.partOfSpeech),senses:e.senses.map(v=>definitionText(v))})),sourceUrl:entries.length?'https://simple.wiktionary.org/wiki/'+encodeURIComponent(word.toLowerCase()):'./third-party/simple-english-definitions/NOTICE.txt',sourceLabel:entries.length?'Simple English Wiktionary contributors · CC BY-SA 4.0':'Bundled dictionary · coverage and notices',license:'CC-BY-SA-4.0',note:'Selected bundled senses, with formatting removed; source coverage is incomplete.'};
}
