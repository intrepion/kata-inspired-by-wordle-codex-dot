import {localDefinition} from './local-definitions.ts';
import {learningFor} from './learning.ts';
import {normalizeGuess,validLetters,type Language} from './language.ts';
export const DEFINITION_SOURCE='Wiktionary contributors';
export const DEFINITION_LICENSE='https://creativecommons.org/licenses/by-sa/4.0/';
export const DEFINITION_ENDPOINT='https://en.wiktionary.org/api/rest_v1/page/definition/';
export interface DefinitionEntry {partOfSpeech:string;senses:string[]}
export interface DefinitionResult {word:string;entries:DefinitionEntry[];sourceUrl:string;sourceLabel?:string;license?:string;note?:string;sourceLinks?:{label:string;url:string}[]}
export type DefinitionFailure='network'|'timeout'|'invalid'|'cancelled';
export class DefinitionError extends Error {constructor(readonly reason:DefinitionFailure){super(reason)}}
const object=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function definitionWord(raw:string,language:Language='en'):string|null {const word=normalizeGuess(raw,language);return word.length>=4&&word.length<=7&&validLetters(word,language)?word:null}
/** Extract readable text only. This output is always rendered with textContent, never as HTML. */
export function definitionText(raw:unknown,limit=1800):string {
 if(typeof raw!=='string'||raw.length>20000)return '';
 const entities:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',hellip:'…',thinsp:' '};
 return raw.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style|iframe|object)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'').replace(/<(?:script|style|iframe|object)\b[\s\S]*$/gi,'').replace(/<[^>]*>/g,'').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(all,token:string)=>{
  if(token[0]!=='#')return entities[token.toLowerCase()]??all;
  const code=token[1].toLowerCase()==='x'?parseInt(token.slice(2),16):parseInt(token.slice(1),10);
  return code>0&&code<=0x10ffff&&!(code>=0xd800&&code<=0xdfff)?String.fromCodePoint(code):'';
 }).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,limit);
}
export function parseDefinitions(payload:unknown,rawWord:string,language:Language='en'):DefinitionResult {
 const word=definitionWord(rawWord,language);if(!word||!object(payload)||((language==='en'?'en':'es') in payload&&!Array.isArray(payload[language==='en'?'en':'es'])))throw new DefinitionError('invalid');
 const entries:DefinitionEntry[]=[];
 for(const entry of (Array.isArray(payload[language==='en'?'en':'es'])?payload[language==='en'?'en':'es'] as unknown[]:[]).slice(0,8)){
  if(!object(entry)||!Array.isArray(entry.definitions)||(entry.language!==undefined&&entry.language!==(language==='en'?'English':'Spanish')))continue;
  const senses:string[]=[];
  for(const item of entry.definitions){if(!object(item))continue;const sense=definitionText(item.definition);if(sense&&!senses.includes(sense))senses.push(sense);if(senses.length===8)break;}
  if(senses.length)entries.push({partOfSpeech:definitionText(entry.partOfSpeech,80)||'Part of speech not supplied',senses});
 }
 return {word,entries,sourceUrl:`https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}#${language==='en'?'English':'Spanish'}`};
}
/** Only words already made visible by play/advice can create a lookup action. */
export function definitionVisible(word:string,guesses:readonly string[],revealed:string|null,suggestions:readonly string[]=[],language:Language='en'):boolean {
 return definitionWord(word,language)===word&&(guesses.includes(word)||revealed===word||suggestions.includes(word));
}
type Fetcher=(input:string,init:RequestInit)=>Promise<Response>;
export class DefinitionClient {
 private cache=new Map<string,{result:DefinitionResult;expires:number}>();
 private pending=new Map<string,{promise:Promise<DefinitionResult>;controller:AbortController}>();
 constructor(private fetcher?:Fetcher,private timeoutMs=6000,private now:()=>number=Date.now,readonly language:Language='en'){}
 normalizeWord(raw:string):string|null {return definitionWord(raw,this.language)}
 peek(raw:string):DefinitionResult|null {const word=this.normalizeWord(raw);if(!word)return null;let item=this.cache.get(word);if(!item){const lesson=learningFor(word,this.language);if(!lesson)return null;const result=parseDefinitions({es:[{language:'Spanish',partOfSpeech:lesson.definitionPartOfSpeech,definitions:[{definition:lesson.definition}]}]},word,'es-MX');result.sourceUrl=lesson.sourceUrl;item={result,expires:Infinity};this.cache.set(word,item);if(this.cache.size>64)this.cache.delete(this.cache.keys().next().value!);} if(item.expires<=this.now()){this.cache.delete(word);return null;}this.cache.delete(word);this.cache.set(word,item);return structuredClone(item.result);}
 lookup(raw:string):Promise<DefinitionResult> {
  const word=this.normalizeWord(raw);if(!word)return Promise.reject(new DefinitionError('invalid'));
  const cached=this.peek(word);if(cached)return Promise.resolve(cached);
  const pending=this.pending.get(word);if(pending)return pending.promise;
  const controller=new AbortController();let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort()},this.timeoutMs);
  const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new DefinitionError(timedOut?'timeout':'cancelled')),{once:true}));
  const work=async()=>{
   try{
    if(!this.fetcher)return await localDefinition(word,this.language);
    // Explicit transport injection supports legacy adapter tests; the application never supplies it.
    const response=await this.fetcher(DEFINITION_ENDPOINT+encodeURIComponent(word.toLowerCase()),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',headers:{Accept:'application/json','Api-User-Agent':'Morrowmark/1.0 (local word definition lookup)'}});
    if(response.status===404)return parseDefinitions({},word,this.language);
    if(!response.ok)throw new DefinitionError('network');
    if(Number(response.headers.get('content-length'))>200000)throw new DefinitionError('invalid');
    const raw=await response.text();if(raw.length>200000)throw new DefinitionError('invalid');
    let payload:unknown;try{payload=JSON.parse(raw)}catch{throw new DefinitionError('invalid')}
    return parseDefinitions(payload,word,this.language);
   }catch(error){if(error instanceof DefinitionError)throw error;throw new DefinitionError('network')}
  };
  const promise=Promise.race([work(),cancelled]).then(result=>{
   if(controller.signal.aborted)throw new DefinitionError(timedOut?'timeout':'cancelled');
   this.cache.set(word,{result:structuredClone(result),expires:this.now()+(result.entries.length?86400000:300000)});
   if(this.cache.size>64)this.cache.delete(this.cache.keys().next().value!);
   return result;
  }).finally(()=>{clearTimeout(timer);if(this.pending.get(word)?.promise===promise)this.pending.delete(word)});
  this.pending.set(word,{promise,controller});return promise;
 }
 cancel(raw:string){const word=this.normalizeWord(raw);if(word){this.pending.get(word)?.controller.abort();this.pending.delete(word);}}
}
