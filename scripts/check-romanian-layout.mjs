/** Local-only UI regression. Requires Playwright (PLAYWRIGHT_MODULE may point at its index.mjs)
 * and Chrome. Starts its own 127.0.0.1 Vite server; uses disposable browser contexts only. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(new URL('..',import.meta.url).pathname),port=Number(process.env.ROMANIAN_LAYOUT_QA_PORT??4192),base=`http://127.0.0.1:${port}`;
const modulePath=process.env.PLAYWRIGHT_MODULE??resolve(root,'../kata-inspired-by-pikmin-codex-dot/node_modules/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(modulePath));
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',chunk=>serverOutput+=chunk);server.stderr.on('data',chunk=>serverOutput+=chunk);
let browser;const reports=[];
const fold=word=>word.normalize('NFC').replace(/[şŞ]/g,'ș').replace(/[ţŢ]/g,'ț').toLocaleUpperCase('ro-RO');
try{
 for(let attempt=0;;attempt++){if(server.exitCode!==null)throw Error(`Vite exited: ${serverOutput}`);try{const response=await fetch(base);if(response.ok)break;if(attempt===0)serverOutput+=' HTTP '+response.status}catch(error){if(attempt===0)serverOutput+=' Fetch '+String(error)+' '+String(error.cause)}if(attempt>600)throw Error('Vite did not start: '+serverOutput);await new Promise(resolve=>setTimeout(resolve,200))}
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
 for(const [label,viewport] of [['narrow-mobile',{width:320,height:780}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:'))external.push(request.url())});
  await context.addInitScript(()=>{if(!localStorage.getItem('romanian-qa-initialized')){localStorage.setItem('morrowmark.v1.language','ro-RO');localStorage.setItem('morrowmark.v1.difficulty','normal');localStorage.setItem('romanian-qa-initialized','1')}});
  await page.goto(base);await page.locator('#language').waitFor();
  const originals=await page.evaluate(async()=>{
   const {emptySave,encode}=await import('/src/persistence.ts'),{activeSaveKeyForPath}=await import('/src/site.ts');
   const values={};for(const language of ['en','en-US','es-MX','fr-FR','fr-CA','nl-NL','de-DE','pt-BR','pt-PT','ru-RU','it-IT','sv-SE','uk-UA']){const key=activeSaveKeyForPath('/',5,language),value=encode(emptySave(new Date().toISOString().slice(0,10),'normal',5,language));localStorage.setItem(key,value);values[key]=value}
   localStorage.setItem('unrelated-app','untouched');values['unrelated-app']='untouched';return values;
  });
  const start=async()=>{if(await page.locator('#start-puzzle').isVisible()){await page.locator('#start-difficulty').selectOption('normal');await page.locator('#start-puzzle').click()}await page.locator('body').click({position:{x:1,y:1}})};
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
  for(const rules of ['conquest','absurd','one','smashare','letroso'])for(const length of rules==='letroso'?[5]:[3,4,5,6,7,8,9,10,11]){
   await choose('ro-RO',rules,'practice',length);
   if(rules==='letroso')assert.match(await page.locator('#language-help').textContent(),/1,770 curated possible answers and 14,684 accepted guesses across 3–11 letters/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${rules}/${length}: no page-wide horizontal overflow at 320px`);
   const keyAttribute=rules==='letroso'?'data-letroso-key':rules==='smashare'?'data-smash-key':'data-key';
   for(const letter of 'ĂÂÎȘȚ')assert.ok(await page.locator(`[${keyAttribute}="${letter}"]`).isVisible(),`${rules}/${length}: ${letter} visible`);
   reports.push({rules,length,viewport:label});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no external dictionary requests');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page-wide horizontal overflow');
  mkdirSync(resolve(root,'.local/romanian-qa'),{recursive:true});await page.screenshot({path:resolve(root,`.local/romanian-qa/${label}-layout.png`),fullPage:true});await context.close();
 }
 console.log(JSON.stringify({passed:true,checks:reports.length,base,reports},null,2));
}finally{await browser?.close();server.kill('SIGTERM')}
