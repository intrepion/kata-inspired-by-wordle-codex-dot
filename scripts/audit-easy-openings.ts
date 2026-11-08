/** Run with node --import tsx scripts/audit-easy-openings.ts [--standard-only].
 * Times analysis after module import, not browser/worker startup or rendering.
 * Uses complete real dictionaries; no singleton fixtures or sampled answer pools.
 */
import assert from 'node:assert/strict';
import {LANGUAGES,normalizeGuess,type Language} from '../src/language.ts';
import {supportedLengths,vocabulary} from '../src/words.ts';
import {score} from '../src/domain.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
import {analyzeLetrosoObservations,letrosoFeedbackCode} from '../src/letroso-advice.ts';
import {orderFeedback} from '../src/letroso.ts';

type Measurement={language:Language;length?:number;milliseconds:number;candidates:number;evaluated:number;shortlisted:boolean};
const standard:Measurement[]=[],letroso:Measurement[]=[];
const started=performance.now();
function verifyScores(pool:readonly string[],word:string,language:Language,actual:{worstCaseLeft:number;expectedSurvivors?:number;guaranteedEliminations:number},ordered=false){
 const buckets=new Map<string|number,number>();
 for(const answer of pool){const code=ordered?letrosoFeedbackCode(orderFeedback(answer,word,language)):score(answer,word,language).join(',');buckets.set(code,(buckets.get(code)??0)+1)}
 const counts=[...buckets.values()],worst=Math.max(...counts);
 assert.equal(actual.worstCaseLeft,worst);assert.equal(actual.guaranteedEliminations,pool.length-worst);assert.equal(actual.expectedSurvivors,counts.reduce((sum,count)=>sum+count*count,0)/pool.length);
}
for(const language of LANGUAGES)for(const length of supportedLengths(language)){
 const {answers,allowed}=vocabulary(length,language),guesses:string[]=[];
 const start=performance.now(),result=analyzeObservations({language,wordLength:length,guesses,feedback:[],finished:false},'optimal');
 standard.push({language,length,milliseconds:Math.round(performance.now()-start),candidates:result.totalCandidates,evaluated:result.evaluatedWords??result.eligibleWords,shortlisted:result.evaluatedWords!==undefined});
 assert.equal(result.totalCandidates,answers.length,`${language}/${length}: incomplete pool`);
 assert.ok(result.suggestions.length>0&&result.suggestions.length<=5,`${language}/${length}: missing opening`);
 const seen=new Set<string>();
 for(const suggestion of result.suggestions){const play=normalizeGuess(suggestion.word,language);assert.equal(play.length,length);assert.ok(allowed.has(play));assert.ok(!seen.has(play));assert.ok(!guesses.includes(play));seen.add(play);verifyScores(answers,suggestion.word,language,suggestion)}
}
assert.equal(standard.length,136);
if(!process.argv.includes('--standard-only'))for(const language of LANGUAGES){
 const lengths=supportedLengths(language),unique=new Map<string,string>();
 for(const length of lengths)for(const word of vocabulary(length,language).answers){const play=normalizeGuess(word,language);if(!unique.has(play))unique.set(play,word)}
 const start=performance.now(),result=analyzeLetrosoObservations({language,guesses:[],feedback:[],finished:false});
 letroso.push({language,milliseconds:Math.round(performance.now()-start),candidates:result.totalCandidates,evaluated:result.rankedCandidates,shortlisted:result.shortlisted});
 assert.equal(result.totalCandidates,unique.size);assert.ok(result.suggestions.length>0&&result.suggestions.length<=5);
 assert.ok(result.rankedCandidates>=Math.min(unique.size,lengths.length*2));
 const seen=new Set<string>();
 for(const suggestion of result.suggestions){const play=normalizeGuess(suggestion.word,language);assert.ok(unique.has(play));assert.ok(lengths.some(length=>length===play.length));assert.ok(vocabulary(play.length,language).allowed.has(play));assert.ok(!seen.has(play));seen.add(play);verifyScores([...unique.values()],suggestion.word,language,suggestion,true)}
}
const summarize=(rows:Measurement[])=>({configurations:rows.length,fullRanking:rows.filter(row=>!row.shortlisted).length,shortlisted:rows.filter(row=>row.shortlisted).length,analysisMilliseconds:rows.reduce((sum,row)=>sum+row.milliseconds,0),slowest:[...rows].sort((a,b)=>b.milliseconds-a.milliseconds).slice(0,5)});
console.log(JSON.stringify({passed:true,timing:'analysis after module import; excludes worker startup and rendering',wallMilliseconds:Math.round(performance.now()-started),standard:summarize(standard),letroso:summarize(letroso)}));
