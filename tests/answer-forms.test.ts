import {test} from 'node:test';import assert from 'node:assert/strict';
import {ANSWERS,ALLOWED} from '../src/words.ts';import {newRun,submit} from '../src/domain.ts';
test('regular and irregular noun plurals stop being answers but stay accepted guesses',()=>{
 for(const word of ['BOOKS','TREES','WORDS','PUMPS','GEESE','TEETH','WOMEN','PENCE','LIVES','JEANS','PANTS']){assert.equal(ANSWERS.includes(word),false,word);assert.equal(ALLOWED.has(word),true,word);assert.equal(submit(newRun('APPLE'),word.toLowerCase()).error,undefined,word)}
});

test('regular and irregular past-tense forms stop being answers while remaining valid exploratory guesses',()=>{
 for(const word of ['BAKED','ASKED','NAMED','TRIED','WROTE','SLEPT','STOOD','SWORE','THREW','CREPT']){assert.equal(ANSWERS.includes(word),false,word);assert.equal(ALLOWED.has(word),true,word);assert.equal(submit(newRun('APPLE'),word.toLowerCase()).error,undefined,word)}
});

test('singular S words, non-past ED words and documented independent base senses survive without stripping suffixes',()=>{
 for(const word of ['GLASS','CLASS','FOCUS','BONUS','ABYSS','CHAOS','BRASS','BLEED','BREED','GREED','SPEED','TWEED','BIPED','NAKED','WRONG','CREED','FOUND','BOUND','WOUND','SPOKE','STOVE','CLOVE','MOPED','DROVE','MEANS','CORPS','GENUS','OPERA','SHEEP','BURST','SPLIT','DOING','LYING','SEEMS','LOSES','EATEN','TAKEN'])assert.equal(ANSWERS.includes(word),true,word);
});
test('reviewed past HIDED is excluded despite an uncertain source mapping, without removing its accepted guess',()=>{assert.equal(ANSWERS.includes('HIDED'),false);assert.equal(ALLOWED.has('HIDED'),true)});

test('accepted guess snapshot stays byte-identical and every curated answer remains accepted',async()=>{
 const {createHash}=await import('node:crypto');const {readFileSync}=await import('node:fs');
 assert.equal(ALLOWED.size,11193);const raw=readFileSync(new URL('../src/data/scowl-guesses.ts',import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),'c21cf2200683f2a5da7291824fd304e56759bca0e631c54efc8273a06d29c00d');assert.equal(ANSWERS.length,2103);assert.equal(new Set(ANSWERS).size,ANSWERS.length);for(const word of ANSWERS)assert.ok(ALLOWED.has(word));
 for(const word of ['SADES','SHOOK','CHOSE','MEDIA','TIRED','BURNT','SPENT']){assert.ok(!ANSWERS.includes(word),word);assert.ok(ALLOWED.has(word),word)}
});

test('published common-guide rounds restart on the filtered dataset while compatible preferences survive once',async()=>{
 const {emptySave,encode,decode,statistics}=await import('../src/persistence.ts');const {difficulty}=await import('../src/domain.ts');const {ANSWER_DATASET,ABSURD_DATASET}=await import('../src/words.ts');
 assert.equal(ANSWER_DATASET,'scowl-2020.12.07-answers-v2');assert.equal(ABSURD_DATASET,'scowl-2020.12.07-absurd-v2');
 const date='2026-10-24',old=JSON.parse(encode(emptySave(date)));
 old.dataset='scowl-2020.12.07-common35-v1';old.settings={contrast:true,strictMode:true,suboptimal:true};old.mode='impossible';old.daily={answer:'BAKED',guesses:['BAKED'],draft:'',hardMode:true};old.practice={answer:'PUMPS',guesses:['PUMPS'],draft:'',easyMode:true,assisted:true};old.impossible={version:2,dataset:'scowl-2020.12.07-absurd35-v1',guesses:['PUMPS'],draft:'CRA',difficulty:'strict',assisted:true,candidates:['PUMPS'],answer:'PUMPS'};old.results={[date]:['BAKED']};old.history={[date]:{won:true,turns:1}};
 const current=decode(JSON.stringify(old),date);assert.equal(current.dataset,ANSWER_DATASET);assert.equal(current.mode,'impossible');assert.equal(difficulty(current.daily),'hard');assert.equal(difficulty(current.practice),'easy');assert.equal(difficulty(current.impossible),'strict');assert.equal(difficulty(current.settings),'strict');assert.equal(current.settings.contrast,true);assert.equal(current.settings.suboptimal,true);
 for(const run of [current.daily,current.practice,current.impossible]){assert.deepEqual(run.guesses,[]);assert.equal(run.draft,'');assert.ok(ANSWERS.includes(run.answer))}
 assert.equal(current.impossible.assisted,undefined);assert.equal(statistics(current.results,date,current.history).played,0);assert.deepEqual(current.results,{});assert.deepEqual(current.history,{});assert.deepEqual(decode(encode(current),date),current);
});

test('morphology source, source notices and generated curation audit are pinned and reproducible offline',async()=>{
 const {readFileSync}=await import('node:fs');const {createHash}=await import('node:crypto');const {execFileSync}=await import('node:child_process');
 const metadata=JSON.parse(readFileSync(new URL('../src/data/agid-source.json',import.meta.url),'utf8'));
 assert.equal(metadata.revision,'5ef55f9c42730ebe4394a78b77855468a6f15dd2');assert.equal(metadata.dataSha256,'df0c8f6edd4193d823abfad9e4ff6f42b4526211516649e1c73d4533aef749fa');assert.equal(metadata.readmeSha256,'d7e5fee4bd2d370c231581679e9d4f4a099cef0629f44aa64e0b0b46ed8a8167');
 for(const [relative,key] of [['agid-relevant.txt','snapshotSha256'],['../../public/third-party/AGID-Copyright.txt','licenseSha256'],['../../docs/sources/agid-2016.01.19-format.txt','formatSha256']]){const raw=readFileSync(new URL('../src/data/'+relative,import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),metadata[key])}
 const report=JSON.parse(readFileSync(new URL('../src/data/answer-curation.json',import.meta.url),'utf8'));assert.equal(report.baseAnswers,3493);assert.equal(report.answers,2103);assert.equal(report.removed.length,1390);for(const entry of report.removed){assert.ok(!ANSWERS.includes(entry.word));assert.ok(ALLOWED.has(entry.word));assert.ok(entry.reasons.length)}
 assert.match(execFileSync(process.execPath,['scripts/generate-vocabulary.mjs','--check'],{encoding:'utf8'}),/2103 answers, 11193 guesses/);
});

test('old-guide migration honors the future Daily preference at rollover or invalid dates while preserving independent Practice',async()=>{
 const {emptySave,encode,decode}=await import('../src/persistence.ts');const {difficulty}=await import('../src/domain.ts');const today='2026-10-24';
 for(const date of ['2026-10-23','invalid','2026-10-25',undefined]){const raw=JSON.parse(encode(emptySave(today,'strict')));raw.dataset='scowl-2020.12.07-common35-v1';raw.date=date;raw.daily={answer:'BAKED',guesses:['BAKED'],draft:'',hardMode:true};raw.practice={answer:'PUMPS',guesses:[],draft:'',easyMode:true};const restored=decode(JSON.stringify(raw),today);assert.equal(difficulty(restored.daily),'strict',String(date));assert.equal(difficulty(restored.practice),'easy');assert.deepEqual(restored.daily.guesses,[]);assert.deepEqual(decode(encode(restored),today),restored)}
});
