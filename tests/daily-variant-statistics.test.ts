import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailyOneMix,dailyAbsurdTarget} from '../src/daily-variants.ts';
import {dailyVariantRecords,dailyVariantStatistics} from '../src/daily-variant-statistics.ts';
import {newRun,awaitingContinuation,continueGuessing} from '../src/domain.ts';
import {submitImpossible} from '../src/impossible.ts';
import {emptySave,encode} from '../src/persistence.ts';
import {initializeNotebookStats,recordCompletion} from '../src/notebook-statistics.ts';
import {variantKey} from '../src/variant-context.ts';

function storage(entries:Record<string,string>){const map=new Map(Object.entries(entries));return {get length(){return map.size},key:(i:number)=>[...map.keys()][i]??null,getItem:(key:string)=>map.get(key)??null};}
function oneRound(date:string,round:number,won:boolean,level:'normal'|'easy'='normal'){
 const save=emptySave(date,false,5,'en');initializeNotebookStats(save,true);const pair=dailyOneMix(date,5,'en')[round];
 save.one={...newRun(pair.answer,level),guesses:won?[pair.clue,pair.answer]:[pair.clue],...(!won?{gaveUp:true}:{})};save.notebookStats!.exposure.one=level;
 recordCompletion(save,'one',date);return encode(save);
}
function absurdRound(date:string){
 const save=emptySave(date,false,5,'en');initializeNotebookStats(save,true);save.impossible.target=dailyAbsurdTarget(date,5,'en').target;save.impossible.gaveUp=true;save.notebookStats!.exposure.impossible='normal';recordCompletion(save,'impossible',date);return encode(save);
}
const base='notebook';const one={rules:'one',schedule:'daily'} as const,absurd={rules:'absurd',schedule:'daily'} as const;
test('combines distinct daily rounds across dates once with filters and isolation',()=>{
 const a='2026-11-01',b='2026-11-02',future='2026-11-03';const items:Record<string,string>={};
 items[variantKey(base,one,a,0)]=oneRound(a,0,true);items[variantKey(base,one,a,1)]=oneRound(a,1,false,'easy');items[variantKey(base,one,b,0)]=oneRound(b,0,true);
 items[variantKey(base,one,future,0)]=oneRound(future,0,true);items[`${base}.one-daily.v1.${a}.selected`]='1';items[variantKey(base,absurd,a)]=absurdRound(a);
 const store=storage(items),args=[store,base,'one',b,5,'en'] as const;const records=dailyVariantRecords(...args);
 assert.equal(records.length,3);assert.deepEqual(records.map(r=>r.date),[a,a,b]);
 const s=dailyVariantStatistics(...args,'all','all');assert.equal(s.played,3);assert.equal(s.wins,2);assert.equal(s.losses,1);assert.equal(s.gaveUp,1);
 assert.equal(dailyVariantStatistics(...args,'easy','all').played,1);assert.equal(dailyVariantStatistics(...args,'all','assisted').played,1);
 assert.deepEqual(dailyVariantStatistics(...args,'all','all'),s);
 assert.equal(dailyVariantStatistics(store,base,'absurd',b,5,'en','all','all').losses,1);
 assert.equal(dailyVariantStatistics(store,'other','one',b,5,'en','all','all').played,0);
});
test('unfinished rounds and malformed keys are not results',()=>{
 const date='2026-11-02',save=emptySave(date,false,5,'en');initializeNotebookStats(save,true);const pair=dailyOneMix(date,5,'en')[0];save.one={...newRun(pair.answer),guesses:[pair.clue]};
 const store=storage({[variantKey(base,one,date,0)]:encode(save),[`${base}.one-daily.v1.${date}.6`]:encode(save)});
 assert.equal(dailyVariantRecords(store,base,'one',date,5,'en').length,0);
});
test('terminal recorded result remains authoritative if an older playing snapshot returns',()=>{
 const date='2026-11-02',raw=oneRound(date,0,true),save=JSON.parse(raw),pair=dailyOneMix(date,5,'en')[0];
 save.one={...newRun(pair.answer),guesses:[pair.clue]};
 const store=storage({[variantKey(base,one,date,0)]:JSON.stringify(save)});
 const result=dailyVariantStatistics(store,base,'one',date,5,'en','all','all');assert.equal(result.played,1);assert.equal(result.wins,1);
});

test('Absurd Daily combines a forced win and loss across dates',()=>{
 const first='2026-11-01',second='2026-11-02',puzzle=dailyAbsurdTarget(first,5,'en'),save=emptySave(first,false,5,'en');initializeNotebookStats(save,true);save.impossible.target=puzzle.target;save.notebookStats!.exposure.impossible='normal';
 for(const guess of puzzle.witness){if(awaitingContinuation(save.impossible))save.impossible=continueGuessing(save.impossible);const next=submitImpossible(save.impossible,guess);assert.equal(next.error,undefined);save.impossible=next.run;}
 assert.equal(recordCompletion(save,'impossible',first),true);const store=storage({[variantKey(base,absurd,first)]:encode(save),[variantKey(base,absurd,second)]:absurdRound(second)});
 const stats=dailyVariantStatistics(store,base,'absurd',second,5,'en','all','all');assert.equal(stats.played,2);assert.equal(stats.wins,1);assert.equal(stats.losses,1);assert.equal(stats.gaveUp,1);
});
