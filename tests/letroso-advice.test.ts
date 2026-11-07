import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newLetroso,submitLetroso,orderFeedback} from '../src/letroso.ts';
import {analyzeLetrosoObservations,possibleLetrosoAnswers,observedLetrosoClues,letrosoAdviceKey,letrosoFeedbackCode,type LetrosoObservations} from '../src/letroso-advice.ts';
import {vocabulary,supportedLengths} from '../src/words.ts';
import {normalizeGuess,type Language} from '../src/language.ts';
const signature=(answer:string,guess:string)=>JSON.stringify(orderFeedback(answer,guess).map(({kind,joinPrevious,start,end})=>[kind,joinPrevious,start,end]));
const input=(answer:string,guesses:string[]=[]):LetrosoObservations=>({language:'en-US',guesses,feedback:guesses.map(guess=>orderFeedback(answer,guess)),finished:false});
const independentScores=(candidates:string[])=>candidates.map(word=>{
 const buckets=new Map<string,number>();for(const answer of candidates){const code=signature(answer,word);buckets.set(code,(buckets.get(code)??0)+1)}
 const counts=[...buckets.values()],worstCaseLeft=Math.max(...counts);
 return {word,worstCaseLeft,guaranteedEliminations:candidates.length-worstCaseLeft,expectedSurvivors:counts.reduce((sum,count)=>sum+count*count,0)/candidates.length};
}).sort((a,b)=>a.worstCaseLeft-b.worstCaseLeft||a.expectedSurvivors-b.expectedSurvivors||(a.word<b.word?-1:a.word>b.word?1:0));
test('worker observations and cache key contain no hidden answer or answer length',()=>{
 const a=observedLetrosoClues(newLetroso('APPLE','en-US','easy')),b=observedLetrosoClues(newLetroso('CAT','en-US','easy'));
 assert.deepEqual(a,b);assert.equal(letrosoAdviceKey(a),letrosoAdviceKey(b));assert.deepEqual(Object.keys(a).sort(),['feedback','finished','guesses','language']);
 const after=observedLetrosoClues(submitLetroso(newLetroso('APPLE','en-US','easy'),'APPLY').run);assert.notEqual(letrosoAdviceKey(a),letrosoAdviceKey(after));
});
test('complete filtering reaches longer answers past the old 500-word cutoff',()=>{
 const clues=observedLetrosoClues(submitLetroso(newLetroso('APPLE','en-US','easy'),'APPLY').run),candidates=possibleLetrosoAnswers(clues);
 assert.ok(candidates.includes('APPLE'));assert.ok(candidates.includes('APPLAUSE'));assert.ok(candidates.length>=5);
 const all=supportedLengths('en-US').flatMap(length=>vocabulary(length,'en-US').answers),expected=all.filter(word=>word!=='APPLY'&&signature(word,'APPLY')===signature('APPLE','APPLY'));
 assert.deepEqual(candidates,expected);const result=analyzeLetrosoObservations(clues);assert.equal(result.totalCandidates,expected.length);assert.deepEqual(result.suggestions,independentScores(expected).slice(0,5));
});
test('opening filter includes all supported lengths and does not stop at five matches',()=>{
 const clues=input('APPLE'),expected=supportedLengths('en-US').flatMap(length=>vocabulary(length,'en-US').answers),actual=possibleLetrosoAnswers(clues);
 assert.deepEqual(actual,expected);assert.deepEqual([...new Set(actual.map(word=>word.length))],[3,4,5,6,7,8,9,10,11]);
 const fil={...clues,language:'fil-PH' as const},filipino=possibleLetrosoAnswers(fil);assert.ok(filipino.length);assert.ok(filipino.every(word=>word.length===5));
});
test('exact ranks agree with independent feedback buckets, including repeated letters and mixed lengths',()=>{
 const pool=['CAT','COT','COAT','SCAT','CATER','CART','CATCH','TACT','TACTIC','TATTOO','ACT','ACTOR','DOG','APPLE','APPLY','PAPAYA','ALLEY'];
 const result=analyzeLetrosoObservations(input('APPLE'),pool);
 assert.equal(result.totalCandidates,pool.length);assert.equal(result.rankedCandidates,pool.length);assert.equal(result.shortlisted,false);assert.deepEqual(result.suggestions,independentScores(pool).slice(0,5));
});
test('compact feedback code preserves ordering, joins, boundaries, and duplicate clues',()=>{
 const alphabet=['A','B','C'],words=[''];for(let length=1;length<=4;length++){const previous=words.filter(word=>word.length===length-1);for(const word of previous)for(const letter of alphabet)words.push(word+letter)}
 for(const guess of words.filter(word=>word.length>=2)){
  const signatures=new Map<number,string>();for(const answer of words.filter(Boolean)){
   const tiles=orderFeedback(answer,guess),code=letrosoFeedbackCode(tiles),key=signature(answer,guess);
   if(signatures.has(code))assert.equal(signatures.get(code),key);else signatures.set(code,key);
  }
 }
 assert.equal(letrosoFeedbackCode([]),0);
 const a=orderFeedback('EXAMPLE','EXCUSE'),b=a.map(tile=>({...tile}));b[0].start=false;assert.notEqual(letrosoFeedbackCode(a),letrosoFeedbackCode(b));
 b[0].start=true;b.at(-1)!.end=false;assert.notEqual(letrosoFeedbackCode(a),letrosoFeedbackCode(b));
 b.at(-1)!.end=true;b[1].joinPrevious=false;assert.notEqual(letrosoFeedbackCode(a),letrosoFeedbackCode(b));
});
test('shortlisted rankings still score every surviving answer exactly and are deterministic',()=>{
 const pool=supportedLengths('en-US').flatMap(length=>vocabulary(length,'en-US').answers.slice(0,40)),clues=input('APPLE'),result=analyzeLetrosoObservations(clues,pool);
 assert.equal(result.totalCandidates,pool.length);assert.equal(result.shortlisted,true);assert.equal(result.rankedCandidates,64);assert.equal(result.suggestions.length,5);
 // Independently reconstruct every displayed score against the FULL pool.
 for(const suggestion of result.suggestions){const buckets=new Map<string,number>();for(const answer of pool){const key=signature(answer,suggestion.word);buckets.set(key,(buckets.get(key)??0)+1)}
  const counts=[...buckets.values()];assert.equal(suggestion.worstCaseLeft,Math.max(...counts));assert.equal(suggestion.expectedSurvivors,counts.reduce((sum,n)=>sum+n*n,0)/pool.length);assert.equal(suggestion.guaranteedEliminations,pool.length-suggestion.worstCaseLeft);
 }
 assert.deepEqual(analyzeLetrosoObservations(clues,[...pool].reverse()),result);
});
test('accent equivalence deduplicates gameplay identities and honors legacy Dutch rules',()=>{
 const plain:LetrosoObservations={language:'nl-NL',dutchRules:2,guesses:[],feedback:[],finished:false},pool=['CAFE','CAFÉ','APPEL'];
 assert.deepEqual(possibleLetrosoAnswers(plain,pool),['CAFE','APPEL']);assert.equal(analyzeLetrosoObservations(plain,pool).totalCandidates,2);
 assert.deepEqual(possibleLetrosoAnswers({...plain,dutchRules:1},pool),pool);assert.notEqual(letrosoAdviceKey(plain),letrosoAdviceKey({...plain,dutchRules:1}));
 for(const language of ['fr-FR','pt-BR','fil-PH','es-MX','ru-RU','uk-UA'] as Language[]){const answer=vocabulary(supportedLengths(language)[0],language).answers[0],run=newLetroso(answer,language,'easy'),clues=observedLetrosoClues(run);assert.ok(possibleLetrosoAnswers(clues).some(word=>normalizeGuess(word,language)===normalizeGuess(answer,language)))}
});
test('singletons are direct solves; played words, inconsistent clues, and completed games do not yield advice',()=>{
 const result=analyzeLetrosoObservations(input('APPLE',['APPLY']),['APPLE','CAT','APPLY']);assert.deepEqual(result.suggestions,[{word:'APPLE',worstCaseLeft:1,guaranteedEliminations:0,expectedSurvivors:1,directSolve:true}]);
 assert.deepEqual(analyzeLetrosoObservations(input('APPLE',['APPLY']),['CAT','APPLY']).suggestions,[]);
 assert.deepEqual(analyzeLetrosoObservations({...input('APPLE'),finished:true},['APPLE']).suggestions,[]);
 assert.ok(!possibleLetrosoAnswers(input('APPLE',['APPLY']),['APPLE','APPLY']).includes('APPLY'));
});
