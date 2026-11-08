import {test} from 'node:test';import assert from 'node:assert/strict';
import {SmashAdviceSession,type SmashAdviceWorker} from '../src/smash-advice-session.ts';
import {smashAdviceKey,observedSmashClues,type SmashAdviceRequest,type SmashAdviceReply,type SmashAdviceResult} from '../src/smash-advice.ts';
import {newSmashRun,submitSmash,dailySmashPair} from '../src/smashare.ts';
class FakeWorker {
 onmessage:SmashAdviceWorker['onmessage']=null;onerror:SmashAdviceWorker['onerror']=null;terminated=false;requests:SmashAdviceRequest[]=[];
 postMessage(request:SmashAdviceRequest){this.requests.push(request)}terminate(){this.terminated=true}
 reply(value:SmashAdviceReply){this.onmessage?.call(this as unknown as Worker,{data:value} as MessageEvent)}
}
const result:SmashAdviceResult={pairs:[],scanned:5,truncated:false};
const phase=(session:SmashAdviceSession)=>session.state.phase;
const opening=()=>observedSmashClues(newSmashRun(dailySmashPair('2026-11-02',5,'en-US'),'en-US','easy'));
test('typing/rejected guesses reuse pending work, and answer never crosses worker boundary',()=>{
 const workers:FakeWorker[]=[],session=new SmashAdviceSession(()=>{const w=new FakeWorker();workers.push(w);return w},()=>{});
 const run=newSmashRun(dailySmashPair('2026-11-02',5,'en-US'),'en-US','easy');session.show({...opening(),answer:'SECRET'} as ReturnType<typeof opening>);
 session.show(observedSmashClues({...run,draft:'AP'}));session.show(observedSmashClues(submitSmash(run,'ZZZZZ').run));assert.equal(workers.length,1);assert.equal(phase(session),'loading');
 assert.deepEqual(Object.keys(workers[0].requests[0].observations).sort(),['feedback','finished','guesses','language','length']);assert.equal(JSON.stringify(workers[0].requests[0]).includes('SECRET'),false);
 const key=smashAdviceKey(opening());workers[0].reply({key,result});assert.equal(phase(session),'ready');assert.equal(workers[0].terminated,true);
 session.show(opening());assert.equal(workers.length,1);
});
test('new clues, language, or leaving cancel work and stale callbacks cannot publish',()=>{
 const workers:FakeWorker[]=[],session=new SmashAdviceSession(()=>{const w=new FakeWorker();workers.push(w);return w},()=>{});
 session.show(opening());const stale=workers[0].onmessage;
 const next=observedSmashClues(submitSmash(newSmashRun(dailySmashPair('2026-11-02',5,'en-US'),'en-US','easy'),'FRESHEEP').run);session.show(next);assert.equal(workers[0].terminated,true);assert.equal(workers.length,2);
 stale?.call(workers[0] as unknown as Worker,{data:{key:smashAdviceKey(opening()),result}} as MessageEvent);assert.equal(phase(session),'loading');
 const delayed=workers[1].onmessage;session.show({...next,language:'en-GB'});assert.equal(workers[1].terminated,true);assert.equal(workers.length,3);session.stop();assert.equal(workers[2].terminated,true);assert.equal(phase(session),'hidden');
 delayed?.call(workers[1] as unknown as Worker,{data:{key:smashAdviceKey(next),result}} as MessageEvent);assert.equal(phase(session),'hidden');
});
test('cache survives leaving but never reveals rankings after finishing, and late errors do not overwrite results',()=>{
 const workers:FakeWorker[]=[],session=new SmashAdviceSession(()=>{const w=new FakeWorker();workers.push(w);return w},()=>{});
 session.show(opening());const lateError=workers[0].onerror;workers[0].reply({key:smashAdviceKey(opening()),result});lateError?.call(workers[0] as unknown as Worker,{} as ErrorEvent);assert.equal(phase(session),'ready');
 session.show(null);session.show(opening());assert.equal(phase(session),'ready');assert.equal(workers.length,1);
 session.show({...opening(),finished:true});assert.equal(phase(session),'hidden');assert.equal(workers.length,1);
});
test('worker and startup failures are visible without repeated retries on typing',()=>{
 let attempts=0;const failed=new SmashAdviceSession(()=>{attempts++;throw Error('blocked')},()=>{});failed.show(opening());assert.equal(phase(failed),'error');failed.show(opening());assert.equal(attempts,1);failed.stop();assert.equal(phase(failed),'hidden');
 const worker=new FakeWorker(),session=new SmashAdviceSession(()=>worker,()=>{});session.show(opening());worker.reply({key:smashAdviceKey(opening()),error:'Analysis unavailable'});assert.equal(phase(session),'error');assert.equal(worker.terminated,true);session.show(opening());assert.equal(phase(session),'error');
});
