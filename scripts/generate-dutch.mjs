/** Offline Dutch vocabulary: preserved accents, IJ is two letters, curated answer whitelist. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../src/data/dutch/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8'),hash=value=>createHash('sha256').update(value).digest('hex');
const source=JSON.parse(read('source.json'));
for(const [name,digest] of Object.entries(source.inputs))if(hash(read(name))!==digest)throw Error('Pinned input differs: '+name);
const lexical=JSON.parse(read('lexical-evidence.json')),frequency=JSON.parse(read('frequency-evidence.json'));
const blocked=/archaic|obsolete|dated|historical|rare|uncommon|dialect|regional|slang|derogatory|offensive|vulgar|slur|abbreviation|clipping|misspelling|nonstandard|nonce|morpheme|name|uppercase|capitalized|alt-of|form-of|alternative|contraction|Belgium|Belgian|Flanders|Flemish|Suriname|Surinamese|South Africa|Afrikaans/i;
const formGloss=/\b(?:inflection|conjugation|plural of|alternative (?:form|spelling)|misspelling|superseded|obsolete spelling|abbreviation|clipping|diminutive of|past participle|present participle|inflected form)\b/i;
const eligible=entries=>entries.flatMap(entry=>entry.senses.filter(sense=>!sense.form_of&&!sense.alt_of&&!formGloss.test(sense.gloss)&&!blocked.test([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])].join(' '))).map(sense=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,gloss:sense.gloss,tags:[...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])]})));
const candidates={};
for(let length=3;length<=11;length++)candidates[length]=Object.keys(lexical).filter(word=>word.length===length&&frequency[word]>=4.3&&eligible(lexical[word]).length).sort((a,b)=>frequency[b]-frequency[a]||a.localeCompare(b,'en')).map(word=>({word,zipf:frequency[word],senses:eligible(lexical[word])}));
if(process.argv.includes('--candidates')){writeFileSync(new URL('candidates.json',root),JSON.stringify(candidates,null,2)+'\n');console.log(Object.fromEntries(Object.entries(candidates).map(([length,words])=>[length,words.length])));process.exit(0);}
const review=JSON.parse(read('review.json')),vocabulary={},definitions={},selection={};
const candidateWords=Object.values(candidates).flat().map(item=>item.word),reviewed=new Set([...review.approved,...Object.keys(review.excluded)]);
if(candidateWords.some(word=>!reviewed.has(word))||[...reviewed].some(word=>!candidateWords.includes(word))||review.approved.some(word=>word in review.excluded))throw Error('Review must classify every current candidate exactly once');
for(let length=3;length<=11;length++)vocabulary[length]={answers:[],guesses:[]};
for(const word of Object.keys(lexical).sort()){
 if(!/^[A-ZÀÁÂÄÇÈÉÊËÍÎÏÓÔÖÙÚÛÜ]{3,11}$/.test(word)||word!==word.normalize('NFC'))throw Error('Unexpected spelling: '+word);
 vocabulary[word.length].guesses.push(word);
 if(review.approved.includes(word)){
  const senses=eligible(lexical[word]);
  if(!(frequency[word]>=4.3)||!senses.length)throw Error('Unqualified reviewed answer: '+word);
  vocabulary[word.length].answers.push(word);selection[word]={zipf:frequency[word],senses};
 }
 definitions[word]=lexical[word].slice(0,8).map(entry=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,senses:[...new Set(entry.senses.map(sense=>{const tags=[...new Set([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])])];return(tags.length?'['+tags.join(', ')+'] ':'')+sense.gloss;}))].slice(0,8)}));
}
if(new Set(review.approved).size!==review.approved.length)throw Error('Duplicate approved word');
for(const word of review.approved)if(!selection[word])throw Error('Missing approved answer '+word);
for(const [length,data] of Object.entries(vocabulary))if(data.answers.length<40)throw Error('Insufficient reviewed Dutch answers at length '+length);
const serialized=value=>JSON.stringify(value,null,2)+'\n';
const outputs={'vocabulary.json':serialized(vocabulary),'answer-selection.json':serialized(selection)};
for(let length=3;length<=11;length++)outputs[`definitions-${length}.json`]=JSON.stringify(Object.fromEntries(Object.entries(definitions).filter(([word])=>word.length===length)))+'\n';
const audit={version:source.version,language:'nl-NL',minimumZipf:4.3,lengths:Object.fromEntries(Object.entries(vocabulary).map(([length,data])=>[length,{answers:data.answers.length,guesses:data.guesses.length,definedGuesses:data.guesses.filter(word=>definitions[word]?.length).length}])),review:'Explicit independent model-reviewed allowlist, not native-human certification.',inputs:{...source.inputs,'review.json':hash(read('review.json'))},outputs:Object.fromEntries(Object.entries(outputs).map(([name,value])=>[name,hash(value)])),limitations:'Conservative starter answer pool. Frequency is historical mixed-region spelling frequency, not current Netherlands sense frequency. Source labels and model review may be incomplete. Broader guesses include labelled historical, regional and inflected entries. No exhaustive morphology coverage.'};
outputs['coverage.json']=serialized(audit);
for(const [name,value] of Object.entries(outputs)){if(process.argv.includes('--check')){if(read(name)!==value)throw Error('Regenerate Dutch: '+name);}else writeFileSync(new URL(name,root),value);}
console.log(JSON.stringify(audit));
