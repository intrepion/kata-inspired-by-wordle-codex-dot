/** Offline Ukrainian vocabulary: NFC Ukrainian with distinct Й and Ї, curated answer whitelist. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../src/data/ukrainian/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8'),hash=value=>createHash('sha256').update(value).digest('hex');
const source=JSON.parse(read('source.json'));
for(const [name,digest] of Object.entries(source.inputs))if(hash(read(name))!==digest)throw Error('Pinned input differs: '+name);
const lexical=JSON.parse(read('lexical-evidence.json')),frequency=JSON.parse(read('frequency-evidence.json'));
const blocked=/archaic|obsolete|dated|historical|rare|uncommon|dialect|regional|slang|derogatory|offensive|vulgar|slur|abbreviation|clipping|misspelling|nonstandard|nonce|morpheme|name|alt-of|form-of|alternative|contraction|Russian|Russia|Belarusian|Belarus|pre-reform|pre-1991/i;
const formGloss=/\b(?:inflection|conjugation|plural of|alternative (?:form|spelling)|misspelling|superseded|obsolete spelling|abbreviation|clipping|diminutive of|past participle|present participle|inflected form)\b/i;
const eligible=entries=>entries.flatMap(entry=>entry.senses.filter(sense=>!sense.form_of&&!sense.alt_of&&!formGloss.test(sense.gloss)&&!blocked.test([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])].join(' '))).map(sense=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,gloss:sense.gloss,tags:[...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])]})));
// One independently reviewed familiar lemma covers Ґ without merging it with Г.
const editorialSupplements={'ҐРУНТ':{minimumZipf:3.82,reason:'Standard familiar lemma: soil, ground; historical frequency under the general 4.3 threshold. Individually reviewed; Ґ remains distinct.'}};
const qualifiesFrequency=word=>frequency[word]>=4.3||word in editorialSupplements&&frequency[word]>=editorialSupplements[word].minimumZipf;
const candidates={};
for(let length=3;length<=11;length++)candidates[length]=Object.keys(lexical).filter(word=>word.length===length&&qualifiesFrequency(word)&&eligible(lexical[word]).length).sort((a,b)=>frequency[b]-frequency[a]||a.localeCompare(b,'en')).map(word=>({word,zipf:frequency[word],senses:eligible(lexical[word]),...(editorialSupplements[word]?{editorialSupplement:editorialSupplements[word].reason}:{})}));
if(process.argv.includes('--candidates')){writeFileSync(new URL('candidates.json',root),JSON.stringify(candidates,null,2)+'\n');console.log(Object.fromEntries(Object.entries(candidates).map(([length,words])=>[length,words.length])));process.exit(0);}
const review=JSON.parse(read('review.json')),vocabulary={},definitions={},selection={},canonical={};
if(review.candidateSha256!==hash(JSON.stringify(candidates,null,2)+'\n'))throw Error('Review candidate hash differs: re-review current Ukrainian candidates');
const candidateWords=Object.values(candidates).flat().map(item=>item.word),reviewed=new Set([...review.approved,...Object.keys(review.excluded)]);
if(candidateWords.some(word=>!reviewed.has(word))||[...reviewed].some(word=>!candidateWords.includes(word))||review.approved.some(word=>word in review.excluded))throw Error('Review must classify every current candidate exactly once');
for(let length=3;length<=11;length++)vocabulary[length]={answers:[],guesses:[]};
for(const word of Object.keys(lexical).sort()){
 if(!/^[АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ]{3,11}$/.test(word)||word!==word.normalize('NFC'))throw Error('Unexpected spelling: '+word);
 vocabulary[word.length].guesses.push(word);
 const headword=eligible(lexical[word])[0]?.sourceWord??lexical[word][0].sourceWord;
 canonical[word]=headword;
 if(review.approved.includes(word)){
  const senses=eligible(lexical[word]);
  if(!qualifiesFrequency(word)||!senses.length)throw Error('Unqualified reviewed answer: '+word);
  vocabulary[word.length].answers.push(word);selection[word]={zipf:frequency[word],senses,...(editorialSupplements[word]?{editorialSupplement:editorialSupplements[word].reason}:{})};
 }
 definitions[word]=lexical[word].slice(0,8).map(entry=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,senses:[...new Set(entry.senses.map(sense=>{const tags=[...new Set([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])])];return(tags.length?'['+tags.join(', ')+'] ':'')+sense.gloss;}))].slice(0,8)}));
}
if(new Set(review.approved).size!==review.approved.length)throw Error('Duplicate approved word');
for(const word of review.approved)if(!selection[word])throw Error('Missing approved answer '+word);
for(const [length,data] of Object.entries(vocabulary))if(data.answers.length<40)throw Error('Insufficient reviewed Ukrainian answers at length '+length);
const serialized=value=>JSON.stringify(value,null,2)+'\n';
const outputs={'vocabulary.json':serialized(vocabulary),'answer-selection.json':serialized(selection),'canonical-spellings.json':serialized(canonical)};
for(let length=3;length<=11;length++)outputs[`definitions-${length}.json`]=JSON.stringify(Object.fromEntries(Object.entries(definitions).filter(([word])=>word.length===length)))+'\n';
const audit={version:source.version,language:'uk-UA',minimumZipf:4.3,editorialSupplements,guessMinimumZipf:2.5,orthography:'NFC Ukrainian 33-letter alphabet. Й/И, Ї/І, Є/Е and Ґ/Г remain distinct. Ь occupies one tile. No accent folding, transliteration or apostrophe stripping. Canonical source spelling retained separately.',frequencyNormalization:'NFC uppercase only. All Ukrainian letters remain distinct. Maximum case-normalized spelling frequency, not a sum; sense frequency is not certified.',lengths:Object.fromEntries(Object.entries(vocabulary).map(([length,data])=>[length,{answers:data.answers.length,guesses:data.guesses.length,definedGuesses:data.guesses.filter(word=>definitions[word]?.length).length}])),review:'Explicit independent model-reviewed allowlist, not native-human certification. Й and Ї remain distinct single tiles; canonical source spelling is preserved.',inputs:{...source.inputs,'review.json':hash(read('review.json'))},outputs:Object.fromEntries(Object.entries(outputs).map(([name,value])=>[name,hash(value)])),limitations:'Conservative starter answer pool. Frequency is historical mixed-region spelling frequency, not current Ukraine-specific sense frequency. Source labels and model review may be incomplete. Broader guesses include labelled historical, regional and inflected entries. No exhaustive morphology coverage.'};
outputs['coverage.json']=serialized(audit);
for(const [name,value] of Object.entries(outputs)){if(process.argv.includes('--check')){if(read(name)!==value)throw Error('Regenerate Ukrainian: '+name);}else writeFileSync(new URL(name,root),value);}
console.log(JSON.stringify(audit));
