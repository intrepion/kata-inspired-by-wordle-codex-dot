/** Offline French word packs. Licensed lexical evidence, curated regional answers. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../src/data/french/',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const hash=value=>createHash('sha256').update(value).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
const source=JSON.parse(read('source.json'));
for(const [name,digest] of Object.entries(source.inputs))if(hash(read(name))!==digest)throw Error('Pinned French input differs: '+name);
const lexical=JSON.parse(read('lexical-evidence.json')),frequency=JSON.parse(read('frequency-evidence.json')),review=JSON.parse(read('review.json'));
const tileSpelling=raw=>raw.normalize('NFC').toLocaleUpperCase('fr').replace(/Œ/g,'OE').replace(/Æ/g,'AE');
const fold=raw=>tileSpelling(raw).normalize('NFD').replace(/\p{M}/gu,'').normalize('NFC');
const blocked=/archaic|obsolete|dated|historical|rare|uncommon|dialect|slang|derogatory|offensive|vulgar|slur|abbreviation|clipping|misspelling|nonstandard|nonce|morpheme|name|uppercase|capitalized|alt-of|form-of|alternative|contraction/i;
const geographic=/regional|Quebec|Canada|North-America|Belgium|Switzerland|Louisiana|Acadia|Africa|Haiti|France|European/i;
const formGloss=/\b(?:inflection|conjugation|plural of|alternative (?:form|spelling)|misspelling|superseded|obsolete spelling|abbreviation|clipping|diminutive of|past participle|present participle|inflected form)\b/i;
const tags=(entry,sense)=>[...new Set([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])])];
function eligible(entries,allowRegional=false){return entries.flatMap(entry=>entry.senses.filter(sense=>!sense.form_of&&!sense.alt_of&&!formGloss.test(sense.gloss)&&!blocked.test(tags(entry,sense).join(' '))&&(allowRegional||!geographic.test(tags(entry,sense).join(' ')))).map(sense=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,gloss:sense.gloss,tags:tags(entry,sense)})));}
const shared=[...review.sharedApproved,...Object.keys(review.sharedExceptions)];
if(new Set(shared).size!==shared.length)throw Error('Duplicate shared French approval');
for(const word of shared){
 if(!lexical[word]||!eligible(lexical[word]).length)throw Error('No eligible shared French sense: '+word);
 if(!review.sharedExceptions[word]&&!(frequency[word]>=review.ordinaryMinimumZipf))throw Error('Unqualified shared French frequency: '+word);
}
const guesses=Object.fromEntries(Array.from({length:9},(_,i)=>[i+3,[]]));
const definitions={},canonical={},normalizedKeys={};
for(const word of Object.keys(lexical).sort()){
 if(word!==tileSpelling(word)||!(/^[A-ZÀÂÇÉÈÊËÎÏÔÙÛÜŸ]{3,11}$/).test(word)||!/^[A-Z]{3,11}$/.test(fold(word)))throw Error('Invalid French tiles: '+word);
 guesses[word.length].push(word);
 const entries=lexical[word];
 definitions[word]=entries.slice(0,8).map(entry=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,senses:[...new Set(entry.senses.map(sense=>{const labels=tags(entry,sense);return(labels.length?'['+labels.join(', ')+'] ':'')+sense.gloss;}))].slice(0,8)}));
 normalizedKeys[word]=fold(word);
 // Prefer a full lexical headword to a nonstandard unligatured alternative.
 const ordinary=eligible(entries,true);
 const chosen=ordinary.find(sense=>/[œæ]/.test(sense.sourceWord))??ordinary[0];
 if(chosen){const spelling=chosen.sourceWord.normalize('NFC').toLocaleUpperCase('fr');if(spelling!==word)canonical[word]=spelling;}
}
const regionTags={
 'fr-CA':new Set(['Canada','Canadian','Quebec','North-America','Acadia','Newfoundland','Ontario','in Quebec']),
 'fr-FR':new Set(['France','Europe','Normandy','Lyon','Alsatian','Lorraine','Toulouse','Alsace','Picardy','Paris','in France']),
 other:new Set(['Belgium','Switzerland','Louisiana','Africa','Southern-Africa','Haiti','US','Luxembourg','Morocco','Congo','Antilles','Rwanda','Vietnam'])
};
/** Labels constrain senses, not whole polysemous words. Inherit known form/alt targets. */
function regionAllows(word,locale,seen=new Set()){
 if(review.guessRegionOverrides[locale][word])return true;
 if(seen.has(word)||!lexical[word])return true; // Incomplete source: do not invent a region.
 const next=new Set([...seen,word]);
 return lexical[word].some(entry=>entry.senses.some(sense=>{
  const labels=tags(entry,sense);
  const locations=Object.entries(regionTags).filter(([,set])=>labels.some(tag=>set.has(tag))).map(([region])=>region);
  if(locations.length)return locations.includes(locale);
  const references=sense.form_of??sense.alt_of;
  return !references?.length||references.some(reference=>regionAllows(tileSpelling(reference.word),locale,next));
 }));
}
const outputs={},selection={},collisions={},primarySenses={},regionalExcluded={};
for(const locale of ['fr-CA','fr-FR']){
 const regional=Object.keys(review.regionalApproved[locale]);
 primarySenses[locale]={};
 if(JSON.stringify(Object.keys(review.regionalPrimarySenses[locale]).sort())!==JSON.stringify([...regional].sort()))throw Error('Primary senses must cover exactly the reviewed regional additions');
 for(const word of regional){
  const gloss=review.regionalPrimarySenses[locale][word];
  // Informal email is acceptable for MAIL; no generic region-based reprioritization.
  const sense=eligible(lexical[word]??[],true).find(sense=>sense.gloss===gloss);
  if(!sense)throw Error('Unattested or unsuitable regional primary sense: '+word);
  primarySenses[locale][fold(word)]={sourceWord:sense.sourceWord,partOfSpeech:sense.partOfSpeech,gloss:sense.gloss};
 }
 if(regional.some(word=>shared.includes(word)))throw Error('Regional/shared approval overlap');
 for(const word of regional)if(!lexical[word]||!eligible(lexical[word],true).length)throw Error('No eligible regional French sense: '+word);
 const byKey=new Map();
 // Exactly one answer per playable spelling prevents duplicated adaptive candidates.
 for(const word of [...shared,...regional].sort((a,b)=>(frequency[b]??0)-(frequency[a]??0)||a.localeCompare(b,'en'))){
  const key=fold(word),prior=byKey.get(key);
  if(prior){(collisions[locale]??={})[key]=[...new Set([prior,...(collisions[locale]?.[key]??[]),word])];continue;}
  byKey.set(key,word);
 }
 const answers=[...byKey.values()].sort();
 regionalExcluded[locale]=Object.keys(lexical).filter(word=>!regionAllows(word,locale)).sort();
 const vocabulary=Object.fromEntries(Object.entries(guesses).map(([length,words])=>[length,{answers:answers.filter(word=>word.length===Number(length)),guesses:words.filter(word=>regionAllows(word,locale))}]));
 for(const word of answers)if(!vocabulary[word.length].guesses.includes(word))throw Error('Answer excluded by regional guess policy: '+locale+' '+word);
 for(const [length,data] of Object.entries(vocabulary))if(data.answers.length<40)throw Error(`Insufficient French ${locale} answers at ${length}`);
 outputs[`vocabulary-${locale}.json`]=json(vocabulary);
 selection[locale]=Object.fromEntries(answers.map(word=>[word,{canonical:canonical[word]??word,normalizedKey:fold(word),zipf:frequency[word]??null,policy:review.regionalApproved[locale][word]??review.sharedExceptions[word]??'Reviewed common French core.',senses:eligible(lexical[word],regional.includes(word))}]));
}
outputs['regional-guess-policy.json']=json({excluded:regionalExcluded,overrides:review.guessRegionOverrides,policy:'Retain a word when any sense is general French or matches the selected region. Follow known form/alternative targets. Exclude only when all supplied senses point elsewhere. Reviewed exceptions correct incomplete labels. Missing labels or references do not prove regional exclusivity.'});
outputs['regional-primary-senses.json']=json(primarySenses);
outputs['canonical-spellings.json']=JSON.stringify(canonical)+'\n';
outputs['normalized-keys.json']=JSON.stringify(normalizedKeys)+'\n';
outputs['answer-selection.json']=json(selection);
for(let length=3;length<=11;length++)outputs[`definitions-${length}.json`]=JSON.stringify(Object.fromEntries(Object.entries(definitions).filter(([word])=>word.length===length)))+'\n';
const audit={version:source.version,languages:['fr-CA','fr-FR'],ordinaryMinimumZipf:review.ordinaryMinimumZipf,guessMinimumZipf:2.5,lengths:Object.fromEntries(['fr-CA','fr-FR'].map(locale=>[locale,Object.fromEntries(Object.entries(JSON.parse(outputs[`vocabulary-${locale}.json`])).map(([length,data])=>[length,{answers:data.answers.length,guesses:data.guesses.length,definedGuesses:data.guesses.filter(word=>definitions[word]?.length).length}]))])),normalizedAnswerCollisions:collisions,review:review.review,orthography:'Accents and cedilla are ignored for comparison. Œ/OE and Æ/AE each occupy two tiles. Answer strings keep accents but expand ligatures for grid-length compatibility. Canonical map retains original orthography for reveals and source links. One answer per folded key per variety.',inputs:{...source.inputs,'review.json':hash(read('review.json'))},outputs:Object.fromEntries(Object.entries(outputs).map(([name,value])=>[name,hash(value)])),limitations:'Conservative starter pools, not exhaustive regional dictionaries. Accepted guesses use source regional-sense labels and inherited form labels with reviewed exceptions; general French remains shared. Regional labels are incomplete, so this is not exhaustive national dictionary separation. Frequency is historical mixed-region spelling frequency, not Canadian/France sense frequency. A small explicit regional allowlist distinguishes answers; other senses remain visible and labelled. Some Canadian additions are specifically Québécois. Native-human review has not been performed.'};
outputs['coverage.json']=json(audit);
for(const [name,value] of Object.entries(outputs)){if(process.argv.includes('--check')){if(read(name)!==value)throw Error('Regenerate French: '+name);}else writeFileSync(new URL(name,root),value);}
console.log(JSON.stringify({lengths:audit.lengths,normalizedAnswerCollisions:collisions}));
