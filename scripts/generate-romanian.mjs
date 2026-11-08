/** Offline Romanian vocabulary: NFC Romanian with distinct Ă Â Î Ș Ț and cedilla aliases, curated answer whitelist. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../src/data/romanian/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8'),hash=value=>createHash('sha256').update(value).digest('hex');
const source=JSON.parse(read('source.json'));
for(const [name,digest] of Object.entries(source.inputs))if(hash(read(name))!==digest)throw Error('Pinned input differs: '+name);
const lexical=JSON.parse(read('lexical-evidence.json')),frequency=JSON.parse(read('frequency-evidence.json'));
const blocked=/archaic|obsolete|dated|historical|rare|uncommon|dialect|regional|slang|derogatory|offensive|vulgar|slur|abbreviation|clipping|misspelling|nonstandard|nonce|morpheme|name|alt-of|form-of|alternative|contraction|Moldovan|Moldavian|Moldova|pre-reform|pre-1993/i;
const formGloss=/\b(?:inflection|conjugation|plural of|alternative (?:form|spelling)|misspelling|superseded|obsolete spelling|abbreviation|clipping|diminutive of|past participle|present participle|inflected form)\b/i;
const eligible=entries=>entries.flatMap(entry=>entry.senses.filter(sense=>!sense.form_of&&!sense.alt_of&&!formGloss.test(sense.gloss)&&!blocked.test([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])].join(' '))).map(sense=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,gloss:sense.gloss,tags:[...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])]})));
const editorialSupplements={};
const qualifiesFrequency=word=>frequency[word]>=4.3;
const candidates={};
for(let length=3;length<=11;length++)candidates[length]=Object.keys(lexical).filter(word=>word.length===length&&qualifiesFrequency(word)&&eligible(lexical[word]).length).sort((a,b)=>frequency[b]-frequency[a]||a.localeCompare(b,'en')).map(word=>({word,zipf:frequency[word],senses:eligible(lexical[word]),...(editorialSupplements[word]?{editorialSupplement:editorialSupplements[word].reason}:{})}));
if(process.argv.includes('--candidates')){writeFileSync(new URL('candidates.json',root),JSON.stringify(candidates,null,2)+'\n');console.log(Object.fromEntries(Object.entries(candidates).map(([length,words])=>[length,words.length])));process.exit(0);}
const review=JSON.parse(read('review.json')),vocabulary={},definitions={},selection={},canonical={};
if(review.candidateSha256!==hash(JSON.stringify(candidates,null,2)+'\n'))throw Error('Review candidate hash differs: re-review current Romanian candidates');
const candidateWords=Object.values(candidates).flat().map(item=>item.word),reviewed=new Set([...review.approved,...Object.keys(review.excluded)]);
if(candidateWords.some(word=>!reviewed.has(word))||[...reviewed].some(word=>!candidateWords.includes(word))||review.approved.some(word=>word in review.excluded))throw Error('Review must classify every current candidate exactly once');
// Exact source-sense rejections are auditable; changed source text requires a fresh review.
const senseKey=(word,entry,sense)=>JSON.stringify([word,entry.sourceWord,entry.partOfSpeech,sense.gloss]);
const rejected=new Set((review.rejectedSenses??[]).map(item=>senseKey(item.word,item,item)));
if(rejected.size!==(review.rejectedSenses??[]).length)throw Error('Duplicate rejected sense');
for(const item of review.rejectedSenses??[])if(!lexical[item.word]?.some(entry=>entry.senses.some(sense=>senseKey(item.word,entry,sense)===senseKey(item.word,item,item))))throw Error('Rejected source sense no longer exists: '+item.word);
for(let length=3;length<=11;length++)vocabulary[length]={answers:[],guesses:[]};
for(const word of Object.keys(lexical).sort()){
 if(!/^[A-ZĂÂÎȘȚ]{3,11}$/.test(word)||word!==word.normalize('NFC'))throw Error('Unexpected spelling: '+word);
 const retained=lexical[word].map(entry=>({...entry,senses:entry.senses.filter(sense=>!rejected.has(senseKey(word,entry,sense)))})).filter(entry=>entry.senses.length);
 if(!retained.length)continue;
 vocabulary[word.length].guesses.push(word);
 const headword=eligible(retained)[0]?.sourceWord??retained[0].sourceWord;
 canonical[word]=headword;
 if(review.approved.includes(word)){
  const senses=eligible(retained);
  if(!qualifiesFrequency(word)||!senses.length)throw Error('Unqualified reviewed answer: '+word);
  vocabulary[word.length].answers.push(word);selection[word]={zipf:frequency[word],senses,...(editorialSupplements[word]?{editorialSupplement:editorialSupplements[word].reason}:{})};
 }
 definitions[word]=retained.slice(0,8).map(entry=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,senses:[...new Set(entry.senses.map(sense=>{const tags=[...new Set([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])])];return(tags.length?'['+tags.join(', ')+'] ':'')+sense.gloss;}))].slice(0,8)}));
}
if(new Set(review.approved).size!==review.approved.length)throw Error('Duplicate approved word');
for(const word of review.approved)if(!selection[word])throw Error('Missing approved answer '+word);
for(const [length,data] of Object.entries(vocabulary))if(data.answers.length<20)throw Error('Insufficient reviewed Romanian answers at length '+length);
const serialized=value=>JSON.stringify(value,null,2)+'\n';
const outputs={'vocabulary.json':serialized(vocabulary),'answer-selection.json':serialized(selection),'canonical-spellings.json':serialized(canonical)};
for(let length=3;length<=11;length++)outputs[`definitions-${length}.json`]=JSON.stringify(Object.fromEntries(Object.entries(definitions).filter(([word])=>word.length===length)))+'\n';
const audit={version:source.version,language:'ro-RO',minimumZipf:4.3,editorialSupplements,guessMinimumZipf:2.5,rejectedSourceSenses:rejected.size,orthography:'NFC Romanian 31-letter alphabet. Ă, Â, Î, Ș and Ț remain distinct. Legacy Ş/Ţ map to Ș/Ț only. No accent folding, transliteration or punctuation stripping. Canonical source spelling retained separately.',frequencyNormalization:'NFC uppercase and legacy cedilla-to-comma aliases. All 31 Romanian letters remain distinct. Maximum case-normalized spelling frequency, not a sum; sense frequency is not certified.',lengths:Object.fromEntries(Object.entries(vocabulary).map(([length,data])=>[length,{answers:data.answers.length,guesses:data.guesses.length,definedGuesses:data.guesses.filter(word=>definitions[word]?.length).length}])),review:'Explicit independent model-reviewed allowlist, not native-human certification. Ă, Â, Î, Ș and Ț remain distinct single tiles; canonical source spelling is preserved.',inputs:{...source.inputs,'review.json':hash(read('review.json'))},outputs:Object.fromEntries(Object.entries(outputs).map(([name,value])=>[name,hash(value)])),limitations:'Conservative starter answer pool. Frequency is historical mixed-region spelling frequency, not current Romania-specific sense frequency. Source labels and model review may be incomplete. Broader guesses include labelled historical, regional and inflected entries. No exhaustive morphology coverage.'};
outputs['coverage.json']=serialized(audit);
for(const [name,value] of Object.entries(outputs)){if(process.argv.includes('--check')){if(read(name)!==value)throw Error('Regenerate Romanian: '+name);}else writeFileSync(new URL(name,root),value);}
console.log(JSON.stringify(audit));
