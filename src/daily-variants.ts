import {answerDataset,vocabulary} from './words.ts';
import {largestBucket} from './impossible.ts';
import {uniqueCluePairs} from './one.ts';
import {validDate} from './domain.ts';
import type {Language,DutchRules} from './language.ts';

export type DailyPair={answer:string;clue:string};
const cache=new Map<string,{target:string;witness:string[]}>();
const mixCache=new Map<string,DailyPair[]>();
function hash(value:string):number {let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
function seed(date:string,length:number,language:Language):string {if(!validDate(date))throw new Error('Invalid UTC date.');return `${date}|${language}|${length}|${answerDataset(length,language)}`}
/** A constructive witness: each chosen guess is a surviving answer and remains legal at every difficulty.
 * The deterministic largest-bucket rule must discard that guess unless it is the sole survivor. */
export function dailyAbsurdTarget(date:string,length:number,language:Language,dutchRules:DutchRules=2):{target:string;witness:readonly string[]} {
 const key=seed(date,length,language),cacheKey=`${key}|rules:${language==='nl-NL'?dutchRules:1}`,old=cache.get(cacheKey);if(old)return old;
 const {answers,allowed}=vocabulary(length,language,dutchRules);let candidates=[...answers].sort();const witness:string[]=[];
 if(!candidates.length||candidates.some(w=>!allowed.has(w)))throw new Error('No verified target is available for this dictionary.');
 while(candidates.length>1){const guess=candidates[hash(`${key}|${witness.length}`)%candidates.length];witness.push(guess);const next=largestBucket(candidates,guess,language,dutchRules).candidates;if(next.length>=candidates.length)throw new Error('Cannot construct a reachable target.');candidates=next;}
 witness.push(candidates[0]);const result={target:candidates[0],witness};cache.set(cacheKey,result);return result;
}
/** Stable independent rounds; every first row has exactly one eligible solution. */
export function dailyOneMix(date:string,length:number,language:Language,dutchRules:DutchRules=2):DailyPair[] {
 const key=seed(date,length,language),cacheKey=`${key}|rules:${language==='nl-NL'?dutchRules:1}`,cached=mixCache.get(cacheKey);if(cached)return cached.map(pair=>({...pair}));
 const {answers,allowed}=vocabulary(length,language,dutchRules),pool=uniqueCluePairs(answers,[...allowed],12,language,dutchRules);
 const byAnswer=new Map<string,DailyPair>();for(const pair of pool)if(!byAnswer.has(pair.answer))byAnswer.set(pair.answer,pair);
 const ranked=[...byAnswer.values()].sort((a,b)=>hash(`${key}|${a.answer}|${a.clue}`)-hash(`${key}|${b.answer}|${b.clue}`)||(a.answer<b.answer?-1:a.answer>b.answer?1:0)||(a.clue<b.clue?-1:a.clue>b.clue?1:0));
 if(ranked.length<5)throw new Error('Fewer than five verified unique clues are available.');
 const result=ranked.slice(0,5);mixCache.set(cacheKey,result);return result.map(pair=>({...pair}));
}
