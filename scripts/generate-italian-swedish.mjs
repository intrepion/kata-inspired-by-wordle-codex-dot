/** Offline Italian/Swedish language packs. Review every candidate before generation. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex'),serial=value=>JSON.stringify(value,null,2)+'\n';
for(const name of ['italian','swedish']){
 const root=new URL(`../src/data/${name}/`,import.meta.url),read=file=>readFileSync(new URL(file,root),'utf8'),source=JSON.parse(read('source.json'));
 for(const [file,digest] of Object.entries(source.inputs))if(hash(read(file))!==digest)throw Error('Pinned input differs: '+file);
 const lexical=JSON.parse(read('lexical-evidence.json')),frequency=JSON.parse(read('frequency-evidence.json'));
 const key=word=>name==='italian'?word.replace(/À/g,'A').replace(/[ÈÉ]/g,'E').replace(/Ì/g,'I').replace(/[ÒÓ]/g,'O').replace(/Ù/g,'U'):word.normalize('NFC');
 const blocked=/archaic|obsolete|dated|historical|rare|uncommon|dialect|regional|slang|derogatory|offensive|vulgar|slur|abbreviation|clipping|misspelling|nonstandard|nonce|morpheme|name|alt-of|form-of|alternative|contraction|Switzerland|Swiss|Ticino|Finland|Estonia/i;
 const forms=/\b(?:inflection|conjugation|plural of|alternative (?:form|spelling)|misspelling|superseded|obsolete spelling|abbreviation|clipping|diminutive of|past participle|present participle|inflected form)\b/i;
 const eligible=entries=>entries.flatMap(entry=>entry.senses.filter(sense=>!sense.form_of&&!sense.alt_of&&!forms.test(sense.gloss)&&!blocked.test([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])].join(' '))).map(sense=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,gloss:sense.gloss,tags:[...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])]})));
 const minimumZipf=length=>name==='swedish'&&length===11?4:4.3;
 const candidates={};for(let n=3;n<=11;n++)candidates[n]=Object.keys(lexical).filter(word=>word.length===n&&frequency[word]>=minimumZipf(n)&&eligible(lexical[word]).length).sort((a,b)=>frequency[b]-frequency[a]||a.localeCompare(b,'en')).map(word=>({word,zipf:frequency[word],senses:eligible(lexical[word])}));
 if(process.argv.includes('--candidates')){writeFileSync(new URL('candidates.json',root),serial(candidates));console.log(name,Object.fromEntries(Object.entries(candidates).map(([n,words])=>[n,words.length])));continue}
 const review=JSON.parse(read('review.json')),candidateWords=Object.values(candidates).flat().map(item=>item.word),reviewed=new Set([...review.approved,...Object.keys(review.excluded)]);
 if(review.candidateSha256!==hash(serial(candidates)))throw Error('Review evidence changed: '+name);
 if(candidateWords.some(word=>!reviewed.has(word))||[...reviewed].some(word=>!candidateWords.includes(word))||review.approved.some(word=>word in review.excluded)||new Set(review.approved).size!==review.approved.length)throw Error('Review must classify every candidate exactly once: '+name);
 const unresolved=gloss=>/^synonym of [^:;()]+[.!]?$/i.test(gloss);
 const omitted=(word,gloss)=>unresolved(gloss)||(review.omittedGlosses?.[word]??[]).includes(gloss);
 const vocabulary={},definitions={},selection={},collisions={},answerKeys=new Set();for(let n=3;n<=11;n++)vocabulary[n]={answers:[],guesses:[]};
 for(const word of Object.keys(lexical).sort()){
  const pattern=name==='italian'?/^[A-ZÀÈÉÌÒÓÙ]{3,11}$/:/^[A-ZÅÄÖ]{3,11}$/;
  if(!pattern.test(word)||word!==word.normalize('NFC'))throw Error('Unexpected spelling: '+word);
  const folded=key(word);vocabulary[word.length].guesses.push(word);(collisions[folded]??=[]).push(word);
  const primary=review.primarySenses?.[word];
  if(review.approved.includes(word)){
   const senses=eligible(lexical[word]);if(frequency[word]<minimumZipf(word.length)||!senses.length)throw Error('Unqualified reviewed answer '+word);
   if(!primary||omitted(word,primary.gloss)||!senses.some(s=>s.sourceWord===primary.sourceWord&&s.partOfSpeech===primary.partOfSpeech&&s.gloss===primary.gloss))throw Error('Missing exact source primary sense: '+word);
   if(answerKeys.has(folded))throw Error('Competing accent-equivalent answers '+word);answerKeys.add(folded);
   vocabulary[word.length].answers.push(word);selection[word]={zipf:frequency[word],primarySense:primary,senses};
  }
  const entries=[...lexical[word]].sort((a,b)=>Number(b.sourceWord===primary?.sourceWord&&b.partOfSpeech===primary?.partOfSpeech)-Number(a.sourceWord===primary?.sourceWord&&a.partOfSpeech===primary?.partOfSpeech));
  (definitions[folded]??=[]).push(...entries.slice(0,8).map(entry=>({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,senses:[...new Set([...entry.senses].filter(sense=>!omitted(word,sense.gloss)).sort((a,b)=>Number(b.gloss===primary?.gloss)-Number(a.gloss===primary?.gloss)).map(sense=>{const tags=[...new Set([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])])];return(tags.length?'['+tags.join(', ')+'] ':'')+sense.gloss;}))].slice(0,8)})).filter(entry=>entry.senses.length));
 }
 // A plain Italian guess may match several accent variants. Prefer the reviewed
 // answer sense across the merged group, not an alphabetically earlier archaic alias.
 for(const [word,{primarySense:primary}] of Object.entries(selection)){
  const rank=entry=>entry.sourceWord===primary.sourceWord&&entry.partOfSpeech===primary.partOfSpeech&&entry.senses.some(sense=>sense.endsWith(primary.gloss))?1:0;
  definitions[key(word)].sort((a,b)=>rank(b)-rank(a));
 }
 for(const [length,data] of Object.entries(vocabulary))if(data.answers.length<20)throw Error('Too few reviewed answers: '+name+' '+length);
 const outputs={'vocabulary.json':serial(vocabulary),'answer-selection.json':serial(selection),'collisions.json':serial(Object.fromEntries(Object.entries(collisions).filter(([,words])=>words.length>1)))};
 for(let n=3;n<=11;n++)outputs[`definitions-${n}.json`]=JSON.stringify(Object.fromEntries(Object.entries(definitions).filter(([word])=>word.length===n)))+'\n';
 const coverage={version:source.version,language:source.language,minimumZipfByLength:Object.fromEntries(Array.from({length:9},(_,i)=>[i+3,minimumZipf(i+3)])),guessMinimumZipf:2.5,lengths:Object.fromEntries(Object.entries(vocabulary).map(([n,data])=>[n,{answers:data.answers.length,guesses:data.guesses.length,definedGuesses:data.guesses.filter(word=>definitions[key(word)]?.length).length,missingMeanings:data.guesses.filter(word=>!definitions[key(word)]?.length)}])),inputs:{...source.inputs,'review.json':hash(read('review.json'))},outputs:Object.fromEntries(Object.entries(outputs).map(([file,content])=>[file,hash(content)])),limitations:'Explicit model editorial review, not native-human certification. Historical spelling frequency is not sense-specific or exclusive to Italy/Sweden. Labels and sense coverage may be incomplete. Broader guesses include inflections and uncommon words. Italian accents fold only for play; Swedish Å Ä Ö remain distinct. Swedish accented loanwords outside the 29-letter alphabet are omitted, never silently folded.'};
 outputs['coverage.json']=serial(coverage);
 for(const [file,content] of Object.entries(outputs)){if(process.argv.includes('--check')){if(read(file)!==content)throw Error('Regenerate '+name+' '+file)}else writeFileSync(new URL(file,root),content)}console.log(name,JSON.stringify(coverage.lengths));
}
