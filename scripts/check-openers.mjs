import {currentTestContext} from './current-test-context.mjs';
/** Isolated local UI coverage; network is intentionally unavailable; missing teaching/definitions must stay honest. */
import assert from 'node:assert/strict';
import {emptySave,encode} from '../src/persistence.ts';
import {newRun} from '../src/domain.ts';
import {vocabulary} from '../src/words.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
import {learningFor,teachingFor} from '../src/learning.ts';
import {saveKeyForPath} from '../src/site.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base=process.env.BASE_URL??'http://127.0.0.1:5298/',path=new URL(base).pathname,root=saveKeyForPath(path),date=new Date().toISOString().slice(0,10);
const openerCache=new Map();
function openers(length){if(!openerCache.has(length))openerCache.set(length,analyzeObservations({guesses:[],feedback:[],wordLength:length,language:'es-MX'},'optimal').suggestions.map(item=>item.word));return openerCache.get(length)}
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
try{for(const width of [1280,390])for(const length of [4,5,6,7]){
 const words=openers(length),seed=emptySave(date,'easy',length,'es-MX');seed.mode='practice';seed.practice=newRun(vocabulary(length,'es-MX').answers.find(word=>!words.includes(word)),'easy','es-MX');
 const context=await currentTestContext(browser,{viewport:{width,height:950}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',error=>errors.push(error.message));await context.route('https://en.wiktionary.org/api/rest_v1/page/definition/**',async route=>{requests.push(decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1)).toLocaleUpperCase('es-MX'));await route.abort('internetdisconnected')});
 await page.addInitScript(({root,key,raw,length})=>{if(!localStorage.getItem('qa-openers')){localStorage.setItem(root+'.language','es-MX');localStorage.setItem(root+'.es-MX.word-length',String(length));localStorage.setItem(key,raw);localStorage.setItem('qa-openers','yes')}},{root,key:saveKeyForPath(path,length,'es-MX'),raw:encode(seed),length});
 const start=Date.now();await page.goto(base);await page.locator('#puzzle-label').click();const typing=Date.now();await page.keyboard.type('abc');assert.equal(await page.locator('.board-row.active b').allTextContents().then(x=>x.join('')),'ABC');assert.ok(Date.now()-typing<2000,'Typing must remain responsive while the worker computes');for(let i=0;i<3;i++)await page.keyboard.press('Backspace');await page.waitForFunction(()=>document.querySelectorAll('#optimal-list>li').length===5,{},{timeout:90000});
 const openerMs=Date.now()-start;assert.deepEqual(await page.locator('#optimal-list>li>strong').allTextContents(),words);
 for(const word of words){const lesson=learningFor(word,'es-MX'),slot=page.locator(`#optimal-list [data-inline-definition="${word}"]`);assert.equal(await slot.locator('.learning-material p').count(),teachingFor(word,'es-MX')?3:0);await slot.locator('.definition-meaning').filter({hasText:/./}).waitFor();assert.ok((await slot.locator('.definition-meaning').innerText()).length>5);assert.match(await slot.locator('a.definition-source').getAttribute('href'),/wiktionary/);assert.equal(await slot.locator('.answer-eligibility').count(),1)}
 assert.ok(words.filter(word=>learningFor(word,'es-MX')).every(word=>!requests.includes(word)));
 for(const [index,word] of words.entries()){
  await page.locator('#puzzle-label').click();for(const letter of word){if(/^[A-Z]$/.test(letter))await page.keyboard.type(letter.toLowerCase());else await page.locator(`[data-key="${letter}"]`).click()}await page.getByRole('button',{name:'Enter: submit guess',exact:true}).click();assert.equal(await page.locator('#turn-label').innerText(),`${index+1}/6 NOTED`);
  const slot=page.locator(`#board [data-inline-definition="${word}"]`);assert.equal(await slot.locator('.learning-material p').count(),teachingFor(word,'es-MX')?3:0);if(teachingFor(word,'es-MX')){assert.match(await slot.innerText(),/English translation:/);assert.match(await slot.innerText(),/English sentence translation:/)}assert.match(await slot.locator('a.definition-source').getAttribute('href'),/wiktionary/);assert.equal(await slot.locator('.answer-eligibility').count(),1);
 }
 await page.reload();for(const word of words)assert.equal(await page.locator(`#board [data-inline-definition="${word}"] .learning-material p`).count(),teachingFor(word,'es-MX')?3:0);
 assert.ok(words.filter(word=>learningFor(word,'es-MX')).every(word=>!requests.includes(word)),'Covered words must not require network');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);console.log('PASS',width,length,`letters (${openerMs}ms page+opener): expanded-pool Easy openers and submitted/restored words retain available teaching, omit missing fields and show eligibility/source links honestly`);await context.close();
}}finally{await browser.close()}
