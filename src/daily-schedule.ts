import {vocabulary,answerDataset} from './words.ts';import type {Language} from './language.ts';
/** Publish before this future UTC boundary; move it forward if publication is delayed. */
export const DAILY_SHUFFLE_START='2026-11-01';
export const DAILY_SCHEDULE_VERSION=1 as const;
export const LEGACY_DAILY_SCHEDULE='alphabetical-v1' as const;
export interface DailyScheduleContext {dailySchedules?:Record<string,typeof LEGACY_DAILY_SCHEDULE>}
const DAY=86400000,START=Date.parse(DAILY_SHUFFLE_START),OLD_START=Date.parse('2026-01-01');
const cache=new Map<string,readonly string[]>();
const modulo=(n:number,d:number)=>((n%d)+d)%d;
function hash(seed:string):number {let value=2166136261;for(let i=0;i<seed.length;i++)value=Math.imul(value^seed.charCodeAt(i),16777619);return value>>>0}
/** Specified 32-bit Mulberry32 stream + rejection-sampled Fisher–Yates; not security randomness. */
function permutation(length:number,language:Language):readonly string[]{
 const key=`lexi-conquest.daily.shuffle.v1|${answerDataset(length,language)}|${language}|${length}`;
 let pool=cache.get(key);if(pool)return pool;
 const shuffled=[...vocabulary(length,language).answers].sort();let state=hash(key+'|'+shuffled.join(','));
 const next=()=>{state=(state+0x6d2b79f5)>>>0;let n=Math.imul(state^(state>>>15),state|1);n^=n+Math.imul(n^(n>>>7),n|61);return (n^(n>>>14))>>>0};
 for(let i=shuffled.length-1;i>0;i--){const size=i+1,limit=4294967296-(4294967296%size);let n;do{n=next()}while(n>=limit);const j=n%size;[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
 pool=Object.freeze(shuffled);cache.set(key,pool);return pool;
}
export function legacyDailyAnswer(date:string,length=5,language:Language='en'):string {const answers=vocabulary(length,language).answers;return answers[modulo(Math.floor((Date.parse(date)-OLD_START)/DAY),answers.length)]}
export function scheduledDailyAnswer(date:string,length=5,language:Language='en'):string {
 const timestamp=Date.parse(date);if(timestamp<START)return legacyDailyAnswer(date,length,language);
 const pool=permutation(length,language);return pool[modulo(Math.floor((timestamp-START)/DAY),pool.length)];
}
/** Only migrated dated notebooks use the old schedule after activation. Never trust a raw saved answer. */
export function notebookDailyAnswer(context:DailyScheduleContext,date:string,length=5,language:Language='en'):string {return context.dailySchedules?.[date]===LEGACY_DAILY_SCHEDULE?legacyDailyAnswer(date,length,language):scheduledDailyAnswer(date,length,language)}
export function legacyDailyLabel(context:DailyScheduleContext,date:string):string {return context.dailySchedules?.[date]===LEGACY_DAILY_SCHEDULE?'Legacy daily schedule':''}
