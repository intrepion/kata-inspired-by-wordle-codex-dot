/** Local UI regression. Uses disposable browser contexts and the existing Playwright install.
 * Override PLAYWRIGHT_MODULE / PLAYWRIGHT_CHANNEL / CONTRAST_QA_PORT if needed. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const port=Number(process.env.CONTRAST_QA_PORT??4188),base=`http://127.0.0.1:${port}`;
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE??resolve(root,'../kata-inspired-by-pikmin-codex-dot/node_modules/playwright/index.mjs')));
const output=resolve(root,'.local/clue-contrast');mkdirSync(output,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
let serverOutput='',browser;const reports=[];
server.stdout.on('data',chunk=>serverOutput+=chunk);server.stderr.on('data',chunk=>serverOutput+=chunk);
const luminance=color=>{const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
try{
 for(let attempt=0;;attempt++){if(server.exitCode!==null)throw Error(serverOutput);try{if((await fetch(base)).ok)break}catch{}if(attempt>100)throw Error('Local server did not start: '+serverOutput);await new Promise(r=>setTimeout(r,200))}
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
 for(const width of [320,390,1440]){
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width,height:width===1440?1100:844}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base);await page.locator('#schedule-select').selectOption('practice');
  const start=async()=>{if(await page.locator('#start-puzzle').isVisible()){await page.locator('#start-difficulty').selectOption('normal');await page.locator('#start-puzzle').click()}};
  await start();
  await page.evaluate(async()=>{const {newRun}=await import('/src/domain.ts'),{activeSaveKeyForPath}=await import('/src/site.ts');const key=activeSaveKeyForPath('/',5,'en-US'),save=JSON.parse(localStorage.getItem(key));save.practice=newRun('APPLE','normal','en-US');save.mode='practice';localStorage.setItem(key,JSON.stringify(save))});
  await page.reload();await start();
  for(const letter of 'ALLEY')await page.locator(`#keyboard [data-key="${letter}"]`).click();
  await page.locator('#keyboard [data-key="↵"]').click();
  await page.locator('#keyboard .key.absent').waitFor();
  assert.equal(await page.locator('#keyboard [data-key="Y"]').getAttribute('aria-label'),'Y, not in the answer');
  assert.equal(await page.locator('#keyboard [data-key="Q"]').getAttribute('aria-label'),'Q, not tried');
  assert.equal(await page.locator('#keyboard [data-key="L"]').getAttribute('aria-label'),'L, elsewhere','duplicate absent tile must not eliminate its letter');
  assert.equal(await page.locator('#board .absent').count(),2);
  assert.equal(await page.locator('#keyboard-state-help').isVisible(),true);
  for(const theme of ['light','dark'])for(const highContrast of [false,true]){
   await page.locator('#theme-select').selectOption(theme);
   await page.locator('#settings').click();await page.locator('#contrast').setChecked(highContrast);await page.keyboard.press('Escape');
   const styles=await page.evaluate(()=>Object.fromEntries(['exact','elsewhere','absent','unused'].map(state=>{const node=document.querySelector(state==='unused'?'#keyboard [data-key="Q"]':`#keyboard .key.${state}`),s=getComputedStyle(node),letter=node.querySelector('.key-letter'),mark=node.querySelector('small');return[state,{bg:s.backgroundColor,ink:s.color,opacity:s.opacity,decoration:getComputedStyle(letter).textDecorationLine,mark:mark?.textContent,markSize:mark?getComputedStyle(mark).fontSize:null,ariaHidden:mark?.getAttribute('aria-hidden')}]})));
   const textRatios=Object.fromEntries(Object.entries(styles).map(([state,s])=>[state,ratio(s.ink,s.bg)]));
   for(const [state,value]of Object.entries(textRatios))assert.ok(value>=4.5,`${width} ${theme} high=${highContrast} ${state}: ${value}, ${JSON.stringify(styles[state])}`);
   const separation=ratio(styles.absent.bg,styles.unused.bg);assert.ok(separation>=7,`Absent/unused contrast ${separation}`);
   assert.equal(styles.absent.decoration,'line-through');assert.equal(styles.elsewhere.decoration,'none');
   for(const [state,mark]of [['exact','✓'],['elsewhere','↔'],['absent','×']]){assert.equal(styles[state].mark,mark);assert.equal(styles[state].ariaHidden,'true');assert.ok(parseInt(styles[state].markSize)>=11)}
   const tileRatios=await page.locator('#board .fieldnote .tile').evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node);return[s.color,s.backgroundColor]}));
   for(const [ink,bg]of tileRatios)assert.ok(ratio(ink,bg)>=4.5,'tile text contrast');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
   await page.locator('#keyboard [data-key="Y"]').hover();assert.equal(await page.locator('#keyboard [data-key="Y"] small').textContent(),'×');await page.mouse.move(0,0);
   await page.locator('#keyboard [data-key="Q"]').focus();assert.notEqual(await page.locator('#keyboard [data-key="Q"]').evaluate(node=>getComputedStyle(node).outlineStyle),'none');
   await page.locator('#keyboard').screenshot({path:resolve(output,`keyboard-${width}-${theme}${highContrast?'-high':''}.png`)});
   if(!highContrast&&width!==320){await page.locator('#board').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,`game-${width}-${theme}.png`),fullPage:true})}
   reports.push({width,theme,highContrast,textRatios,absentUnusedRatio:separation});
  }
  if(width===1440){
   await page.setViewportSize({width,height:700});
   const key=page.locator('#keyboard [data-key="Y"]'),letter=await key.locator('.key-letter').boundingBox(),mark=await key.locator('small').boundingBox();
   assert.ok(letter.y+letter.height<=mark.y,'compact desktop clue symbol does not overlap the letter');
   await key.locator('..').screenshot({path:resolve(output,'compact-desktop-keyboard-row.png')});
   await page.setViewportSize({width,height:1100});
  }
  // Reload/theme/contrast toggles preserve both feedback and the submitted guess.
  await page.reload();await page.locator('#keyboard .key.absent').waitFor();assert.equal(await page.locator('#keyboard [data-key="L"]').getAttribute('aria-label'),'L, elsewhere');
  // Absent keys remain available in Normal mode, rather than silently changing game rules.
  await page.locator('#keyboard [data-key="Y"]').click();assert.equal(await page.locator('#board .active b').first().textContent(),'Y');await page.locator('#keyboard [data-key="⌫"]').click();
  for(const letter of 'APPLE')await page.locator(`#keyboard [data-key="${letter}"]`).click();await page.locator('#keyboard [data-key="↵"]').click();
  assert.equal(await page.locator('#keyboard [data-key="Y"]').isDisabled(),true);assert.equal(await page.locator('#keyboard [data-key="Y"]').evaluate(node=>getComputedStyle(node).opacity),'1','finished feedback must not fade');
  // Densest keyboard and long board still fit on narrow phones.
  await page.locator('#language').selectOption('uk');await start();await page.locator('#word-length').selectOption('11');await start();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Ukrainian 11-letter layout fits');
  for(const letter of 'ҐЇЙ')await page.locator(`#keyboard [data-key="${letter}"]`).click();
  assert.equal((await page.locator('#board .active b').allTextContents()).join(''),'ҐЇЙ');
  await page.locator('#keyboard').screenshot({path:resolve(output,`ukrainian-keyboard-${width}.png`)});
  // Every variant has the same non-color keyboard signals after an accepted guess.
  await page.locator('#language').selectOption('en');await page.locator('#word-length').selectOption('5');
  for(const rules of ['absurd','one','smashare','letroso']){
   await page.locator('#mode-select').selectOption(rules);await start();
   const active=rules==='smashare'?'#smash-panel':rules==='letroso'?'#letroso-panel':'section.puzzle';
   const keyAttr=rules==='smashare'?'data-smash-key':rules==='letroso'?'data-letroso-key':'data-key';
   const guess=rules==='smashare'?'APPLEMON':'ALLEY';
   for(const letter of guess)await page.locator(`${active} .keyboard [${keyAttr}="${letter}"]`).click();await page.locator(`${active} .keyboard [${keyAttr}="↵"]`).click();
   const marked=page.locator(`${active} .keyboard .key small`);assert.ok(await marked.count()>0,`${rules} keyboard has marks`);
   assert.equal(await page.locator(`${active} .keyboard-state-help:visible`).count(),1,`${rules} has one legend`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${rules} fits`);
  }
  await page.locator('#mode-select').selectOption('conquest');assert.equal(await page.locator('#keyboard-state-help').isVisible(),true,'standard legend returns after variants');
  assert.deepEqual(errors,[]);await context.close();console.log(`Passed ${width}px gameplay and four palette combinations`);
 }
 writeFileSync(resolve(output,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
}finally{await browser?.close();server.kill()}
