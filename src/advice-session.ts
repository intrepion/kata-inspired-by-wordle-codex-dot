import {adviceKey,type AdviceResult,type AdviceReply,type AdviceKind} from './advice-protocol.ts';
import {possibleAnswers,type Observations} from './observations.ts';
export type AdviceState={phase:'hidden'}|{phase:'unavailable';message:string}|{phase:'loading';key:string;total:number}|{phase:'ready';key:string;result:AdviceResult}|{phase:'error';key:string;message:string};
export type AdviceWorker=Pick<Worker,'onmessage'|'onerror'|'postMessage'|'terminate'>;
/** One cancellable analysis; cache only the last 12 deterministic history results. */
export class AdviceSession {
 private worker:AdviceWorker|null=null;
 private generation=0;
 private pendingKey:string|null=null;
 private cache=new Map<string,AdviceResult>();
 private current:AdviceState={phase:'hidden'};
 private createWorker:()=>AdviceWorker;
 private publish:(state:AdviceState)=>void;
 constructor(createWorker:()=>AdviceWorker,publish:(state:AdviceState)=>void){this.createWorker=createWorker;this.publish=publish;}
 get state():AdviceState{return this.current}
 private emit(state:AdviceState){this.current=state;this.publish(state);}
 private cancel(){this.generation++;this.worker?.terminate();this.worker=null;this.pendingKey=null;}
 show(run:Observations|null,kind:AdviceKind='suboptimal'):void {
  if(!run){this.cancel();this.emit({phase:'hidden'});return;}
  if(run.finished||run.guesses.length>=6){this.cancel();this.emit({phase:'unavailable',message:'Round complete. Advice is hidden.'});return;}
  const key=adviceKey(run,kind);
  if(this.pendingKey===key||((this.current.phase==='ready'||this.current.phase==='error')&&this.current.key===key))return;
  const cached=this.cache.get(key);
  if(cached){this.cancel();this.cache.delete(key);this.cache.set(key,cached);this.emit({phase:'ready',key,result:cached});return;}
  const total=possibleAnswers(run).length;
  if(kind==='suboptimal'&&total<=1){this.cancel();this.emit({phase:'unavailable',message:total===1?'One curated answer remains; information ranking is not meaningful.':'No curated answers match these clues.'});return;}
  this.cancel();const generation=this.generation;
  this.pendingKey=key;this.emit({phase:'loading',key,total});
  try{
   const worker=this.createWorker();this.worker=worker;
   worker.onmessage=event=>{
    const reply=event.data as AdviceReply;
    if(generation!==this.generation||this.pendingKey!==key||reply.key!==key)return;
    this.cancel();
    if('error' in reply){this.emit({phase:'error',key,message:reply.error});return;}
    if(reply.result.totalCandidates!==total){this.emit({phase:'error',key,message:'Analysis changed. Try changing modes and returning.'});return;}
    this.cache.set(key,reply.result);
    if(this.cache.size>12)this.cache.delete(this.cache.keys().next().value!);
    this.emit({phase:'ready',key,result:reply.result});
   };
   worker.onerror=()=>{if(generation!==this.generation)return;this.cancel();this.emit({phase:'error',key,message:'Analysis unavailable. All accepted guesses remain playable.'});};
   worker.postMessage({key,observations:{guesses:[...run.guesses],feedback:run.feedback.map(row=>[...row]),finished:run.finished},kind});
  }catch{this.cancel();this.emit({phase:'error',key,message:'Analysis unavailable. All accepted guesses remain playable.'});}
 }
 stop():void {this.cancel();this.emit({phase:'hidden'});}
}
