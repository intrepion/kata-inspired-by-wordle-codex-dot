import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGuess,normalizeSpelling,keyboardRows,type DutchRules} from '../src/language.ts';
import {newRun,submit,status,score,keyboardClues,clueConstraintError,shareText,dailyAnswer,type Difficulty} from '../src/domain.ts';
import {vocabulary,supportedLengths,answerDataset} from '../src/words.ts';
import {newImpossible,submitImpossible,impossibleStatus,impossibleSnapshot,restoreImpossible} from '../src/impossible.ts';
import {dailyOneMix,dailyAbsurdTarget} from '../src/daily-variants.ts';
import {validUniqueClue} from '../src/one.ts';
import {newLetroso,submitLetroso,letrosoStatus,restoreLetroso,orderFeedback,letrosoShare} from '../src/letroso.ts';
import {makeSmashPair,newSmashRun,submitSmash,smashStatus,restoreSmashRun,scoreSmash} from '../src/smashare.ts';
import {observedClues,possibleAnswers,type Observations} from '../src/observations.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
import {adviceKey} from '../src/advice-protocol.ts';
import {emptySave,decode,encode,recordDaily,statistics} from '../src/persistence.ts';
import {initializeNotebookStats,notebookStatistics} from '../src/notebook-statistics.ts';
import data from '../src/data/dutch/vocabulary.json';
const lang='nl-NL',date='2026-11-06';
const levels:Difficulty[]=['easy','normal','hard','strict'];
const accented=['OKÉ','CAFÉ','PRIVÉ','COMITÉ','CREËREN','PATIËNT','CARRIÈRE'];
const plain=(word:string)=>word.normalize('NFD').replace(/\p{M}/gu,'');
function unmarked<T>(value:T):T{return JSON.parse(JSON.stringify(value),(key,v)=>key==='dutchRules'?undefined:v)}

test('Dutch canonical source arrays and dataset identities are unchanged at all nine lengths',()=>{
 assert.deepEqual(supportedLengths(lang),[3,4,5,6,7,8,9,10,11]);
 assert.deepEqual(Object.values(data).flatMap(v=>v.answers).filter(w=>plain(w)!==w).sort(),[...accented].sort());
 for(const [length,source] of Object.entries(data))for(const rules of [1,2] as DutchRules[]){
  assert.deepEqual(vocabulary(+length,lang,rules).answers,source.answers);
  assert.deepEqual([...vocabulary(+length,lang,rules).allowed],source.guesses);
  assert.equal(answerDataset(+length,lang),`nl-NL-wiktionary-wordfreq-${length}-v1`);
 }
});

test('Dutch folds decomposed accents, retains spelling, and keeps IJ distinct from EI and Y',()=>{
 for(const word of accented){assert.equal(normalizeGuess(word.normalize('NFD').toLowerCase(),lang),plain(word));assert.equal(normalizeSpelling(word.normalize('NFD'),lang),word);assert.equal(normalizeGuess(word,lang,1),word)}
 assert.equal(normalizeGuess('ĳs',lang),'IJS');assert.equal(normalizeGuess('Ĳ',lang).length,2);
 assert.notEqual(normalizeGuess('IJ',lang),normalizeGuess('EI',lang));assert.notEqual(normalizeGuess('IJ',lang),'Y');
 assert.equal(normalizeGuess('café','es-MX'),'CAFÉ');assert.equal(normalizeGuess('niño','es-MX'),'NIÑO');assert.equal(normalizeGuess('búhay','fil-PH'),'BUHAY');assert.equal(normalizeGuess('ñ','fil-PH'),'Ñ');
 assert.equal(keyboardRows(lang).length,3);assert.ok(keyboardRows(lang,1).join('').includes('É'));
});

