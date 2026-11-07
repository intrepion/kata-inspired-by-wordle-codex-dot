/** Local-only UI regression. Requires Playwright (PLAYWRIGHT_MODULE may point at its index.mjs)
 * and Chrome. Starts its own 127.0.0.1 Vite server; uses disposable browser contexts only. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(new URL('..',import.meta.url).pathname),port=Number(process.env.UKRAINIAN_QA_PORT??4187),base=`http://127.0.0.1:${port}`;
const modulePath=process.env.PLAYWRIGHT_MODULE??resolve(root,'../kata-inspired-by-pikmin-codex-dot/node_modules/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(modulePath));
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
let serverOutput='';server.stdout.on('data',chunk=>serverOutput+=chunk);server.stderr.on('data',chunk=>serverOutput+=chunk);
let browser;const reports=[];
const fold=word=>word.normalize('NFC').toLocaleUpperCase('uk-UA');
try{
 for(let attempt=0;;attempt++){if(server.exitCode!==null)throw Error(`Vite exited: ${serverOutput}`);try{if((await fetch(base)).ok)break}catch{}if(attempt>100)throw Error('Vite did not start: '+serverOutput);await new Promise(resolve=>setTimeout(resolve,200))}
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
 for(const [label,viewport] of [['desktop',{width:1440,height:1100}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:'))external.push(request.url())});
  await context.addInitScript(()=>{if(!localStorage.getItem('ukrainian-qa-initialized')){localStorage.setItem('morrowmark.v1.language','uk-UA');localStorage.setItem('morrowmark.v1.difficulty','normal');localStorage.setItem('ukrainian-qa-initialized','1')}});
  await page.goto(base);await page.locator('#language').waitFor();
  const originals=await page.evaluate(async()=>{
   const {emptySave,encode}=await import('/src/persistence.ts'),{activeSaveKeyForPath}=await import('/src/site.ts');
   const values={};for(const language of ['en','en-US','es-MX','fr-FR','fr-CA','nl-NL','de-DE','pt-BR','pt-PT','ru-RU','it-IT','sv-SE']){const key=activeSaveKeyForPath('/',5,language),value=encode(emptySave(new Date().toISOString().slice(0,10),'normal',5,language));localStorage.setItem(key,value);values[key]=value}
   localStorage.setItem('unrelated-app','untouched');values['unrelated-app']='untouched';return values;
  });
  const start=async()=>{if(await page.locator('#start-puzzle').isVisible()){await page.locator('#start-difficulty').selectOption('normal');await page.locator('#start-puzzle').click()}await page.locator('body').click({position:{x:1,y:1}})};
  const choose=async(locale,rules='conquest',schedule='daily',length=5)=>{
   await page.locator('#language').selectOption('uk');await page.locator('#variety').selectOption(locale);
   await page.locator('#mode-select').selectOption(rules);await page.locator('#schedule-select').selectOption(schedule);
   if(rules!=='letroso')await page.locator('#word-length').selectOption(String(length));await start();
   assert.equal(await page.locator('#variety').inputValue(),locale);assert.match(await page.locator('#language-help').textContent(),/Й and И/);
  };
  const stored=async(locale,rules,schedule,length=5)=>page.evaluate(async({locale,rules,schedule,length})=>{
   const {activeSaveKeyForPath}=await import('/src/site.ts'),{variantKey}=await import('/src/variant-context.ts');
   const date=new Date().toISOString().slice(0,10),baseKey=activeSaveKeyForPath('/',length,locale);
   const key=rules==='letroso'?`${activeSaveKeyForPath('/',5,locale)}.letroso-hidden.v2.${schedule}${schedule==='daily'?'.'+date:''}.game`:variantKey(baseKey,{rules,schedule},date)+(rules==='smashare'?'.game':'');
   const value=JSON.parse(localStorage.getItem(key));return {key,value,run:rules==='smashare'||rules==='letroso'?value:value[rules==='absurd'?'impossible':rules==='one'?'one':schedule]};
  },{locale,rules,schedule,length});
  const enter=async word=>{await page.locator('body').click({position:{x:1,y:1}});for(const key of word)await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})),key);await page.keyboard.press('Enter')};
  for(const locale of ['uk-UA']){
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
  // Check every key in an unfinished fresh practice fixture, including soft sign and Ukrainian-specific letters.
  await choose('uk-UA','conquest','practice',5);
  const saved=await stored('uk-UA','conquest','practice',5);
  const reset=async answer=>{await page.evaluate(async({key,answer})=>{const {newRun}=await import('/src/domain.ts');const value=JSON.parse(localStorage.getItem(key));value.practice=newRun(answer,'normal','uk-UA');localStorage.setItem(key,JSON.stringify(value))},{key:saved.key,answer});await page.reload();await page.locator('#language').waitFor();await start()};
  const answers=await page.evaluate(async()=>(await import('/src/words.ts')).vocabulary(5,'uk-UA').answers);
  await reset(answers[0]);
  const letters='АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';
  for(const letter of letters){await page.locator(`#keyboard [data-key="${letter}"]`).click();assert.equal((await stored('uk-UA','conquest','practice',5)).run.draft,letter);await page.locator('#keyboard [data-key="⌫"]').click()}
  for(const key of ['A','P','C','X','Ё','Ъ','Ы','Э',"'",'’','ʼ'])await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})),key);
  assert.equal((await stored('uk-UA','conquest','practice',5)).run.draft,'','Latin lookalikes are ignored');
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'и\u0306',bubbles:true,cancelable:true})));
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'і\u0308',bubbles:true,cancelable:true})));
  assert.equal((await stored('uk-UA','conquest','practice',5)).run.draft,'ЙЇ');
  await page.reload();await page.locator('#language').waitFor();assert.equal((await stored('uk-UA','conquest','practice',5)).run.draft,'ЙЇ');
  const preserved=(await stored('uk-UA','conquest','practice',5)).run;
  // Switch language without starting another notebook, then resume exactly.
  await page.locator('#language').selectOption('en');await page.locator('#language').selectOption('uk');
  assert.deepEqual((await stored('uk-UA','conquest','practice',5)).run,preserved);
  await page.locator('#help').click();assert.match(await page.locator('dialog').textContent(),/Й and И/);await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').isVisible(),false);
  await page.locator('#about').click();assert.match(await page.locator('dialog').textContent(),/Ґ and Г/);await page.locator('#close').click();assert.equal(await page.locator('dialog').isVisible(),false);
  await page.locator('#stats').click();assert.equal(await page.locator('#stats-language').inputValue(),'uk');assert.equal(await page.locator('#stats-variety').inputValue(),'uk-UA');await page.keyboard.press('Escape');
  await page.locator('#settings').click();assert.match(await page.locator('dialog').textContent(),/Difficulty/);await page.keyboard.press('Escape');
  assert.deepEqual((await stored('uk-UA','conquest','practice',5)).run,preserved,'dismissed dialogs preserve progress');
  // Similar Cyrillic vowels cannot silently win a Ґ/Ї/Й answer.
  for(const [letter,wrongLetter] of [['Ґ','Г'],['Ї','І'],['Й','И']]){const answer=answers.find(word=>word.includes(letter));assert.ok(answer,`five-letter ${letter} answer`);await reset(answer);await enter(answer.replaceAll(letter,wrongLetter));const state=await stored('uk-UA','conquest','practice',5);assert.equal(state.run.guesses.includes(answer),false);assert.doesNotMatch(await page.locator('#message').textContent(),/Found/)}
  // Decomposed Cyrillic input must solve and produce an attributed English meaning.
  const answer=answers.find(word=>/[ЇЙ]/u.test(word));assert.ok(answer,'five-letter answer includes a composable letter');await reset(answer);
  for(const key of answer)await page.evaluate(key=>window.dispatchEvent(new KeyboardEvent('keydown',{key:key.normalize('NFD'),bubbles:true,cancelable:true})),key);
  await page.keyboard.press('Enter');assert.equal((await stored('uk-UA','conquest','practice',5)).run.guesses.at(-1),answer);
  assert.match(await page.locator('#message').textContent(),/Found/);
  await page.waitForFunction(word=>[...document.querySelectorAll(`[data-inline-definition="${word}"] a`)].some(a=>a.href.endsWith('#Ukrainian')),answer);
  // Layout remains usable even on a narrow phone.
  if(label==='mobile'){await page.setViewportSize({width:320,height:780});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'320px page does not overflow');await page.setViewportSize(viewport)}
  // Opening English can update its own notebook; all untouched languages remain byte-identical.
  delete originals['morrowmark.v1.en-US'];
  assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),Object.keys(originals)),originals,'existing language saves remain byte-for-byte unchanged');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[],'no external dictionary requests');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page-wide horizontal overflow');
  mkdirSync(resolve(root,'.local/ukrainian-qa'),{recursive:true});await page.screenshot({path:resolve(root,`.local/ukrainian-qa/${label}.png`),fullPage:true});await context.close();
 }
 console.log(JSON.stringify({passed:true,checks:reports.length,base,reports},null,2));
}finally{await browser?.close();server.kill('SIGTERM')}
