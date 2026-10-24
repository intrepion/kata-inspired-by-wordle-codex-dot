import {score} from '../src/domain.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AdviceSession,type AdviceWorker} from '../src/advice-session.ts';
import {newImpossible,submitImpossible} from '../src/impossible.ts';
import {adviceKey,type AdviceReply,type AdviceRequest} from '../src/evil-advice.ts';
class FakeWorker {
 onmessage:AdviceWorker['onmessage']=null;onerror:AdviceWorker['onerror']=null;terminated=false;requests:AdviceRequest[]=[];
 postMessage(request:AdviceRequest){this.requests.push(request)}
 terminate(){this.terminated=true}
 reply(value:AdviceReply){this.onmessage?.call(this as unknown as Worker,{data:value} as MessageEvent)}
}
const phase=(session:AdviceSession):string=>session.state.phase;
const result=(totalCandidates:number)=>({totalCandidates,eligibleWords:1,suggestions:[{word:'XYLEM',worstCaseLeft:totalCandidates,guaranteedEliminations:0}]});
test('typing and rejected guesses reuse work; leaving cancels and stale results cannot return',()=>{
 const workers:FakeWorker[]=[];const session=new AdviceSession(()=>{const worker=new FakeWorker();workers.push(worker);return worker},()=>{});
 const first=newImpossible();session.show(first);assert.equal(phase(session),'loading');
 const typing={...first,draft:'CRA'};session.show(typing);session.show(submitImpossible(first,'ZZZZZ').run);assert.equal(workers.length,1);
 const stale=workers[0].onmessage;session.show(null);assert.equal(workers[0].terminated,true);assert.equal(phase(session),'hidden');
 stale?.call(workers[0] as unknown as Worker,{data:{key:adviceKey(first),result:result(3493)}} as MessageEvent);assert.equal(phase(session),'hidden');
 session.show(first);assert.equal(workers.length,2);
 const second=submitImpossible(first,'ADIEU').run;session.show(second);assert.equal(workers[1].terminated,true);assert.equal(workers.length,3);
 workers[1].reply({key:adviceKey(first),result:result(3493)});assert.equal(phase(session),'loading');
 workers[2].reply({key:adviceKey(second),result:result(second.candidates.length)});assert.equal(phase(session),'ready');
 const count=workers.length;session.show(submitImpossible(second,'ADIEU').run);assert.equal(workers.length,count);
 session.show(null);session.show(second);assert.equal(phase(session),'ready');assert.equal(workers.length,count);
});
test('finished/singleton rounds clear ranks and errors leave playable advice state',()=>{
 const worker=new FakeWorker();const session=new AdviceSession(()=>worker,()=>{});const run=newImpossible();session.show(run);
 const singleton={guesses:['ACORN','BADGE','EQUAL','FEAST'],feedback:['ACORN','BADGE','EQUAL','FEAST'].map(word=>score('HEAVY',word))};session.show(singleton);assert.equal(phase(session),'unavailable');assert.equal(worker.terminated,true);
 session.show({...run,guesses:['XYLEM','JAZZY','FUZZY','BOOZY','DIZZY','MAMMA']});assert.equal(phase(session),'unavailable');
 const failed=new AdviceSession(()=>{throw new Error('Worker blocked')},()=>{});failed.show(run);assert.equal(phase(failed),'error');failed.stop();assert.equal(phase(failed),'hidden');
});
test('ranking directions are separate and toggle-off rejects a delayed response without leaking run fields',()=>{
 const workers:FakeWorker[]=[];const session=new AdviceSession(()=>{const w=new FakeWorker();workers.push(w);return w},()=>{});const run=newImpossible();
 session.show(run,'optimal');const request=workers[0].requests[0];assert.equal(request.kind,'optimal');assert.deepEqual(Object.keys(request.observations).sort(),['feedback','finished','guesses']);assert.equal('answer' in request.observations,false);assert.equal('candidates' in request.observations,false);
 const delayed=workers[0].onmessage;session.show(null);delayed?.call(workers[0] as unknown as Worker,{data:{key:request.key,result:result(3493)}} as MessageEvent);assert.equal(phase(session),'hidden');
 session.show(run,'suboptimal');assert.notEqual(workers[1].requests[0].key,request.key);assert.equal(workers[0].terminated,true);
});

test('Easy opening analysis runs before any guess and reuses only identical public empty histories across variants and fresh rounds',async()=>{
 const {newRun,submit}=await import('../src/domain.ts');const {observedClues}=await import('../src/observations.ts');const {analyzeObservations}=await import('../src/evil-advice.ts');const {ANSWERS,ALLOWED}=await import('../src/words.ts');
 const workers:FakeWorker[]=[];const session=new AdviceSession(()=>{const worker=new FakeWorker();workers.push(worker);return worker},()=>{});
 const fresh=[newRun('APPLE','easy'),newRun('LEVEL','easy'),newImpossible('easy')];
 const input=observedClues(fresh[0]);session.show(input,'optimal');assert.equal(phase(session),'loading');assert.equal(session.state.phase==='loading'&&session.state.total,ANSWERS.length);
 assert.deepEqual(workers[0].requests[0].observations,{guesses:[],feedback:[],finished:false});const opening=analyzeObservations(input,'optimal');assert.equal(opening.totalCandidates,3493);assert.equal(opening.eligibleWords,11193);assert.equal(opening.suggestions.length,5);for(const item of opening.suggestions)assert.ok(ALLOWED.has(item.word));
 workers[0].reply({key:adviceKey(input,'optimal'),result:opening});assert.equal(phase(session),'ready');
 for(const run of fresh){session.show(null);session.show(observedClues(run),'optimal');assert.equal(phase(session),'ready');assert.equal(workers.length,1);assert.equal(run.assisted,true)}
 session.show(observedClues(submit(fresh[0],'ALLEY').run),'optimal');assert.equal(phase(session),'loading');const late=workers[1].onmessage;session.show(observedClues(newRun('APPLE','easy')),'optimal');assert.equal(workers[1].terminated,true);assert.equal(phase(session),'ready');late?.call(workers[1] as unknown as Worker,{data:{key:workers[1].requests[0].key,result:result(2)}} as MessageEvent);assert.equal(session.state.phase==='ready'&&session.state.result.totalCandidates,3493);session.stop();
});