for(const level of levels)for(const answer of accented)test(`${level}: ${answer} accepts accented, plain and decomposed guesses in Conquest and Letroso`,()=>{
 for(const input of [answer,plain(answer).toLowerCase(),answer.normalize('NFD')]){
  const solved=submit(newRun(answer,level,lang),input);assert.equal(solved.error,undefined);assert.equal(status(solved.run),'won');assert.equal(solved.run.answer,answer);assert.deepEqual(solved.run.guesses,[plain(answer)]);assert.equal(solved.run.continuation,undefined);
  assert.deepEqual(score(answer,input,lang),Array(answer.length).fill('exact'));
  for(const letter of plain(answer))assert.equal(keyboardClues(solved.run)[letter],'exact');
  assert.match(shareText(date,solved.run),/1\/6/);
  const save=emptySave(date,level,answer.length,lang);save.practice=solved.run;assert.deepEqual(decode(encode(save),date,answer.length,lang).practice,solved.run);
  const ordered=submitLetroso(newLetroso(answer,lang,level),input);assert.equal(ordered.error,undefined);assert.equal(letrosoStatus(ordered.run),'won');assert.equal(ordered.run.answer,answer);assert.deepEqual(restoreLetroso(ordered.run,lang,answer.length),ordered.run);assert.match(letrosoShare(ordered.run,date),/1 guesses/);
  assert.ok(orderFeedback(answer,input,lang).every(t=>t.kind==='ordered'));
 }
});

test('Exact-first duplicate scoring and constraints compare folded letter counts',()=>{
 assert.deepEqual(score('CAFÉ','ÉÉÉÉ',lang),['absent','absent','absent','exact']);
 assert.deepEqual(score('ÉÉABC','AEÉEE',lang),['elsewhere','exact','elsewhere','absent','absent']);
 const guesses=['CÁFE'],feedback=[score('CAFÉ','CÁFE',lang)];
 for(const level of ['hard','strict'])assert.equal(clueConstraintError({guesses,language:lang,dutchRules:2,hardMode:level==='hard',strictMode:level==='strict'},'CAFE',feedback),undefined);
 const run=submit(newRun('WATER','normal',lang),'PRIVÉ').run;assert.equal(run.guesses.length,1);const repeated=submit(run,'prive');assert.match(repeated.error!,/Already/);assert.equal(repeated.run,run);
 const ordered=submitLetroso(newLetroso('WATER',lang,'normal'),'PRIVÉ').run;assert.match(submitLetroso(ordered,'prive').error!,/Already/);
});

for(const rules of [1,2] as DutchRules[])for(const length of supportedLengths(lang))test(`Rules ${rules}, ${length} letters: One uniqueness and reachable Absurd targets`,()=>{
 const answers=vocabulary(length,lang,rules).answers;
 const mix=dailyOneMix(date,length,lang,rules);assert.equal(mix.length,5);assert.equal(new Set(mix.map(p=>p.answer)).size,5);
 for(const pair of mix){assert.ok(validUniqueClue(pair.answer,pair.clue,answers,lang,rules));for(const level of levels){const start={...newRun(pair.answer,level,lang,rules),guesses:[pair.clue]};const solved=submit(start,pair.answer);assert.equal(solved.error,undefined);assert.equal(status(solved.run),'won')}}
 const target=dailyAbsurdTarget(date,length,lang,rules);
 for(const level of levels){let run={...newImpossible(level,length,lang,rules),target:target.target};for(const guess of target.witness){if(run.continuation==='pending')run={...run,continuation:'unlimited'};const next=submitImpossible(run,guess);assert.equal(next.error,undefined);run={...next.run,target:target.target}}assert.equal(impossibleStatus(run),'won');assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),(({target,...rest})=>rest)(run))}
});

// Fixed source pairs exercise accented canonical answers without relying on a daily draw.
const accentPairs=Object.values(data).flatMap(v=>v.answers.flatMap(first=>v.answers.flatMap(second=>{
 const pair=makeSmashPair(first,second);return pair&&plain(pair.merged)!==pair.merged?[pair]:[];
})));
test('Smashare accented source pairs exist and solve/restore at every difficulty',()=>{
 assert.ok(accentPairs.length>0);
 for(const pair of accentPairs)for(const level of levels){const run=newSmashRun(pair,lang,level);for(const input of [pair.merged,plain(pair.merged),pair.merged.normalize('NFD')]){const solved=submitSmash(run,input);assert.equal(solved.error,undefined);assert.equal(smashStatus(solved.run),'won');assert.deepEqual(solved.run.answer,pair);assert.deepEqual(restoreSmashRun(solved.run,lang,pair.first.length),solved.run);assert.deepEqual(scoreSmash(pair,pair,lang),Array(pair.merged.length).fill('exact'))}}
});

