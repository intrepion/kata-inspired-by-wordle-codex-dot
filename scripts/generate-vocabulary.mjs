import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {curateAnswers} from './answer-forms.mjs';
const data=new URL('../src/data/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('scowl-source.json',data),'utf8'));
const raw=readFileSync(new URL('scowl-five-letter.json',data));
if(createHash('sha256').update(raw).digest('hex')!==manifest.snapshotSha256)throw new Error('SCOWL source snapshot changed; review provenance.');
const inputs=JSON.parse(raw.toString('utf8'));
if(Object.keys(inputs).sort().join('\n')!==Object.keys(manifest.files).sort().join('\n'))throw new Error('SCOWL input manifest mismatch.');
for(const [name,words] of Object.entries(inputs))if(!/^(english|american|british)-words\.(10|20|35|40|50|55|60|70|80)$/.test(name)||!Array.isArray(words)||words.some(word=>!/^[a-z]{5}$/.test(word)))throw new Error('Invalid SCOWL input.');
const select=size=>[...new Set(Object.entries(inputs).filter(([name])=>Number(name.split('.').at(-1))<=size).flatMap(([,words])=>words))].sort();
const base=select(35),guesses=select(80);
const morphology=JSON.parse(readFileSync(new URL('agid-source.json',data),'utf8'));
const rawForms=readFileSync(new URL('agid-relevant.txt',data));
if(createHash('sha256').update(rawForms).digest('hex')!==morphology.snapshotSha256)throw new Error('AGID snapshot changed; review provenance.');
for(const [path,key] of [['../public/third-party/AGID-Copyright.txt','licenseSha256'],['../docs/sources/agid-2016.01.19-format.txt','formatSha256']])if(createHash('sha256').update(readFileSync(new URL(path,import.meta.url))).digest('hex')!==morphology[key])throw new Error('AGID notice/format changed.');
const overrides=JSON.parse(readFileSync(new URL('answer-form-overrides.json',data),'utf8'));
const {answers,removed}=curateAnswers(base,rawForms.toString('utf8'),overrides);
const report=JSON.stringify({policy:'qualified-plural-past-exclusions-v2',baseAnswers:base.length,answers:answers.length,removed},null,2)+'\n';
const reportTarget=new URL('answer-curation.json',data);
if(process.argv.includes('--check')){if(readFileSync(reportTarget,'utf8')!==report)throw new Error('Regenerate answer curation report.')}else writeFileSync(reportTarget,report);
if(base.length!==3493||answers.length===0||guesses.length!==11193||answers.some(word=>!guesses.includes(word)))throw new Error('SCOWL vocabulary invariants changed.');
const module=(name,words)=>{
 const rows=[];for(let i=0;i<words.length;i+=20)rows.push(words.slice(i,i+20).join(' ').toUpperCase());
 return (name==='CURATED_ANSWERS'?'/** SCOWL common35 filtered with pinned AGID plural/past metadata and reviewed exceptions. See WORDS-LICENSE.md and both upstream notices. */\n': '/** Modified five-letter SCOWL 2020.12.07 selection. See WORDS-LICENSE.md and SCOWL-Copyright.txt. */\n')+`export const ${name} = \``+rows.join('\n')+'`.split(/\\s+/);\n';
};
for(const [file,name,words] of [['scowl-answers.ts','CURATED_ANSWERS',answers],['scowl-guesses.ts','ACCEPTED_GUESSES',guesses]]){
 const target=new URL(file,data),output=module(name,words);
 if(process.argv.includes('--check')){if(readFileSync(target,'utf8')!==output)throw new Error(`Regenerate ${file}`)}else writeFileSync(target,output);
}
console.log(`SCOWL verified: ${answers.length} answers, ${guesses.length} guesses.`);
