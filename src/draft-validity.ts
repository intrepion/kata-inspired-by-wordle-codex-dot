import {vocabulary,isSupportedLength} from './words.ts';
import {parseSmashGuess} from './smashare.ts';
import {normalizeGuess,type Language,type DutchRules} from './language.ts';

/** Color only dictionary-invalid drafts, never difficulty or repeated-guess errors. */
export function invalidDraft(draft:string,mode:'fixed'|'smashare'|'letroso',length:number,language:Language,dutchRules:DutchRules=2):boolean {
 const word=normalizeGuess(draft,language,dutchRules);
 if(mode==='letroso')return word.length>=3&&word.length<=11&&(!isSupportedLength(word.length,language)||!vocabulary(word.length,language,dutchRules).allowed.has(word));
 if(mode==='smashare')return word.length===2*length-2&&!parseSmashGuess(word,length,language,dutchRules);
 return word.length===length&&!vocabulary(length,language,dutchRules).allowed.has(word);
}