test('Advice uses folded public clues, matching metrics, and rules-specific cache identity',()=>{
 const run=submit(newRun('CAFÉ','easy',lang),'DAME').run,input=observedClues(run);
 assert.ok(possibleAnswers(input).includes('CAFÉ'));assert.notEqual(adviceKey(input),adviceKey({...input,dutchRules:1}));
 const result=analyzeObservations(input,'optimal'),candidates=possibleAnswers(input);
 assert.equal(result.totalCandidates,candidates.length);assert.equal(new Set(result.suggestions.map(s=>plain(s.word))).size,result.suggestions.length);
 for(const suggestion of result.suggestions){const buckets=new Map<string,number>();for(const answer of candidates){const code=score(answer,suggestion.word,lang).join();buckets.set(code,(buckets.get(code)??0)+1)}assert.equal(suggestion.worstCaseLeft,Math.max(...buckets.values()));assert.equal(suggestion.expectedSurvivors,[...buckets.values()].reduce((sum,n)=>sum+n*n,0)/candidates.length)}
});

test('Unmarked legacy fixed saves preserve accent-sensitive guesses, drafts and completed outcomes',()=>{
 for(const answer of accented){const save=emptySave(date,'normal',answer.length,lang);const guess=vocabulary(answer.length,lang,1).answers.find(w=>w!==answer)!;save.practice={...newRun(answer,'normal',lang,1),guesses:[guess],draft:answer.slice(0,2)};const legacy=unmarked(save),restored=decode(JSON.stringify(legacy),date,answer.length,lang);assert.equal(restored.practice.dutchRules,1);assert.deepEqual(restored.practice.guesses,[guess]);assert.equal(restored.practice.draft,save.practice.draft);assert.equal(restored.practice.answer,answer);assert.equal(status(restored.practice),'playing');assert.deepEqual(score(answer,guess,lang,1),score(answer,guess));
 save.practice=submit(newRun(answer,'normal',lang,1),answer).run;assert.equal(status(decode(JSON.stringify(unmarked(save)),date,answer.length,lang).practice),'won');}
 // Both spellings were independently legal before the change and must not collapse.
 const collision=Object.values(data).flatMap(v=>v.guesses).find(w=>plain(w)!==w&&vocabulary(w.length,lang,1).allowed.has(plain(w)));
 assert.ok(collision);const save=emptySave(date,'normal',collision.length,lang);save.practice={...newRun(vocabulary(collision.length,lang).answers.find(w=>w!==collision&&w!==plain(collision))!,'normal',lang,1),guesses:[collision,plain(collision)]};assert.deepEqual(decode(JSON.stringify(unmarked(save)),date,collision.length,lang).practice.guesses,[collision,plain(collision)]);
});

test('Unmarked adaptive, One, Smashare and Letroso saves preserve legacy replay and accented drafts',()=>{
 let absurd=submitImpossible(newImpossible('normal',4,lang,1),'CAFÉ').run;absurd.draft='É';const restored=restoreImpossible(unmarked(impossibleSnapshot(absurd)));assert.deepEqual(restored,absurd);
 const pair=dailyOneMix(date,4,lang,1)[0],save=emptySave(date,'normal',4,lang);save.one={...newRun(pair.answer,'normal',lang,1),guesses:[pair.clue]};save.mode='one';const decoded=decode(JSON.stringify(unmarked(save)),date,4,lang);assert.equal(decoded.mode,'one');assert.deepEqual(decoded.one,save.one);
 const smash=newSmashRun(accentPairs[0],lang,'normal',1);smash.draft='É';assert.deepEqual(restoreSmashRun(unmarked(smash),lang,smash.length),smash);
 const ordered=newLetroso('CAFÉ',lang,'normal',1);ordered.draft='É';assert.deepEqual(restoreLetroso(unmarked(ordered),lang,4),ordered);
});

test('Daily folded wins retain historical rule metadata and statistics after reload',()=>{
 for(const rules of [1,2] as DutchRules[]){let chosen='';for(let day=0;day<4000;day++){const d=new Date(Date.UTC(2026,0,1+day)).toISOString().slice(0,10);if(dailyAnswer(d,4,lang)==='CAFÉ'){chosen=d;break}}assert.ok(chosen);
 const save=emptySave(chosen,'normal',4,lang);save.daily=submit(newRun('CAFÉ','normal',lang,rules),rules===1?'CAFÉ':'CAFE').run;recordDaily(save,chosen,save.daily);const raw=rules===1?JSON.stringify(unmarked(save)):encode(save),restored=decode(raw,chosen,4,lang);assert.equal(status(restored.daily),'won');assert.equal(restored.daily.dutchRules,rules);assert.equal(restored.history[chosen].dutchRules,rules);assert.equal(statistics(restored.results,chosen,restored.history,4,lang).wins,1);initializeNotebookStats(restored);assert.equal(notebookStatistics(restored,'daily','all',chosen).wins,1)}
});

