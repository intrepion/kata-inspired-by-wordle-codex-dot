import type {Language} from './language.ts';
import {SAVE_KEY} from './persistence.ts';

export const PROJECT_PATH='/kata-inspired-by-wordle-codex-dot/';
export const PAGES_SAVE_KEY='morrowmark.kata-inspired-by-wordle-codex-dot.v1';

/** Project sites share an origin; never import another site's root notebook. */
export function saveKeyForPath(pathname:string,length=5,language:Language='en'):string {
 const root=pathname===PROJECT_PATH.slice(0,-1)||pathname.startsWith(PROJECT_PATH)?PAGES_SAVE_KEY:SAVE_KEY;
 const base=language==='en'?root:`${root}.es-MX`;
 return length===5?base:`${base}.letters-${length}`;
}

export const STORAGE_EPOCH='2026-10-spanish-base-word-policy-v1';
export function storageEpochKey(pathname:string):string {return saveKeyForPath(pathname)+'.reset-epoch'}
/** Only this deployment's Morrowmark namespace belongs to this reset. */
export function resetStorageForUpdate(storage:Pick<Storage,'length'|'key'|'getItem'|'setItem'|'removeItem'>,pathname:string):boolean {
 const root=saveKeyForPath(pathname),marker=storageEpochKey(pathname),keys:string[]=[];
 if(storage.getItem(marker)===STORAGE_EPOCH)return false;
 for(let index=0;index<storage.length;index++){const key=storage.key(index);if(key&&(key===root||key.startsWith(root+'.')))keys.push(key)}
 for(const key of keys)storage.removeItem(key);
 storage.setItem(marker,STORAGE_EPOCH);return true;
}
