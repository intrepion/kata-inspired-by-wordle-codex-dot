import {analyzeSmashObservations,type SmashAdviceRequest,type SmashAdviceReply} from './smash-advice.ts';
const scope=self as unknown as {onmessage:((event:MessageEvent<SmashAdviceRequest>)=>void)|null;postMessage:(reply:SmashAdviceReply)=>void};
scope.onmessage=event=>{
 const {key,observations}=event.data;
 try{scope.postMessage({key,result:analyzeSmashObservations(observations)})}
 catch{scope.postMessage({key,error:'Suggestions unavailable. All accepted guesses remain playable.'})}
};
