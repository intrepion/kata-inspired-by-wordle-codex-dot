/** Local-only UI regression. Requires Playwright (PLAYWRIGHT_MODULE may point at its index.mjs)
 * and Chrome. Starts its own 127.0.0.1 Vite server; uses disposable browser contexts only. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(new URL('..',import.meta.url).pathname),port=Number(process.env.ROMANIAN_EASY_QA_PORT??4191),base=`http://127.0.0.1:${port}`;
const modulePath=process.env.PLAYWRIGHT_MODULE??resolve(root,'../kata-inspired-by-pikmin-codex-dot/node_modules/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(modulePath));
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',chunk=>serverOutput+=chunk);server.stderr.on('data',chunk=>serverOutput+=chunk);
let browser,flowIndex=0;const reports=[],skip=Number(process.env.ROMANIAN_QA_SKIP??0);
const fold=word=>word.normalize('NFC').replace(/[şŞ]/g,'ș').replace(/[ţŢ]/g,'ț').toLocaleUpperCase('ro-RO');
try{
 for(let attempt=0;;attempt++){if(server.exitCode!==null)throw Error(`Vite exited: ${serverOutput}`);try{const response=await fetch(base);if(response.ok)break;if(attempt===0)serverOutput+=' HTTP '+response.status}catch(error){if(attempt===0)serverOutput+=' Fetch '+String(error)+' '+String(error.cause)}if(attempt>600)throw Error('Vite did not start: '+serverOutput);await new Promise(resolve=>setTimeout(resolve,200))}
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
 for(const [label,viewport] of [['desktop',{width:1440,height:1100}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],external=[];page.setDefaultNavigationTimeout(90000);
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:'))external.push(request.url())});
  await context.addInitScript(()=>{if(!localStorage.getItem('romanian-easy-initialized')){localStorage.setItem('morrowmark.v1.language','ro-RO');localStorage.setItem('morrowmark.v1.difficulty','easy');localStorage.setItem('romanian-easy-initialized','1')}});
  await page.goto(base);await page.locator('#language').waitFor();
  const originals=await page.evaluate(async()=>{
   const {emptySave,encode}=await import('/src/persistence.ts'),{activeSaveKeyForPath}=await import('/src/site.ts');
   const values={};for(const language of ['en','en-US','es-MX','fr-FR','fr-CA','nl-NL','de-DE','pt-BR','pt-PT','ru-RU','it-IT','sv-SE','uk-UA']){const key=activeSaveKeyForPath('/',5,language),value=encode(emptySave(new Date().toISOString().slice(0,10),'easy',5,language));localStorage.setItem(key,value);values[key]=value}
   localStorage.setItem('unrelated-app','untouched');values['unrelated-app']='untouched';return values;
  });
  const start=async()=>{if(await page.locator('#start-puzzle').isVisible()){await page.locator('#start-difficulty').selectOption('easy');await page.locator('#start-puzzle').click()}await page.locator('body').click({position:{x:1,y:1}})};
  const choose=async(locale,rules='conquest',schedule='daily',length=5)=>{
   await page.locator('#language').selectOption('ro');await page.locator('#variety').selectOption(locale);
   await page.locator('#mode-select').selectOption(rules);await page.locator('#schedule-select').selectOption(schedule);
   if(rules!=='letroso')await page.locator('#word-length').selectOption(String(length));await start();
   assert.equal(await page.locator('#variety').inputValue(),locale);assert.match(await page.locator('#language-help').textContent(),/Ă, Â, Î, Ș and Ț/);
  };
  const stored=async(locale,rules,schedule,length=5)=>page.evaluate(async({locale,rules,schedule,length})=>{
   const {activeSaveKeyForPath}=await import('/src/site.ts'),{variantKey}=await import('/src/variant-context.ts');
   const date=new Date().toISOString().slice(0,10),baseKey=activeSaveKeyForPath('/',length,locale);
   const key=rules==='letroso'?`${activeSaveKeyForPath('/',5,locale)}.letroso-hidden.v2.${schedule}${schedule==='daily'?'.'+date:''}.game`:variantKey(baseKey,{rules,schedule},date)+(rules==='smashare'?'.game':'');
   const value=JSON.parse(localStorage.getItem(key));return {key,value,run:rules==='smashare'||rules==='letroso'?value:value[rules==='absurd'?'impossible':rules==='one'?'one':schedule]};
  },{locale,rules,schedule,length});
  const enter=async word=>{await page.locator('body').click({position:{x:1,y:1}});for(const key of word)await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})),key);await page.keyboard.press('Enter')};
  for(const locale of ['ro-RO']){
   for(const rules of ['conquest','absurd','one','smashare','letroso'])for(const schedule of ['daily','practice'])for(const length of rules==='letroso'?[5]:[3,4,5,6,7,8,9,10,11]){
    if(flowIndex++<skip)continue;
    await choose(locale,rules,schedule,length);const before=await stored(locale,rules,schedule,length);
    const selector=rules==='smashare'?'[data-smash-suggestion]':rules==='letroso'?'[data-letroso-suggestion]':'#optimal-list>li>strong';
    await page.waitForFunction(selector=>document.querySelectorAll(selector).length>0,selector,{timeout:60000});
    const suggestions=page.locator(selector);assert.ok(await suggestions.count()<=5);
    const guess=rules==='smashare'?await suggestions.first().getAttribute('data-smash-suggestion'):rules==='letroso'?await suggestions.first().getAttribute('data-letroso-suggestion'):await suggestions.first().textContent();
    assert.ok(guess);assert.equal(before.run.assisted,true,'Easy marks assistance before the first played guess');
    if(rules==='smashare'||rules==='letroso'){await suggestions.first().click();assert.equal((await stored(locale,rules,schedule,length)).run.draft,fold(guess));await page.keyboard.press('Enter')}else await enter(fold(guess));
const after=await stored(locale,rules,schedule,length);
    assert.ok(after.run.guesses.length>before.run.guesses.length,`${label} ${locale} ${rules} ${schedule} ${length}: guess accepted; message=${await page.locator('#message').textContent()}`);
    assert.equal(after.run.guesses.at(-1),fold(guess));
    await page.reload();await page.locator('#language').waitFor();assert.deepEqual((await stored(locale,rules,schedule,length)).run,after.run,'saved round resumes');assert.equal(after.run.assisted,true);
    reports.push({viewport:label,locale,rules,schedule,length,guesses:after.run.guesses.length});console.error(`Passed ${label} ${locale} ${rules} ${schedule} ${length}`);
   }
   for(let length=3;length<=11;length++){
    await choose(locale,'conquest','daily',length);assert.equal(await page.locator('#word-length').inputValue(),String(length));assert.ok((await stored(locale,'conquest','daily',length)).run.answer.length===length);
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no external dictionary requests');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page-wide horizontal overflow');
  mkdirSync(resolve(root,'.local/romanian-qa'),{recursive:true});await page.screenshot({path:resolve(root,`.local/romanian-qa/${label}-easy.png`),fullPage:true});await context.close();
 }
 console.log(JSON.stringify({passed:true,skippedPreviouslyVerified:skip,checks:reports.length,base,reports},null,2));
}finally{await browser?.close();server.kill('SIGTERM')}
