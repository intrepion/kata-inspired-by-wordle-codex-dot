import {smashStatus,type SmashRun} from './smashare.ts';
import type {Difficulty} from './domain.ts';
export type SmashResult={id:string;date:string|null;won:boolean;turns:number;difficulty:Difficulty|'legacy';assisted:boolean|null;gaveUp:boolean;extended:boolean};
export function readSmashResults(raw:string|null):SmashResult[] {
 try{const data=JSON.parse(raw??'[]');if(!Array.isArray(data))return [];return data.filter((r:SmashResult)=>r&&typeof r.id==='string'&&(r.date===null||typeof r.date==='string'&&/^20\d\d-\d\d-\d\d$/.test(r.date))&&typeof r.won==='boolean'&&Number.isSafeInteger(r.turns)&&r.turns>=0&&['easy','normal','hard','strict','legacy'].includes(r.difficulty)&&(typeof r.assisted==='boolean'||r.assisted===null)&&typeof r.gaveUp==='boolean'&&typeof r.extended==='boolean');}catch{return []}
}
export function addSmashResult(records:SmashResult[],id:string,date:string|null,run:SmashRun):SmashResult[] {
 const state=smashStatus(run);if(state==='playing'||records.some(r=>r.id===id))return records;
 return [...records,{id,date,won:state==='won',turns:run.guesses.length,difficulty:run.easiest??'legacy',assisted:run.assisted??null,gaveUp:run.gaveUp===true,extended:run.continuation==='unlimited'}];
}
export function summarizeSmash(records:SmashResult[],difficulty:string,assistance:string,today:string){
 const results=records.filter(r=>(r.date===null||r.date<=today)&&(difficulty==='all'||r.difficulty===difficulty)&&(assistance==='all'||assistance==='unknown'&&r.assisted===null||assistance==='assisted'&&r.assisted===true||assistance==='unassisted'&&r.assisted===false));
 const histogram=[0,0,0,0,0,0];let current=0,best=0;for(const r of results){if(r.won){if(r.turns>=1&&r.turns<=6)histogram[r.turns-1]++;current++;best=Math.max(best,current)}else current=0}
 const wins=results.filter(r=>r.won).length;return {played:results.length,wins,losses:results.length-wins,percent:results.length?Math.round(100*wins/results.length):0,current,best,histogram,withinSixWins:results.filter(r=>r.won&&r.turns<=6).length,extendedWins:results.filter(r=>r.won&&r.turns>6).length,extendedPlayed:results.filter(r=>r.extended).length,gaveUp:results.filter(r=>r.gaveUp).length,assisted:results.filter(r=>r.assisted===true).length,unknownAssistance:results.filter(r=>r.assisted===null).length,legacy:results.filter(r=>r.difficulty==='legacy').length};
}
