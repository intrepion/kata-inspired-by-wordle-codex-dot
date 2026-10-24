import {test} from 'node:test';import assert from 'node:assert/strict';
import {vocabulary} from '../src/words.ts';
test('each selectable length has independently curated answers and matching broad guesses, preserving the five-letter guide',()=>{
 for(const length of [4,5,6,7]){const {answers,allowed}=vocabulary(length);assert.ok(answers.length>500);assert.ok(allowed.size>answers.length);assert.ok(answers.every(word=>word.length===length&&allowed.has(word)));assert.ok([...allowed].every(word=>word.length===length));}
 assert.equal(vocabulary(5).answers.length,2103);assert.equal(vocabulary(5).allowed.size,11193);
});
import {newImpossible,submitImpossible,impossibleSnapshot,restoreImpossible} from '../src/impossible.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {adviceKey} from '../src/advice-protocol.ts';
test('adaptive history reconstruction and clue-only candidate analysis keep lengths separate',()=>{
 const keys=new Set<string>();
 for(const length of [4,5,6,7]){let run=newImpossible('normal',length);assert.equal(run.candidates.length,vocabulary(length).answers.length);keys.add(adviceKey(observedClues(run),'optimal'));
 const next=submitImpossible(run,vocabulary(length).answers[10]);assert.equal(next.error,undefined);run=next.run;assert.ok(run.candidates.every(word=>word.length===length&&vocabulary(length).answers.includes(word)));assert.deepEqual(possibleAnswers(observedClues(run)),run.candidates);assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);assert.equal(submitImpossible(run,run.guesses[0]).run,run);
 }assert.equal(keys.size,4);
});
import {score,newRun,submit,dailyAnswer,choosePractice,shareText} from '../src/domain.ts';
test('four through seven letter play uses the matching guide, duplicate scoring and deterministic daily schedule',()=>{
 assert.deepEqual(score('BALLOON','LAGOONS'),['elsewhere','exact','absent','elsewhere','exact','elsewhere','absent']);
 for(const [answer,guess] of [['BOOK','BORE'],['APPLE','ALLEY'],['LETTER','BETTER'],['BALLOON','LAGOONS']]){
  const result=submit(newRun(answer),guess.toLowerCase());assert.equal(result.error,undefined);assert.deepEqual(result.run.guesses,[guess]);assert.equal(score(answer,guess).length,answer.length);assert.ok(submit(result.run,answer.length===5?'BOOK':'APPLE').error);
  assert.ok(vocabulary(answer.length).answers.includes(dailyAnswer('2026-10-24',answer.length)));assert.equal(dailyAnswer('2026-10-24',answer.length),dailyAnswer('2026-10-24',answer.length));assert.equal(choosePractice(answer,()=>0,false,answer.length).answer.length,answer.length);assert.match(shareText('2026-10-24',result.run),new RegExp(`${answer.length} letters`));
 }
});
import {emptySave,encode,decode,recordDaily} from '../src/persistence.ts';
import {saveKeyForPath} from '../src/site.ts';
test('notebooks isolate length and survive reload while an existing five-letter notebook is unchanged',()=>{
 const date='2026-10-24';const legacy=emptySave(date);legacy.daily.draft='CRA';legacy.practice=submit(newRun('APPLE'),'ALLEY').run;legacy.settings.contrast=true;
 assert.deepEqual(decode(encode(legacy),date),legacy);assert.equal(saveKeyForPath('/',5),'morrowmark.v1');
 const keys=new Set<string>();for(const length of [4,5,6,7]){keys.add(saveKeyForPath('/',length));const save=emptySave(date,'hard',length);assert.equal(save.daily.answer.length,length);assert.equal(save.practice.answer.length,length);assert.equal(save.impossible.answer.length,length);save.daily=submit(save.daily,save.daily.answer).run;recordDaily(save,date,save.daily);assert.deepEqual(decode(encode(save),date,length),save);assert.deepEqual(decode(encode(legacy),date,length).daily.guesses, length===5?legacy.daily.guesses:[]);}
 assert.equal(keys.size,4);
});
import {definitionWord} from '../src/definitions.ts';
test('inline dictionary lookups accept only displayed supported-length words',()=>{for(const word of ['BOOK','APPLE','LETTER','BALLOON'])assert.equal(definitionWord(word.toLowerCase()),word);for(const word of ['A','CAT','ELEPHANT','<BOOK>'])assert.equal(definitionWord(word),null)});
import {clueConstraintError,type Difficulty,type Clue} from '../src/domain.ts';
import {largestBucket,impossibleStatus} from '../src/impossible.ts';
import {feedbackCode,analyzeObservations} from '../src/evil-advice.ts';
test('duplicate hints and strict consistency work at every length, with distinct hard behavior',()=>{
 assert.deepEqual(score('ROOF','FOOD'),['elsewhere','exact','exact','absent']);assert.deepEqual(score('LETTER','TELLER'),['elsewhere','exact','elsewhere','absent','exact','exact']);
 for(const [answer,previous] of [['ROOF','FOOD'],['APPLE','ALLEY'],['LETTER','TELLER'],['BALLOON','LAGOONS']]){
 const feedback=[score(answer,previous)],run={guesses:[previous],strictMode:true};assert.equal(clueConstraintError(run,answer,feedback),undefined);assert.ok(clueConstraintError(run,previous,feedback));assert.equal(clueConstraintError({guesses:[previous],hardMode:true},previous,feedback),undefined);
 const encoded=(word:string)=>[...word].map(c=>c.charCodeAt(0)-65);const expected=feedback[0].reduce((n,c)=>n*3+({absent:0,elsewhere:1,exact:2}[c]),0);assert.equal(feedbackCode(encoded(answer),encoded(previous)),expected);
 }
});
test('all adaptive difficulties retain at least one matching curated answer through win or the six-turn limit and reload',()=>{
 for(const length of [4,5,6,7])for(const level of ['easy','normal','hard','strict'] as Difficulty[]){let run=newImpossible(level,length);for(let turn=0;turn<6&&impossibleStatus(run)==='playing';turn++){const next=submitImpossible(run,run.candidates[0]);assert.equal(next.error,undefined);run=next.run;assert.ok(run.candidates.length);assert.ok(run.candidates.every(answer=>run.guesses.every((guess,row)=>score(answer,guess).every((c,i)=>c===run.feedback[row][i]))));assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run)}assert.notEqual(impossibleStatus(run),'playing');assert.ok(vocabulary(length).answers.includes(run.answer));}
 assert.equal(largestBucket(['BOOK','BORE'],'BOOK').candidates[0],'BORE');
});
test('clue-only advice ranks the same remaining candidates for hidden answers with identical clues, excludes other lengths and matches independent bucket counts',()=>{
 for(const length of [4,5,6,7]){const answers=vocabulary(length).answers;let run=newImpossible('normal',length);for(let i=0;i<4&&run.candidates.length>8;i++)run=submitImpossible(run,run.candidates[0]).run;const input=observedClues(run);input.finished=false;
 const result=analyzeObservations(input,'optimal');assert.equal(result.totalCandidates,run.candidates.length);for(const suggestion of result.suggestions){assert.equal(suggestion.word.length,length);assert.ok(vocabulary(length).allowed.has(suggestion.word));const buckets=new Map<string,number>();for(const answer of run.candidates){const pattern=score(answer,suggestion.word).join();buckets.set(pattern,(buckets.get(pattern)??0)+1)}assert.equal(suggestion.worstCaseLeft,Math.max(...buckets.values()));}
 const weak=analyzeObservations(input,'suboptimal');for(const suggestion of weak.suggestions)assert.ok(input.guesses.every((guess,row)=>score(suggestion.word,guess).every((clue,i)=>clue===input.feedback[row][i])));
 if(run.candidates.length>1)assert.deepEqual(observedClues({...newRun(run.candidates[0]),guesses:run.guesses}),observedClues({...newRun(run.candidates[1]),guesses:run.guesses}));
 }
});
import {AdviceSession,type AdviceWorker} from '../src/advice-session.ts';
import type {AdviceRequest,AdviceReply} from '../src/advice-protocol.ts';
test('length switches cancel old advice and never reuse a different-length empty-history result',()=>{
 const workers:{onmessage:AdviceWorker['onmessage'];onerror:AdviceWorker['onerror'];postMessage:(request:AdviceRequest)=>void;terminate:()=>void;terminated:boolean;request?:AdviceRequest}[]=[];
 const session=new AdviceSession(()=>{const worker={onmessage:null,onerror:null,terminated:false,postMessage(request:AdviceRequest){this.request=request},terminate(){this.terminated=true},request:undefined as AdviceRequest|undefined};workers.push(worker);return worker},()=>{});
 session.show(observedClues(newImpossible('easy',7)),'optimal');const first=workers[0],late=first.onmessage;assert.equal(first.request?.observations.wordLength,7);session.show(observedClues(newImpossible('easy',4)),'optimal');assert.equal(first.terminated,true);assert.notEqual(first.request?.key,workers[1].request?.key);
 const result={totalCandidates:1480,eligibleWords:1,suggestions:[]};workers[1].onmessage?.call(workers[1] as unknown as Worker,{data:{key:workers[1].request!.key,result}} as unknown as MessageEvent<AdviceReply>);assert.equal(session.state.phase,'ready');late?.call(first as unknown as Worker,{data:{key:first.request!.key,result:{...result,totalCandidates:4138}}} as unknown as MessageEvent<AdviceReply>);assert.equal(session.state.phase==='ready'&&session.state.result.totalCandidates,1480);session.show(null);assert.equal(session.state.phase,'hidden');
});
import {execFileSync} from 'node:child_process';
test('new length datasets reproduce offline and apply licensed morphology rather than suffix guesses',()=>{
 assert.match(execFileSync(process.execPath,['scripts/generate-lengths.mjs','--check'],{encoding:'utf8'}),/7 4138 answers 29870 guesses/);
 for(const [length,removed] of [[4,['CATS','FEET','WENT','SAID']],[6,['HOUSES','BAKERS','CALLED']],[7,['FARMERS','BROUGHT','WROUGHT']]] as const)for(const word of removed){assert.ok(vocabulary(length).allowed.has(word),word);assert.ok(!vocabulary(length).answers.includes(word),word)}
 for(const [length,kept] of [[4,['DEAD','SEED','BORE','ROSE','DOVE','FEED','WEED','SHOT','DATA']],[6,['PLANET','GROUND']],[7,['JOURNEY','THOUGHT','OVERLAY','REBOUND','WORSTED']]] as const)for(const word of kept)assert.ok(vocabulary(length).answers.includes(word),word);
});
test('non-five-letter optimal ranking matches an independent complete dictionary minimax reference',()=>{
 for(const length of [4,6,7]){let run=newImpossible('normal',length);for(let i=0;i<5&&run.candidates.length>6;i++)run=submitImpossible(run,run.candidates[0]).run;const observations=observedClues(run);observations.finished=false;
 const actual=analyzeObservations(observations,'optimal').suggestions.map(x=>x.word);if(run.candidates.length===1){assert.deepEqual(actual,run.guesses.includes(run.candidates[0])?[]:run.candidates);continue}
 const expected=[...vocabulary(length).allowed].filter(word=>!run.guesses.includes(word)).map(word=>{const groups=new Map<string,number>();for(const answer of run.candidates){const clue=score(answer,word).join();groups.set(clue,(groups.get(clue)??0)+1)}return {word,worst:Math.max(...groups.values()),square:[...groups.values()].reduce((sum,n)=>sum+n*n,0),candidate:run.candidates.includes(word)}}).sort((a,b)=>a.worst-b.worst||a.square-b.square||Number(b.candidate)-Number(a.candidate)||a.word.localeCompare(b.word,'en')).slice(0,5).map(x=>x.word);assert.deepEqual(actual,expected);
 }
});
