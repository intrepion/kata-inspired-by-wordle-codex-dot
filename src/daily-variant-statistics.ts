import {validDate} from './domain.ts';
import {dailyAbsurdTarget} from './daily-variants.ts';
import {decode,emptySave} from './persistence.ts';
import {initializeNotebookStats,notebookStatistics,type Completion,type StatsDifficulty,type AssistanceFilter} from './notebook-statistics.ts';
import {savedDutchRules,type Language} from './language.ts';

type StorageReader=Pick<Storage,'length'|'key'|'getItem'>;
/** Read each dated notebook once. A scope has at most one recorded result. */
export function dailyVariantRecords(storage:StorageReader,base:string,rules:'one'|'absurd',today:string,length:number,language:Language):Completion[] {
 const marker=`${base}.${rules==='one'?'one-daily':'absurd-daily'}.v1.`,scopes:{key:string;date:string;round:number}[]=[];
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);if(!key?.startsWith(marker))continue;
  const tail=key.slice(marker.length),match=rules==='one'?/^(\d{4}-\d{2}-\d{2})\.([1-5])$/.exec(tail):/^(\d{4}-\d{2}-\d{2})$/.exec(tail);
  if(!match||!validDate(match[1])||match[1]>today)continue;
  scopes.push({key,date:match[1],round:rules==='one'?Number(match[2]):0});
 }
 scopes.sort((a,b)=>a.date.localeCompare(b.date)||a.round-b.round);
 const result:Completion[]=[];const seen=new Set<string>();
 for(const scope of scopes){
  const id=`${scope.date}:${scope.round}`;if(seen.has(id))continue;seen.add(id);
  const raw=storage.getItem(scope.key);if(!raw)continue;
  let dutchRules:1|2=1;try{dutchRules=savedDutchRules(JSON.parse(raw).impossible)}catch{/* Decode handles malformed saves. */}
  const target=rules==='absurd'?dailyAbsurdTarget(scope.date,length,language,dutchRules).target:undefined;
  const saved=decode(raw,scope.date,length,language,target);initializeNotebookStats(saved,false);
  const mode=rules==='one'?'one':'impossible';
  const stats=saved.notebookStats!,record=stats.records[stats.active[mode]];
  if(!record||record.mode!==mode)continue;
  // The scope date is authoritative; internal order only applies within each notebook.
  result.push({...record,date:scope.date,order:result.length+1});
 }
 return result;
}
export function dailyVariantStatistics(storage:StorageReader,base:string,rules:'one'|'absurd',today:string,length:number,language:Language,level:StatsDifficulty|'all',assistance:AssistanceFilter){
 const records=dailyVariantRecords(storage,base,rules,today,length,language),save=emptySave(today,false,length,language);initializeNotebookStats(save,true);
 save.notebookStats!.records=Object.fromEntries(records.map((record,index)=>[`${rules}:${index+1}`,record]));
 return notebookStatistics(save,rules==='one'?'one':'impossible',level,today,assistance);
}
