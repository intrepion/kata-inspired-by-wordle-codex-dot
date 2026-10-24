import {DefinitionClient,DEFINITION_SOURCE} from './definitions.ts';
import {InlineDefinitions} from './inline-definitions.ts';
import './style.css';
import {ANSWERS,ALLOWED} from './words.ts';
import {dateKey,dayIndex,score,status,submit,setDifficulty,difficulty,keyboardClues,choosePractice,shareText,type Run,type Clue,type Difficulty} from './domain.ts';
import {AdviceSession,type AdviceState} from './advice-session.ts';
import type {AdviceKind} from './advice-protocol.ts';
import {observedClues} from './observations.ts';
import {newImpossible,setImpossibleDifficulty,isImpossible,impossibleStatus,submitImpossible,impossibleShare} from './impossible.ts';
import {encode,decode,emptySave,SAVE_KEY,recordDaily,statistics,synchronize} from './persistence.ts';

const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<header class="masthead"><a class="wordmark" href="/" aria-label="Morrowmark home"><span class="mark">m.</span>morrowmark<span class="wordmark-dot">✦</span></a><span class="masthead-note">A SMALL DAILY DISCOVERY</span><nav aria-label="Tools"><button id="help" class="icon-button" aria-label="How to play">?</button><button id="stats" class="icon-button" aria-label="Daily statistics">▥</button><button id="settings" class="icon-button" aria-label="Settings">⚙</button></nav></header>
<main><section class="intro"><div class="edition"><span class="live-dot"></span><span id="edition"></span><span class="edition-line"></span><span>EST. 2026</span></div><h1>Every word leaves<br>a <em>little mark.</em></h1><p id="intro-description">Five letters. Six fieldnotes. One word waiting to be found.</p></section>
<div class="workspace"><aside class="margin-note"><span class="small-label">THE FIELD GUIDE</span><h2>Follow the<br>small clues.</h2><p>Let each guess narrow the possibilities. A good word is a good place to start.</p><div class="legend"><span class="legend-icon exact">✓</span><div><strong>In place</strong><small>The right letter, right spot.</small></div><span class="legend-icon elsewhere">↔</span><div><strong>Elsewhere</strong><small>Right letter. Another spot.</small></div><span class="legend-icon absent">×</span><div><strong>Not here</strong><small>No copy left to find.</small></div></div><button class="text-button" id="guide">Open the field guide ↗</button><div class="pencil-art" aria-hidden="true"><span></span><i></i></div><p class="quiet-note">A fresh dispatch at midnight UTC.<br>Stay curious. Come back tomorrow.</p></aside>
<section class="puzzle" aria-label="Word puzzle"><div class="mode-bar"><div class="tabs" role="group" aria-label="Puzzle mode"><button id="daily">Daily dispatch</button><button id="practice">Practice</button><button id="impossible">Absurd</button></div><span id="mode-label"></span></div><div id="adaptive-info" class="adaptive-info" hidden><p>No answer is fixed in advance. Each guess keeps the largest group consistent with every clue. Choose Easy, Normal, Hard or Strict in Settings; restrictions use the revealed clues. Answers come only from the ${ANSWERS.length.toLocaleString('en-US')} curated words. The count shows exactly how many of those still match every clue. Other accepted words remain valid exploratory guesses, subject to difficulty. Daily marks stay separate.</p><p id="candidate-count" role="status" aria-live="polite"></p></div><div class="puzzle-meta"><span id="puzzle-label"></span><span id="turn-label"></span></div><p class="definition-disclosure">Visible guesses, suggestions and revealed answers automatically request English meanings from Wiktionary, one word per request. Each displayed word is sent separately; the provider can see these words and your IP address. No puzzle identifier, draft, hidden answer or saved statistics is sent. Selected, shortened senses · <a href="https://en.wiktionary.org/wiki/Wiktionary:Copyrights" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Wiktionary contributors / CC BY-SA 4.0</a>. Coverage may be incomplete.</p><p id="opening-help" class="opening-help" hidden>Easy starts with five Optimal opening guesses below the keyboard. You can wait for them before guessing.</p><div id="board" class="board" role="group" aria-label="Six fieldnotes, five letters each"></div><p id="message" class="message" role="status" aria-live="polite" aria-atomic="true"></p><div id="result-actions" class="result-actions"></div><div id="keyboard" class="keyboard" role="group" aria-label="Letter keyboard"></div><p class="keyboard-tip">TYPE OR TAP LETTERS <span>·</span> ENTER TO NOTE <span>·</span> ⌫ TO ERASE</p>${adviceMarkup('optimal')}${adviceMarkup('suboptimal')}</section>
<aside class="dispatch-note"><div class="stamp" aria-hidden="true"><span>MORROWMARK</span><strong>05</strong><small>LETTERS / DAILY</small></div><span class="small-label">A MOMENT TO YOURSELF</span><p class="quote">“Make a guess.<br>Notice a clue.<br>Find your way.”</p><div class="rule"></div><p>No rush. No leaderboard.<br>Just you and a little possibility.</p><div class="daily-summary" id="summary"></div></aside></div>
</main><footer><span>MADE FOR CURIOUS MINDS</span><span><b>m.</b> One small discovery at a time.</span><button id="about" class="text-button">About the words ↗</button></footer>
<dialog id="modal"><div class="dialog-top"><span class="small-label">MORROWMARK / FIELD GUIDE</span><button id="close" class="icon-button" aria-label="Close dialog">×</button></div><div id="modal-content"></div></dialog>`;

const el=(id:string)=>document.getElementById(id)!;
const dialog=el('modal') as HTMLDialogElement;
type DefinitionFocus={word:string;index:number;control:'summary'|'a'};
function captureDefinitionFocus():DefinitionFocus|null {
 const focused=document.activeElement;if(!(focused instanceof HTMLElement))return null;
 const slot=focused.closest<HTMLElement>('[data-inline-definition]'),control=focused.closest('summary')?'summary':focused.closest('a')?'a':null;
 if(!slot||!control)return null;const word=slot.dataset.inlineDefinition!;
 return {word,index:[...document.querySelectorAll(`[data-inline-definition="${word}"]`)].indexOf(slot),control};
}
function restoreDefinitionFocus(focus:DefinitionFocus|null){
 if(!focus||dialog.open)return;
 const slots=document.querySelectorAll(`[data-inline-definition="${focus.word}"]`),slot=slots[focus.index]??slots[0];
 const control=slot?.querySelector<HTMLElement>(focus.control);(control??el(save.mode)).focus({preventScroll:true});
}
const expandedDefinitions=new Set<string>();
const definitions=new InlineDefinitions(new DefinitionClient(),word=>{
 for(const node of document.querySelectorAll<HTMLElement>('[data-inline-definition]'))if(node.dataset.inlineDefinition===word)renderInlineDefinition(node,word);
});
function inlineDefinition(word:string){const node=document.createElement('div');node.className='inline-definition';node.dataset.inlineDefinition=word;node.setAttribute('aria-label',`Definition of ${word}`);renderInlineDefinition(node,word);return node;}
function renderInlineDefinition(node:HTMLElement,word:string){
 const focus=node.contains(document.activeElement)?captureDefinitionFocus():null;
 const state=definitions.state(word);node.replaceChildren();
 const text=document.createElement('p');text.className='definition-meaning';
 if(state.phase==='loading')text.textContent='Loading meaning…';
 else if(state.phase==='missing')text.textContent='No English definition returned. Still a valid game word.';
 else if(state.phase==='error')text.textContent=state.reason==='timeout'?'Dictionary timed out. Meaning unavailable; reload to retry.':'Dictionary unavailable or offline. Meaning unavailable; reload to retry.';
 else {
  const first=state.result.entries[0],meaning=first.senses[0];
  const part=document.createElement('em');part.textContent=first.partOfSpeech+' · ';text.append(part,document.createTextNode(meaning.length>260?meaning.slice(0,257)+'…':meaning));
 }
 node.append(text);
 if(state.phase==='ready'){
  const first=state.result.entries[0];
  if(first.senses[0].length>260||first.senses.length>1||state.result.entries.length>1){
   const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`More senses for ${word}`;details.append(summary);details.open=expandedDefinitions.has(word);
   for(const entry of state.result.entries){const heading=document.createElement('strong');heading.textContent=entry.partOfSpeech;const senses=document.createElement('ol');for(const sense of entry.senses){const li=document.createElement('li');li.textContent=sense;senses.append(li)}details.append(heading,senses)}
   details.ontoggle=()=>{if(details.isConnected){if(details.open)expandedDefinitions.add(word);else expandedDefinitions.delete(word)}};node.append(details);
  }
 }
 const source=document.createElement('a');source.href=`https://en.wiktionary.org/wiki/${word.toLowerCase()}#English`;source.textContent=DEFINITION_SOURCE;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';source.className='definition-source';source.setAttribute('aria-label',`Wiktionary source for ${word} (opens in a new tab)`);node.append(source);restoreDefinitionFocus(focus);
}
function updateDefinitions(){definitions.show([...document.querySelectorAll<HTMLElement>('[data-inline-definition]')].map(node=>node.dataset.inlineDefinition!));}
let storageAvailable=true;
function read(){try{return localStorage.getItem(SAVE_KEY)}catch{storageAvailable=false;return null}}
let save=decode(read(),dateKey(new Date()));
let message='Your next discovery starts with a guess.';
let lastAccepted=false;
let resetPending=false;
let typingOnButton=false;
function persist(){try{localStorage.setItem(SAVE_KEY,encode(save))}catch{storageAvailable=false;}}
function sync(){
 const today=dateKey(new Date());
 if(storageAvailable){const result=synchronize(save,today,()=>localStorage.getItem(SAVE_KEY));save=result.save;storageAvailable=result.available;}
 else if(save.date!==today)save=decode(encode(save),today);
 return today;
}
function current():Run{return save[save.mode]}
function runOutcome(run:Run){return isImpossible(run)?impossibleStatus(run):status(run)}
function adviceMarkup(kind:AdviceKind){return `<section id="${kind}-advice" class="evil-advice" hidden aria-labelledby="${kind}-title"><h3 id="${kind}-title">${kind==='optimal'?'Optimal guesses':'Suboptimal'}</h3><p id="${kind}-explanation">${kind==='optimal'?'One-step best worst-case ranking from revealed clues only. Exploratory words may ignore prior clues. This is not a guarantee of the best overall winning strategy. Ties use fewer expected survivors (uniform candidates), then candidate answers, then alphabetical order.':'These unplayed guesses fit every clue but leave the most possible answers in the worst case. Advice only; all accepted words remain playable. Ties alphabetical.'}</p><p id="${kind}-status" role="status" aria-live="polite"></p><ol id="${kind}-list"></ol></section>`}
const workerFactory=()=>new Worker(new URL('./evil-advice.worker.ts',import.meta.url),{type:'module'});
const suboptimalSession=new AdviceSession(workerFactory,state=>renderAdvice('suboptimal',state));
const optimalSession=new AdviceSession(workerFactory,state=>renderAdvice('optimal',state));
function renderAdvice(kind:AdviceKind,state:AdviceState){
 const region=el(`${kind}-advice`),list=el(`${kind}-list`);region.hidden=state.phase==='hidden';const focus=captureDefinitionFocus(),hadFocus=list.contains(document.activeElement);list.replaceChildren();if(hadFocus&&!focus)el(save.mode).focus({preventScroll:true});
 el(`${kind}-explanation`).hidden=state.phase==='unavailable'||state.phase==='error';
 const status=el(`${kind}-status`),opening=kind==='optimal'&&current().guesses.length===0;
 if(state.phase==='hidden'){status.textContent='';updateDefinitions();restoreDefinitionFocus(focus);return;}
 if(state.phase==='loading'){status.textContent=opening?`Finding five opening guesses from all ${state.total.toLocaleString('en-US')} curated answers and ${ALLOWED.size.toLocaleString('en-US')} accepted guesses…`:`Checking all ${ALLOWED.size.toLocaleString('en-US')} accepted words in the background…`;updateDefinitions();restoreDefinitionFocus(focus);return;}
 if(state.phase==='unavailable'||state.phase==='error'){status.textContent=state.message;updateDefinitions();restoreDefinitionFocus(focus);return;}
 const {suggestions,totalCandidates,eligibleWords}=state.result;const poolName='curated';
 status.textContent=`${opening?'Opening guesses · ':''}${totalCandidates} ${poolName} ${totalCandidates===1?'answer fits':'answers fit'} the observed clues. ${suggestions.length} of ${eligibleWords.toLocaleString('en-US')} unplayed ${kind==='suboptimal'?'clue-consistent ':''}words shown. ${kind==='optimal'?'Smallest':'Largest'} worst-case remainder first.`;
 for(const item of suggestions.slice(0,5)){
  const li=document.createElement('li'),word=document.createElement('strong'),detail=document.createElement('span');word.textContent=item.word;
  detail.textContent=item.directSolve?`Only remaining ${poolName} answer: direct solve inferred from the clues.`:`Leaves at most ${item.worstCaseLeft} of ${totalCandidates} in the worst case; guarantees ${item.guaranteedEliminations} eliminations.${kind==='optimal'?` Expected survivors: ${item.expectedSurvivors!.toFixed(2)} with uniform candidates.`:''}`;
  li.append(word,detail,inlineDefinition(item.word));list.append(li);
 }
 updateDefinitions();restoreDefinitionFocus(focus);
}
function updateAdvice(run:Run){
 const playing=runOutcome(run)==='playing';
 const weak=playing&&save.settings.suboptimal===true,strong=playing&&difficulty(run)==='easy';
 const input=weak||strong?observedClues(run):null;
 suboptimalSession.show(weak?input:null,'suboptimal');optimalSession.show(strong?input:null,'optimal');
}
const symbol:Record<Clue,string>={exact:'✓',elsewhere:'↔',absent:'×'};
const clueName:Record<Clue,string>={exact:'in place',elsewhere:'elsewhere',absent:'no unmatched copy'};
function render(){
 const focus=captureDefinitionFocus();
 const run=current(),outcome=runOutcome(run),daily=save.mode==='daily',adaptive=isImpossible(run);
 if(outcome==='playing'&&(save.settings.suboptimal===true||difficulty(run)==='easy')&&!run.assisted){run.assisted=true;persist();}
 document.body.classList.toggle('contrast',save.settings.contrast);
 el('edition').textContent=adaptive?'ABSURD / ADAPTIVE ROUND':`DISPATCH No. ${String(dayIndex(save.date)+1).padStart(3,'0')} / ${save.date} UTC`;
 for(const mode of ['daily','practice','impossible']){el(mode).setAttribute('aria-pressed',String(save.mode===mode));}
 el('mode-label').textContent=difficulty(run)==='easy'?'EASY · ASSISTED':difficulty(run)==='strict'?'STRICT MODE':difficulty(run)==='hard'?'HARD MODE':adaptive?'NORMAL MODE':daily?'ONE PER DAY':'ROOM TO EXPLORE';
 if(run.assisted&&!el('mode-label').textContent?.includes('ASSISTED'))el('mode-label').textContent+=' · ASSISTED';
 el('intro-description').textContent=adaptive?'Five letters. Six guesses. Make the possibilities disappear.':'Five letters. Six fieldnotes. One word waiting to be found.';
 el('adaptive-info').hidden=!adaptive;
 if(adaptive){const count=`${run.candidates.length} curated ${run.candidates.length===1?'answer remains':'answers remain'}.`;if(el('candidate-count').textContent!==count)el('candidate-count').textContent=count;}
 el('puzzle-label').textContent=adaptive?'YOUR ADAPTIVE FIELDNOTES':daily?'TODAY’S FIELDNOTES':'YOUR PRACTICE FIELDNOTES';
 el('turn-label').textContent=outcome==='playing'?`${run.guesses.length}/6 NOTED`:`${outcome==='won'?'FOUND':adaptive?'CLOSED':'REVEALED'} · ${run.guesses.length}/6`;
 el('opening-help').hidden=!(outcome==='playing'&&difficulty(run)==='easy'&&run.guesses.length===0);
 const board=el('board');board.replaceChildren();
 for(let row=0;row<6;row++){
  const guess=run.guesses[row];const draft=row===run.guesses.length&&outcome==='playing';
  const letters=guess??(draft?run.draft:'');const clues=guess?(adaptive?run.feedback[row]:score(run.answer,guess)):null;
  const line=document.createElement('div');line.className=`board-row${draft?' active':''}${lastAccepted&&row===run.guesses.length-1?' just-noted':''}`;
  line.setAttribute('role','group');line.setAttribute('aria-label',`Fieldnote ${row+1}${draft?', current':''}${guess?`: ${guess}`:''}`);
  for(let i=0;i<5;i++){
   const tile=document.createElement('span');tile.className=`tile ${clues?.[i]??''}${!clues&&letters[i]?' filled':''}`;
   tile.setAttribute('aria-label',`Position ${i+1}: ${letters[i]??'blank'}${clues?`, ${clueName[clues[i]]}`:''}`);
   const letter=document.createElement('b');letter.textContent=letters[i]??'';tile.append(letter);
   if(clues){const icon=document.createElement('small');icon.textContent=symbol[clues[i]];icon.setAttribute('aria-hidden','true');tile.append(icon);}
   line.append(tile);
  }if(guess){const fieldnote=document.createElement('div');fieldnote.className='fieldnote';fieldnote.append(line,inlineDefinition(guess));board.append(fieldnote)}else board.append(line);
 }
 let text=message;
 if(outcome==='won')text=`A little discovery: ${run.answer}. Found in ${run.guesses.length} ${run.guesses.length===1?'fieldnote':'fieldnotes'}.`;
 if(outcome==='lost')text=adaptive?`One surviving curated answer is ${run.answer}. ${run.candidates.length} still ${run.candidates.length===1?'fits':'fit'} all clues; no word was fixed in advance.`:`The word was ${run.answer}. Every fieldnote taught you something.`;
 if(adaptive&&outcome==='won')text=`You forced ${run.answer}: the only curated answer. Found in ${run.guesses.length} fieldnotes.`;
 if(!storageAvailable)text+=' Saving is unavailable in this browser; keep this tab open.';
 el('message').textContent=text;el('message').classList.toggle('finished',outcome!=='playing');
 const actions=el('result-actions');actions.replaceChildren();
 if(outcome!=='playing'){const answer=document.createElement('section');answer.className='revealed-definition';answer.setAttribute('aria-label',`Revealed answer ${run.answer}`);const word=document.createElement('strong');word.textContent=run.answer;answer.append(word,inlineDefinition(run.answer));actions.append(answer);}
 if(!daily&&!adaptive){const next=document.createElement('button');next.textContent='Fresh practice ↗';next.className='text-button';next.onclick=()=>{if(status(current())==='playing'&&(current().guesses.length||current().draft))openPracticeConfirm();else nextPractice();};actions.append(next);}
 if(adaptive){const next=document.createElement('button');next.textContent='New Absurd round ↗';next.className='text-button';next.onclick=()=>{if(runOutcome(current())==='playing'&&(current().guesses.length||current().draft))openImpossibleConfirm();else nextImpossible();};actions.append(next);}
 if((daily||adaptive)&&outcome!=='playing'){
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
 const stats=statistics(save.results,save.date,save.history);
 el('summary').innerHTML=`<span class="small-label">YOUR DAILY MARKS</span><div><strong>${stats.wins}</strong><span>words found</span></div><div><strong>${stats.current}</strong><span>day streak</span></div><button class="text-button" id="summary-stats">View your notebook ↗</button>`;
 el('summary-stats').onclick=openStats;
 lastAccepted=false;
 updateAdvice(run);
 updateDefinitions();restoreDefinitionFocus(focus);
}
function input(key:string){
 if(dialog.open)return;
 const oldDate=save.date;sync();
 if(oldDate!==save.date&&save.mode==='daily'){message='A fresh UTC dispatch has arrived. Start a new fieldnote.';render();return;}
 const run=current();if(runOutcome(run)!=='playing')return;
 if(key==='↵'){
  const result=isImpossible(run)?submitImpossible(run,run.draft):submit(run,run.draft);
  if(save.mode==='impossible'&&isImpossible(result.run))save.impossible=result.run;else if(save.mode!=='impossible')save[save.mode]=result.run;
  if(result.error)message=result.error;
  else{lastAccepted=true;message=`Fieldnote ${result.run.guesses.length} noted. Follow the clues.`;if(save.mode==='daily')recordDaily(save,save.date,result.run);}
 }else if(key==='⌫'){run.draft=run.draft.slice(0,-1);message='Take your time. Follow the clues.';}
 else if(/^[A-Z]$/.test(key)&&run.draft.length<5){run.draft+=key;message='Ready when you are.';}
 persist();render();
}
function setMode(mode:'daily'|'practice'|'impossible'){sync();save.mode=mode;message=mode==='impossible'?'The answer adapts to your guesses. Keep narrowing the possibilities.':mode==='daily'?'Your daily dispatch is waiting.':'Practice freely. Your daily marks stay separate.';persist();render();}
function nextPractice(){sync();save.practice=choosePractice(save.practice.answer,Math.random,difficulty(save.settings));save.mode='practice';message='A fresh page. A new possibility.';persist();dialog.close();render();}
function nextImpossible(){sync();save.impossible=newImpossible(difficulty(save.impossible));save.mode='impossible';message=`A fresh adaptive round: ${ANSWERS.length.toLocaleString('en-US')} possibilities, six guesses.`;persist();dialog.close();render();}
function openImpossibleConfirm(){modal(`<h2>Restart the adaptive round?</h2><p>This replaces only your unfinished Absurd fieldnotes. Daily and Practice stay safe. Every new round starts with the same ${ANSWERS.length.toLocaleString('en-US')} possibilities and deterministic rules.</p><div class="dialog-actions"><button id="keep-impossible">Keep exploring</button><button id="next-impossible" class="primary">New Absurd round</button></div>`);el('keep-impossible').onclick=()=>dialog.close();el('next-impossible').onclick=nextImpossible;}
function modal(html:string){el('modal-content').innerHTML=html;const heading=el('modal-content').querySelector('h2');if(heading){heading.id='dialog-title';dialog.setAttribute('aria-labelledby','dialog-title');}if(!dialog.open)dialog.showModal();}
function openPracticeConfirm(){modal('<h2>Turn a fresh page?</h2><p>This replaces your unfinished practice fieldnotes. Your daily dispatch is safe.</p><div class="dialog-actions"><button id="keep-practice">Keep exploring</button><button id="next-practice" class="primary">Fresh practice</button></div>');el('keep-practice').onclick=()=>dialog.close();el('next-practice').onclick=nextPractice;}
function openHelp(){modal(`<h2>A little field guide.</h2><p>Find a five-letter word in six guesses. Type letters or use the keyboard below the board; press Enter or NOTE to submit.</p><div class="help-clues"><p><b>✓ In place</b> — right letter, right spot.</p><p><b>↔ Elsewhere</b> — right letter, another spot.</p><p><b>× Not here</b> — no unmatched copy left.</p></div><h3>One letter, one clue.</h3><p>Repeated letters count only as often as they appear. Exact matches are reserved first.</p><p>If the answer is <b>APPLE</b>, guessing <b>ALLEY</b> gives:</p><div class="example">${score('APPLE','ALLEY').map((c,i)=>`<span class="tile ${c}"><b>${'ALLEY'[i]}</b><small>${symbol[c]}</small></span>`).join('')}</div><p>Only one L exists: the first L is elsewhere, the second L has no remaining copy. E is elsewhere; Y is absent.</p><h3>Discover a word’s meaning.</h3><p>Definitions appear automatically below every submitted guess, advice suggestion and revealed answer. Only these displayed words are requested individually from Wiktionary; each displayed word is sent separately and the provider can see those words and your IP address. No puzzle identifier, draft, hidden answer or saved statistics is sent. Coverage is incomplete and definitions never affect accepted guesses. Expand More senses for additional meanings.</p><h3>Choose your difficulty.</h3><p>Settings offers Easy, Normal, Hard and Strict. Easy permits any word and shows Optimal guesses based only on observed clues. Optional Show Suboptimal guesses is off by default and available in every mode. Advice marks the round Assisted permanently; its one-step ranking does not guarantee an optimal overall strategy. Hard fixes greens and reuses green/yellow copies. Strict also rules out prior yellow positions and gray letters, enforces duplicate limits, and checks all earlier clues. Any consistent dictionary word is allowed. Hard/Strict upgrades require no accepted guesses. Easy can be enabled midgame on an unfinished puzzle; assistance stays marked after switching it off. Each saved puzzle keeps its difficulty. Ordinary choices also apply to new ordinary puzzles; Absurd keeps its own choice.</p><h3>Three ways to explore.</h3><p><b>Absurd:</b> adaptive answers, not a preselected word. Only the ${ANSWERS.length.toLocaleString('en-US')} curated words can be answers. Each valid guess keeps the largest consistent answer group. Ties avoid a win when possible, then follow a fixed clue order. All four difficulties are available in Settings and use only revealed adaptive clues. Absurd keeps its difficulty separate from Daily and Practice. Surviving possibilities are shown. Six guesses, separate saved round/results, and no daily statistics. It is a greedy adversary, not a proof of an optimal strategy or an unwinnable game.</p><p><b>Daily dispatch:</b> one shared puzzle per UTC date. It changes at midnight UTC, even if your local date is different. Unfinished daily fieldnotes expire without a recorded loss.</p><p><b>Practice:</b> replay as often as you like. It resumes after reload and never changes daily statistics.</p><p>Words must be in our accepted-guess guide; unknown and repeated guesses use no turn. Winning or the sixth accepted guess completes the puzzle.</p><button id="start" class="primary">Let’s make a mark</button>`);el('start').onclick=()=>dialog.close();}
function openStats(){sync();const s=statistics(save.results,save.date,save.history);modal(`<h2>Your daily notebook.</h2><p>Small discoveries, counted once.</p><div class="stats-grid"><div><b>${s.played}</b><span>Played</span></div><div><b>${s.percent}%</b><span>Win rate</span></div><div><b>${s.current}</b><span>Current streak</span></div><div><b>${s.best}</b><span>Best streak</span></div></div><h3>Fieldnotes to find the word</h3><div class="histogram">${s.histogram.map((count,i)=>`<div><span>${i+1}</span><div style="width:${Math.max(8,count/Math.max(1,...s.histogram)*100)}%"><b>${count}</b></div></div>`).join('')}</div><p class="fine-print">${s.wins} wins in ${s.played} completed daily dispatches. Streaks count consecutive UTC dates won. A loss or missed date breaks the streak. Yesterday’s winning streak remains current until today ends or is lost. Practice and Absurd do not count. Daily statistics combine difficulties; Easy/advice-enabled shares are marked Assisted.</p><p class="fine-print">Saved only in this browser. Clearing browser data or erasing the notebook removes these marks.</p>`);}
function openSettings(){sync();const run=current(),selected=difficulty(run),rank={easy:0,normal:0,hard:1,strict:2};modal(`<h2>Make yourself at home.</h2><label class="setting"><span><b>Difficulty</b><small>${isImpossible(run)?'Absurd · saved separately from ordinary puzzles.':save.mode==='daily'?'Daily dispatch · also used for new ordinary puzzles.':'Practice · also used for new ordinary puzzles.'}</small></span><select id="difficulty" class="difficulty-select" aria-label="Difficulty" aria-describedby="difficulty-help">${(['easy','normal','hard','strict'] as const).map(mode=>`<option value="${mode}" ${mode===selected?'selected':''} ${(run.guesses.length&&rank[mode]>rank[selected])||(mode==='easy'&&runOutcome(run)!=='playing'&&selected!=='easy')?'disabled':''}>${mode==='easy'?'Easy':mode==='normal'?'Normal':mode==='hard'?'Hard':'Strict'}</option>`).join('')}</select></label><div id="difficulty-help" class="fine-print"><p><b>Easy:</b> unrestricted guesses with five Optimal guesses inferred only from observed clues. This marks the round Assisted permanently; turning Easy off cannot remove that label. Easy may be enabled midgame on an unfinished puzzle.</p><p><b>Normal:</b> any accepted word.</p><p><b>Hard:</b> keep greens fixed and reuse green/yellow copies. Gray letters, extra copies and previous yellow positions are allowed.</p><p><b>Strict:</b> match every previous clue. Move yellows, avoid ruled-out letters, and obey known minimum and maximum copy counts. Any consistent dictionary word is allowed.</p><p>Hard/Strict upgrades require no accepted guesses. Easy may be enabled on any unfinished round; you may switch Easy/Normal freely, retaining the Assisted marker. You may lower restrictions anytime. All assistance stays marked on shares. Other saved puzzles keep their difficulty. Start a fresh Practice or Absurd round, or wait for tomorrow’s Daily, to choose a higher level.</p></div><label class="setting"><span><b>Show Suboptimal guesses</b><small>Optional weak guesses in Daily, Practice and Absurd. Off by default. Enabling advice marks each active round Assisted permanently.</small></span><input id="suboptimal-toggle" type="checkbox" aria-label="Show Suboptimal guesses" ${save.settings.suboptimal?'checked':''}></label><label class="setting"><span><b>High contrast clues</b><small>Deeper tones; symbols always stay visible.</small></span><input id="contrast" type="checkbox" ${save.settings.contrast?'checked':''}></label><h3>Your notebook stays here.</h3><p>We save your daily and practice fieldnotes on this browser. There’s no account, tracking, or external posting.</p><button id="reset" class="danger">Erase saved notebook…</button>`);const selector=document.getElementById('difficulty');if(selector)selector.onchange=()=>{
 const selected=(el('difficulty') as HTMLSelectElement).value as Difficulty;sync();
 const adaptive=save.mode==='impossible';
 const result=adaptive?setImpossibleDifficulty(save.impossible,selected):setDifficulty(current(),selected);
 if(adaptive)save.impossible=result.run as typeof save.impossible;else save[save.mode as 'daily'|'practice']=result.run;
 if(result.error)message=result.error;else{
  if(!adaptive){
  save.settings.hardMode=selected==='hard';
  if(selected==='easy')save.settings.easyMode=true;else delete save.settings.easyMode;
  if(selected==='strict')save.settings.strictMode=true;else delete save.settings.strictMode;
  }
  message=`${selected==='strict'?'Strict':selected==='hard'?'Hard':selected==='easy'?'Easy':'Normal'} difficulty saved ${adaptive?'for Absurd only':'for this puzzle and new ordinary puzzles'}.`;
 }
 persist();render();openSettings();el('difficulty').focus();
 };el('suboptimal-toggle').onchange=()=>{const enabled=(el('suboptimal-toggle') as HTMLInputElement).checked;sync();if(enabled)save.settings.suboptimal=true;else delete save.settings.suboptimal;persist();render();};el('contrast').onchange=()=>{sync();save.settings.contrast=(el('contrast') as HTMLInputElement).checked;persist();render();};el('reset').onclick=()=>{resetPending=true;modal('<h2>Erase your notebook?</h2><p>This clears all Morrowmark guesses, daily statistics and settings in this browser. It cannot be undone.</p><div class="dialog-actions"><button id="cancel-reset">Keep my notebook</button><button id="confirm-reset" class="danger">Erase everything</button></div>');el('cancel-reset').onclick=()=>{resetPending=false;openSettings();};el('confirm-reset').onclick=()=>{if(!resetPending)return;resetPending=false;try{localStorage.removeItem(SAVE_KEY)}catch{storageAvailable=false;}save=emptySave(dateKey(new Date()));message='A clean notebook. Make your first mark.';persist();dialog.close();render();};};}
function openAbout(){modal(`<h2>An independent field guide.</h2><p>Morrowmark accepts <b>${ALLOWED.size.toLocaleString('en-US')} five-letter guesses</b> and selects answers only from <b>${ANSWERS.length.toLocaleString('en-US')} common-tier SCOWL words</b> in Daily, Practice and Absurd. Other accepted words remain exploratory guesses; advice counts the curated answers.</p><p>Both lists are modified selections from <a href="https://github.com/en-wl/wordlist/tree/5ef55f9c42730ebe4394a78b77855468a6f15dd2/scowl" target="_blank" rel="noopener noreferrer">SCOWL 2020.12.07</a>, pinned by release revision and checksums. Answers use size35; guesses use size80. We retain lowercase five-letter ASCII entries from general, American and British word categories, with common plurals and inflections included. Names, abbreviation categories, contractions and accented forms are excluded. These are independent English lists, with different coverage from Wordle; no official NYT parity is claimed.</p><p><b>Word-list notices:</b> SCOWL collective work Copyright 2000-2018 Kevin Atkinson. Includes <b>UK Advanced Cryptics Dictionary: Copyright (c) J Ross Beresford 1993-1999. All Rights Reserved.</b> Other contributor notices also apply. Redistribution is permitted under the retained <a href="./third-party/SCOWL-Copyright.txt" target="_blank" rel="noopener noreferrer">complete permission notices</a>, including WordNet and VarCon terms. This is a modified five-letter selection, not an unmodified official dictionary. See WORDS-LICENSE.md for exact provenance and transformations.</p><p class="fine-print">SCOWL common35 guide · ${ANSWERS.length.toLocaleString('en-US')}-day cycle in alphabetical order, starting January1,2026 UTC. Your device clock determines the date. The replacement guide starts the old notebook fresh at default settings once; new progress is saved normally.</p>`);}

async function copyResult(){
 const run=current();const text=isImpossible(run)?impossibleShare(run):shareText(save.date,save.daily);
 modal(`<h2>${isImpossible(run)?'Your adaptive round':'Your dispatch'}, without spoilers.</h2><p id="copy-status" role="status">Copying locally… You can also select and copy this text.</p><textarea id="share-text" readonly rows="11" aria-label="Spoiler-free result"></textarea>`);
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
el('daily').onclick=()=>setMode('daily');el('practice').onclick=()=>setMode('practice');el('impossible').onclick=()=>setMode('impossible');
window.addEventListener('pointerdown',()=>{typingOnButton=false;});
window.addEventListener('keydown',event=>{
 if(event.key==='Tab')typingOnButton=false;
 if(event.ctrlKey||event.metaKey||event.altKey||dialog.open||event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;
 const key=event.key==='Enter'?'↵':event.key==='Backspace'?'⌫':event.key.toUpperCase();
 // Disclosure summaries and source links keep native keyboard activation.
 if(event.key==='Enter'&&event.target instanceof HTMLElement&&event.target.closest('summary,a'))return;
 // Native buttons own Enter/Space activation; letter input still works while a key has focus.
 if(event.key==='Enter'&&event.target instanceof HTMLButtonElement&&!typingOnButton)return;
 if(key==='↵'||key==='⌫'||/^[A-Z]$/.test(key)){event.preventDefault();typingOnButton=true;input(key);}
});
function refresh(){const before=save.date;sync();if(before!==save.date)message='A fresh UTC dispatch has arrived.';render();}
window.addEventListener('beforeunload',()=>{definitions.close();suboptimalSession.stop();optimalSession.stop();});
window.addEventListener('focus',refresh);window.addEventListener('storage',event=>{if(event.key===SAVE_KEY)refresh();});
setInterval(()=>{if(dateKey(new Date())!==save.date)refresh();},15_000);
persist();render();
