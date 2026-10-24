export const DEFINITION_SOURCE='Wiktionary contributors';
export const DEFINITION_LICENSE='https://creativecommons.org/licenses/by-sa/4.0/';
export const DEFINITION_ENDPOINT='https://en.wiktionary.org/api/rest_v1/page/definition/';
export interface DefinitionEntry {partOfSpeech:string;senses:string[]}
export interface DefinitionResult {word:string;entries:DefinitionEntry[];sourceUrl:string}
export type DefinitionFailure='network'|'timeout'|'invalid'|'cancelled';
export class DefinitionError extends Error {constructor(readonly reason:DefinitionFailure){super(reason)}}
const object=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function definitionWord(raw:string):string|null {return /^[a-z]{5}$/i.test(raw)?raw.toUpperCase():null}
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
export function parseDefinitions(payload:unknown,rawWord:string):DefinitionResult {
 const word=definitionWord(rawWord);if(!word||!object(payload)||('en' in payload&&!Array.isArray(payload.en)))throw new DefinitionError('invalid');
 const entries:DefinitionEntry[]=[];
 for(const entry of (Array.isArray(payload.en)?payload.en:[]).slice(0,8)){
  if(!object(entry)||!Array.isArray(entry.definitions)||(entry.language!==undefined&&entry.language!=='English'))continue;
  const senses:string[]=[];
  for(const item of entry.definitions){if(!object(item))continue;const sense=definitionText(item.definition);if(sense&&!senses.includes(sense))senses.push(sense);if(senses.length===8)break;}
  if(senses.length)entries.push({partOfSpeech:definitionText(entry.partOfSpeech,80)||'Part of speech not supplied',senses});
 }
 return {word,entries,sourceUrl:`https://en.wiktionary.org/wiki/${word.toLowerCase()}#English`};
}
/** Only words already made visible by play/advice can create a lookup action. */
export function definitionVisible(word:string,guesses:readonly string[],revealed:string|null,suggestions:readonly string[]=[]):boolean {
 return definitionWord(word)===word&&(guesses.includes(word)||revealed===word||suggestions.includes(word));
}
type Fetcher=(input:string,init:RequestInit)=>Promise<Response>;
export class DefinitionClient {
 private cache=new Map<string,{result:DefinitionResult;expires:number}>();
 private pending=new Map<string,{promise:Promise<DefinitionResult>;controller:AbortController}>();
 constructor(private fetcher:Fetcher=(url,init)=>fetch(url,init),private timeoutMs=6000,private now:()=>number=Date.now){}
 peek(raw:string):DefinitionResult|null {const word=definitionWord(raw);if(!word)return null;const item=this.cache.get(word);if(!item)return null;if(item.expires<=this.now()){this.cache.delete(word);return null;}this.cache.delete(word);this.cache.set(word,item);return structuredClone(item.result);}
 lookup(raw:string):Promise<DefinitionResult> {
  const word=definitionWord(raw);if(!word)return Promise.reject(new DefinitionError('invalid'));
  const cached=this.peek(word);if(cached)return Promise.resolve(cached);
  const pending=this.pending.get(word);if(pending)return pending.promise;
  const controller=new AbortController();let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort()},this.timeoutMs);
  const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new DefinitionError(timedOut?'timeout':'cancelled')),{once:true}));
  const work=async()=>{
   try{
    const response=await this.fetcher(DEFINITION_ENDPOINT+word.toLowerCase(),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',headers:{Accept:'application/json','Api-User-Agent':'Morrowmark/1.0 (local word definition lookup)'}});
    if(response.status===404)return parseDefinitions({},word);
    if(!response.ok)throw new DefinitionError('network');
    if(Number(response.headers.get('content-length'))>200000)throw new DefinitionError('invalid');
    const raw=await response.text();if(raw.length>200000)throw new DefinitionError('invalid');
    let payload:unknown;try{payload=JSON.parse(raw)}catch{throw new DefinitionError('invalid')}
    return parseDefinitions(payload,word);
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
 cancel(raw:string){const word=definitionWord(raw);if(word){this.pending.get(word)?.controller.abort();this.pending.delete(word);}}
}
