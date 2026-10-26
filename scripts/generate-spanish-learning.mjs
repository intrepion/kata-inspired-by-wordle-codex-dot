import {isCuratedSpanishAnswer} from './spanish-answer-policy.mjs';
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const data=new URL('../src/data/spanish/',import.meta.url),read=name=>readFileSync(new URL(name,data)),manifest=JSON.parse(read('learning-manifest.json')),sha=raw=>createHash('sha256').update(raw).digest('hex');
for(const [name,hash] of Object.entries(manifest.files))if(sha(read(name))!==hash)throw Error('Reviewed teaching source changed: '+name);
const snapshot=JSON.parse(read('wiktionary-snapshot.json')),selections=JSON.parse(read('definition-selection.json')),output={};
const audit=JSON.parse(read('answer-policy.json'));
const support=JSON.parse(read('opener-support.json')),expandedSupport=JSON.parse(read('expanded-support.json'));
for(const row of read('learning-authored.tsv').toString().trim().split('\n')){
 const [word,partOfSpeech,translation,example,exampleTranslation]=row.split('|'),record=snapshot.words[word],selected=selections[word];
 if(!record?.responseRaw||sha(record.responseRaw)!==record.responseSha256)throw Error('Invalid definition source: '+word);
 let definition,definitionPartOfSpeech;
 if(selected.baseEntry){
  const pages=Object.values(JSON.parse(record.responseRaw).query.pages),page=pages.find(page=>page.title===selected.baseEntry),revision=page?.revisions?.[0];
  const conjugation=support.spanishConjugations.words[selected.baseEntry]??expandedSupport.pages[selected.baseEntry];
  if(revision?.revid!==record.revision||!revision.slots.main['*'].includes(selected.sourceText)||(selected.mappingText&&!revision.slots.main['*'].includes(selected.mappingText))||!conjugation||sha(conjugation.responseRaw)!==conjugation.responseSha256||JSON.parse(conjugation.responseRaw).parse.revid!==record.revision||!JSON.parse(conjugation.responseRaw).parse.text['*'].includes(word.toLocaleLowerCase('es-MX')))throw Error('Invalid translated base evidence: '+word);
  definition=selected.definitionTranslation;definitionPartOfSpeech=selected.definitionPartOfSpeech;
 }else{
  const group=JSON.parse(record.responseRaw).es[selected.entry];definition=group?.definitions?.[selected.sense]?.definition;definitionPartOfSpeech=group?.partOfSpeech;
 }
 if(typeof definition!=='string'||!definition.trim())throw Error('Invalid selected sense: '+word);
 output[word]={word,partOfSpeech,translation,example,exampleTranslation,answer:!!audit.words[word]&&isCuratedSpanishAnswer(audit.words[word]),definition,definitionPartOfSpeech,sourceUrl:record.revisionUrl??(record.revision?`https://en.wiktionary.org/w/index.php?oldid=${record.revision}#Spanish`:record.sourceUrl),sourceRevision:record.revision,review:'independent-model',authorship:'AI-authored',license:'CC-BY-SA-4.0'};
}
const content='/** CC-BY-SA4.0. Definitions: Wiktionary contributors. Glosses/examples/translations: AI-authored, independently model-reviewed; no human/native certification. See source snapshots and WORDS-LICENSE.md. */\nimport type {LearningEntry} from \'../../learning.ts\';\nexport const SPANISH_LEARNING:Record<string,LearningEntry> = '+JSON.stringify(output)+';\n';const target=new URL('learning.ts',data);if(process.argv.includes('--check')){if(readFileSync(target,'utf8')!==content)throw Error('Regenerate Spanish learning material')}else writeFileSync(target,content);if(Object.keys(output).length!==manifest.review.authoredEntries)throw Error('Teaching count differs from review manifest');console.log(`${Object.keys(output).length} attributed teaching records generated from reviewed, pinned sources.`);
