import type {Language} from './language.ts';
import {SAVE_KEY} from './persistence.ts';

export const PROJECT_PATH='/kata-inspired-by-wordle-codex-dot/';
export const PAGES_SAVE_KEY='morrowmark.kata-inspired-by-wordle-codex-dot.v1';

/** Project sites share an origin; never import another site's root notebook. */
export function saveKeyForPath(pathname:string,length=5,language:Language='en'):string {
 const root=pathname===PROJECT_PATH.slice(0,-1)||pathname.startsWith(PROJECT_PATH)?PAGES_SAVE_KEY:SAVE_KEY;
 const base=language==='en'?root:`${root}.${language}`;
 return length===5?base:`${base}.letters-${length}`;
}

export const STORAGE_EPOCH='2026-10-spanish-base-word-policy-v1';
export function storageEpochKey(pathname:string):string {return saveKeyForPath(pathname)+'.reset-epoch'}
/** Retained for old callers. Updates never erase local notebooks or preferences. */
export function resetStorageForUpdate(_storage:Pick<Storage,'length'|'key'|'getItem'|'setItem'|'removeItem'>,_pathname:string):boolean {return false}

export const ENGLISH_UPDATE_NAMESPACE='english-base-v1';
/** Original keys stay untouched and recoverable, including removed-answer rounds. */
export function activeSaveKeyForPath(pathname:string,length=5,language:Language='en'):string {
 const key=saveKeyForPath(pathname,length,language);
 return language==='en'&&length!==3?`${key}.${ENGLISH_UPDATE_NAMESPACE}`:key;
}
/** Copy only English game data. Preferences and other languages retain their exact keys.
 * Copy-before-write is idempotent. A failed copy must block app writes, never delete originals.
 */
export function preserveEnglishStorageForUpdate(storage:Pick<Storage,'length'|'key'|'getItem'|'setItem'>,pathname:string):number {
 const marker=activeSaveKeyForPath(pathname)+'.import-complete';if(storage.getItem(marker)==='1')return 0;
 let copied=0;
 for(const {key,destination} of originalEnglishKeys(storage,pathname)){
  if(storage.getItem(destination)!==null)continue;
  const raw=storage.getItem(key);if(raw===null)continue;
  storage.setItem(destination,raw);
  if(storage.getItem(destination)!==raw)throw new Error('The previous English notebook could not be preserved.');
  copied++;
 }
 storage.setItem(marker,'1');if(storage.getItem(marker)!=='1')throw new Error('The English notebook migration could not finish.');
 return copied;
}
function originalEnglishKeys(storage:Pick<Storage,'length'|'key'>,pathname:string):{key:string;destination:string}[]{
 const root=saveKeyForPath(pathname),keys=Array.from({length:storage.length},(_,i)=>storage.key(i)),entries:{key:string;destination:string}[]=[];
 for(const key of keys){
  if(!key||!(key===root||key.startsWith(root+'.')))continue;
  let length=5,tail=key.slice(root.length);
  const match=/^\.letters-(4|6|7|8|9|10|11)(?=\.|$)/.exec(tail);
  if(match){length=Number(match[1]);tail=tail.slice(match[0].length)}
  if(tail!==''&&!/^\.(?:absurd-daily|one-daily|smashare|smashare-stats|letroso|letroso-hidden|letroso-stats)\./.test(tail))continue;
  const destination=activeSaveKeyForPath(pathname,length)+tail;
  entries.push({key,destination});
 }
 return entries;
}

/** Export exact original values for recovery without replacing active progress. */
export function exportOriginalEnglishNotebooks(storage:Pick<Storage,'length'|'key'|'getItem'>,pathname:string):string {
 const notebooks=Object.fromEntries(originalEnglishKeys(storage,pathname).map(({key})=>[key,storage.getItem(key)]));
 return JSON.stringify({version:1,description:'Original English notebooks before the base-word answer update. Values are preserved verbatim.',notebooks},null,2);
}
