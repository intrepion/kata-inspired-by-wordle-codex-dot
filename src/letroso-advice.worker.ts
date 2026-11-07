import {analyzeLetrosoObservations,type LetrosoAdviceRequest,type LetrosoAdviceReply} from './letroso-advice.ts';
const scope=self as unknown as {onmessage:((event:MessageEvent<LetrosoAdviceRequest>)=>void)|null;postMessage:(reply:LetrosoAdviceReply)=>void};
scope.onmessage=event=>{
 const {key,observations}=event.data;
 try{scope.postMessage({key,result:analyzeLetrosoObservations(observations)})}
 catch{scope.postMessage({key,error:'Ranking unavailable. All accepted guesses remain playable.'})}
};
