import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const raw=(name:string)=>readFileSync(new URL(name,root));
const json=(name:string)=>JSON.parse(raw(name).toString('utf8'));
const sha=(value:Buffer)=>createHash('sha256').update(value).digest('hex');

test('Australian SCOWL uses the exact pinned release and independent Australian category',()=>{
 const source=json('src/data/australian-scowl-source.json'),original=json('src/data/scowl-source.json');
 for(const key of ['release','revision','archiveUrl','archiveSha256'])assert.equal(source[key],original[key]);
 assert.equal(source.archiveSha256,'5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc');
 const snapshot=raw('src/data/australian-scowl.json');
 assert.equal(sha(snapshot),source.snapshotSha256);
 const data=JSON.parse(snapshot.toString('utf8')) as Record<string,string[]>;
 const names=[10,20,35,40,50,55,60,70,80].map(tier=>`australian-words.${tier}`);
 assert.deepEqual(Object.keys(data),names);assert.deepEqual(Object.keys(source.files),names);
 const words=Object.values(data).flat(),unique=new Set(words);
 assert.equal(words.length,5283);assert.equal(unique.size,5283);
 assert.equal(source.counts.tokens,words.length);assert.equal(source.counts.uniqueWords,unique.size);
 assert.ok(words.every(word=>/^[a-z]{3,11}$/.test(word)));
 for(let length=3;length<=11;length++)assert.equal(source.counts.byLength[length],words.filter(word=>word.length===length).length);
 for(const word of ['arvo','bogan','chook','dinkum','doona','ute'])assert.ok(data['australian-words.35'].includes(word),word);
 assert.ok(data['australian-words.20'].includes('racquet'));
 assert.ok(unique.has('colour'));assert.ok(!unique.has('color'));
});

test('Australian SCOWL reuses byte-pinned complete upstream notices',()=>{
 const source=json('src/data/australian-scowl-source.json');
 assert.deepEqual(Object.keys(source.notices),['Copyright','README']);
 for(const notice of Object.values(source.notices) as {path:string;sha256:string}[])assert.equal(sha(raw(notice.path)),notice.sha256);
});

test('Australian-only answer approval is conservative, complete, and evidence-pinned',async()=>{
 const {loadAustralianAnswerReview,validateAustralianAnswerReview}=await import('../scripts/australian-answer-review.mjs');
 const review=loadAustralianAnswerReview();
 assert.deepEqual(review.counts,{newCommon35:272,allowed:65,deferred:207});
 for(const word of ['ARVO','BOGAN','CHOOK','DINKUM','DOONA','UTE','RACQUET'])assert.ok(review.allow[word],word);
 for(const word of ['ARVOS','BOGANS','CHOOKS','DOONAS','UTES','RACQUETS','BINGLED','CARKED','FOSSICKED','SWAGMEN']){
  assert.ok(!review.allow[word],word);assert.ok(review.deferred.includes(word),word);
 }
 const changed=structuredClone(review);changed.allow.ARVO.evidence[0].entrySha256='0'.repeat(64);
 assert.throws(()=>validateAustralianAnswerReview(changed),/definition evidence/);
 const incomplete=structuredClone(review);incomplete.deferred.pop();
 assert.throws(()=>validateAustralianAnswerReview(incomplete),/every new common-tier word/);
 const duplicate=structuredClone(review);duplicate.deferred.push('ARVO');
 assert.throws(()=>validateAustralianAnswerReview(duplicate),/every new common-tier word/);
});
