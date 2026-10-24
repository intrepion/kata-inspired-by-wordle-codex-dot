import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ALLOWED} from '../src/words.ts';
import {score} from '../src/domain.ts';
import {newImpossible,submitImpossible,impossibleSnapshot} from '../src/impossible.ts';
import {notRecommended,feedbackCode,adviceKey} from '../src/evil-advice.ts';

test('fast feedback encoding matches original duplicate-aware scorer across dictionary words',()=>{
 const enc=(word:string)=>[...word].map(c=>c.charCodeAt(0)-65);
 for(const answer of ['APPLE','LEVEL','EERIE','BANAL','LEECH'])for(const guess of ALLOWED){
  const expected=Number.parseInt(score(answer,guess).map(c=>({absent:0,elsewhere:1,exact:2}[c])).join(''),3);
  assert.equal(feedbackCode(enc(answer),enc(guess)),expected,`${answer}/${guess}`);
 }
});
test('ranking matches independent score histograms over all clue-consistent dictionary guesses',()=>{
 let run=submitImpossible(newImpossible(),'ADIEU').run;
 for(const state of [{...newImpossible(),candidates:['AMPLE','APPLE']},run,submitImpossible(run,'XYLEM').run]){
  const eligible=[...ALLOWED].filter(word=>!state.guesses.includes(word)&&state.guesses.every((previous,row)=>score(word,previous).every((clue,i)=>clue===state.feedback[row][i])));
  const reference=eligible.map(word=>{
   const counts=new Map<string,number>();for(const answer of state.candidates){const key=score(answer,word).join(',');counts.set(key,(counts.get(key)??0)+1);}
   const worstCaseLeft=Math.max(...counts.values());return {word,worstCaseLeft,guaranteedEliminations:state.candidates.length-worstCaseLeft};
  }).sort((a,b)=>b.worstCaseLeft-a.worstCaseLeft||(a.word<b.word?-1:a.word>b.word?1:0));
  const result=notRecommended(state);assert.equal(result.eligibleWords,eligible.length);assert.equal(result.totalCandidates,state.candidates.length);assert.deepEqual(result.suggestions,reference.slice(0,5));
  assert.deepEqual(notRecommended(state).suggestions,result.suggestions);
 }
});
test('advice clue filtering honors duplicate maximums and all previous feedback',()=>{
 const run={...newImpossible(),answer:'APPLE',guesses:['ALLEY'],feedback:[score('APPLE','ALLEY')],candidates:['AMPLE','APPLE']};
 const result=notRecommended(run);
 assert.ok(result.eligibleWords>5);
 for(const item of result.suggestions){assert.deepEqual(score(item.word,'ALLEY'),run.feedback[0]);assert.equal([...item.word].filter(c=>c==='L').length,1);assert.equal(item.word[0],'A');assert.notEqual(item.word[1],'L');assert.notEqual(item.word[2],'L');}
 const earlier={...run,guesses:['FUZZY','CRANE'],feedback:[score('APPLE','FUZZY'),score('APPLE','CRANE')]};
 for(const item of notRecommended(earlier).suggestions)for(let row=0;row<2;row++)assert.deepEqual(score(item.word,earlier.guesses[row]),earlier.feedback[row]);
});
test('gameover and singleton rounds have no ranking; invalid/repeated input keeps analysis identity',()=>{
 let run=submitImpossible(newImpossible(),'ADIEU').run;const key=adviceKey(run);
 const typing={...run,draft:'CRA'};assert.equal(adviceKey(typing),key);assert.equal(adviceKey(submitImpossible(run,'ZZZZZ').run),key);assert.equal(adviceKey(submitImpossible(run,'ADIEU').run),key);
 assert.deepEqual(notRecommended({...run,candidates:[run.candidates[0]]}).suggestions,[]);
 for(const word of ['XYLEM','JAZZY','FUZZY','BOOZY','DIZZY'])run=submitImpossible(run,word).run;
 assert.deepEqual(notRecommended(run).suggestions,[]);
 assert.deepEqual(Object.keys(impossibleSnapshot(run)).sort(),['dataset','difficulty','draft','guesses','version']);
});
test('legacy Impossible saves and Absurd aliases resume the same round and drafts',async()=>{
 const {emptySave,encode,decode}=await import('../src/persistence.ts');
 const save=emptySave('2026-10-24','strict');save.mode='impossible';save.impossible=submitImpossible(save.impossible,'ADIEU').run;save.impossible.draft='CRA';
 const old=encode(save);assert.deepEqual(decode(old,save.date),save);
 const alias=JSON.parse(old);alias.mode='evil';alias.evil=alias.impossible;delete alias.impossible;
 assert.deepEqual(decode(JSON.stringify(alias),save.date),save);
});

test('first-turn full-dictionary ranking has stable least-elimination fixtures',()=>{
 const run=newImpossible(),result=notRecommended(run);
 assert.equal(result.eligibleWords,11193);assert.equal(result.totalCandidates,3493);
 assert.deepEqual(result.suggestions.map(item=>[item.word,item.worstCaseLeft]),[['BUBBY',2290],['FUZZY',2283],['YUKKY',2280],['BUZZY',2248],['MUMMY',2228]]);
 for(const item of result.suggestions){
  const groups=new Map<string,number>();for(const answer of run.candidates){const key=score(answer,item.word).join(',');groups.set(key,(groups.get(key)??0)+1);}
  assert.equal(item.worstCaseLeft,Math.max(...groups.values()));assert.equal(item.guaranteedEliminations,3493-item.worstCaseLeft);
 }
});
