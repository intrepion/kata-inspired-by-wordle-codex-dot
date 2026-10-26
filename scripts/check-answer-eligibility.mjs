import {vocabulary} from '../src/words.ts';
import assert from 'node:assert/strict';
import {currentTestContext} from './current-test-context.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
try{for(const width of [1280,390]){
 const context=await currentTestContext(browser,{viewport:{width,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.route('https://en.wiktionary.org/api/rest_v1/page/definition/**',route=>route.fulfill({status:404,headers:{'access-control-allow-origin':'*'},body:'{}'}));
 await page.goto(process.env.BASE_URL??'http://127.0.0.1:5298/');await page.locator('#practice').click();
 for(const word of ['BOOKS','WROTE','GLASS']){await page.keyboard.type(word);await page.keyboard.press('Enter')}
 const word=w=>page.locator(`#board [data-inline-definition="${w}"]`);
 await word('BOOKS').locator('.answer-eligibility').waitFor({timeout:3000});
 assert.match(await word('BOOKS').innerText(),/Possible answer: No.*plural noun form of BOOK/s);
 assert.match(await word('WROTE').innerText(),/Possible answer: No.*past-tense verb form of WRITE/s);
 assert.match(await word('GLASS').innerText(),/Possible answer: Yes/);
 await page.reload();assert.match(await word('BOOKS').innerText(),/Possible answer: No/);
 await page.locator('#language').selectOption('es-MX');await page.locator('#word-length').selectOption('4');await page.locator('#practice').click();
 await page.keyboard.type('VINO');await page.keyboard.press('Enter');
 assert.match(await word('VINO').innerText(),/Possible answer: Yes/);
 assert.equal(await word('VINO').evaluate(node=>{const children=[...node.children];return children.findIndex(n=>n.classList.contains('learning-material'))<children.findIndex(n=>n.classList.contains('answer-eligibility'))&&children.findIndex(n=>n.classList.contains('answer-eligibility'))<children.findIndex(n=>n.classList.contains('definition-meaning'))}),true);
 await page.locator('#word-length').selectOption('5');await page.keyboard.type('HABLO');await page.keyboard.press('Enter');
 assert.match(await word('HABLO').innerText(),/Possible answer: No.*Valid guess.*inflected verb/s);
 assert.equal(await word('HABLO').locator('.learning-material').count(),0);
 await page.locator('#settings').click();await page.locator('#difficulty').selectOption('easy');await page.getByRole('button',{name:'Close dialog'}).click();
 await page.waitForFunction(()=>document.querySelectorAll('#optimal-list>li .answer-eligibility').length===5,{},{timeout:30000});
 await page.locator('#impossible').click();assert.match(await page.locator('#candidate-count').innerText(),new RegExp(`${vocabulary(5,'es-MX').answers.length} possible answers remain`));
 await page.locator('#help').click();assert.doesNotMatch(await page.locator('#modal').innerText(),/curated/i);await page.getByRole('button',{name:'Close dialog'}).click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 await context.close();console.log('PASS eligibility',width,'membership/reasons/fallback, missing definitions, teaching order, reload, locale/length, advice, help/count, layout');
}}finally{await browser.close()}
