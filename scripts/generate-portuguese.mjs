/** Offline, region-verified Portuguese vocabulary. No runtime downloads. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import nspell from 'nspell';
const root=new URL('../src/data/portuguese/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8'),hash=value=>createHash('sha256').update(value).digest('hex'),serial=value=>JSON.stringify(value,null,2)+'\n';
const source=JSON.parse(read('source.json')),lexical=JSON.parse(read('lexical-evidence.json')),frequency=JSON.parse(read('frequency-evidence.json'));
for(const [name,digest] of Object.entries(source.inputs))if(hash(read(name))!==digest)throw Error('Pinned input differs: '+name);
for(const info of Object.values(source.regionalSources))for(const [file,digest] of Object.entries(info.files))if(hash(readFileSync(new URL('../'+info.localSource+'/'+file,import.meta.url)))!==digest)throw Error('Regional source differs: '+file);
const key=word=>word.normalize('NFD').replace(/\p{M}/gu,'').toLocaleUpperCase('pt');
const blocked=/archaic|obsolete|dated|historical|rare|uncommon|dialect|slang|derogatory|offensive|vulgar|slur|abbreviation|clipping|misspelling|nonstandard|nonce|morpheme|name|alt-of|form-of|alternative|contraction|Angola|Mozambique|Cape Verde/i;
const form=/\b(?:inflection|conjugation|plural of|alternative (?:form|spelling)|misspelling|superseded|obsolete spelling|abbreviation|clipping|diminutive of|past participle|present participle|inflected form)\b/i;
const regionalExamples={br:['ÔNIBUS','TREM','CELULAR','SUCO','GELADEIRA','BANHEIRO','CAFÉ','AVÓ','AVÔ','AÇÃO','AÇÚCAR','CORAÇÃO'],pt:['TÉNIS','AUTOCARRO','COMBOIO','TELEMÓVEL','SUMO','FRIGORÍFICO','CASA','CAFÉ','AVÓ','AVÔ','AÇÃO','AÇÚCAR','CORAÇÃO']};
const eligible=(entries,region)=>entries.flatMap(entry=>entry.senses.filter(sense=>{const labels=[...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])].join(' ');return !sense.form_of&&!sense.alt_of&&!form.test(sense.gloss)&&!blocked.test(labels)&&!(region==='br'?/Portugal|European Portuguese/i:/Brazil/i).test(labels)}).map(sense=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,gloss:sense.gloss,tags:[...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])]})));
const outputs={},coverage={version:source.version,lengths:{},limitations:'Conservative starter lists, not exhaustive or native-human certified. Mixed-region historical spelling frequency does not certify individual senses. Accepted guesses are attested Wiktionary headwords exact headwords in the regional Hunspell dictionary, plus the explicitly proven BR CASA form; not all generated inflections.'};
for(const [region,code] of [['br','BR'],['pt','PT']]){
 let membership;
 if(process.argv.includes('--verify-regions')){
  const affix=readFileSync(new URL(`../public/third-party/pt-${code}/pt_${code}.aff`,import.meta.url),'utf8').replace(/^\uFEFF/,'');
  if(!/^SET UTF-8$/m.test(affix))throw Error('Unsupported regional source encoding');
  const dictionary=readFileSync(new URL(`../public/third-party/pt-${code}/pt_${code}.dic`,import.meta.url),'utf8');
  const rows=dictionary.replace(/^\uFEFF/,'').split(/\r?\n/).slice(1);
  const forbiddenFlag=affix.match(/^FORBIDDENWORD (.+)$/m)?.[1];
  const forbidden=new Set(rows.filter(line=>forbiddenFlag&&line.split(/[\s]/)[0].split('/')[1]?.includes(forbiddenFlag)).map(line=>line.split(/[\/\s]/)[0].normalize('NFC')));
  const stems=new Set(rows.map(line=>line.split(/[\/\s]/)[0].normalize('NFC')).filter(word=>!forbidden.has(word)));
  membership=Object.keys(lexical).filter(word=>stems.has(word.toLocaleLowerCase('pt'))).sort();
  // VERO deliberately stores CASAR and generates CASA; independent Wiktionary
  // evidence supplies CASA's noun sense. Expand only this explicit source row.
  if(region==='br'){
   const row=rows.find(line=>line.startsWith('casar/'));
   if(!row||!nspell(affix,`1\n${row}\n`).correct('casa')||!lexical.CASA)throw Error('CASA proof no longer holds');
   membership=[...new Set([...membership,'CASA'])].sort();
  }
  const content=JSON.stringify(membership)+'\n';if(process.argv.includes('--check')){if(read(`membership-${region}.json`)!==content)throw Error('Regional membership differs')}else writeFileSync(new URL(`membership-${region}.json`,root),content);
 }else membership=JSON.parse(read(`membership-${region}.json`));
 const candidates={};for(let length=3;length<=11;length++)candidates[length]=membership.filter(word=>word.length===length&&(frequency[word]>=4.3||regionalExamples[region].includes(word))&&eligible(lexical[word],region).length).map(word=>({word,zipf:frequency[word],senses:eligible(lexical[word],region)}));
 if(process.argv.includes('--candidates')){writeFileSync(new URL(`candidates-${region}.json`,root),serial(candidates));console.log(region,Object.fromEntries(Object.entries(candidates).map(([length,items])=>[length,items.length])));continue}
 const review=JSON.parse(read(`review-${region}.json`)),candidateWords=Object.values(candidates).flat().map(item=>item.word),reviewed=new Set([...review.approved,...Object.keys(review.excluded)]);
 if(review.candidateSha256!==hash(serial(candidates)))throw Error('Candidate review evidence changed: '+region);
 if(candidateWords.some(word=>!review.primarySenses?.[word]&&review.approved.includes(word)))throw Error('Missing reviewed primary sense: '+region);
 if(candidateWords.some(word=>!reviewed.has(word))||[...reviewed].some(word=>!candidateWords.includes(word))||review.approved.some(word=>word in review.excluded)||new Set(review.approved).size!==review.approved.length)throw Error('Review must classify every candidate exactly once: '+region);
 for(const [word,primary] of Object.entries(review.primarySenses??{})){
  if(!review.approved.includes(word)||!eligible(lexical[word]??[],region).some(sense=>sense.sourceWord===primary.sourceWord&&sense.partOfSpeech===primary.partOfSpeech&&sense.gloss===primary.gloss))throw Error('Primary sense is not exact source evidence: '+word);
 }
 const vocabulary={},definitions={},selection={},collisions={};for(let n=3;n<=11;n++)vocabulary[n]={answers:[],guesses:[]};
 for(const word of membership){
  if(!/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ]{3,11}$/.test(word)||!lexical[word])throw Error('Invalid regional membership '+word);
  const folded=key(word);vocabulary[word.length].guesses.push(word);(collisions[folded]??=[]).push(word);
  const primary=review.primarySenses?.[word];
  const entries=[...lexical[word]].sort((a,b)=>Number(b.sourceWord===primary?.sourceWord&&b.partOfSpeech===primary?.partOfSpeech&&b.senses.some(sense=>sense.gloss===primary?.gloss))-Number(a.sourceWord===primary?.sourceWord&&a.partOfSpeech===primary?.partOfSpeech&&a.senses.some(sense=>sense.gloss===primary?.gloss)));
  (definitions[folded]??=[]).push(...entries.slice(0,8).map(entry=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,senses:[...new Set([...entry.senses].sort((a,b)=>Number(b.gloss===primary?.gloss)-Number(a.gloss===primary?.gloss)).map(sense=>{const labels=[...new Set([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])])];return(labels.length?'['+labels.join(', ')+'] ':'')+sense.gloss}))].slice(0,8)})));
 }
 // Review decides which canonical answer, if any, survives a folded collision.
 for(const word of review.approved){if(!membership.includes(word)||!eligible(lexical[word],region).length)throw Error('Unqualified answer '+word);vocabulary[word.length].answers.push(word);selection[word]={key:key(word),zipf:frequency[word],senses:eligible(lexical[word],region)}}
 coverage.lengths[region]={};for(const [length,data] of Object.entries(vocabulary)){
  data.answers.sort();const keys=data.answers.map(key);if(keys.length<5||new Set(keys).size!==keys.length)throw Error('Too few or colliding answers '+region+' '+length);
  const pairs=keys.reduce((sum,first)=>sum+keys.filter(second=>first!==second&&first.slice(0,2)===second.slice(-2)).length,0);if(!pairs)throw Error('No Smashare pairs '+region+' '+length);
  coverage.lengths[region][length]={answers:keys.length,guesses:data.guesses.length,foldedGuesses:new Set(data.guesses.map(key)).size,definedGuesses:data.guesses.length,smasharePairs:pairs};
  outputs[`definitions-${region}-${length}.json`]=JSON.stringify(Object.fromEntries(Object.entries(definitions).filter(([word])=>word.length===Number(length))))+'\n';
 }
 outputs[`vocabulary-${region}.json`]=serial(vocabulary);outputs[`answer-selection-${region}.json`]=serial(selection);outputs[`collisions-${region}.json`]=serial(Object.fromEntries(Object.entries(collisions).filter(([,words])=>words.length>1)));
 coverage[region]={membershipSha256:hash(read(`membership-${region}.json`)),reviewSha256:hash(read(`review-${region}.json`)),candidateCount:candidateWords.length,collisionKeys:Object.values(collisions).filter(words=>words.length>1).length};
}
if(!process.argv.includes('--candidates')){
 coverage.outputs=Object.fromEntries(Object.entries(outputs).map(([name,content])=>[name,hash(content)]));outputs['coverage.json']=serial(coverage);
 for(const [name,content] of Object.entries(outputs)){if(process.argv.includes('--check')){if(read(name)!==content)throw Error('Regenerate '+name)}else writeFileSync(new URL(name,root),content)}console.log(JSON.stringify(coverage.lengths));
}
