/** Offline, deterministic es-MX word-form expansion. nspell is build-only, never a runtime dependency. */
import {isCuratedSpanishAnswer} from './spanish-answer-policy.mjs';
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import nspell from 'nspell';
const data=new URL('../src/data/spanish/',import.meta.url),sources=new URL('../public/third-party/es-MX/',import.meta.url),sha=raw=>createHash('sha256').update(raw).digest('hex'),manifest=JSON.parse(readFileSync(new URL('source.json',data),'utf8'));
for(const [file,digest] of Object.entries(manifest.files))if(sha(readFileSync(new URL(file,sources)))!==digest)throw Error('Spanish source changed: '+file);
const spell=nspell(readFileSync(new URL('es-MX.aff',sources)),readFileSync(new URL('es-MX.dic',sources)));const words=Object.keys(spell.data).filter(word=>word===word.normalize('NFC')&&/^[a-záéíóúüñ]{4,7}$/.test(word)&&spell.correct(word)).map(word=>word.toLocaleUpperCase('es-MX')).sort();
const authored=readFileSync(new URL('learning-authored.tsv',data),'utf8').trim().split('\n').map(line=>{const [word,partOfSpeech,translation,example,exampleTranslation]=line.split('|');return {word,partOfSpeech,translation,example,exampleTranslation}});if(authored.some(entry=>!['noun','adjective','infinitive','plural','past','exploratory'].includes(entry.partOfSpeech)))throw Error('Unreviewed morphology category');
const teachingManifest=JSON.parse(readFileSync(new URL('learning-manifest.json',data),'utf8'));
for(const [file,digest]of Object.entries(teachingManifest.files))if(sha(readFileSync(new URL(file,data)))!==digest)throw Error('Teaching source changed: '+file);
const audit=JSON.parse(readFileSync(new URL('answer-policy.json',data),'utf8')),snapshot=JSON.parse(readFileSync(new URL('wiktionary-snapshot.json',data),'utf8')),selections=JSON.parse(readFileSync(new URL('definition-selection.json',data),'utf8'));
for(const [word,sense]of Object.entries(audit.words)){
 const row=authored.find(entry=>entry.word===word),record=snapshot.words[word],selected=selections[word],pos=selected?.baseEntry?selected.definitionPartOfSpeech:JSON.parse(record.responseRaw).es[selected.entry].partOfSpeech;
 const family=sense.kind==='infinitive'?'Verb':sense.kind==='noun'?'Noun':sense.kind==='adjective'?'Adjective':'';
 const sourceUrl=record.revisionUrl??(record.revision?`https://en.wiktionary.org/w/index.php?oldid=${record.revision}#Spanish`:record.sourceUrl);
 if(!family||!pos.startsWith(family)||sense.sourceUrl!==sourceUrl||!row||sense.word!==word||sense.kind!==row.partOfSpeech||sense.sense!==row.translation||sense.sourcePartOfSpeech!==pos||sense.sourceRevision!==record.revision)throw Error('Answer sense requires review: '+word);
}
const selection=JSON.parse(readFileSync(new URL('answer-selection.json',data),'utf8'));
if(new Set(authored.map(x=>x.word)).size!==manifest.teachingScope.authoredEntries||authored.some(x=>!words.includes(x.word)||!x.example.toLocaleUpperCase('es-MX').includes(x.word)))throw Error('Invalid teaching record');
const output={};for(const length of [4,5,6,7]){const answers=selection.answers[length],guesses=words.filter(word=>word.length===length);if(!answers.length||new Set(answers).size!==answers.length||answers.some(word=>word.length!==length||!guesses.includes(word)))throw Error('Invalid Spanish possible-answer selection');output[length]={answers,guesses};console.log(`es-MX ${length}: ${answers.length} possible answers, ${guesses.length} accepted guesses`)}
const content='/** Accepted guesses: RLA-es2.9 es-MX / MPL1.1. Answer selection: modified Wiktionary and wordfreq metadata / CC BY-SA4.0. See WORDS-LICENSE.md and source notices. Generated offline. */\nexport const SPANISH_VOCABULARY = '+JSON.stringify(output)+';\n';const target=new URL('vocabulary.ts',data);if(process.argv.includes('--check')){if(readFileSync(target,'utf8')!==content)throw Error('Regenerate Spanish vocabulary')}else writeFileSync(target,content);
