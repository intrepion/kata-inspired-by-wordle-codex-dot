import {SAVE_KEY} from './persistence.ts';

export const PROJECT_PATH='/kata-inspired-by-wordle-codex-dot/';
export const PAGES_SAVE_KEY='morrowmark.kata-inspired-by-wordle-codex-dot.v1';

/** Project sites share an origin; never import another site's root notebook. */
export function saveKeyForPath(pathname:string):string {
 return pathname===PROJECT_PATH.slice(0,-1)||pathname.startsWith(PROJECT_PATH)?PAGES_SAVE_KEY:SAVE_KEY;
}
