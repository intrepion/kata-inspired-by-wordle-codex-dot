import {validDate} from './domain.ts';
export type Rules='conquest'|'absurd'|'one'|'smashare'|'letroso';
export type Schedule='daily'|'practice';
export type Selection={rules:Rules;schedule:Schedule};
export function legacySelection(mode:string):Selection {return mode==='impossible'?{rules:'absurd',schedule:'practice'}:mode==='one'?{rules:'one',schedule:'practice'}:{rules:'conquest',schedule:mode==='practice'?'practice':'daily'}}
export function parseSelection(raw:string|null,fallback:Selection):Selection {try{const s=JSON.parse(raw??'null');if((s?.rules==='conquest'||s?.rules==='absurd'||s?.rules==='one'||s?.rules==='smashare'||s?.rules==='letroso')&&(s.schedule==='daily'||s.schedule==='practice'))return {rules:s.rules,schedule:s.schedule}}catch{}return fallback}
export function modeFor(selection:Selection):'daily'|'practice'|'impossible'|'one' {return selection.rules==='conquest'?selection.schedule:selection.rules==='absurd'?'impossible':selection.rules==='smashare'||selection.rules==='letroso'?'practice':'one'}
/** Preserve all original notebooks; new daily variants use date-scoped, independent notebooks. */
export function variantKey(base:string,selection:Selection,date:string,round=0):string {
 if(selection.rules==='letroso')return `${base}.letroso.v1.${selection.schedule}${selection.schedule==='daily'?'.'+date:''}`;
 if(selection.rules==='smashare')return `${base}.smashare.v1.${selection.schedule}${selection.schedule==='daily'?'.'+date:''}`;
 if(selection.schedule!=='daily'||selection.rules==='conquest')return base;
 if(!validDate(date))throw new Error('Invalid UTC date.');
 if(selection.rules==='absurd')return `${base}.absurd-daily.v1.${date}`;
 if(!Number.isInteger(round)||round<0||round>4)throw new Error('Invalid round.');
 return `${base}.one-daily.v1.${date}.${round+1}`;
}
