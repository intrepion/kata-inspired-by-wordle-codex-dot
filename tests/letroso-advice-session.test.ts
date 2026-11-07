import {test} from 'node:test';import assert from 'node:assert/strict';
import {LetrosoAdviceSession,type LetrosoAdviceWorker} from '../src/letroso-advice-session.ts';
import {letrosoAdviceKey,observedLetrosoClues,type LetrosoAdviceRequest,type LetrosoAdviceReply,type LetrosoAdviceResult} from '../src/letroso-advice.ts';
import {newLetroso,submitLetroso} from '../src/letroso.ts';
class FakeWorker {
 onmessage:LetrosoAdviceWorker['onmessage']=null;onerror:LetrosoAdviceWorker['onerror']=null;terminated=false;requests:LetrosoAdviceRequest[]=[];
 postMessage(request:LetrosoAdviceRequest){this.requests.push(request)}terminate(){this.terminated=true}
 reply(value:LetrosoAdviceReply){this.onmessage?.call(this as unknown as Worker,{data:value} as MessageEvent)}
}
const result:LetrosoAdviceResult={totalCandidates:2,rankedCandidates:2,shortlisted:false,suggestions:[{word:'APPLE',worstCaseLeft:1,guaranteedEliminations:1,expectedSurvivors:1}]};
const phase=(session:LetrosoAdviceSession)=>session.state.phase;
const opening=()=>observedLetrosoClues(newLetroso('APPLE','en-US','easy'));
test('typing/rejected guesses reuse pending work, and answer/length never cross worker boundary',()=>{
 const workers:FakeWorker[]=[],session=new LetrosoAdviceSession(()=>{const w=new FakeWorker();workers.push(w);return w},()=>{});
 const run=newLetroso('APPLE','en-US','easy');session.show({...opening(),answer:'SECRET',length:6} as ReturnType<typeof opening>);
 session.show(observedLetrosoClues({...run,draft:'AP'}));session.show(observedLetrosoClues(submitLetroso(run,'ZZZZZ').run));assert.equal(workers.length,1);assert.equal(phase(session),'loading');
 assert.deepEqual(Object.keys(workers[0].requests[0].observations).sort(),['feedback','finished','guesses','language']);assert.equal(JSON.stringify(workers[0].requests[0]).includes('SECRET'),false);
 const key=letrosoAdviceKey(opening());workers[0].reply({key,result});assert.equal(phase(session),'ready');assert.equal(workers[0].terminated,true);
 session.show(opening());assert.equal(workers.length,1);
});
test('new clues, language, or leaving cancel work and stale callbacks cannot publish',()=>{
 const workers:FakeWorker[]=[],session=new LetrosoAdviceSession(()=>{const w=new FakeWorker();workers.push(w);return w},()=>{});
 session.show(opening());const stale=workers[0].onmessage;
 const next=observedLetrosoClues(submitLetroso(newLetroso('APPLE','en-US','easy'),'APPLY').run);session.show(next);assert.equal(workers[0].terminated,true);assert.equal(workers.length,2);
 stale?.call(workers[0] as unknown as Worker,{data:{key:letrosoAdviceKey(opening()),result}} as MessageEvent);assert.equal(phase(session),'loading');
 const delayed=workers[1].onmessage;session.show({...next,language:'en-GB'});assert.equal(workers[1].terminated,true);assert.equal(workers.length,3);session.stop();assert.equal(workers[2].terminated,true);assert.equal(phase(session),'hidden');
 delayed?.call(workers[1] as unknown as Worker,{data:{key:letrosoAdviceKey(next),result}} as MessageEvent);assert.equal(phase(session),'hidden');
});
test('cache survives leaving but never reveals rankings after finishing, and late errors do not overwrite results',()=>{
 const workers:FakeWorker[]=[],session=new LetrosoAdviceSession(()=>{const w=new FakeWorker();workers.push(w);return w},()=>{});
 session.show(opening());const lateError=workers[0].onerror;workers[0].reply({key:letrosoAdviceKey(opening()),result});lateError?.call(workers[0] as unknown as Worker,{} as ErrorEvent);assert.equal(phase(session),'ready');
 session.show(null);session.show(opening());assert.equal(phase(session),'ready');assert.equal(workers.length,1);
 session.show({...opening(),finished:true});assert.equal(phase(session),'hidden');assert.equal(workers.length,1);
});
test('worker and startup failures are visible without repeated retries on typing',()=>{
 let attempts=0;const failed=new LetrosoAdviceSession(()=>{attempts++;throw Error('blocked')},()=>{});failed.show(opening());assert.equal(phase(failed),'error');failed.show(opening());assert.equal(attempts,1);failed.stop();assert.equal(phase(failed),'hidden');
 const worker=new FakeWorker(),session=new LetrosoAdviceSession(()=>worker,()=>{});session.show(opening());worker.reply({key:letrosoAdviceKey(opening()),error:'Analysis unavailable'});assert.equal(phase(session),'error');assert.equal(worker.terminated,true);session.show(opening());assert.equal(phase(session),'error');
});
