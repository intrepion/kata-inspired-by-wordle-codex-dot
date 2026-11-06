/** Supplemental editorial decisions, never suffix-based grammar inference. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../src/data/',import.meta.url);
const sha=value=>createHash('sha256').update(value).digest('hex');
export function loadEnglishAnswerReview(){
 const review=JSON.parse(readFileSync(new URL('english-answer-review.json',root),'utf8'));
 return validateEnglishAnswerReview(review);
}
export function validateEnglishAnswerReview(review){
 if(review.schema!==1)throw Error('Unknown English answer review schema');
 const files=new Map();
 for(const [file,digest]of Object.entries(review.inputs)){
  if(!/^(agid-[a-z-]+\.txt|definitions\/(?:english-|extended-)?\d+\.json)$/.test(file))throw Error('Invalid English review evidence path');
  const raw=readFileSync(new URL(file,root));if(sha(raw)!==digest)throw Error(`English review source changed: ${file}`);files.set(file,raw.toString('utf8'));
 }
 for(const [word,entry]of Object.entries(review.exclude)){
  if(!/^[A-Z]{3,11}$/.test(word)||!['past','plural','reviewed'].includes(entry.kind)||!entry.reason?.trim()||!entry.review?.trim()||!Array.isArray(entry.evidence)||(entry.kind!=='reviewed'&&!entry.lemma?.trim())||review.keep[word])throw Error(`Invalid English review: ${word}`);
  for(const proof of entry.evidence){
   if(!proof||typeof proof!=='object')throw Error(`Invalid English evidence selector: ${word}`);
   const agid=typeof proof.file==='string'&&proof.file.endsWith('.txt')&&typeof proof.line==='string'&&proof.line.trim()&&proof.word===undefined&&proof.entrySha256===undefined;
   const definition=typeof proof.file==='string'&&proof.file.endsWith('.json')&&proof.line===undefined&&proof.word===word&&typeof proof.entrySha256==='string'&&/^[a-f0-9]{64}$/.test(proof.entrySha256);
   if(!agid&&!definition)throw Error(`Invalid English evidence selector: ${word}`);
   const raw=files.get(proof.file);if(!raw)throw Error(`Unpinned English evidence: ${word}`);
   if(proof.line&&!raw.split(/\r?\n/).includes(proof.line))throw Error(`Missing AGID review row: ${word}`);
   if(proof.word&&(proof.word!==word||sha(JSON.stringify(JSON.parse(raw)[word]))!==proof.entrySha256))throw Error(`Changed definition review row: ${word}`);
  }
 }
 return review;
}
export function reviewForLength(review,length){return Object.fromEntries(Object.entries(review.exclude).filter(([word])=>word.length===length))}
