import {analyzeObservations,type AdviceRequest,type AdviceReply} from './evil-advice.ts';
const scope=self as unknown as {onmessage:((event:MessageEvent<AdviceRequest>)=>void)|null;postMessage:(reply:AdviceReply)=>void};
scope.onmessage=event=>{
 const {key,observations,kind}=event.data;
 try{scope.postMessage({key,result:analyzeObservations(observations,kind)});}
 catch{scope.postMessage({key,error:'Analysis unavailable. All accepted guesses remain playable.'});}
};
