import {DefinitionClient,DefinitionError,definitionWord,type DefinitionResult,type DefinitionFailure} from './definitions.ts';
export type InlineDefinitionState={phase:'loading'}|{phase:'ready'|'missing';result:DefinitionResult}|{phase:'error';reason:DefinitionFailure};
/** Only rendered words enter this queue. Two requests, bounded memory, no automatic retry loop. */
export class InlineDefinitions {
 private visible=new Set<string>();
 private states=new Map<string,InlineDefinitionState>();
 private active=new Map<string,object>();
 private timer:ReturnType<typeof setTimeout>|null=null;
 constructor(private client:DefinitionClient,private publish:(word:string)=>void,private debounceMs=180){}
 state(word:string):InlineDefinitionState {return this.states.get(word)??{phase:'loading'}}
 show(words:readonly string[]){
  const next=new Set(words.map(word=>this.client.normalizeWord(word)).filter((word):word is string=>word!==null).slice(0,17));
  for(const word of this.visible)if(!next.has(word)&&this.active.has(word)){this.active.delete(word);this.client.cancel(word);this.states.delete(word)}
  this.visible=next;
  for(const word of next){
   const cached=this.client.peek(word);
   if(cached){this.states.set(word,{phase:cached.entries.length?'ready':'missing',result:cached});this.publish(word)}
   else if(this.states.get(word)?.phase==='ready'||this.states.get(word)?.phase==='missing')this.states.delete(word);
  }
  for(const word of this.states.keys())if(this.states.size>64&&!next.has(word))this.states.delete(word);
  if(!this.timer&&[...next].some(word=>!this.states.has(word))){this.timer=setTimeout(()=>{this.timer=null;this.pump()},this.debounceMs)}
 }
 private pump(){
  for(const word of this.visible){
   if(this.active.size>=2)break;
   if(this.states.has(word))continue;
   const token={};this.active.set(word,token);this.states.set(word,{phase:'loading'});
   void this.client.lookup(word).then(result=>this.finish(word,token,{phase:result.entries.length?'ready':'missing',result}),error=>this.finish(word,token,{phase:'error',reason:error instanceof DefinitionError?error.reason:'network'}));
  }
 }
 private finish(word:string,token:object,state:InlineDefinitionState){
  if(this.active.get(word)!==token)return;
  this.active.delete(word);
  if(this.visible.has(word)){this.states.set(word,state);this.publish(word)}else this.states.delete(word);
  this.pump();
 }
 close(){if(this.timer)clearTimeout(this.timer);this.timer=null;for(const word of this.active.keys())this.client.cancel(word);this.active.clear();this.visible.clear();this.states.clear()}
}
