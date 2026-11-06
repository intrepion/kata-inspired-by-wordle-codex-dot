/** Production-server regression. Run with node --import tsx; does not touch the user's browser profile. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {emptySave,encode} from '../src/persistence.ts';
import {newRun,submit} from '../src/domain.ts';
import {activeSaveKeyForPath,saveKeyForPath} from '../src/site.ts';
import {vocabulary} from '../src/words.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base=process.env.BASE_URL??'http://127.0.0.1:5314/',path=new URL(base).pathname,date=new Date().toISOString().slice(0,10);
const screens=process.env.SCREENSHOT_DIR??'.local/english-varieties-qa';mkdirSync(screens,{recursive:true});
const legacy=emptySave(date,'normal');legacy.practice=submit(newRun('APPLE'),'ALLEY').run;
const spanish=emptySave(date,'normal',5,'es-MX');spanish.practice.draft='ÁRB';
const saved={
 [saveKeyForPath(path)]:encode(legacy),
 [activeSaveKeyForPath(path)]:encode(legacy),
 [saveKeyForPath(path,5,'es-MX')]:encode(spanish),
 [saveKeyForPath(path)+'.theme']:'dark',
 [saveKeyForPath(path)+'.difficulty']:'normal',
 unrelated:'untouched'
};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(saved=>{if(localStorage.getItem('qa-seeded'))return;for(const [key,value]of Object.entries(saved))localStorage.setItem(key,value);localStorage.setItem('qa-seeded','1')},saved);
  await page.goto(base);await page.locator('#variety').waitFor({timeout:10000});
  assert.equal(await page.locator('#language').inputValue(),'en');assert.equal(await page.locator('#variety').inputValue(),'en-US');
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  assert.deepEqual(await page.locator('#variety option').evaluateAll(nodes=>nodes.map(node=>node.value)),['en-US','en-GB','en-AU']);
  const start=async()=>{if(await page.locator('#start-puzzle').isVisible()){await page.locator('#start-difficulty').selectOption('normal');await page.locator('#start-puzzle').click()}};
  const guess=async word=>{await page.locator('#puzzle-label').click();await page.keyboard.type(word.toLowerCase());await page.keyboard.press('Enter')};
  const erase=async word=>{for(const _ of word)await page.keyboard.press('Backspace')};
  await page.locator('#schedule-select').selectOption('practice');await start();
  assert.equal(await page.locator('.fieldnote').count(),0);
  await guess('SABRE');assert.match(await page.locator('#message').innerText(),/outside our field guide/);assert.equal(await page.locator('.fieldnote').count(),0);await erase('SABRE');
  await guess('SABER');assert.equal(await page.locator('.fieldnote').count(),1);
  await page.locator('#variety').selectOption('en-GB');await start();assert.equal(await page.locator('.fieldnote').count(),0);
  await guess('SABER');assert.match(await page.locator('#message').innerText(),/outside our field guide/);await erase('SABER');
  await guess('SABRE');assert.equal(await page.locator('.fieldnote').count(),1);
  await page.reload();assert.equal(await page.locator('#variety').inputValue(),'en-GB');assert.equal(await page.locator('.fieldnote').count(),1);assert.equal((await page.locator('.fieldnote').first().locator('.tile b').allTextContents()).join(''),'SABRE');
  // Independent length notebooks, repeated switches, and remembered variety.
  await page.locator('#word-length').selectOption('6');await start();await guess('COLOUR');assert.equal(await page.locator('.fieldnote').count(),1);
  await page.locator('#variety').selectOption('en-US');assert.equal(await page.locator('#word-length').inputValue(),'5');assert.equal(await page.locator('.fieldnote').count(),1);
  await page.locator('#word-length').selectOption('6');await start();await guess('COLOUR');assert.match(await page.locator('#message').innerText(),/outside our field guide/);await erase('COLOUR');
  await page.locator('#variety').selectOption('en-GB');assert.equal(await page.locator('#word-length').inputValue(),'6');assert.equal(await page.locator('.fieldnote').count(),1);
  await page.locator('#language').selectOption('fil');assert.equal(await page.locator('#variety').inputValue(),'fil-PH');assert.deepEqual(await page.locator('#word-length option').allTextContents(),['5 letters']);
  await page.locator('#language').selectOption('nl');assert.equal(await page.locator('#variety').inputValue(),'nl-NL');
  await page.locator('#language').selectOption('en');assert.equal(await page.locator('#variety').inputValue(),'en-GB');
  for(const locale of ['en-US','en-GB']){await page.locator('#variety').selectOption(locale);await page.locator('#word-length').selectOption('5');await page.locator('#mode-select').selectOption('absurd');await start();assert.equal(await page.locator('#candidate-count').innerText(),`${vocabulary(5,locale).answers.length} possible answers remain.`);await page.locator('#mode-select').selectOption('conquest')}
  await page.getByRole('button',{name:'Statistics',exact:true}).click();assert.equal(await page.locator('#stats-language').inputValue(),'en');assert.equal(await page.locator('#stats-variety').inputValue(),'en-GB');await page.locator('#stats-variety').selectOption('en-US');assert.match(await page.locator('#statistics-results').innerText(),/American English/);await page.getByRole('button',{name:'Close dialog'}).click();assert.equal(await page.locator('#variety').inputValue(),'en-GB');
  // Dismissal must not change selected variety, and a cancelled erase must not mutate progress.
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Erase saved notebook…'}).click();await page.getByRole('button',{name:'Keep my notebook'}).click();await page.getByRole('button',{name:'Close dialog'}).click();assert.equal(await page.locator('.fieldnote').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const preserved=await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(saved));assert.deepEqual(preserved,saved);
  assert.deepEqual(errors,[]);await page.screenshot({path:`${screens}/english-varieties-${width}.png`,fullPage:true});
  console.log(`PASS ${width}: separate guesses, counts, reloads, repeated language/variety/length switches, stats, cancellation, preserved legacy/Spanish/preferences and responsive layout`);
  await context.close();
 }
}finally{await browser.close()}
