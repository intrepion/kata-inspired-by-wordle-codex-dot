/** Local-only UI regression. Requires Playwright (PLAYWRIGHT_MODULE may point at its index.mjs)
 * and Chrome. Starts its own 127.0.0.1 Vite server; uses disposable browser contexts only. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(new URL('..',import.meta.url).pathname),port=Number(process.env.PORTUGUESE_QA_PORT??4179),base=`http://127.0.0.1:${port}`;
const modulePath=process.env.PLAYWRIGHT_MODULE??resolve(root,'../kata-inspired-by-pikmin-codex-dot/node_modules/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(modulePath));
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',chunk=>serverOutput+=chunk);server.stderr.on('data',chunk=>serverOutput+=chunk);
let browser;const reports=[];
const fold=word=>word.normalize('NFD').replace(/\p{M}/gu,'').toUpperCase();
try{
 for(let attempt=0;;attempt++){if(server.exitCode!==null)throw Error(`Vite exited: ${serverOutput}`);try{if((await fetch(base)).ok)break}catch{}if(attempt>100)throw Error('Vite did not start: '+serverOutput);await new Promise(resolve=>setTimeout(resolve,200))}
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
 for(const [label,viewport] of [['desktop',{width:1440,height:1100}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:'))external.push(request.url())});
  await context.addInitScript(()=>{if(!localStorage.getItem('portuguese-qa-initialized')){localStorage.setItem('morrowmark.v1.language','pt-BR');localStorage.setItem('morrowmark.v1.difficulty','normal');localStorage.setItem('portuguese-qa-initialized','1')}});
  await page.goto(base);await page.locator('#language').waitFor();
  const originals=await page.evaluate(async()=>{
   const {emptySave,encode}=await import('/src/persistence.ts'),{activeSaveKeyForPath}=await import('/src/site.ts');
   const values={};for(const language of ['en','en-US','es-MX','fr-FR','fr-CA','nl-NL','de-DE']){const key=activeSaveKeyForPath('/',5,language),value=encode(emptySave(new Date().toISOString().slice(0,10),'normal',5,language));localStorage.setItem(key,value);values[key]=value}
   localStorage.setItem('unrelated-app','untouched');values['unrelated-app']='untouched';return values;
  });
  const start=async()=>{if(await page.locator('#start-puzzle').isVisible()){await page.locator('#start-difficulty').selectOption('normal');await page.locator('#start-puzzle').click()}await page.locator('body').click({position:{x:1,y:1}})};
  const choose=async(locale,rules='conquest',schedule='daily',length=5)=>{
   await page.locator('#language').selectOption('pt');await page.locator('#variety').selectOption(locale);
   await page.locator('#mode-select').selectOption(rules);await page.locator('#schedule-select').selectOption(schedule);
   if(rules!=='letroso')await page.locator('#word-length').selectOption(String(length));await start();
   assert.equal(await page.locator('#variety').inputValue(),locale);assert.match(await page.locator('#language-help').textContent(),/Accents and ç/);
  };
  const stored=async(locale,rules,schedule,length=5)=>page.evaluate(async({locale,rules,schedule,length})=>{
   const {activeSaveKeyForPath}=await import('/src/site.ts'),{variantKey}=await import('/src/variant-context.ts');
   const date=new Date().toISOString().slice(0,10),baseKey=activeSaveKeyForPath('/',length,locale);
   const key=rules==='letroso'?`${activeSaveKeyForPath('/',5,locale)}.letroso-hidden.v2.${schedule}${schedule==='daily'?'.'+date:''}.game`:variantKey(baseKey,{rules,schedule},date)+(rules==='smashare'?'.game':'');
   const value=JSON.parse(localStorage.getItem(key));return {key,value,run:rules==='smashare'||rules==='letroso'?value:value[rules==='absurd'?'impossible':rules==='one'?'one':schedule]};
  },{locale,rules,schedule,length});
  const enter=async word=>{await page.locator('body').click({position:{x:1,y:1}});for(const key of word)await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})),key);await page.keyboard.press('Enter')};
  for(const locale of ['pt-BR','pt-PT']){
   for(const rules of ['conquest','absurd','one','smashare','letroso'])for(const schedule of ['daily','practice']){
    await choose(locale,rules,schedule);const before=await stored(locale,rules,schedule);
    let guess=rules==='smashare'?before.run.answer.merged:before.run.answer;
    if(rules==='absurd')guess=await page.evaluate(async locale=>(await import('/src/words.ts')).vocabulary(5,locale).answers[0],locale);
    await enter(fold(guess));const after=await stored(locale,rules,schedule);
    assert.ok(after.run.guesses.length>before.run.guesses.length,`${label} ${locale} ${rules} ${schedule}: guess accepted; message=${await page.locator('#message').textContent()}`);
    assert.equal(after.run.guesses.at(-1),fold(guess));
    await page.reload();await page.locator('#language').waitFor();assert.deepEqual((await stored(locale,rules,schedule)).run,after.run,'saved round resumes');
    reports.push({viewport:label,locale,rules,schedule,guesses:after.run.guesses.length});console.error(`Passed ${label} ${locale} ${rules} ${schedule}`);
   }
   for(let length=3;length<=11;length++){
    await choose(locale,'conquest','daily',length);assert.equal(await page.locator('#word-length').inputValue(),String(length));assert.ok((await stored(locale,'conquest','daily',length)).run.answer.length===length);
   }
  }
  // Use a real eligible accented answer to exercise decomposed keyboard input and canonical reveal.
  for(const locale of ['pt-BR','pt-PT']){
   await choose(locale,'conquest','practice',4);const saved=await stored(locale,'conquest','practice',4);
   const answer=await page.evaluate(async({key,locale})=>{const {vocabulary}=await import('/src/words.ts'),{newRun}=await import('/src/domain.ts');const answer=vocabulary(4,locale).answers.find(word=>word!==word.normalize('NFD').replace(/\p{M}/gu,''));if(!answer)throw Error('Need an accented answer fixture');const value=JSON.parse(localStorage.getItem(key));value.practice=newRun(answer,'normal',locale);localStorage.setItem(key,JSON.stringify(value));return answer},{key:saved.key,locale});
   await page.reload();await page.locator('#language').waitFor();await start();
   for(const key of answer)await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key:key.normalize('NFD'),bubbles:true,cancelable:true})),key);
   await page.keyboard.press('Enter');assert.equal((await stored(locale,'conquest','practice',4)).run.guesses.at(-1),fold(answer));
   assert.equal(await page.locator('.revealed-definition > strong').textContent(),answer);
   assert.match(await page.locator('#message').textContent(),/Found/);
  }
  // Both accented identities must survive plain-input definition lookup in the rendered UI.
  await choose('pt-BR','conquest','practice',3);const before=await stored('pt-BR','conquest','practice',3);
  if(!before.run.guesses.includes('AVO'))await enter('AVO');
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-inline-definition="AVO"] a')].some(a=>decodeURIComponent(a.href).includes('/avó#Portuguese'))).catch(async error=>{console.error(JSON.stringify({before,after:await stored('pt-BR','conquest','practice',3),message:await page.locator('#message').textContent(),inline:await page.locator('[data-inline-definition]').evaluateAll(nodes=>nodes.map(node=>({word:node.dataset.inlineDefinition,text:node.textContent,links:[...node.querySelectorAll('a')].map(a=>a.href)})))}));throw error});
  const links=await page.locator('[data-inline-definition="AVO"] a').evaluateAll(nodes=>nodes.map(node=>decodeURIComponent(node.href)));
  assert.ok(links.some(link=>link.includes('/avó#Portuguese')));assert.ok(links.some(link=>link.includes('/avô#Portuguese')));
  const practice=(await stored('pt-BR','conquest','practice',3)).run;
  await choose('pt-PT','conquest','practice',3);await choose('pt-BR','conquest','practice',3);
  assert.deepEqual((await stored('pt-BR','conquest','practice',3)).run,practice,'region roundtrip preserves practice progress');
  await page.locator('#help').click();assert.match(await page.locator('dialog').textContent(),/Accents and ç/);await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').isVisible(),false);
  await page.locator('#about').click();assert.match(await page.locator('dialog').textContent(),/avó and avô/);await page.locator('#close').click();assert.equal(await page.locator('dialog').isVisible(),false);
  assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(originals)),originals,'existing language saves remain byte-for-byte unchanged');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no external dictionary requests');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page-wide horizontal overflow');
  mkdirSync(resolve(root,'.local/portuguese-qa'),{recursive:true});await page.screenshot({path:resolve(root,`.local/portuguese-qa/${label}.png`),fullPage:true});await context.close();
 }
 console.log(JSON.stringify({passed:true,checks:reports.length,base,reports},null,2));
}finally{await browser?.close();server.kill('SIGTERM')}
