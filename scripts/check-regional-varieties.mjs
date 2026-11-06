/** Region and spelling regression against a real local production HTTP server. */
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {emptySave,encode} from '../src/persistence.ts';
import {newRun} from '../src/domain.ts';
import {saveKeyForPath,activeSaveKeyForPath} from '../src/site.ts';
import {vocabulary} from '../src/words.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base=process.env.BASE_URL??'http://127.0.0.1:5314/',path=new URL(base).pathname,date=new Date().toISOString().slice(0,10),screens=process.env.SCREENSHOT_DIR??'.local/regional-varieties-qa';mkdirSync(screens,{recursive:true});
const browser=await chromium.launch({headless:true});
try{for(const width of [1280,390]){
 const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const seeds=Object.fromEntries(['fr-FR','fr-CA','es-ES','en-AU'].map(locale=>{const save=emptySave(date,'normal',5,locale);save.practice=newRun(locale.startsWith('fr')?'ÉCOLE':locale==='es-ES'?'COCHE':'APPLE','normal',locale);save.mode='practice';return [activeSaveKeyForPath(path,5,locale),encode(save)]}));
 seeds[saveKeyForPath(path)+'.language']='fr-FR';seeds[saveKeyForPath(path)+'.difficulty']='normal';seeds['unrelated']='keep';
 await context.addInitScript(seeds=>{if(localStorage.getItem('qa-regional-seeded'))return;for(const [key,value]of Object.entries(seeds))localStorage.setItem(key,value);localStorage.setItem('qa-regional-seeded','1')},seeds);
 await page.goto(base);assert.equal(await page.locator('#language').inputValue(),'fr');assert.equal(await page.locator('#variety').inputValue(),'fr-FR');
 const start=async()=>{if(await page.locator('#start-puzzle').isVisible()){await page.locator('#start-difficulty').selectOption('normal');await page.locator('#start-puzzle').click()}};
 const guess=async word=>{await page.locator('#puzzle-label').click();await page.keyboard.type(word.toLowerCase());await page.keyboard.press('Enter')};
 const erase=async word=>{for(const _ of word)await page.keyboard.press('Backspace')};
 await start();await guess('CEGEP');assert.match(await page.locator('#message').innerText(),/outside our field guide/);await erase('CEGEP');await guess('ECOLE');assert.match(await page.locator('#message').innerText(),/ÉCOLE/);assert.equal(await page.locator('.fieldnote .tile.exact').count(),5);await page.reload();assert.match(await page.locator('#message').innerText(),/ÉCOLE/);
 await page.locator('#variety').selectOption('fr-CA');await start();await guess('PREPA');assert.match(await page.locator('#message').innerText(),/outside our field guide/);await erase('PREPA');await guess('CEGEP');assert.equal(await page.locator('.fieldnote').count(),1);await guess('ECOLE');assert.match(await page.locator('#message').innerText(),/ÉCOLE/);
 await page.waitForFunction(()=>[...document.querySelectorAll('[data-inline-definition="ECOLE"] .definition-meaning')].some(node=>/school/i.test(node.textContent??'')));assert.match(await page.locator('#definition-disclosure').innerText(),/French/);
 await page.locator('#language').selectOption('es');await page.locator('#variety').selectOption('es-ES');await start();await guess('COCHE');assert.match(await page.locator('#message').innerText(),/COCHE/);assert.match(await page.locator('#definition-disclosure').innerText(),/not English translations/);await page.waitForFunction(()=>document.querySelector('[data-inline-definition="COCHE"] .definition-meaning')?.textContent?.includes('Vehículo'));
 await page.locator('#variety').selectOption('es-MX');assert.equal(await page.locator('#variety').inputValue(),'es-MX');await page.locator('#variety').selectOption('es-ES');assert.match(await page.locator('#message').innerText(),/COCHE/);
 await page.locator('#language').selectOption('en');await page.locator('#variety').selectOption('en-AU');await start();await guess('COLOR');assert.match(await page.locator('#message').innerText(),/outside our field guide/);await erase('COLOR');await guess('CHOOK');assert.equal(await page.locator('.fieldnote').count(),1);await page.reload();assert.equal(await page.locator('#variety').inputValue(),'en-AU');assert.equal(await page.locator('.fieldnote').count(),1);
 // Every new pack enters all five rules and both schedules, survives repeated switches,
 // and offers locale-appropriate pools without opening a mixed notebook.
 for(const locale of ['en-AU','es-ES','fr-FR','fr-CA']){
  await page.locator('#language').selectOption(locale.slice(0,2));await page.locator('#variety').selectOption(locale);
  for(const schedule of ['daily','practice'])for(const rules of ['conquest','absurd','one','smashare','letroso']){
   await page.locator('#schedule-select').selectOption(schedule);await page.locator('#mode-select').selectOption(rules);assert.equal(await page.locator('dialog[open]').count(),0,`${locale} ${schedule} ${rules}`);await start();assert.equal(await page.locator('#variety').inputValue(),locale);
   if(rules==='absurd')assert.match(await page.locator('#candidate-count').innerText(),new RegExp(String(vocabulary(5,locale).answers.length)));
  }
 }
 await page.locator('#language').selectOption('fr');await page.locator('#variety').selectOption('fr-FR');await page.locator('#mode-select').selectOption('conquest');await page.locator('#schedule-select').selectOption('practice');
 await page.waitForFunction(()=>[...document.querySelectorAll('.revealed-definition .definition-meaning')].some(node=>/school/i.test(node.textContent??'')));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated')),'keep');assert.deepEqual(errors,[]);await page.screenshot({path:`${screens}/regional-varieties-${width}.png`,fullPage:true});
 console.log(`PASS ${width}: France/Canada regional rejection, accent-folded win/reload, sourced meanings, Spain separation, Australia source words, all new locales × five rules × two schedules, mobile layout`);await context.close();
}}
finally{await browser.close()}
