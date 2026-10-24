import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRun,submit,setDifficulty,difficulty,shareText,score} from '../src/domain.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
import {ANSWERS,ALLOWED} from '../src/words.ts';
import {emptySave,decode,encode,recordDaily} from '../src/persistence.ts';

test('Suboptimal is opt-in, absent old settings stay off in all variants',()=>{
 for(const mode of ['daily','practice','impossible'] as const){
  const save=emptySave('2026-10-24');save.mode=mode;assert.equal(save.settings.suboptimal,undefined);
  assert.equal(decode(encode(save),save.date).settings.suboptimal,undefined);
  save.settings.suboptimal=true;assert.equal(decode(encode(save),save.date).settings.suboptimal,true);
 }
});
test('Easy allows unrestricted midgame play and assistance survives downgrade, reload and share',()=>{
 let run=submit(newRun('APPLE'),'ALLEY').run;run=setDifficulty(run,'easy').run;
 assert.equal(difficulty(run),'easy');assert.equal(submit(run,'CRANE').error,undefined);
 run=setDifficulty(run,'normal').run;assert.equal(run.assisted,true);assert.match(shareText('2026-10-24',run),/Assisted/);
 assert.ok(setDifficulty(run,'strict').error);
 const save=emptySave('2026-10-24');save.practice=run;assert.equal(decode(encode(save),save.date).practice.assisted,true);
 save.daily=submit(newRun(save.daily.answer,'easy'),save.daily.answer).run;recordDaily(save,save.date,save.daily);
 assert.equal(decode(encode(save),save.date).daily.assisted,true);assert.ok(setDifficulty(submit(newRun('APPLE'),'APPLE').run,'easy').error);
});
test('advice transport and initial pools are independent of hidden selected answer',()=>{
 const a=observedClues(newRun('APPLE','easy')),b=observedClues(newRun('LEVEL','easy'));
 assert.deepEqual(a,b);assert.equal(possibleAnswers(a).length,2103);assert.deepEqual(Object.keys(a).sort(),['feedback','finished','guesses']);
 const first=submit(newRun('APPLE'),'ALLEY').run,second=submit(newRun('AMPLE'),'ALLEY').run;
 assert.deepEqual(observedClues(first),observedClues(second));assert.deepEqual(analyzeObservations(observedClues(first),'optimal'),analyzeObservations(observedClues(second),'optimal'));
});
test('Optimal and Suboptimal directions match independent minimax/expected/candidate ordering',()=>{
 const run=submit(newRun('APPLE'),'ALLEY').run,input=observedClues(run),pool=possibleAnswers(input),candidates=new Set(pool);
 const reference=[...ALLOWED].filter(word=>!input.guesses.includes(word)).map(word=>{
  const histogram=new Map<string,number>();for(const answer of pool){const key=score(answer,word).join(',');histogram.set(key,(histogram.get(key)??0)+1);}
  return {word,worstCaseLeft:Math.max(...histogram.values()),guaranteedEliminations:pool.length-Math.max(...histogram.values()),expectedSurvivors:[...histogram.values()].reduce((sum,n)=>sum+n*n,0)/pool.length};
 }).sort((a,b)=>a.worstCaseLeft-b.worstCaseLeft||a.expectedSurvivors-b.expectedSurvivors||Number(candidates.has(b.word))-Number(candidates.has(a.word))||(a.word<b.word?-1:a.word>b.word?1:0));
 assert.deepEqual(analyzeObservations(input,'optimal').suggestions,reference.slice(0,5));
 const weak=analyzeObservations(input,'suboptimal');for(const item of weak.suggestions)assert.deepEqual(score(item.word,'ALLEY'),input.feedback[0]);
 assert.ok(reference.some(item=>score(item.word,'ALLEY').some((clue,i)=>clue!==input.feedback[0][i])));
});
test('singleton Optimal solves directly; tied perfect information prefers remaining answers',()=>{
 const history=['ACORN','BADGE','EQUAL','FEAST'];
 // HEAVY is the sole curated answer consistent with these already-observed rows.
 const input={guesses:history,feedback:history.map(word=>score('HEAVY',word)),finished:false};assert.deepEqual(possibleAnswers(input),['HEAVY']);
 const result=analyzeObservations(input,'optimal');assert.deepEqual(result.suggestions.map(item=>item.word),['HEAVY']);assert.equal(result.suggestions[0].directSolve,true);
 assert.deepEqual(analyzeObservations(input,'suboptimal').suggestions,[]);assert.deepEqual(analyzeObservations({...input,finished:true},'optimal').suggestions,[]);
 const two={guesses:['ALLEY'],feedback:[score('APPLE','ALLEY')]};const pool=possibleAnswers(two);const best=analyzeObservations(two,'optimal').suggestions;
 for(let i=1;i<best.length;i++)if(best[i-1].worstCaseLeft===best[i].worstCaseLeft&&best[i-1].expectedSurvivors===best[i].expectedSurvivors&&pool.includes(best[i].word))assert.ok(pool.includes(best[i-1].word));
});
test('legacy boolean and named difficulties migrate while optional assistance persists separately',()=>{
 const save=emptySave('2026-10-24');const raw=JSON.parse(encode(save));raw.practice={answer:'APPLE',guesses:[],draft:'',difficulty:'easy'};raw.settings={contrast:false,difficulty:'easy',suboptimal:true};
 const restored=decode(JSON.stringify(raw),save.date);assert.equal(difficulty(restored.practice),'easy');assert.equal(restored.practice.assisted,true);assert.equal(difficulty(restored.settings),'easy');assert.equal(restored.settings.suboptimal,true);
 assert.equal(ANSWERS.length,2103);
});
test('new advice preferences do not retroactively mark an old completed daily result',()=>{
 const save=emptySave('2026-10-24');save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,save.date,save.daily);
 const raw=JSON.parse(encode(save));raw.settings={contrast:false,easyMode:true,suboptimal:true};delete raw.daily;
 const restored=decode(JSON.stringify(raw),save.date);assert.equal(restored.daily.assisted,undefined);assert.equal(difficulty(restored.daily),'normal');assert.deepEqual(restored.results,save.results);
});
