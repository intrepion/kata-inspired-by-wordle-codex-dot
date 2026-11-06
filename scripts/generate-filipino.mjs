import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FILIPINO_MIN_ZIPF,selectFilipinoAnswer} from './filipino-answer-policy.mjs';
const root=new URL('../src/data/filipino/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8'),hash=value=>createHash('sha256').update(value).digest('hex');
const source=JSON.parse(read('source.json'));
for(const [name,digest] of Object.entries(source.inputs))if(hash(read(name))!==digest)throw Error('Pinned input differs: '+name);
const lexical=JSON.parse(read('lexical-evidence.json')),frequency=JSON.parse(read('frequency-evidence.json')),review=JSON.parse(read('review.json'));
const guesses=Object.keys(lexical).sort(),answers=[],definitions={},selection={};
for(const word of guesses){
 if(!/^[A-ZÑ]{5}$/.test(word))throw Error('Unexpected normalized spelling: '+word);
 const entries=lexical[word].map(entry=>({...entry,senses:entry.senses.filter(sense=>!review[word]?.omitGlosses?.includes(sense.gloss))})),selected=selectFilipinoAnswer(entries,frequency[word],review[word]);
 if(selected.possible){answers.push(word);selection[word]={zipf:frequency[word],senses:selected.senses};}
 const output=[];
 for(const entry of entries){
  const senses=[];
  for(const sense of entry.senses){
   const tags=[...new Set([...(entry.tags??[]),...(sense.tags??[]),...(sense.raw_tags??[])])];
   const value=(tags.length?'['+tags.join(', ')+'] ':'')+sense.gloss;
   if(!senses.includes(value))senses.push(value);
   if(senses.length===8)break;
  }
  if(senses.length)output.push({sourceWord:entry.sourceWord,partOfSpeech:entry.partOfSpeech,senses});
  if(output.length===8)break;
 }
 if(output.length)definitions[word]=output;
}
if(answers.length<100)throw Error('Filipino requires at least 100 qualified answers.');
const serialized=value=>JSON.stringify(value,null,2)+'\n';
const outputs={'vocabulary.json':serialized({answers,guesses}),'definitions.json':JSON.stringify(definitions)+'\n','answer-selection.json':serialized(selection)};
const audit={version:source.version,language:'fil-PH',wordLength:5,minimumZipf:FILIPINO_MIN_ZIPF,accepted:guesses.length,answers:answers.length,definedGuesses:Object.keys(definitions).length,definedAnswers:answers.filter(word=>definitions[word]).length,reviewedExclusions:Object.values(review).filter(value=>value.exclude).length,reviewedMeaningCorrections:Object.values(review).filter(value=>value.omitGlosses?.length).length,inputs:{...source.inputs,'review.json':hash(read('review.json'))},outputs:Object.fromEntries(Object.entries(outputs).map(([name,value])=>[name,hash(value)])),limitations:'Conservative source-label/frequency selection with explicit editorial exclusions; not native-human certification. Guesses are attested headwords only, not exhaustive inflection coverage. Optional vowel marks collapse meanings; labels and historical spelling frequency can be incomplete.'};
outputs['coverage.json']=serialized(audit);
for(const [name,value] of Object.entries(outputs)){const path=new URL(name,root);if(process.argv.includes('--check')){if(read(name)!==value)throw Error('Regenerate Filipino: '+name)}else writeFileSync(path,value);}
console.log(JSON.stringify(audit));
