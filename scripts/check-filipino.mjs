/** Isolated Filipino browser QA. No user browser/profile; no mocked definitions.
 * Matrix answers are read from the real freshly generated local game, not seeded.
 * Run: BASE_URL=http://127.0.0.1:5298/ PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node --import tsx scripts/check-filipino.mjs
 */
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {currentTestContext} from './current-test-context.mjs';
import {startPuzzleIfNeeded} from './start-puzzle-if-needed.mjs';
import {saveKeyForPath} from '../src/site.ts';
import {variantKey,modeFor} from '../src/variant-context.ts';
import {vocabulary} from '../src/words.ts';
import {difficulty} from '../src/domain.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base=process.env.BASE_URL??'http://127.0.0.1:5298/',origin=new URL(base).origin,path=new URL(base).pathname;
const output=process.env.SCREENSHOT_DIR??'/private/tmp/lexi-filipino-qa';mkdirSync(output,{recursive:true});
const today=new Date().toISOString().slice(0,10),fil=saveKeyForPath(path,5,'fil-PH');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const report=[],smokeReport=[];
async function fresh(width){
 const context=await currentTestContext(browser,{viewport:{width,height:950}}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await context.route('**/*',r=>{if(new URL(r.request().url()).origin!==origin){external.push(r.request().url());return r.abort()}return r.continue()});
 await page.goto(base);return {context,page,errors,external};
}
async function type(page,word,submit=true){await page.locator('.intro h1').click();await page.keyboard.type(word.toLowerCase());if(submit)await page.keyboard.press('Enter')}
async function tap(page,word){for(const key of [...word,'↵'])await page.locator(`[data-key="${key}"]`).click()}
async function stored(page,key){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)}
/** Keep both example guesses nonterminal using only genuinely generated UI rounds. */
async function preparePractice(page){
 const maxRefreshes=10;
 for(let refreshes=0;refreshes<=maxRefreshes;refreshes++){
  const run=(await stored(page,fil))?.practice;
  assert.ok(run&&vocabulary(5,'fil-PH').answers.includes(run.answer),'Expected a real Filipino practice answer');
  assert.equal(run.guesses.length,0,'Practice selection must precede all interaction guesses');
  assert.equal(run.draft,'','Practice selection must precede all interaction drafts');
  if(!['BAHAY','BUHAY'].includes(run.answer))return {answer:run.answer,refreshes};
  if(refreshes===maxRefreshes)assert.fail(`Could not obtain a Filipino practice answer other than BAHAY/BUHAY after ${maxRefreshes} UI refreshes; last answer: ${run.answer}`);
  await page.getByRole('button',{name:'Fresh practice ↗',exact:true}).click();
  await startPuzzleIfNeeded(page,'normal');
 }
}
async function checks(test,label){assert.deepEqual(test.external,[],`${label}: external requests`);assert.deepEqual(test.errors,[],`${label}: browser errors`);const overflow=await test.page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('body *')].map(n=>({tag:n.tagName,id:n.id,classes:n.className,right:n.getBoundingClientRect().right,width:n.getBoundingClientRect().width})).filter(n=>n.right>innerWidth)}));assert.ok(overflow.scroll<=overflow.width,`${label}: document overflow ${JSON.stringify(overflow)}`)}
async function meaning(page,word){const n=page.locator(`[data-inline-definition="${word}"]`).first();await n.locator('a.definition-source[href$="#Tagalog"]').waitFor();assert.match(await n.locator('.definition-meaning').innerText(),word==='BAHAY'?/house|home/i:/life|alive/i);assert.equal(await n.getAttribute('lang'),'en')}
try{
 for(const width of (process.env.QA_WIDTH?[Number(process.env.QA_WIDTH)]:[1280,390])){
  const test=await fresh(width),{page,context}=test;
  // All notebook preservation here is real UI entry, not injected save data.
  await page.locator('#schedule-select').selectOption('practice');await page.locator('#word-length').selectOption('6');await startPuzzleIfNeeded(page,'normal');await type(page,'planet',false);
  await page.locator('#language').selectOption('es-MX');await page.locator('#word-length').selectOption('4');await startPuzzleIfNeeded(page,'normal');await type(page,'casa',false);
  await page.locator('#language').selectOption('fil-PH');assert.equal(await page.locator('#language option:checked').innerText(),'Filipino (Philippines)');assert.doesNotMatch(await page.locator('body').innerText(),/\bbeta\b/i);assert.deepEqual(await page.locator('#word-length option').evaluateAll(ns=>ns.map(n=>n.value)),['5']);await startPuzzleIfNeeded(page,'normal');
  const practiceSelection=await preparePractice(page);
  await type(page,'zzzzz',false);assert.equal(await page.locator('.active .invalid-draft').count(),5);for(let n=0;n<5;n++)await page.keyboard.press('Backspace');
  await type(page,'bahay');await meaning(page,'BAHAY');await tap(page,'BUHAY');await meaning(page,'BUHAY');assert.equal(await page.locator('#board>.fieldnote').count(),2);
  await page.reload();assert.equal(await page.locator('#board>.fieldnote').count(),2);await meaning(page,'BAHAY');
  // Accent normalization and N/G separate tiles, with Ñ kept distinct, use explicit synthetic keydown events (Playwright has no accented key mapping).
  await page.locator('#puzzle-label').click();for(const key of ['á','à','â','Ñ','G'])await page.evaluate(key=>document.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true})),key);assert.equal((await page.locator('.active b').allTextContents()).join(''),'AAAÑG');for(let n=0;n<5;n++)await page.keyboard.press('Backspace');await type(page,'nga',false);assert.equal((await page.locator('.active b').allTextContents()).join(''),'NGA');for(let n=0;n<3;n++)await page.keyboard.press('Backspace');
  await page.locator('#settings').click();await page.locator('#difficulty').selectOption('easy');await page.getByRole('button',{name:'Close dialog'}).click();await page.waitForFunction(()=>document.querySelectorAll('#optimal-list>li').length>0);assert.ok((await page.locator('#optimal-list>li>strong').allTextContents()).every(word=>vocabulary(5,'fil-PH').allowed.has(word)));await page.locator('#settings').click();await page.locator('#difficulty').selectOption('normal');await page.getByRole('button',{name:'Close dialog'}).click();
  await page.screenshot({path:`${output}/filipino-${width}.png`,fullPage:true});
  await page.locator('#stats').click();assert.equal(await page.locator('#stats-language').inputValue(),'fil-PH');assert.deepEqual(await page.locator('#stats-length option').evaluateAll(ns=>ns.map(n=>n.value)),['5']);await page.getByRole('button',{name:'Close dialog'}).click();
  await page.locator('#settings').click();await page.locator('#reset').click();await page.locator('#cancel-reset').click();await page.getByRole('button',{name:'Close dialog'}).click();assert.equal(await page.locator('#board>.fieldnote').count(),2);
  await page.locator('#give-up').click();await page.locator('#cancel-give-up').click();assert.equal(await page.locator('#board>.fieldnote').count(),2);
  for(let n=0;n<3;n++){await page.locator('#language').selectOption('en');await page.locator('#language').selectOption('es-MX');await page.locator('#language').selectOption('fil-PH')}
  await meaning(page,'BAHAY');assert.equal(await page.locator('.learning-material').count(),0);
  await page.locator('#language').selectOption('en');assert.equal(await page.locator('#word-length').inputValue(),'6');assert.equal((await page.locator('.active b').allTextContents()).join(''),'PLANET');
  await page.locator('#language').selectOption('es-MX');assert.equal(await page.locator('#word-length').inputValue(),'4');assert.equal((await page.locator('.active b').allTextContents()).join(''),'CASA');
  await page.locator('#language').selectOption('fil-PH');await page.locator('#give-up').click();await page.locator('#confirm-give-up').click();await page.reload();assert.match(await page.locator('#turn-label').innerText(),/GAVE UP/);
  for(const file of ['NOTICE.txt','CC-BY-SA-4.0.txt','wordfreq-MIT-LICENSE.txt','wordfreq-README.md']){const r=await context.request.get(new URL(`third-party/fil-PH/${file}`,base).href);assert.equal(r.status(),200);assert.ok((await r.text()).length>50)}
  await checks(test,`${width} interaction`);await context.close();console.log('PASS',width,'typed/tapped meanings, accents/Ñ/N+G, invalid draft, reload, notebooks, stats, reset/give-up cancellation, give-up persistence, notices, layout');
  smokeReport.push({width,...practiceSelection,result:'pass',source:'real generated game; bounded UI refreshes; no injected fixtures'});writeFileSync(`${output}/smoke-report.json`,JSON.stringify(smokeReport,null,2));
  if(process.env.SMOKE_ONLY)continue;
  for(const rules of ['conquest','absurd','one','smashare','letroso'])for(const schedule of ['daily','practice'])for(const level of ['easy','normal','hard','strict']){
   const t=await fresh(width),p=t.page,label=`${width} ${rules} ${schedule} ${level}`;
   await p.locator('#language').selectOption('fil-PH');await p.locator('#schedule-select').selectOption(schedule);await p.locator('#mode-select').selectOption(rules);await startPuzzleIfNeeded(p,level);
   assert.equal(await p.locator('#puzzle-setup').isVisible(),false,label);assert.deepEqual(await p.locator('#word-length option').evaluateAll(ns=>ns.map(n=>n.value)),['5']);
   const selection={rules,schedule},key=rules==='letroso'?`${fil}.letroso-hidden.v2.${schedule}${schedule==='daily'?'.'+today:''}.game`:variantKey(fil,selection,today)+(rules==='smashare'?'.game':'');
   const save=await stored(p,key);assert.ok(save,`${label}: real game saved`);const run=rules==='letroso'||rules==='smashare'?save:save[modeFor(selection)];
   const word=rules==='smashare'?run.answer.merged:rules==='absurd'?'BAHAY':run.answer;
   if(rules==='smashare'){assert.ok(vocabulary(5,'fil-PH').answers.includes(run.answer.first));assert.ok(vocabulary(5,'fil-PH').answers.includes(run.answer.second))}else if(rules!=='absurd')assert.ok(vocabulary(5,'fil-PH').answers.includes(word));
   await type(p,word);const after=await stored(p,key),actual=rules==='letroso'||rules==='smashare'?after:after[modeFor(selection)];assert.ok(actual.guesses.includes(word),`${label}: guess accepted`);assert.equal(actual.difficulty??difficulty(actual),level,label);
   await p.reload();const reload=await stored(p,key),restored=rules==='letroso'||rules==='smashare'?reload:reload[modeFor(selection)];assert.ok(restored.guesses.includes(word),`${label}: reload`);
   await checks(t,label);report.push({width,rules,schedule,difficulty:level,guess:word,source:'real generated game state; no injected fixtures',result:'pass'});writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));await t.context.close();console.log('PASS',label);
  }
 }
 if(!process.env.SMOKE_ONLY)writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));
}finally{await browser.close()}
