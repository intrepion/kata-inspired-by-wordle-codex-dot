/** Isolated regression for the reported trajectory against the pinned independent SCOWL pool. */
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const errors=[];
try{
 for(const width of [1280,390])for(const assisted of [false,true])for(const ending of ['MAKES','WAXES']){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{}}}));
  await context.route('https://en.wiktionary.org/api/rest_v1/page/definition/**',route=>route.fulfill({status:404,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'api-user-agent'},body:'{}'}));
  await page.goto(process.env.BASE_URL??'http://127.0.0.1:5298');await page.getByRole('button',{name:'Absurd',exact:true}).click();
  if(assisted){await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('combobox',{name:'Difficulty'}).selectOption('easy');await page.getByRole('checkbox',{name:'Show Suboptimal guesses'}).check();await page.getByRole('button',{name:'Close dialog'}).click();}
  const count=async()=>Number((await page.locator('#candidate-count').textContent()).match(/\d+/)[0]);assert.equal(await count(),2103);
  for(const [word,remaining] of [['AUDIO',412],['ENTRY',61],['BEACH',28],['VALVE',13],['GAFFE',7]]){
   await page.keyboard.type(word.toLowerCase());await page.keyboard.press('Enter');assert.equal(await count(),remaining,word);
   const rows=await page.locator('#board .fieldnote .board-row').evaluateAll(elements=>elements.map(el=>[...el.querySelectorAll('.tile')].map(tile=>tile.getAttribute('aria-label'))));assert.equal(rows.length,['AUDIO','ENTRY','BEACH','VALVE','GAFFE'].indexOf(word)+1);await page.reload();assert.equal(await count(),remaining);assert.deepEqual(await page.locator('#board .fieldnote .board-row').evaluateAll(elements=>elements.map(el=>[...el.querySelectorAll('.tile')].map(tile=>tile.getAttribute('aria-label')))),rows);
  }
  assert.equal(await page.locator('#candidate-count').textContent(),'7 curated answers remain.');
  for(const invalid of ['PASSE','MASSE']){await page.keyboard.type(invalid.toLowerCase());await page.keyboard.press('Enter');assert.match(await page.locator('#message').textContent(),/outside our field guide/);assert.equal(await count(),7);assert.match(await page.locator('#turn-label').textContent(),/5\/6/);for(let i=0;i<5;i++)await page.keyboard.press('Backspace')}
  if(assisted){await page.waitForFunction(()=>document.querySelector('#optimal-status').textContent.startsWith('7 curated answers fit'));assert.match(await page.locator('#suboptimal-status').textContent(),/^7 curated answers fit/)}
  await page.keyboard.type(ending.toLowerCase());await page.keyboard.press('Enter');const remaining=3;assert.equal(await count(),remaining);assert.match(await page.locator('#turn-label').textContent(),/CLOSED · 6\/6/);assert.match(await page.locator('#message').textContent(),/One surviving curated answer is/);
  await page.getByRole('button',{name:/Copy spoiler-free result/}).click();const share=await page.getByRole('textbox',{name:'Spoiler-free result'}).inputValue();assert.match(share,new RegExp(`${remaining} curated answer`));assert.doesNotMatch(share,/MAKES|WAXES|PASSE|MASSE/);await page.getByRole('button',{name:'Close dialog'}).click();
  await page.reload();assert.equal(await count(),remaining);assert.match(await page.locator('#turn-label').textContent(),/CLOSED/);assert.match(await page.locator('#adaptive-info').textContent(),/Answers come only from the 2,103 curated words/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(process.env.SCREENSHOT_DIR)await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/scowl-${width}-${assisted?'easy':'normal'}-${ending.toLowerCase()}.png`,fullPage:true});await context.close();console.log('PASS',width,assisted?'Easy+Suboptimal':'Normal',ending,'SCOWL counts/reload/clues/rejected former endings/loss/share');
 }
 for(const width of [1280,390]){const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();await page.goto(process.env.BASE_URL??'http://127.0.0.1:5298');await page.getByRole('button',{name:'Absurd',exact:true}).click();for(const word of ['RAISE','MUHLY','CATCH','BOUGH','DOUGH']){await page.keyboard.type(word.toLowerCase());await page.keyboard.press('Enter')}assert.match(await page.locator('#turn-label').textContent(),/FOUND · 5\/6/);await page.reload();assert.match(await page.locator('#turn-label').textContent(),/FOUND · 5\/6/);await context.close();console.log('PASS',width,'full-pool deterministic win and reload')}
 assert.deepEqual(errors,[]);console.log('PASS independent SCOWL Absurd exact-sequence and win regressions');
}finally{await browser.close()}
