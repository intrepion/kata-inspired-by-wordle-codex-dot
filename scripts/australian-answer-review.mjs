/** Conservative, evidence-pinned approval of new Australian common-tier bases. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const data=new URL('../src/data/',import.meta.url);
const read=name=>readFileSync(new URL(name,data));
const json=name=>JSON.parse(read(name));
const sha=value=>createHash('sha256').update(value).digest('hex');
const common=snapshot=>Object.entries(snapshot).filter(([name])=>Number(name.split('.').at(-1))<=35).flatMap(([,words])=>words);

export function loadAustralianAnswerReview(){return validateAustralianAnswerReview(json('australian-answer-review.json'))}

export function validateAustralianAnswerReview(review){
 if(review.schema!==1||!review.allow||!Array.isArray(review.deferred))throw Error('Unknown Australian answer review schema');
 const files=new Map();
 for(const [file,digest]of Object.entries(review.inputs)){
  if(!/^(?:australian-scowl\.json|definitions\/(?:english-|extended-)?\d+\.json)$/.test(file))throw Error('Invalid Australian review evidence path');
  const raw=read(file);if(sha(raw)!==digest)throw Error(`Australian review source changed: ${file}`);files.set(file,JSON.parse(raw));
 }
 const australian=files.get('australian-scowl.json');if(!australian)throw Error('Australian snapshot is not pinned by review');
 if(review.inputs['australian-scowl.json']!==json('australian-scowl-source.json').snapshotSha256)throw Error('Australian review snapshot differs from source manifest');
 const previous=new Set();
 for(const [snapshot,manifest,key]of [['scowl-five-letter.json','scowl-source.json','snapshotSha256'],['scowl-other-lengths.json','word-length-source.json','scowlSnapshotSha256'],['scowl-extended-lengths.json','extended-length-source.json','scowlSnapshotSha256']]){
  const raw=read(snapshot);if(sha(raw)!==json(manifest)[key])throw Error(`Prior English source changed: ${snapshot}`);
  for(const word of common(JSON.parse(raw)))previous.add(word);
 }
 const additions=new Set(common(australian).filter(word=>!previous.has(word)).map(word=>word.toUpperCase()));
 for(const [word,entry]of Object.entries(review.allow)){
  if(!/^[A-Z]{3,11}$/.test(word)||!additions.has(word)||!entry.reason?.trim()||!Array.isArray(entry.evidence)||!entry.evidence.length)throw Error(`Invalid Australian answer approval: ${word}`);
  for(const proof of entry.evidence){
   if(proof.file){
    const entries=files.get(proof.file);
    if(!entries||!proof.word||!entries[proof.word]||sha(JSON.stringify(entries[proof.word]))!==proof.entrySha256)throw Error(`Changed Australian definition evidence: ${word}`);
   }else{
    // These two approvals use fixed external revisions reviewed when the map was
    // created. Builds do not fetch them or infer source text from a mutable URL.
    const fixed={UTE:'https://en.wiktionary.org/w/index.php?oldid=94635769&title=ute',RACQUET:'https://en.wiktionary.org/w/index.php?title=racquet&oldid=90571322'};
    if(!fixed[word]||proof.url!==fixed[word]||!proof.section?.trim()||proof.reviewed!=='2026-11-06'||!proof.finding?.trim())throw Error(`Invalid external Australian evidence: ${word}`);
   }
  }
 }
 const allow=Object.keys(review.allow),deferred=review.deferred;
 const partition=[...allow,...deferred];
 if(partition.length!==additions.size||new Set(partition).size!==additions.size||partition.some(word=>!additions.has(word)))throw Error('Australian review must cover every new common-tier word exactly once');
 if(review.counts.newCommon35!==additions.size||review.counts.allowed!==allow.length||review.counts.deferred!==deferred.length)throw Error('Australian review counts mismatch');
 return review;
}
