/** New bundled English gap entries: isolated desktop/mobile, no third-party traffic. */
import assert from 'node:assert/strict';
import {startPuzzleIfNeeded} from './start-puzzle-if-needed.mjs';
import {currentTestContext} from './current-test-context.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base=process.env.BASE_URL??'http://127.0.0.1:5298/';
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{for(const width of [1280,390]){
 const c=await currentTestContext(browser,{viewport:{width,height:950}});const p=await c.newPage(),external=[],errors=[];
 await c.route('**/*',r=>{if(new URL(r.request().url()).origin!==new URL(base).origin){external.push(r.request().url());return r.abort()}return r.continue()});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.locator('#practice').click();
 for(const [length,word,meaning] of [[4,'ADZE',/cut|tool|wood/i],[5,'ABACA',/banana|fibre|fiber|hemp/i],[6,'ACACIA',/tree|shrub|plant/i],[7,'ABALONE',/mollusc|mollusk|shellfish|gastropod/i]]){
  await p.locator('#word-length').selectOption(String(length));await startPuzzleIfNeeded(p,'normal');await p.locator('#puzzle-label').click();await p.keyboard.type(word.toLowerCase());await p.keyboard.press('Enter');
  const node=p.locator(`[data-inline-definition="${word}"]`).first();await node.waitFor();await p.waitForFunction(({word,source})=>[...document.querySelectorAll(`[data-inline-definition="${word}"]`)].some(n=>n.textContent.includes(source)),{word,source:'English Wiktionary contributors'},{timeout:20000});assert.match(await node.innerText(),meaning);assert.ok(await node.locator('a[href*="en.wiktionary.org/wiki/"]').count());
  await p.reload();await p.waitForFunction(w=>[...document.querySelectorAll(`[data-inline-definition="${w}"]`)].some(n=>n.textContent.includes('English Wiktionary contributors')),word,{timeout:20000});assert.match(await p.locator(`[data-inline-definition="${word}"]`).first().innerText(),meaning);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);if(process.env.SCREENSHOT_DIR){const {mkdir}=await import('node:fs/promises');await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});await p.screenshot({path:`${process.env.SCREENSHOT_DIR}/english-gap-${width}.png`,fullPage:true})}await c.close();console.log('PASS',width,'new English 4–7 definitions, source links, reload, layout; zero external requests');
}}finally{await browser.close()}
