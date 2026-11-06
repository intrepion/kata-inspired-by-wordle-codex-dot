import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {vocabulary,WORD_LENGTHS,answerDataset,absurdDataset} from '../src/words.ts';
import {newRun,submit} from '../src/domain.ts';
import {answerEligibility} from '../src/answer-eligibility.ts';
import {loadEnglishAnswerReview,reviewForLength,validateEnglishAnswerReview,type EnglishAnswerReview} from '../scripts/english-answer-review.mjs';
const review=loadEnglishAnswerReview();
const counts:Record<number,number>={3:447,4:1479,5:2094,6:3148,7:4121,8:4208,9:3700,10:2788,11:1747};
test('all 184 reviewed plural/past leaks are excluded at every length, but accepted as guesses',()=>{
 assert.equal(Object.keys(review.exclude).length,184);
 for(const [word,entry] of Object.entries(review.exclude)){
  const {answers,allowed}=vocabulary(word.length);assert.ok(!answers.includes(word),word);assert.ok(allowed.has(word),word);
  assert.equal(submit(newRun(answers[0]),word.toLowerCase()).error,undefined,word);
  const eligibility=answerEligibility(word,word.length as typeof WORD_LENGTHS[number],'en');assert.equal(eligibility.possible,false,word);assert.match(eligibility.reason,/Valid guess/,word);
  if(entry.kind==='plural'||entry.kind==='past')assert.ok(eligibility.reason.includes(entry.lemma!.toUpperCase()),word);
 }
});
test('independent base forms, lexical adjectives and out-of-scope inflections are not suffix-stripped',()=>{
 for(const [word,reason]of Object.entries(review.keep)){assert.ok(reason.length>10);assert.ok(vocabulary(word.length).answers.includes(word),word)}
 for(const word of ['GLASS','CLASS','NAKED','BREED','BLEED','BUS','GAS','MATHEMATICS','ECONOMICS','DEMENTED','FORCEPS','WATERWORKS'])assert.ok(vocabulary(word.length).answers.includes(word),word);
});
test('all English lengths have exact audited counts and byte-equivalent accepted word sequences',()=>{
 const inputs:Record<string,string[]>=Object.assign({},...['scowl-five-letter.json','scowl-other-lengths.json','scowl-extended-lengths.json'].map(name=>{
  const source=JSON.parse(readFileSync(new URL('../src/data/'+name,import.meta.url),'utf8')) as Record<string,string[]>;
  return Object.fromEntries(Object.entries(source).map(([key,words])=>[name+':'+key,words]));
 }));
 for(const length of WORD_LENGTHS){
  const {answers,allowed}=vocabulary(length),expected=[...new Set(Object.values(inputs).flat().filter((w:string)=>w.length===length))].sort().map(w=>w.toUpperCase());
  assert.equal(answers.length,counts[length]);assert.equal(new Set(answers).size,answers.length);assert.deepEqual([...allowed],expected);assert.ok(answers.every(w=>allowed.has(w)));
  assert.deepEqual(Object.keys(reviewForLength(review,length)),Object.keys(review.exclude).filter(w=>w.length===length));
 }
});
test('English corrections use new dataset identities only for changed pools',()=>{
 for(const length of WORD_LENGTHS){
  assert.equal(answerDataset(length),length===5?'scowl-2020.12.07-answers-v3':`scowl-2020.12.07-${length}-answers-v${length===3?1:2}`);
  assert.equal(absurdDataset(length),length===5?'scowl-2020.12.07-absurd-v3':`scowl-2020.12.07-${length}-absurd-v${length===3?1:2}`);
 }
});
test('extended exclusions have grammatical explanations instead of a generic membership fallback',()=>{
 assert.match(answerEligibility('SUNGLASSES',10,'en').reason,/plural.*SUNGLASS/);
 assert.match(answerEligibility('IDOLISED',8,'en').reason,/past.tense.*IDOLISE/);
 assert.match(answerEligibility('WENT',4,'en').reason,/past.tense.*GO/);
 assert.match(answerEligibility('WAS',3,'en').reason,/past.tense.*BE/);
 assert.match(answerEligibility('REGALIA',7,'en').reason,/plural.only/);
});
test('all three English generators reproduce the audited pools and reports offline',()=>{
 for(const file of ['generate-vocabulary.mjs','generate-lengths.mjs','generate-extended-lengths.mjs'])execFileSync(process.execPath,['scripts/'+file,'--check'],{encoding:'utf8'});
});

test('review rejects missing, empty, mixed and mismatched evidence selectors',()=>{
 for(const evidence of [
  {file:'agid-other-lengths.txt'},
  {file:'agid-other-lengths.txt',line:''},
  {file:'agid-other-lengths.txt',line:'cost V: cost, costed 2 | costing | costs',word:'COSTED'},
  {file:'definitions/6.json',word:'COSTED'},
  {file:'definitions/6.json',word:'COSTED',entrySha256:'not-a-hash'},
  {file:'agid-other-lengths.txt',word:'COSTED',entrySha256:'0'.repeat(64)},
 ]){
  const invalid=structuredClone(review);invalid.exclude.COSTED.evidence=[evidence] as unknown as EnglishAnswerReview['exclude'][string]['evidence'];
  assert.throws(()=>validateEnglishAnswerReview(invalid),/Invalid English evidence selector/);
 }
});
