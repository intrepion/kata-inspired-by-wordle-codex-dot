/** Offline, locale-specific SCOWL lists. Source and morphology checksums are pinned. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {curateAnswers} from './answer-forms.mjs';
import {loadAustralianAnswerReview} from './australian-answer-review.mjs';
import {loadEnglishAnswerReview,reviewForLength} from './english-answer-review.mjs';
const data=new URL('../src/data/',import.meta.url),read=name=>readFileSync(new URL(name,data));
const json=name=>JSON.parse(read(name));
const sha=raw=>createHash('sha256').update(raw).digest('hex');
const reviewed=loadEnglishAnswerReview(),australianReview=loadAustralianAnswerReview(),australianSource=json('australian-scowl.json'),output={'en-US':{},'en-GB':{},'en-AU':{}},report={};
if(sha(read('australian-scowl.json'))!==json('australian-scowl-source.json').snapshotSha256)throw Error('Pinned Australian source mismatch');
const sources=[
 {lengths:[5],snapshot:'scowl-five-letter.json',manifest:'scowl-source.json',key:'snapshotSha256',forms:'agid-relevant.txt',formManifest:'agid-source.json',formKey:'snapshotSha256',overrides:'answer-form-overrides.json'},
 {lengths:[4,6,7],snapshot:'scowl-other-lengths.json',manifest:'word-length-source.json',key:'scowlSnapshotSha256',forms:'agid-other-lengths.txt',formManifest:'word-length-source.json',formKey:'agidSnapshotSha256',overrides:'length-form-overrides.json'},
 {lengths:[3,8,9,10,11],snapshot:'scowl-extended-lengths.json',manifest:'extended-length-source.json',key:'scowlSnapshotSha256',forms:'agid-extended-lengths.txt',formManifest:'extended-length-source.json',formKey:'agidSnapshotSha256'}
];
for(const source of sources){
 const raw=read(source.snapshot),forms=read(source.forms);
 if(sha(raw)!==json(source.manifest)[source.key]||sha(forms)!==json(source.formManifest)[source.formKey])throw Error('Pinned English source mismatch');
 const inputs={...JSON.parse(raw),...australianSource},overrides=source.overrides?json(source.overrides):{keep:{},exclude:{}};
 for(const length of source.lengths){
  const select=(tier,category)=>[...new Set(Object.entries(inputs).filter(([name])=>Number(name.split('.').at(-1))<=tier&&(category?name.startsWith('english-')||name.startsWith(category+'-'):!name.startsWith('australian-'))).flatMap(([,words])=>words).filter(word=>word.length===length))].sort();
  // Run the existing answer audit against its full pinned source first, then retain
  // only eligible words independently sourced for the selected spelling category.
  const localOverrides=Object.fromEntries(Object.entries(overrides).map(([kind,entries])=>[kind,Object.fromEntries(Object.entries(entries).filter(([word])=>word.length===length))]));
  const curated=new Set(curateAnswers(select(35),forms.toString(),localOverrides,reviewForLength(reviewed,length)).answers);
  for(const [locale,category]of [['en-US','american'],['en-GB','british'],['en-AU','australian']]){
   const answers=select(35,category).filter(word=>curated.has(word)||(locale==='en-AU'&&Object.hasOwn(australianReview.allow,word.toUpperCase()))).map(word=>word.toUpperCase()),guesses=select(80,category).map(word=>word.toUpperCase());
   if(!answers.length||answers.some(word=>!guesses.includes(word)))throw Error('Invalid '+locale+' vocabulary');
   output[locale][length]={answers,guesses};
   (report[locale]??={})[length]={answers:answers.length,guesses:guesses.length};
   console.log(`${locale} ${length}: ${answers.length} answers, ${guesses.length} guesses`);
  }
 }
}
for(const [name,value]of [['english-varieties.json',output],['english-variety-counts.json',report]]){
 const path=new URL(name,data),text=JSON.stringify(value,null,name.endsWith('counts.json')?2:0)+'\n';
 if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==text)throw Error('Regenerate '+name)}else writeFileSync(path,text);
}
