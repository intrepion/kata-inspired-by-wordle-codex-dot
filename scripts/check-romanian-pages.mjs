/** Actual Pages-build/live smoke checks in disposable browser contexts.
 * node --import tsx scripts/check-romanian-pages.mjs
 * Set BASE_URL to verify the published build instead of serving dist-pages locally. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {vocabulary} from '../src/words.ts';
import {newRun} from '../src/domain.ts';
import {activeSaveKeyForPath,PROJECT_PATH,saveKeyForPath as preferenceKeyForPath} from '../src/site.ts';
import {variantKey} from '../src/variant-context.ts';
import {normalizeGuess} from '../src/language.ts';
const root=resolve(new URL('..',import.meta.url).pathname),modulePath=process.env.PLAYWRIGHT_MODULE??resolve(root,'../kata-inspired-by-pikmin-codex-dot/node_modules/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(modulePath));
let server,base=process.env.BASE_URL;
if(!base){const directory=resolve(root,'dist-pages');server=createServer(async(req,res)=>{try{const url=new URL(req.url??'/','http://localhost');assert.ok(url.pathname.startsWith(PROJECT_PATH));const path=resolve(directory,decodeURIComponent(url.pathname.slice(PROJECT_PATH.length))||'index.html');assert.ok(path.startsWith(directory+sep));const data=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.txt':'text/plain'})[extname(path)]??'application/octet-stream');res.end(data)}catch{res.writeHead(404);res.end('Not found')}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}${PROJECT_PATH}`}
const path=new URL(base).pathname,date=new Date().toISOString().slice(0,10),preference=preferenceKeyForPath(path);
let browser;const reports=[];
try{
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
 for(const [label,viewport] of [['desktop',{width:1440,height:1100}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],bad=[],external=[];
  page.on('pageerror',error=>errors.push(String(error)));page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)bad.push(response.status()+' '+response.url())});page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:'))external.push(request.url())});
  await context.addInitScript(preference=>{if(!localStorage.getItem('romanian-pages-initialized')){localStorage.setItem(preference+'.language','ro-RO');localStorage.setItem(preference+'.difficulty','normal');localStorage.setItem('unrelated-root-notebook','untouched');localStorage.setItem('romanian-pages-initialized','1')}},preference);
  const response=await page.goto(base);assert.equal(response.status(),200);await page.locator('#language').waitFor();
  const start=async()=>{if(await page.locator('#start-puzzle').isVisible()){await page.locator('#start-difficulty').selectOption('normal');await page.locator('#start-puzzle').click()}await page.locator('body').click({position:{x:1,y:1}})};
  const choose=async(locale,rules='conquest',schedule='daily',length=5)=>{await page.locator('#language').selectOption(locale.split('-')[0]);await page.locator('#variety').selectOption(locale);await page.locator('#mode-select').selectOption(rules);await page.locator('#schedule-select').selectOption(schedule);if(rules!=='letroso')await page.locator('#word-length').selectOption(String(length));await start();assert.equal(await page.locator('#variety').inputValue(),locale)};
  const stored=async(locale,rules,schedule,length=5)=>{const baseKey=activeSaveKeyForPath(path,length,locale),key=rules==='letroso'?`${activeSaveKeyForPath(path,5,locale)}.letroso-hidden.v2.${schedule}${schedule==='daily'?'.'+date:''}.game`:variantKey(baseKey,{rules,schedule},date)+(rules==='smashare'?'.game':'');const value=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);return {key,value,run:rules==='smashare'||rules==='letroso'?value:value[rules==='absurd'?'impossible':rules==='one'?'one':schedule]}};
  const enter=async word=>{await page.locator('body').click({position:{x:1,y:1}});for(const key of word)await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key:key.normalize('NFD'),bubbles:true,cancelable:true})),key);await page.keyboard.press('Enter')};
  for(const locale of ['ro-RO']){
   for(const rules of ['conquest','absurd','one','smashare','letroso'])for(const schedule of ['daily','practice']){
    await choose(locale,rules,schedule);const before=await stored(locale,rules,schedule),answer=rules==='smashare'?before.run.answer.merged:rules==='absurd'?vocabulary(5,locale).answers[0]:before.run.answer;
    await enter(normalizeGuess(answer,locale));const after=await stored(locale,rules,schedule);assert.equal(after.run.guesses.length,before.run.guesses.length+1,`${label} ${locale} ${rules} ${schedule}`);assert.equal(after.run.guesses.at(-1),normalizeGuess(answer,locale));await page.reload();await page.locator('#language').waitFor();assert.deepEqual((await stored(locale,rules,schedule)).run,after.run);reports.push({label,locale,rules,schedule});console.log('PASS',label,locale,rules,schedule);
   }
   for(let length=3;length<=11;length++){await choose(locale,'conquest','daily',length);assert.equal((await stored(locale,'conquest','daily',length)).run.answer.length,length)}
   // Long-word Smashare must be playable, not just a selectable length.
   await choose(locale,'smashare','daily',11);const long=await stored(locale,'smashare','daily',11);await enter(normalizeGuess(long.run.answer.merged,locale));assert.equal((await stored(locale,'smashare','daily',11)).run.guesses.at(-1),normalizeGuess(long.run.answer.merged,locale));
   await choose(locale,'conquest','practice',5);const saved=await stored(locale,'conquest','practice',5),answer='PÂINE';saved.value.practice=newRun(answer,'normal',locale);await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),saved);await page.reload();await page.locator('#language').waitFor();await start();
   for(const key of ['Ă','Â','Î','Ș','Ț']){await page.locator(`#keyboard [data-key="${key}"]`).click();assert.equal((await stored(locale,'conquest','practice',5)).run.draft,key);await page.locator('#keyboard [data-key="⌫"]').click()}
   await enter(answer);assert.match(await page.locator('#message').textContent(),/Found/);assert.match(await page.locator('#message').textContent(),/PÂINE/);
   const key=normalizeGuess(answer,locale),section='Romanian';await page.waitForFunction(({key,section})=>[...document.querySelectorAll(`[data-inline-definition="${key}"] a`)].some(a=>a.href.endsWith('#'+section)),{key,section});assert.match(await page.locator(`[data-inline-definition="${key}"]`).first().textContent(),/bread/);
   await page.locator('#stats').click();assert.equal(await page.locator('#stats-language').inputValue(),locale.split('-')[0]);assert.equal(await page.locator('#stats-variety').inputValue(),locale);await page.keyboard.press('Escape');
   for(const notice of ['NOTICE.txt','CC-BY-SA-4.0.txt','wordfreq-README.md']){const response=await context.request.get(new URL(`third-party/${locale}/${notice}`,base).href);assert.equal(response.status(),200);assert.ok((await response.text()).length>100)}
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-root-notebook')),'untouched');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);assert.deepEqual(external,[]);await context.close();
 }
 console.log(JSON.stringify({passed:true,base,flows:reports.length,checks:'daily/practice all five modes, reloads, all lengths, eleven-letter Smashare, Romanian input and reveals, English meanings, Romanian keys, source notices, statistics, no failed assets or external dictionaries',reports},null,2));
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve))}
