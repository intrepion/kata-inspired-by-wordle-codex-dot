import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {SPANISH_MIN_ZIPF,selectSpanishAnswer} from './spanish-eligibility-policy.mjs';
const data=new URL('../src/data/spanish/',import.meta.url),read=file=>readFileSync(new URL(file,data),'utf8');
const manifest=JSON.parse(read('selection-source.json'));
for(const [file,digest]of Object.entries(manifest.inputs))if(createHash('sha256').update(read(file)).digest('hex')!==digest)throw Error('Selection source changed: '+file);
const supplements=JSON.parse(read('supplemental-senses.json'));
function checkedReview(word){
 const review=overrides.words[word],preferred=review?.preferredEvidence;if(preferred?.source!=='supplemental')return review;
 const record=supplements[word];if(!record||createHash('sha256').update(record.responseRaw).digest('hex')!==record.sha256)throw Error('Invalid supplemental source: '+word);
 const group=JSON.parse(record.responseRaw).es?.[preferred.entry],definition=group?.definitions?.[preferred.sense]?.definition;
 if(group?.partOfSpeech!=='Noun'||typeof definition!=='string'||!preferred.requiredText.every(text=>definition.includes(text)))throw Error('Unverified independent noun sense: '+word);
 return {...review,validatedNounEvidence:{entry:preferred.entry,sense:preferred.sense}};
}
const frequency=JSON.parse(read('frequency-evidence.json')),lexical=JSON.parse(read('lexical-evidence.json')),overrides=JSON.parse(read('selection-overrides.json'));
// Frozen spelling source: selecting answers must never broaden the accepted-guess dictionary.
const text=read('vocabulary.ts'),current=JSON.parse(text.slice(text.indexOf(' = ')+3).trim().replace(/;$/,''));
const answers={},reasonGroups={},reviewedReasons={},evidence={},counts={};
for(const length of [4,5,6,7]){
 answers[length]=[];
 for(const word of current[length].guesses){
  const selected=selectSpanishAnswer(word,frequency[word],lexical[word],checkedReview(word));
  if(selected.possible){answers[length].push(word);evidence[word]={zipf:frequency[word],...selected.evidence,...(selected.evidence.source==='supplemental'?{sourceUrl:supplements[word].url,sourceSha256:supplements[word].sha256}:{} )};}
  else if(selected.detail)reviewedReasons[word]=selected.detail;
  else (reasonGroups[selected.reason]??=[]).push(word);
 }
 answers[length].sort();counts[length]=answers[length].length;
}
const selection={version:'wiktionary-wordfreq-v1',minimumZipf:SPANISH_MIN_ZIPF,counts,answers};
const outputs={
 'answer-selection.json':JSON.stringify(selection,null,2)+'\n',
 'selection-evidence.json':JSON.stringify(evidence,null,2)+'\n',
 'answer-exclusions.ts':'/** Modified source-label selection: Wiktionary contributors and wordfreq / CC BY-SA4.0. See WORDS-LICENSE.md. */\nexport const SPANISH_EXCLUSIONS:{reasonGroups:Record<string,string[]>;reviewedReasons:Record<string,string>} = '+JSON.stringify({reasonGroups,reviewedReasons})+';\n',
};
for(const [name,content] of Object.entries(outputs)){const file=new URL(name,data);if(process.argv.includes('--check')){if(readFileSync(file,'utf8')!==content)throw Error('Regenerate Spanish selection: '+name)}else writeFileSync(file,content)}
console.log('Spanish possible answers',counts,'threshold',SPANISH_MIN_ZIPF,'; no per-length count cap.');
