import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {validateTeaching} from './teaching-validation.mjs';
const data=new URL('../src/data/spanish/',import.meta.url),read=name=>readFileSync(new URL(name,data),'utf8'),sha=text=>createHash('sha256').update(text).digest('hex');
const original=JSON.parse(read('learning.ts').split(' = ')[1].trim().replace(/;$/,'')),answers=Object.values(JSON.parse(read('answer-selection.json')).answers).flat(),expected=answers.filter(word=>!original[word]).sort(),manifest=JSON.parse(read('complete-teaching-review.json'));
if(sha(read('learning.ts'))!==manifest.originalLearningSha256||sha(read('answer-selection.json'))!==manifest.answerSelectionSha256)throw Error('Teaching target or preserved archive changed');
const output={},all=[];
for(const batch of manifest.batches){
 if(batch.file!==`batch-${String(batch.number).padStart(2,'0')}.json`||typeof batch.author!=='string'||typeof batch.reviewer!=='string')throw Error('Invalid review identity/path');
 const raw=read('teaching-batches/'+batch.file),rows=JSON.parse(raw);
 if(batch.status!=='approved'||batch.author===batch.reviewer||sha(raw)!==batch.reviewedSha256||rows.length!==batch.reviewedCount)throw Error('Independent review missing or stale: '+batch.file);
 const errors=validateTeaching(rows,expected.slice((batch.number-1)*150,batch.number*150));if(errors.length)throw Error(errors.join('\n'));
 for(const row of rows){if(original[row.word]||output[row.word])throw Error('Existing/duplicate word: '+row.word);output[row.word]=row;all.push(row)}
}
const errors=validateTeaching(all,expected);if(errors.length)throw Error(errors.join('\n'));
if(manifest.batches.length!==Math.ceil(expected.length/150))throw Error('Missing review batches');
const sorted=Object.fromEntries(Object.keys(output).sort().map(word=>[word,output[word]]));
const content='/** Original AI-authored translations/examples, independently model-reviewed; not native-human-certified or dictionary quotations. CC-BY-SA4.0. See complete-teaching-review.json. */\nexport const ADDITIONAL_TEACHING:Record<string,{word:string;translation:string;example:string;exampleTranslation:string}> = '+JSON.stringify(sorted)+';\n';
const file=new URL('additional-teaching.ts',data);if(process.argv.includes('--check')){if(readFileSync(file,'utf8')!==content)throw Error('Regenerate complete teaching')}else writeFileSync(file,content);
console.log(`${expected.length} new teaching records; ${answers.length}/${answers.length} possible answers covered; ${Object.keys(original).length+expected.length} total teaching records. No definition/source fields invented.`);
