import './style.css';
import {ANSWERS,ALLOWED} from './words.ts';
import {dateKey,dayIndex,score,status,submit,keyboardClues,choosePractice,shareText,type Run,type Clue} from './domain.ts';
import {decode,emptySave,SAVE_KEY,recordDaily,statistics,synchronize} from './persistence.ts';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<header class="masthead"><a class="wordmark" href="/" aria-label="Morrowmark home"><span class="mark">m.</span>morrowmark<span class="wordmark-dot">✦</span></a><span class="masthead-note">A SMALL DAILY DISCOVERY</span><nav aria-label="Tools"><button id="help" class="icon-button" aria-label="How to play">?</button><button id="stats" class="icon-button" aria-label="Daily statistics">▥</button><button id="settings" class="icon-button" aria-label="Settings">⚙</button></nav></header>
<main><section class="intro"><div class="edition"><span class="live-dot"></span><span id="edition"></span><span class="edition-line"></span><span>EST. 2026</span></div><h1>Every word leaves<br>a <em>little mark.</em></h1><p>Five letters. Six fieldnotes. One word waiting to be found.</p></section>
<div class="workspace"><aside class="margin-note"><span class="small-label">THE FIELD GUIDE</span><h2>Follow the<br>small clues.</h2><p>Let each guess narrow the possibilities. A good word is a good place to start.</p><div class="legend"><span class="legend-icon exact">✓</span><div><strong>In place</strong><small>The right letter, right spot.</small></div><span class="legend-icon elsewhere">↔</span><div><strong>Elsewhere</strong><small>Right letter. Another spot.</small></div><span class="legend-icon absent">×</span><div><strong>Not here</strong><small>No copy left to find.</small></div></div><button class="text-button" id="guide">Open the field guide ↗</button><div class="pencil-art" aria-hidden="true"><span></span><i></i></div><p class="quiet-note">A fresh dispatch at midnight UTC.<br>Stay curious. Come back tomorrow.</p></aside>
<section class="puzzle" aria-label="Word puzzle"><div class="mode-bar"><div class="tabs" role="group" aria-label="Puzzle mode"><button id="daily">Daily dispatch</button><button id="practice">Practice</button></div><span id="mode-label"></span></div><div class="puzzle-meta"><span id="puzzle-label"></span><span id="turn-label"></span></div><div id="board" class="board" role="group" aria-label="Six fieldnotes, five letters each"></div><p id="message" class="message" role="status" aria-live="polite" aria-atomic="true"></p><div id="result-actions" class="result-actions"></div><div id="keyboard" class="keyboard" role="group" aria-label="Letter keyboard"></div><p class="keyboard-tip">TYPE OR TAP LETTERS <span>·</span> ENTER TO NOTE <span>·</span> ⌫ TO ERASE</p></section>
<aside class="dispatch-note"><div class="stamp" aria-hidden="true"><span>MORROWMARK</span><strong>05</strong><small>LETTERS / DAILY</small></div><span class="small-label">A MOMENT TO YOURSELF</span><p class="quote">“Make a guess.<br>Notice a clue.<br>Find your way.”</p><div class="rule"></div><p>No rush. No leaderboard.<br>Just you and a little possibility.</p><div class="daily-summary" id="summary"></div></aside></div>
</main><footer><span>MADE FOR CURIOUS MINDS</span><span><b>m.</b> One small discovery at a time.</span><button id="about" class="text-button">About the words ↗</button></footer>
<dialog id="modal"><div class="dialog-top"><span class="small-label">MORROWMARK / FIELD GUIDE</span><button id="close" class="icon-button" aria-label="Close dialog">×</button></div><div id="modal-content"></div></dialog>`;

const el=(id:string)=>document.getElementById(id)!;
const dialog=el('modal') as HTMLDialogElement;
let storageAvailable=true;
function read(){try{return localStorage.getItem(SAVE_KEY)}catch{storageAvailable=false;return null}}
let save=decode(read(),dateKey(new Date()));
let message='Your next discovery starts with a guess.';
let lastAccepted=false;
let resetPending=false;
let typingOnButton=false;
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch{storageAvailable=false;}}
function sync(){
 const today=dateKey(new Date());
 if(storageAvailable){const result=synchronize(save,today,()=>localStorage.getItem(SAVE_KEY));save=result.save;storageAvailable=result.available;}
 else if(save.date!==today)save=decode(JSON.stringify(save),today);
 return today;
}
function current():Run{return save[save.mode]}
const symbol:Record<Clue,string>={exact:'✓',elsewhere:'↔',absent:'×'};
const clueName:Record<Clue,string>={exact:'in place',elsewhere:'elsewhere',absent:'no unmatched copy'};
function render(){
 const run=current(),outcome=status(run),daily=save.mode==='daily';
 document.body.classList.toggle('contrast',save.settings.contrast);
 el('edition').textContent=`DISPATCH No. ${String(dayIndex(save.date)+1).padStart(3,'0')} / ${save.date} UTC`;
 for(const mode of ['daily','practice']){el(mode).setAttribute('aria-pressed',String(save.mode===mode));}
 el('mode-label').textContent=daily?'ONE PER DAY':'ROOM TO EXPLORE';
 el('puzzle-label').textContent=daily?'TODAY’S FIELDNOTES':'YOUR PRACTICE FIELDNOTES';
 el('turn-label').textContent=outcome==='playing'?`${run.guesses.length}/6 NOTED`:`${outcome==='won'?'FOUND':'REVEALED'} · ${run.guesses.length}/6`;
 const board=el('board');board.replaceChildren();
 for(let row=0;row<6;row++){
  const guess=run.guesses[row];const draft=row===run.guesses.length&&outcome==='playing';
  const letters=guess??(draft?run.draft:'');const clues=guess?score(run.answer,guess):null;
  const line=document.createElement('div');line.className=`board-row${draft?' active':''}${lastAccepted&&row===run.guesses.length-1?' just-noted':''}`;
  line.setAttribute('role','group');line.setAttribute('aria-label',`Fieldnote ${row+1}${draft?', current':''}`);
  for(let i=0;i<5;i++){
   const tile=document.createElement('span');tile.className=`tile ${clues?.[i]??''}${!clues&&letters[i]?' filled':''}`;
   tile.setAttribute('aria-label',`Position ${i+1}: ${letters[i]??'blank'}${clues?`, ${clueName[clues[i]]}`:''}`);
   const letter=document.createElement('b');letter.textContent=letters[i]??'';tile.append(letter);
   if(clues){const icon=document.createElement('small');icon.textContent=symbol[clues[i]];icon.setAttribute('aria-hidden','true');tile.append(icon);}
   line.append(tile);
  }board.append(line);
 }
 let text=message;
 if(outcome==='won')text=`A little discovery: ${run.answer}. Found in ${run.guesses.length} ${run.guesses.length===1?'fieldnote':'fieldnotes'}.`;
 if(outcome==='lost')text=`The word was ${run.answer}. Every fieldnote taught you something.`;
 if(!storageAvailable)text+=' Saving is unavailable in this browser; keep this tab open.';
 el('message').textContent=text;el('message').classList.toggle('finished',outcome!=='playing');
 const actions=el('result-actions');actions.replaceChildren();
 if(!daily){const next=document.createElement('button');next.textContent='Fresh practice ↗';next.className='text-button';next.onclick=()=>{if(status(current())==='playing'&&(current().guesses.length||current().draft))openPracticeConfirm();else nextPractice();};actions.append(next);}
 if(daily&&outcome!=='playing'){
  const share=document.createElement('button');share.textContent='Copy spoiler-free result ↗';share.className='text-button';share.onclick=()=>void copyResult();actions.append(share);
 }
 const keys=keyboardClues(run);const keyboard=el('keyboard');
 if(!keyboard.childElementCount){
  for(const row of ['QWERTYUIOP','ASDFGHJKL','↵ZXCVBNM⌫']){
   const line=document.createElement('div');line.className='key-row';
   for(const key of row){
    const button=document.createElement('button');button.dataset.key=key;button.onclick=()=>input(key);line.append(button);
   }keyboard.append(line);
  }
 }
 for(const button of keyboard.querySelectorAll<HTMLButtonElement>('button')){
  const key=button.dataset.key!;const clue=keys[key];
  button.className=`key ${clue??''}${key==='↵'||key==='⌫'?' wide':''}`;
  button.textContent=key==='↵'?'NOTE':key;
  button.setAttribute('aria-label',key==='↵'?'Submit guess':key==='⌫'?'Erase letter':`${key}${clue?`, ${clueName[clue]}`:''}`);
  if(clue){const small=document.createElement('small');small.textContent=symbol[clue];button.append(small);}
  button.disabled=outcome!=='playing';
 }
 const stats=statistics(save.results,save.date);
 el('summary').innerHTML=`<span class="small-label">YOUR DAILY MARKS</span><div><strong>${stats.wins}</strong><span>words found</span></div><div><strong>${stats.current}</strong><span>day streak</span></div><button class="text-button" id="summary-stats">View your notebook ↗</button>`;
 el('summary-stats').onclick=openStats;
 lastAccepted=false;
}
function input(key:string){
 if(dialog.open)return;
 const oldDate=save.date;sync();
 if(oldDate!==save.date&&save.mode==='daily'){message='A fresh UTC dispatch has arrived. Start a new fieldnote.';render();return;}
 const run=current();if(status(run)!=='playing')return;
 if(key==='↵'){
  const result=submit(run,run.draft);save[save.mode]=result.run;
  if(result.error)message=result.error;
  else{lastAccepted=true;message=`Fieldnote ${result.run.guesses.length} noted. Follow the clues.`;if(save.mode==='daily')recordDaily(save,save.date,result.run);}
 }else if(key==='⌫'){run.draft=run.draft.slice(0,-1);message='Take your time. Follow the clues.';}
 else if(/^[A-Z]$/.test(key)&&run.draft.length<5){run.draft+=key;message='Ready when you are.';}
 persist();render();
}
function setMode(mode:'daily'|'practice'){sync();save.mode=mode;message=mode==='daily'?'Your daily dispatch is waiting.':'Practice freely. Your daily marks stay separate.';persist();render();}
function nextPractice(){sync();save.practice=choosePractice(save.practice.answer);save.mode='practice';message='A fresh page. A new possibility.';persist();dialog.close();render();}
function modal(html:string){el('modal-content').innerHTML=html;const heading=el('modal-content').querySelector('h2');if(heading){heading.id='dialog-title';dialog.setAttribute('aria-labelledby','dialog-title');}if(!dialog.open)dialog.showModal();}
function openPracticeConfirm(){modal('<h2>Turn a fresh page?</h2><p>This replaces your unfinished practice fieldnotes. Your daily dispatch is safe.</p><div class="dialog-actions"><button id="keep-practice">Keep exploring</button><button id="next-practice" class="primary">Fresh practice</button></div>');el('keep-practice').onclick=()=>dialog.close();el('next-practice').onclick=nextPractice;}
function openHelp(){modal(`<h2>A little field guide.</h2><p>Find a five-letter word in six guesses. Type letters or use the keyboard below the board; press Enter or NOTE to submit.</p><div class="help-clues"><p><b>✓ In place</b> — right letter, right spot.</p><p><b>↔ Elsewhere</b> — right letter, another spot.</p><p><b>× Not here</b> — no unmatched copy left.</p></div><h3>One letter, one clue.</h3><p>Repeated letters count only as often as they appear. Exact matches are reserved first.</p><p>If the answer is <b>APPLE</b>, guessing <b>ALLEY</b> gives:</p><div class="example">${score('APPLE','ALLEY').map((c,i)=>`<span class="tile ${c}"><b>${'ALLEY'[i]}</b><small>${symbol[c]}</small></span>`).join('')}</div><p>Only one L exists: the first L is elsewhere, the second L has no remaining copy. E is elsewhere; Y is absent.</p><h3>Two ways to explore.</h3><p><b>Daily dispatch:</b> one shared puzzle per UTC date. It changes at midnight UTC, even if your local date is different. Unfinished daily fieldnotes expire without a recorded loss.</p><p><b>Practice:</b> replay as often as you like. It resumes after reload and never changes daily statistics.</p><p>Words must be in our curated guide; unknown and repeated guesses use no turn. Winning or the sixth accepted guess completes the puzzle.</p><button id="start" class="primary">Let’s make a mark</button>`);el('start').onclick=()=>dialog.close();}
function openStats(){sync();const s=statistics(save.results,save.date);modal(`<h2>Your daily notebook.</h2><p>Small discoveries, counted once.</p><div class="stats-grid"><div><b>${s.played}</b><span>Played</span></div><div><b>${s.percent}%</b><span>Win rate</span></div><div><b>${s.current}</b><span>Current streak</span></div><div><b>${s.best}</b><span>Best streak</span></div></div><h3>Fieldnotes to find the word</h3><div class="histogram">${s.histogram.map((count,i)=>`<div><span>${i+1}</span><div style="width:${Math.max(8,count/Math.max(1,...s.histogram)*100)}%"><b>${count}</b></div></div>`).join('')}</div><p class="fine-print">${s.wins} wins in ${s.played} completed daily dispatches. Streaks count consecutive UTC dates won. A loss or missed date breaks the streak. Yesterday’s winning streak remains current until today ends or is lost. Practice does not count.</p><p class="fine-print">Saved only in this browser. Clearing browser data or erasing the notebook removes these marks.</p>`);}
function openSettings(){modal(`<h2>Make yourself at home.</h2><label class="setting"><span><b>High contrast clues</b><small>Deeper tones; symbols always stay visible.</small></span><input id="contrast" type="checkbox" ${save.settings.contrast?'checked':''}></label><h3>Your notebook stays here.</h3><p>We save your daily and practice fieldnotes on this browser. There’s no account, tracking, or external posting.</p><button id="reset" class="danger">Erase saved notebook…</button>`);el('contrast').onchange=()=>{sync();save.settings.contrast=(el('contrast') as HTMLInputElement).checked;persist();render();};el('reset').onclick=()=>{resetPending=true;modal('<h2>Erase your notebook?</h2><p>This clears all Morrowmark guesses, daily statistics and settings in this browser. It cannot be undone.</p><div class="dialog-actions"><button id="cancel-reset">Keep my notebook</button><button id="confirm-reset" class="danger">Erase everything</button></div>');el('cancel-reset').onclick=()=>{resetPending=false;openSettings();};el('confirm-reset').onclick=()=>{if(!resetPending)return;resetPending=false;try{localStorage.removeItem(SAVE_KEY)}catch{storageAvailable=false;}save=emptySave(dateKey(new Date()));message='A clean notebook. Make your first mark.';persist();dialog.close();render();};};}
function openAbout(){modal(`<h2>A modest field guide.</h2><p>Morrowmark uses an original hand-curated collection of <b>${ALLOWED.size} accepted five-letter guesses</b>, including <b>${ANSWERS.length} answer words</b>. Compiled for this project and dedicated to the public domain under CC0 1.0.</p><p>This is a deliberately small English vocabulary, not a full dictionary. Some valid English words, regional spellings and inflections are missing. Answers favor familiar words; several inflected forms remain. The daily cycle repeats after ${ANSWERS.length} days.</p><p>No commercial game word lists, branding, art or assets were used. Word rules are inspired by the familiar five-letter deduction format; the presentation and writing are original.</p><p class="fine-print">Version 1 · Daily identity is based on UTC date and the frozen answer list. Your device clock determines the date; offline clock changes can change which dispatch appears.</p>`);}
async function copyResult(){
 const text=shareText(save.date,save.daily);
 modal('<h2>Your dispatch, without spoilers.</h2><p id="copy-status" role="status">Copying locally… You can also select and copy this text.</p><textarea id="share-text" readonly rows="11" aria-label="Spoiler-free result"></textarea>');
 (el('share-text') as HTMLTextAreaElement).value=text;
 try{
  await Promise.race([navigator.clipboard.writeText(text),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Clipboard timeout')),1500))]);
  if(dialog.open&&document.getElementById('copy-status'))el('copy-status').textContent='Copied locally. The word stays between us.';
 }catch{
  if(dialog.open&&document.getElementById('copy-status'))el('copy-status').textContent='Clipboard access was unavailable. Select and copy the text below.';
 }
}
el('close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{resetPending=false;});
el('help').onclick=openHelp;el('guide').onclick=openHelp;el('stats').onclick=openStats;el('settings').onclick=openSettings;el('about').onclick=openAbout;
el('daily').onclick=()=>setMode('daily');el('practice').onclick=()=>setMode('practice');
window.addEventListener('pointerdown',()=>{typingOnButton=false;});
window.addEventListener('keydown',event=>{
 if(event.key==='Tab')typingOnButton=false;
 if(event.ctrlKey||event.metaKey||event.altKey||dialog.open||event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;
 const key=event.key==='Enter'?'↵':event.key==='Backspace'?'⌫':event.key.toUpperCase();
 // Native buttons own Enter/Space activation; letter input still works while a key has focus.
 if(event.key==='Enter'&&event.target instanceof HTMLButtonElement&&!typingOnButton)return;
 if(key==='↵'||key==='⌫'||/^[A-Z]$/.test(key)){event.preventDefault();typingOnButton=true;input(key);}
});
function refresh(){const before=save.date;sync();if(before!==save.date)message='A fresh UTC dispatch has arrived.';render();}
window.addEventListener('focus',refresh);window.addEventListener('storage',event=>{if(event.key===SAVE_KEY)refresh();});
setInterval(()=>{if(dateKey(new Date())!==save.date)refresh();},15_000);
persist();render();
