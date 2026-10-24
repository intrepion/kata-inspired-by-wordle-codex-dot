import {DefinitionClient,DefinitionError,definitionWord,type DefinitionResult,type DefinitionFailure} from './definitions.ts';
export type DefinitionState={phase:'hidden'}|{phase:'idle'|'loading';word:string}|{phase:'ready'|'missing';word:string;result:DefinitionResult}|{phase:'error';word:string;reason:DefinitionFailure};
/** One visible word, one cancellable request. Opening never sends data automatically. */
export class DefinitionSession {
 private generation=0;
 private timer:ReturnType<typeof setTimeout>|null=null;
 private current:DefinitionState={phase:'hidden'};
 constructor(private client:DefinitionClient,private publish:(state:DefinitionState)=>void,private debounceMs=180){}
 get state(){return this.current}
 private emit(state:DefinitionState){this.current=state;this.publish(state)}
 private cancel(){this.generation++;if(this.timer!==null)clearTimeout(this.timer);this.timer=null;if(this.current.phase!=='hidden')this.client.cancel(this.current.word)}
 open(raw:string){const word=definitionWord(raw);if(!word)return;this.cancel();const cached=this.client.peek(word);this.emit(cached?{phase:cached.entries.length?'ready':'missing',word,result:cached}:{phase:'idle',word})}
 request(){
  if(this.current.phase==='hidden'||this.current.phase==='loading')return;
  const word=this.current.word;this.cancel();const generation=this.generation;this.emit({phase:'loading',word});
  this.timer=setTimeout(()=>{this.timer=null;void this.client.lookup(word).then(result=>{if(generation===this.generation)this.emit({phase:result.entries.length?'ready':'missing',word,result})},error=>{if(generation===this.generation)this.emit({phase:'error',word,reason:error instanceof DefinitionError?error.reason:'network'})})},this.debounceMs);
 }
 close(){this.cancel();this.emit({phase:'hidden'})}
}
