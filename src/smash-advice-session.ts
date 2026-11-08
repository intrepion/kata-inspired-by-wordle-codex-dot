import {smashAdviceKey,type SmashObservations,type SmashAdviceResult,type SmashAdviceReply,type SmashAdviceRequest} from './smash-advice.ts';
export type SmashAdviceState={phase:'hidden'}|{phase:'loading'}|{phase:'error';message:string}|{phase:'ready';result:SmashAdviceResult};
export type SmashAdviceWorker=Pick<Worker,'onmessage'|'onerror'|'postMessage'|'terminate'>;
/** One cancellable worker, with a small public-clue-only result cache. */
export class SmashAdviceSession {
 private worker:SmashAdviceWorker|null=null;
 private generation=0;
 private key:string|null=null;
 private cache=new Map<string,SmashAdviceResult>();
 private current:SmashAdviceState={phase:'hidden'};
 constructor(private createWorker:()=>SmashAdviceWorker,private publish:(state:SmashAdviceState)=>void){}
 get state():SmashAdviceState{return this.current}
 private emit(state:SmashAdviceState){this.current=state;this.publish(state)}
 private cancel(){this.generation++;this.worker?.terminate();this.worker=null;this.key=null}
 show(input:SmashObservations|null):void {
  if(!input||input.finished){this.stop();return}
  const key=smashAdviceKey(input);if(this.key===key)return;
  this.cancel();this.key=key;
  const cached=this.cache.get(key);if(cached){this.cache.delete(key);this.cache.set(key,cached);this.emit({phase:'ready',result:cached});return}
  const generation=this.generation;this.emit({phase:'loading'});
  try{
   const worker=this.createWorker();this.worker=worker;
   worker.onmessage=event=>{
    const reply=event.data as SmashAdviceReply;if(generation!==this.generation||this.key!==key||reply.key!==key)return;
    worker.terminate();this.worker=null;this.generation++;
    if('error' in reply){this.emit({phase:'error',message:reply.error});return}
    this.cache.set(key,reply.result);if(this.cache.size>12)this.cache.delete(this.cache.keys().next().value!);
    this.emit({phase:'ready',result:reply.result});
   };
   worker.onerror=()=>{if(generation!==this.generation||this.key!==key)return;worker.terminate();this.worker=null;this.generation++;this.emit({phase:'error',message:'Suggestions unavailable. All accepted guesses remain playable.'})};
   // Copy only the documented public fields, even if a caller passes a wider object.
   const observations:SmashObservations={language:input.language,...(input.language==='nl-NL'?{dutchRules:input.dutchRules??2}:{}),length:input.length,guesses:[...input.guesses],feedback:input.feedback.map(row=>[...row]),finished:input.finished};
   const request:SmashAdviceRequest={key,observations};worker.postMessage(request);
  }catch{this.worker?.terminate();this.worker=null;this.generation++;this.emit({phase:'error',message:'Suggestions unavailable. All accepted guesses remain playable.'})}
 }
 stop():void {this.cancel();if(this.current.phase!=='hidden')this.emit({phase:'hidden'})}
}
