import {letrosoStatus,type LetrosoRun} from './letroso.ts';
import type {SmashResult} from './smash-statistics.ts';
/** A saved round contributes at most one completion to its schedule's ledger. */
export function addLetrosoResult(records:SmashResult[],id:string,date:string,run:LetrosoRun):SmashResult[]{
 const state=letrosoStatus(run);if(state==='playing'||records.some(r=>r.id===id))return records;
 return [...records,{id,date,won:state==='won',turns:run.guesses.length,difficulty:run.easiest,assisted:run.assisted,letterHints:0,gaveUp:run.gaveUp===true,extended:run.guesses.length>6}];
}
