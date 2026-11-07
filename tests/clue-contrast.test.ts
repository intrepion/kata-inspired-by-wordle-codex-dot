import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {keyboardClues,newRun,submit} from '../src/domain.ts';
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
function tokens(selector:string):Record<string,string>{
 const start=css.indexOf(selector+'{');assert.ok(start>=0,`Palette ${selector} exists`);
 return Object.fromEntries([...css.slice(start,css.indexOf('}',start)).matchAll(/--([\w-]+):([^;\s}]+)/g)].map(match=>[match[1],match[2]]));
}
function luminance(hex:string){
 const raw=hex.slice(1),full=raw.length===3?[...raw].map(c=>c+c).join(''):raw;
 const values=full.match(/../g)!.map(c=>parseInt(c,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
 return values[0]*.2126+values[1]*.7152+values[2]*.0722;
}
function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const theme of ['light','dark'])for(const high of [false,true])test(`${theme}${high?' high contrast':''} keyboard and clues meet contrast targets`,()=>{
 const colors={...tokens(':root'),...(theme==='dark'?tokens(':root[data-theme=dark]'):{}),...(high?tokens('.contrast'):{}),...(high&&theme==='dark'?tokens(':root[data-theme=dark] .contrast'):{})};
 for(const state of ['exact','elsewhere','absent','key'])assert.ok(contrast(colors[state],colors[state+'-ink'])>=4.5,`${state} text meets WCAG AA`);
 assert.ok(contrast(colors.key,colors.absent)>=7,'unused and absent key faces are clearly distinct');
});
test('an extra absent copy does not strike out a letter known to be present',()=>{
 const run=submit(newRun('APPLE','normal','en-US'),'ALLEY').run,keys=keyboardClues(run);
 assert.equal(keys.A,'exact');assert.equal(keys.L,'elsewhere');assert.equal(keys.E,'elsewhere');assert.equal(keys.Y,'absent');assert.equal(keys.Q,undefined);
});
