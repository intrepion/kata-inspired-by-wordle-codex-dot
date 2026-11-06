/** Isolated browser fixtures: five gameplay tiles, original Œ spelling on reveal. */
import assert from 'node:assert/strict';
import {emptySave,encode} from '../src/persistence.ts';
import {newRun} from '../src/domain.ts';
import {newLetroso} from '../src/letroso.ts';
import {saveKeyForPath,activeSaveKeyForPath} from '../src/site.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base=process.env.BASE_URL??'http://127.0.0.1:5314/',path=new URL(base).pathname,date=new Date().toISOString().slice(0,10),root=saveKeyForPath(path),locale='fr-FR',key=activeSaveKeyForPath(path,5,locale);
const browser=await chromium.launch({headless:true});
try{for(const mode of ['conquest','letroso']){
 const context=await browser.newContext({viewport:{width:390,height:950}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const save=emptySave(date,'normal',5,locale);save.mode='practice';save.practice=newRun('COEUR','normal',locale);
 const seeds={[root+'.language']:locale,[root+'.difficulty']:'normal',[root+'.selection.v1']:JSON.stringify({rules:mode,schedule:'practice'}),[key]:encode(save),[key+'.letroso-hidden.v2.practice.game']:JSON.stringify(newLetroso('COEUR',locale,'normal'))};
 await context.addInitScript(seeds=>{if(localStorage.getItem('qa-ligature-seeded'))return;for(const [key,value]of Object.entries(seeds))localStorage.setItem(key,value);localStorage.setItem('qa-ligature-seeded','yes')},seeds);
 await page.goto(base);if(await page.locator('#start-puzzle').isVisible())await page.locator('#start-puzzle').click();await page.locator(mode==='letroso'?'#letroso-draft':'#puzzle-label').click();
 await page.keyboard.type('c');await page.locator('body').dispatchEvent('keydown',{key:'œ',bubbles:true,cancelable:true});await page.keyboard.type('ur');await page.keyboard.press('Enter');
 const reveal=page.locator(mode==='letroso'?'#letroso-panel > strong':'.revealed-definition > strong');assert.equal(await reveal.innerText(),'CŒUR');assert.equal(await page.locator('.fieldnote .tile.exact').count(),5);await page.reload();assert.equal(await reveal.innerText(),'CŒUR');assert.equal(await page.locator('.fieldnote .tile.exact').count(),5);assert.deepEqual(errors,[]);
 console.log(`PASS ${mode}: synthetic Œ key expands to two tiles, CŒUR wins in five tiles, canonical reveal and reload`);await context.close();
}}finally{await browser.close()}