test('Every accented source guess accepts plain/decomposed input without mutating the canonical lists',()=>{
 let count=0;
 for(const source of Object.values(data))for(const word of source.guesses){if(plain(word)===word)continue;count++;const answer=source.answers.find(a=>plain(a)!==plain(word))!;
  for(const raw of [word,plain(word),word.normalize('NFD')]){const checked=submit(newRun(answer,'normal',lang),raw);assert.equal(checked.error,undefined,word);assert.deepEqual(checked.run.guesses,[plain(word)]);assert.equal(submitLetroso(newLetroso(answer,lang,'normal'),raw).error,undefined,word)}
 }
 assert.ok(count>=accented.length);
});

test('A legacy OKE guess must not become an early OKÉ win or erase subsequent guesses',()=>{
 const save=emptySave(date,'normal',3,lang);let run=newRun('OKÉ','normal',lang,1);
 for(const guess of ['OKE','ZEE','OKÉ']){const next=submit(run,guess);assert.equal(next.error,undefined);run=next.run}save.practice=run;
 const restored=decode(JSON.stringify(unmarked(save)),date,3,lang);assert.deepEqual(restored.practice.guesses,['OKE','ZEE','OKÉ']);assert.equal(status(restored.practice),'won');assert.equal(restored.practice.dutchRules,1);
 save.practice={...newRun('OKÉ','normal',lang,1),guesses:['OKE'],gaveUp:true};const lost=decode(JSON.stringify(unmarked(save)),date,3,lang);assert.equal(status(lost.practice),'lost');assert.deepEqual(lost.practice.guesses,['OKE']);
});

test('Legacy and folded extended play and pending continuations survive reload',()=>{
 for(const rules of [1,2] as DutchRules[]){const save=emptySave(date,'normal',4,lang);let run=newRun('CAFÉ','normal',lang,rules);
 for(const word of vocabulary(4,lang,rules).answers.filter(w=>plain(w)!=='CAFE').slice(0,6)){const next=submit(run,word);assert.equal(next.error,undefined);run=next.run}
 assert.equal(run.continuation,'pending');save.practice=run;let restored=decode(rules===1?JSON.stringify(unmarked(save)):encode(save),date,4,lang);assert.deepEqual(restored.practice,run);
 run={...run,continuation:'unlimited'};const solved=submit(run,rules===1?'CAFÉ':'CAFE');assert.equal(solved.error,undefined);assert.equal(status(solved.run),'won');save.practice=solved.run;restored=decode(rules===1?JSON.stringify(unmarked(save)):encode(save),date,4,lang);assert.deepEqual(restored.practice,solved.run);assert.equal(restored.practice.guesses.length,7)}
});

test('Advice retains canonical spelling for a single folded possible answer and never repeats a guessed alias',()=>{
 const input:Observations={language:lang as 'nl-NL',dutchRules:2 as const,wordLength:4,guesses:['CAFE'],feedback:[['exact','exact','exact','exact']]};
 assert.deepEqual(possibleAnswers(input),['CAFÉ']);assert.deepEqual(analyzeObservations(input,'optimal').suggestions,[]);
 const partial=observedClues(submit(newRun('CAFÉ','normal',lang),'DAME').run);
 for(const rules of [1,2] as DutchRules[]){const start=observedClues(newRun('CAFÉ','normal',lang,rules));const result=analyzeObservations(start,'optimal');for(const suggestion of result.suggestions){const buckets=new Map<string,number>();for(const answer of vocabulary(4,lang).answers){const key=score(answer,suggestion.word,lang,rules).join();buckets.set(key,(buckets.get(key)??0)+1)}assert.equal(suggestion.worstCaseLeft,Math.max(...buckets.values()))}}
 assert.equal(partial.dutchRules,2);
});
