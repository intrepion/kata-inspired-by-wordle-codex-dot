import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeObservations,feedbackCode,notRecommended} from '../src/evil-advice.ts';
import {normalizeGuess,type Language,type DutchRules} from '../src/language.ts';
import {vocabulary} from '../src/words.ts';
import {score,newRun} from '../src/domain.ts';
import {newImpossible} from '../src/impossible.ts';
import {observedClues,possibleAnswers,type Observations} from '../src/observations.ts';

const encode=(word:string)=>[...word].map(letter=>letter.codePointAt(0)!);
for(const [language,answer,guess,dutchRules] of [
 ['ru-RU','АЛЛЕЯ','ЛИЛИЯ',2],['uk-UA','ЇЇЄҐА','АЇЇҐЄ',2],['sv-SE','ÅÄÖÅÅ','ÅÅÅÄÖ',2],
 ['de-DE','ÄÄÖẞÜ','ÜÄÄÖẞ',2],['es-MX','ÑÁÑAA','AÑÁÑÁ',2],['fr-FR','ÉÉÈAA','AÉÉÈÈ',2],
 ['nl-NL','ÉÉÈAA','AÉÉÈÈ',1],['nl-NL','ÉÉÈAA','AÉÉÈÈ',2],
 ['en-US','AAAAABBBBBB','BAAAAAAAAAA',2],
] as [Language,string,string,DutchRules][])test(`fast duplicate feedback matches independent scorer: ${language}, rules ${dutchRules}`,()=>{
 const expected=score(answer,guess,language,dutchRules).reduce((code,clue)=>code*3+({absent:0,elsewhere:1,exact:2}[clue]),0);
 assert.equal(feedbackCode(encode(normalizeGuess(answer,language,dutchRules)),encode(normalizeGuess(guess,language,dutchRules))),expected);
});

for(const kind of ['optimal','suboptimal'] as const)test(`${kind}: large openings are bounded, deterministic and score every answer`,()=>{
 const input:Observations={language:'en-US',wordLength:8,guesses:[],feedback:[]};
 const result=analyzeObservations(input,kind),pool=possibleAnswers(input),dictionary=vocabulary(8,'en-US');
 assert.equal(result.totalCandidates,pool.length);assert.equal(result.eligibleWords,dictionary.allowed.size);
 assert.ok(result.evaluatedWords!>0&&result.evaluatedWords!<=256);assert.equal(result.suggestions.length,5);
 assert.deepEqual(analyzeObservations(input,kind),result);
 for(const suggestion of result.suggestions){
  assert.ok(dictionary.allowed.has(suggestion.word));
  const histogram=new Map<string,number>();
  for(const answer of pool){const key=score(answer,suggestion.word,'en-US').join(',');histogram.set(key,(histogram.get(key)??0)+1);}
  const worst=Math.max(...histogram.values());
  assert.equal(suggestion.worstCaseLeft,worst);assert.equal(suggestion.guaranteedEliminations,pool.length-worst);
  if(kind==='optimal')assert.equal(suggestion.expectedSurvivors,[...histogram.values()].reduce((sum,count)=>sum+count*count,0)/pool.length);
 }
 // Even the shortlist itself must not depend on the concealed selected answer.
 const a=observedClues(newRun(pool[0],'easy','en-US')),b=observedClues(newRun(pool.at(-1)!,'easy','en-US'));
 assert.deepEqual(a,b);assert.deepEqual(analyzeObservations(a,kind),result);
});

test('affordable pools still evaluate every eligible guess without a shortlist label',()=>{
 const input:Observations={guesses:['ALLEY'],feedback:[score('APPLE','ALLEY')]};
 assert.equal(analyzeObservations(input,'optimal').evaluatedWords,undefined);
 assert.equal(analyzeObservations(input,'suboptimal').evaluatedWords,undefined);
});

test('large survivor buckets do not wrap at the 16-bit boundary',()=>{
 const count=65_536,result=notRecommended({...newImpossible(),candidates:Array<string>(count).fill('APPLE')});
 assert.equal(result.totalCandidates,count);assert.equal(result.suggestions.length,5);
 for(const suggestion of result.suggestions){assert.equal(suggestion.worstCaseLeft,count);assert.equal(suggestion.guaranteedEliminations,0);}
});
