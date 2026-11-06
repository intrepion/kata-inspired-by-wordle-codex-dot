/** Explicit synthetic old-save fixtures in fresh disposable browser contexts.
 * No user profile, external definitions, network mocks, or application edits.
 * Run only after rebuilding the served app:
 * BASE_URL=http://127.0.0.1:5308/ PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node --import tsx scripts/check-english-progress.mjs
 */
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {emptySave,encode,decode,recordDaily} from '../src/persistence.ts';
import {newRun,submit,status,DAY} from '../src/domain.ts';
import {notebookDailyAnswer} from '../src/daily-schedule.ts';
import {previousEnglishDataset} from '../src/legacy-english.ts';
import {vocabulary} from '../src/words.ts';
import {initializeNotebookStats,beginStatsPuzzle,settleNotebookStats,notebookStatistics} from '../src/notebook-statistics.ts';
import {saveKeyForPath,activeSaveKeyForPath} from '../src/site.ts';
import {startPuzzleIfNeeded} from './start-puzzle-if-needed.mjs';

const base=process.env.BASE_URL??'http://127.0.0.1:5308/';
const origin=new URL(base).origin,path=new URL(base).pathname;
const output=process.env.SCREENSHOT_DIR??'.local/english-progress-qa';
mkdirSync(output,{recursive:true});
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const root=saveKeyForPath(path),active=activeSaveKeyForPath(path);
const report=[];
function prior(date,length=5){
 const save=emptySave(date,'normal',length);
 save.dataset=previousEnglishDataset(length);
 save.englishAnswerSchedules={[date]:'previous'};
 save.daily=newRun(notebookDailyAnswer(save,date,length));
 initializeNotebookStats(save,true);beginStatsPuzzle(save,'daily','normal');
 return save;
}
function oldBytes(save){
 const raw=JSON.parse(encode(save));delete raw.englishAnswerSchedules;
 raw.impossible.dataset='scowl-2020.12.07-absurd-v2';
 return JSON.stringify(raw);
}
function findDate(eligible){
 for(let i=0;i<3000;i++){
  const date=new Date(Date.parse('2026-11-01')+i*DAY).toISOString().slice(0,10);
  if(vocabulary().answers.includes(prior(date).daily.answer)===eligible)return date;
 }
 throw Error('No matching prior daily date');
}
const compatibleDate=findDate(true),removedDate=findDate(false);
function fixture(kind){
 const date=kind==='stale-ledger'?'2027-12-27':kind.startsWith('removed')?removedDate:compatibleDate;
 const save=prior(date),answer=save.daily.answer;
 if(kind==='compatible'){
  save.daily=submit(save.daily,vocabulary().answers.find(w=>w!==answer)).run;
  save.daily.draft=answer.slice(0,2);
  save.practice=submit(newRun('APPLE'),'ALLEY').run;
 }else if(kind==='removed-complete'){
  save.daily=submit(save.daily,answer).run;recordDaily(save,date,save.daily);settleNotebookStats(save);
 }else if(kind==='stale-ledger'){
  assert.equal(answer,'FECES');save.results[date]=[answer];save.history[date]={won:true,turns:1};
 }else if(kind==='adaptive'){
  save.mode='impossible';save.impossible.guesses=['AUDIO'];save.impossible.draft='PAS';
  save.notebookStats.records['impossible:2']={mode:'impossible',date,difficulty:'normal',assisted:false,won:true,turns:5,order:1};
  save.notebookStats.nextOrder=2;
 }else save.daily=submit(save.daily,vocabulary().answers.find(w=>w!==answer)).run;
 const originals={[root]:oldBytes(save)};
 const isolated={
  [saveKeyForPath(path,3)]:encode(emptySave(date,'normal',3)),
  [saveKeyForPath(path,5,'es-MX')]:encode(emptySave(date,'normal',5,'es-MX')),
  [saveKeyForPath(path,5,'fil-PH')]:encode(emptySave(date,'normal',5,'fil-PH')),
  [root+'.theme']:'light',[root+'.difficulty']:'normal',[root+'.language']:'en',
  [root+'.word-length']:'5',[root+'.reset-epoch']:'older-release-fixture',
  'unrelated.application.fixture':'DO NOT TOUCH'
 };
 const preferences={[root+'.selection.v1']:JSON.stringify({rules:kind==='adaptive'?'absurd':'conquest',schedule:kind==='adaptive'?'practice':'daily'})};
 return {date,save,originals,isolated,seed:{...originals,...isolated,...preferences}};
}
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
async function bytes(page){return page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))}
async function verify(page,f,kind){
 const all=await bytes(page);
 for(const [key,value] of Object.entries({...f.originals,...f.isolated}))assert.equal(all[key],value,`${kind}: preserved ${key}`);
 const save=JSON.parse(all[active]);assert.ok(save,`${kind}: copied notebook exists`);
 if(kind==='compatible'){
  assert.deepEqual(save.daily,f.save.daily);assert.deepEqual(save.practice,f.save.practice);
  assert.match(await page.locator('body').innerText(),/Previous English answer list/);
 }else if(kind==='removed-active'){
  assert.notEqual(save.daily.answer,f.save.daily.answer);assert.deepEqual(save.daily.guesses,[]);
  assert.equal(await page.locator('#puzzle-setup').isVisible(),true);
 }else if(kind==='adaptive'){
  assert.deepEqual(save.impossible.guesses,[]);assert.equal(save.impossible.draft,'');
  assert.equal(notebookStatistics(decode(all[active],f.date),'impossible','all',f.date).wins,1);
  assert.equal(await page.locator('#puzzle-setup').isVisible(),true);
 }else{
  assert.equal(save.daily.answer,f.save.daily.answer);assert.equal(status(save.daily),'won');
  assert.equal(notebookStatistics(decode(all[active],f.date),'daily','all',f.date).wins,1);
 }
 assert.doesNotMatch(await page.locator('body').innerText(),/\bbeta\b/i);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${kind}: overflow`);
 return save;
}
try{
 for(const [length,count] of [[3,447],[4,1479],[5,2094],[6,3148],[7,4121],[8,4208],[9,3700],[10,2788],[11,1747]])assert.equal(vocabulary(length).answers.length,count);
 for(const word of ['BLOGS','BLOGGED']){assert.equal(vocabulary(word.length).allowed.has(word),true);assert.equal(vocabulary(word.length).answers.includes(word),false)}
 for(const width of [1280,390])for(const kind of ['compatible','removed-active','removed-complete','stale-ledger','adaptive']){
  const f=fixture(kind),context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true});
  const errors=[],external=[];
  await context.route('**/*',route=>{
   if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort()}
   return route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.clock.install({time:new Date(f.date+'T12:00:00Z')});
  await context.addInitScript(({seed,origin})=>{
   if(location.origin!==origin||sessionStorage.getItem('explicit-fixture-installed'))return;
   for(const [key,value] of Object.entries(seed))localStorage.setItem(key,value);
   sessionStorage.setItem('explicit-fixture-installed','1');
  },{seed:f.seed,origin});
  await page.goto(base);await page.locator('#settings').waitFor();
  await verify(page,f,kind);
  for(let reload=0;reload<3;reload++){await page.reload();await verify(page,f,kind)}
  await page.screenshot({path:`${output}/${kind}-${width}.png`,fullPage:true});
  await page.locator('#settings').click();
  const pending=page.waitForEvent('download');await page.locator('#export-original-english').click();
  const download=await pending;assert.equal(download.suggestedFilename(),'lexi-conquest-original-english-notebooks.json');
  const downloaded=`${output}/${kind}-${width}-originals.json`;await download.saveAs(downloaded);
  assert.deepEqual(JSON.parse(readFileSync(downloaded,'utf8')).notebooks,f.originals);
  await page.getByRole('button',{name:'Close dialog'}).click();
  assert.deepEqual(errors,[],`${kind}: browser errors`);assert.deepEqual(external,[],`${kind}: unexpected network`);
  report.push({width,kind,date:f.date,source:'explicit synthetic old-save fixture; disposable browser context',result:'pass',reloads:3,export:'exact original bytes'});
  writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));
  console.log('PASS',width,kind);await context.close();
 }
}finally{await browser.close()}
