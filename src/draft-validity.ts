import {vocabulary} from './words.ts';
import {parseSmashGuess} from './smashare.ts';
import {normalizeGuess,type Language} from './language.ts';

/** Color only dictionary-invalid drafts, never difficulty or repeated-guess errors. */
export function invalidDraft(draft:string,mode:'fixed'|'smashare'|'letroso',length:number,language:Language):boolean {
 const word=normalizeGuess(draft,language);
 if(mode==='letroso')return word.length>=3&&word.length<=11&&!vocabulary(word.length,language).allowed.has(word);
 if(mode==='smashare')return word.length===2*length-2&&!parseSmashGuess(word,length,language);
 return word.length===length&&!vocabulary(length,language).allowed.has(word);
}
