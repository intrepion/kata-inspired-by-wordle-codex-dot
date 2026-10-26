import {TranslationClient,translationUsage,translationPartOfSpeech} from './translations.ts';
import translationCoverage from './data/spanish/translation-coverage.json';
import {applyGlobalDifficulty,decodeGlobalDifficulty} from './global-difficulty.ts';
import {answerEligibility} from './answer-eligibility.ts';
import {isLanguage,isLetter,normalizeGuess,languageLabel,type Language} from './language.ts';
import {teachingFor,teachingFields,SPANISH_TEACHING_TOTAL} from './learning.ts';
import {DefinitionClient,DEFINITION_SOURCE} from './definitions.ts';
import {InlineDefinitions} from './inline-definitions.ts';
import './style.css';
import {vocabulary,isWordLength,WORD_LENGTHS,type WordLength} from './words.ts';
import {dateKey,dayIndex,score,status,submit,newRun,difficulty,keyboardClues,choosePractice,shareText,type Run,type Clue,type Difficulty} from './domain.ts';
import {AdviceSession,type AdviceState} from './advice-session.ts';
import type {AdviceKind} from './advice-protocol.ts';
import {observedClues,remainingAnswerCount} from './observations.ts';
import {newImpossible,isImpossible,impossibleStatus,submitImpossible,impossibleShare} from './impossible.ts';
import {encode,decode,emptySave,recordDaily,statistics,synchronize} from './persistence.ts';

import {saveKeyForPath,resetStorageForUpdate} from './site.ts';
let storageAvailable=true,resetForUpdate=false;
try{resetForUpdate=resetStorageForUpdate(localStorage,location.pathname)}catch{storageAvailable=false}

const DIFFICULTY_KEY=saveKeyForPath(location.pathname)+'.difficulty';
const LANGUAGE_KEY=saveKeyForPath(location.pathname)+'.language';
function readLanguage():Language {if(!storageAvailable)return 'en';try{const value=localStorage.getItem(LANGUAGE_KEY);return isLanguage(value)?value:'en'}catch{return 'en'}}
let language=readLanguage();
function lengthPreferenceKey(selected:Language){return saveKeyForPath(location.pathname,5,selected)+'.word-length'}
let LENGTH_KEY=lengthPreferenceKey(language);
function readLength():WordLength {if(!storageAvailable)return 5;try{const value=Number(localStorage.getItem(LENGTH_KEY));return isWordLength(value)?value:5}catch{return 5}}
let wordLength=readLength();
let SAVE_KEY=saveKeyForPath(location.pathname,wordLength,language);
let {answers:ANSWERS,allowed:ALLOWED}=vocabulary(wordLength,language);
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`
<header class="masthead"><a class="wordmark" href="./" aria-label="Lexi Conquest home"><span class="mark">lc</span>Lexi Conquest<span class="wordmark-dot">✦</span></a><span class="masthead-note">A SMALL DAILY DISCOVERY</span><nav aria-label="Tools"><button id="help" class="icon-button" aria-label="How to play">?</button><button id="stats" class="icon-button" aria-label="Daily statistics">▥</button><button id="settings" class="icon-button" aria-label="Settings">⚙</button></nav></header>
<main><section class="intro"><div class="edition"><span class="live-dot"></span><span id="edition"></span><span class="edition-line"></span><span>EST. 2026</span></div><h1>Every word leaves<br>a <em>little mark.</em></h1><p id="intro-description">Five letters. Six fieldnotes. One word waiting to be found.</p></section>
<div class="workspace"><aside class="margin-note"><span class="small-label">THE FIELD GUIDE</span><h2>Follow the<br>small clues.</h2><p>Let each guess narrow the possibilities. A good word is a good place to start.</p><div class="legend"><span class="legend-icon exact">✓</span><div><strong>In place</strong><small>The right letter, right spot.</small></div><span class="legend-icon elsewhere">↔</span><div><strong>Elsewhere</strong><small>Right letter. Another spot.</small></div><span class="legend-icon absent">×</span><div><strong>Not here</strong><small>No copy left to find.</small></div></div><button class="text-button" id="guide">Open the field guide ↗</button><div class="pencil-art" aria-hidden="true"><span></span><i></i></div><p class="quiet-note">A fresh dispatch at midnight UTC.<br>Stay curious. Come back tomorrow.</p></aside>
<section class="puzzle" aria-label="Word puzzle"><div class="mode-bar"><div class="tabs" role="group" aria-label="Puzzle mode"><button id="daily">Daily dispatch</button><button id="practice">Practice</button><button id="impossible">Absurd</button></div><span id="mode-label"></span></div><label class="word-length-setting">Language <select id="language" aria-label="Language" aria-describedby="language-help"><option value="en">English</option><option value="es-MX">Español (México)</option></select></label><p id="language-help" class="fine-print length-help"></p><label class="word-length-setting">Word length <select id="word-length" aria-label="Word length" aria-describedby="word-length-help">${WORD_LENGTHS.map(length=>`<option value="${length}">${length} letters</option>`).join('')}</select></label><p id="word-length-help" class="fine-print length-help">Each length has separate rounds and daily statistics; difficulty is global. Switching opens or resumes that notebook; your other lengths stay saved. Six guesses at every length.</p><div id="adaptive-info" class="adaptive-info" hidden><p id="adaptive-explanation">No answer is fixed in advance. Each guess keeps the largest group consistent with every clue. Choose Easy, Normal, Hard or Strict in Settings; restrictions use the revealed clues. Answers come only from the possible answers for the selected length. The count shows exactly how many of those still match every clue. Other accepted words remain valid exploratory guesses, subject to difficulty. Daily marks stay separate.</p><p id="candidate-count" role="status" aria-live="polite"></p></div><div class="puzzle-meta"><span id="puzzle-label"></span><span id="turn-label"></span></div><p id="definition-disclosure" class="definition-disclosure">Meanings load from bundled files on this site. No words are automatically sent to an external dictionary or translation service. Source links open only when selected. Coverage is incomplete; missing meanings stay unavailable. <a href="./third-party/simple-english-definitions/NOTICE.txt" target="_blank" rel="noopener noreferrer">Simple English Wiktionary contributors · selected, modified text · CC BY-SA 4.0</a>.</p><p id="opening-help" class="opening-help" hidden>Easy starts with five Optimal opening guesses below the keyboard. You can wait for them before guessing.</p><div id="difficulty-conflict" class="adaptive-info" hidden><p id="difficulty-conflict-message" role="status"></p><button id="restart-for-difficulty" class="text-button">Start this round over with the global difficulty</button></div><div id="board" class="board" role="group" aria-label="Six fieldnotes"></div><p id="message" class="message" role="status" aria-live="polite" aria-atomic="true"></p><div id="result-actions" class="result-actions"></div><div id="keyboard" class="keyboard" role="group" aria-label="Letter keyboard"></div><p class="keyboard-tip">TYPE OR TAP LETTERS <span>·</span> ENTER TO SUBMIT <span>·</span> ⌫ TO ERASE</p>${adviceMarkup('optimal')}${adviceMarkup('suboptimal')}</section>
<aside class="dispatch-note"><div class="stamp" aria-hidden="true"><span>Lexi Conquest</span><strong id="stamp-length">05</strong><small>LETTERS / DAILY</small></div><span class="small-label">A MOMENT TO YOURSELF</span><p class="quote">“Make a guess.<br>Notice a clue.<br>Find your way.”</p><div class="rule"></div><p>No rush. No leaderboard.<br>Just you and a little possibility.</p><div class="daily-summary" id="summary"></div></aside></div>
</main><footer><span>MADE FOR CURIOUS MINDS</span><span><b>m.</b> One small discovery at a time.</span><button id="about" class="text-button">About the words ↗</button></footer>
<dialog id="modal"><div class="dialog-top"><span class="small-label">Lexi Conquest / FIELD GUIDE</span><button id="close" class="icon-button" aria-label="Close dialog">×</button></div><div id="modal-content"></div></dialog>`;

const el=(id:string)=>document.getElementById(id)!;
const dialog=el('modal') as HTMLDialogElement;
const englishDisclosure=el('definition-disclosure').innerHTML;
const englishAdaptiveExplanation=el('adaptive-explanation').textContent!;
const englishLengthHelp=el('word-length-help').textContent!;
type DefinitionFocus={word:string;index:number;href?:string;control:'summary.definition-meanings'|'summary.translation-meanings'|'a.translation-source'|'a.definition-source'};
function captureDefinitionFocus():DefinitionFocus|null {
 const focused=document.activeElement;if(!(focused instanceof HTMLElement))return null;
 const slot=focused.closest<HTMLElement>('[data-inline-definition]'),control=focused.closest('summary.translation-meanings')?'summary.translation-meanings':focused.closest('summary.definition-meanings')?'summary.definition-meanings':focused.closest('a.translation-source')?'a.translation-source':focused.closest('a.definition-source')?'a.definition-source':null;
 if(!slot||!control)return null;const word=slot.dataset.inlineDefinition!;
 return {word,...(focused instanceof HTMLAnchorElement?{href:focused.href}:{}),index:[...document.querySelectorAll(`[data-inline-definition="${word}"]`)].indexOf(slot),control};
}
function restoreDefinitionFocus(focus:DefinitionFocus|null){
 if(!focus||dialog.open)return;
 const slots=document.querySelectorAll(`[data-inline-definition="${focus.word}"]`),slot=slots[focus.index]??slots[0];
 const controls=[...slot?.querySelectorAll<HTMLElement>(focus.control)??[]],control=focus.href?controls.find(node=>node instanceof HTMLAnchorElement&&node.href===focus.href):controls[0];(control??el(save.mode)).focus({preventScroll:true});
}
const expandedDefinitions=new Set<string>();
const expandedTranslations=new Set<string>();
const translations=new TranslationClient();
const definitionClients=new Map<Language,DefinitionClient>();
function clientFor(selected:Language){let client=definitionClients.get(selected);if(!client){client=new DefinitionClient(undefined,6000,Date.now,selected);definitionClients.set(selected,client)}return client}
function createDefinitions(selected:Language){return new InlineDefinitions(clientFor(selected),word=>{
 for(const node of document.querySelectorAll<HTMLElement>('[data-inline-definition]'))if(node.dataset.inlineDefinition===word)renderInlineDefinition(node,word);
})}
let definitions=createDefinitions(language);
function inlineDefinition(word:string){const node=document.createElement('div');node.className='inline-definition';node.lang='en';node.dataset.inlineDefinition=word;node.setAttribute('aria-label',`Definition of ${word}`);renderInlineDefinition(node,word);return node;}
function renderInlineDefinition(node:HTMLElement,word:string){
 const focus=node.contains(document.activeElement)?captureDefinitionFocus():null;
 const state=definitions.state(word);node.replaceChildren();
 const fields=language==='es-MX'?teachingFields(teachingFor(word,language)):[];
 if(fields.length){
  const learning=document.createElement('div');learning.className='learning-material';
  for(const field of fields){const line=document.createElement('p'),heading=document.createElement('strong'),content=document.createElement('span');heading.textContent=field.label+': ';content.textContent=field.value;content.lang=field.language;line.append(heading,content);learning.append(line)}
  node.append(learning);
 }


 if(language==='es-MX'&&!fields.length){
  const translation=translations.peek(word,language),learning=document.createElement('div');learning.className='dictionary-translation';
  if(translation?.phase==='ready'){
   const heading=document.createElement('strong');heading.textContent=translation.entry.kind==='reviewed-spanish'?'English meanings · model translations from Spanish':translation.entry.kind==='reviewed-wordnet'?'English meanings · reviewed WordNet concepts':translation.entry.kind==='derived-forms'?'English form equivalents · automatically derived':translation.entry.kind==='english-wiktionary'?'English meanings · dictionary and derived forms':'English dictionary meanings · unreviewed entries';learning.append(heading);
   const appendMeaning=(container:HTMLElement,sense:typeof translation.entry.senses[number],compact:boolean)=>{const line=document.createElement('p'),tags=translationUsage(sense.tags),meaning=sense.english.join('; ');line.textContent=`${translationPartOfSpeech(sense.partOfSpeech)} · ${compact&&meaning.length>360?meaning.slice(0,357)+'…':meaning}${tags.length?' ['+tags.join(', ')+']':''}`;container.append(line)};
   for(const sense of translation.entry.senses.slice(0,2))appendMeaning(learning,sense,true);
   if(translation.entry.senses.length>2||translation.entry.senses.slice(0,2).some(s=>s.english.join('; ').length>360)){
    const details=document.createElement('details'),summary=document.createElement('summary'),key=language+':'+word;summary.className='translation-meanings';details.open=expandedTranslations.has(key);summary.textContent=`${details.open?'Fewer':'More'} English meanings for ${word}`;details.append(summary);for(const sense of translation.entry.senses)appendMeaning(details,sense,false);details.ontoggle=()=>{summary.textContent=`${details.open?'Fewer':'More'} English meanings for ${word}`;if(details.isConnected){if(details.open)expandedTranslations.add(key);else expandedTranslations.delete(key)}};learning.append(details);
   }
   const attribution=document.createElement('p'),link=document.createElement('a');link.className='translation-source';link.textContent=translation.entry.kind==='reviewed-wordnet'?'MCR + Princeton WordNet · sources/notices':translation.entry.kind==='derived-forms'?'Apertium + AGID · source/notices · GPL v2-derived data':'Wiktionary contributors · CC BY-SA 4.0';link.href=translation.entry.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';link.referrerPolicy='no-referrer';attribution.append(link);for(const item of translation.entry.sourceLinks??[]){if(item.url===translation.entry.sourceUrl)continue;const extra=document.createElement('a');extra.className='translation-source';extra.textContent=item.label;extra.href=item.url;extra.target='_blank';extra.rel='noopener noreferrer';extra.referrerPolicy='no-referrer';attribution.append(document.createTextNode(' · '),extra)}attribution.append(document.createTextNode(translation.entry.kind==='derived-forms'?'. Supported morphological readings only; not complete senses or reviewed Mexican examples.':'. General Spanish; may contain source errors or incomplete meanings. Not reviewed Mexican examples.'));learning.append(attribution);
  }else{
   const line=document.createElement('p');line.textContent=translation?.phase==='error'?'Bundled translation could not load. Reload to retry.':translation?.phase==='missing'?'No verified English translation bundled for this word.':'Loading bundled translation…';learning.append(line);
   if(!translation){const selected=language;void translations.lookup(word,selected).then(()=>{if(node.isConnected&&language===selected&&node.dataset.inlineDefinition===word)renderInlineDefinition(node,word)})}
  }
  node.append(learning);
 }

 const eligibility=answerEligibility(word,wordLength,language),eligibilityLine=document.createElement('p'),eligibilityLabel=document.createElement('strong');
 eligibilityLine.className='answer-eligibility';eligibilityLabel.textContent=`Possible answer: ${eligibility.possible?'Yes':'No'}. `;eligibilityLine.append(eligibilityLabel,document.createTextNode(eligibility.reason));node.append(eligibilityLine);
 if(fields.length){const heading=document.createElement('strong');heading.textContent='Meaning · bundled material';node.append(heading)}
 const text=document.createElement('p');text.className='definition-meaning';
 if(state.phase==='loading')text.textContent='Loading meaning…';
 else if(state.phase==='missing')text.textContent='No meaning bundled for this word. Still a valid game word.';
 else if(state.phase==='error')text.textContent=state.reason==='timeout'?'Bundled meaning took too long to load. Reload to retry.':'Bundled meaning could not load. Reload to retry.';
 else {
  const first=state.result.entries[0],meaning=first.senses[0];
  const part=document.createElement('em');part.textContent=first.partOfSpeech+' · ';text.append(part,document.createTextNode(meaning.length>260?meaning.slice(0,257)+'…':meaning));
 }
 node.append(text);
 if(state.phase==='ready'){
  const first=state.result.entries[0];
  if(first.senses[0].length>260||first.senses.length>1||state.result.entries.length>1){
   const details=document.createElement('details'),summary=document.createElement('summary');summary.className='definition-meanings';summary.textContent=`More meanings for ${word}`;details.append(summary);details.open=expandedDefinitions.has(word);summary.textContent=`${details.open?'Fewer':'More'} meanings for ${word}`;
   for(const entry of state.result.entries){const heading=document.createElement('strong');heading.textContent=entry.partOfSpeech;const senses=document.createElement('ol');for(const sense of entry.senses){const li=document.createElement('li');li.textContent=sense;senses.append(li)}details.append(heading,senses)}
   details.ontoggle=()=>{summary.textContent=`${details.open?'Fewer':'More'} meanings for ${word}`;if(details.isConnected){if(details.open)expandedDefinitions.add(word);else expandedDefinitions.delete(word)}};node.append(details);
  }
 }
 const source=document.createElement('a');source.href=state.phase==='ready'||state.phase==='missing'?state.result.sourceUrl:language==='en'?'./third-party/simple-english-definitions/NOTICE.txt':'./third-party/english-wiktionary-translations/NOTICE.txt';source.textContent=(state.phase==='ready'||state.phase==='missing'?state.result.sourceLabel:undefined)??DEFINITION_SOURCE;source.target='_blank';source.rel='noopener noreferrer';source.referrerPolicy='no-referrer';source.className='definition-source';source.setAttribute('aria-label',`Meaning source for ${word} (opens in a new tab)`);node.append(source);if(state.phase==='ready'&&state.result.note){const note=document.createElement('small');note.className='fine-print';note.textContent=state.result.note;node.append(note)}restoreDefinitionFocus(focus);
}
function updateDefinitions(){definitions.show([...document.querySelectorAll<HTMLElement>('[data-inline-definition]')].map(node=>node.dataset.inlineDefinition!));}
function read(){if(!storageAvailable)return null;try{return localStorage.getItem(SAVE_KEY)}catch{storageAvailable=false;return null}}
let save=decode(read(),dateKey(new Date()),wordLength,language);
function readGlobalDifficulty(fallback:Difficulty):Difficulty {if(!storageAvailable)return fallback;try{return decodeGlobalDifficulty(localStorage.getItem(DIFFICULTY_KEY),fallback)}catch{storageAvailable=false;return fallback}}
let globalDifficulty=readGlobalDifficulty(difficulty(save[save.mode]));
let difficultyBlock:string|undefined;
let message=resetForUpdate?'A fresh notebook. English · 5 letters · Normal.':'Your next discovery starts with a guess.';
let lastAccepted=false;
let resetPending=false;
let typingOnButton=false;
function persist(){try{localStorage.setItem(SAVE_KEY,encode(save));localStorage.setItem(DIFFICULTY_KEY,globalDifficulty)}catch{storageAvailable=false;}}
function sync(){
 const today=dateKey(new Date());
 if(storageAvailable){const result=synchronize(save,today,()=>localStorage.getItem(SAVE_KEY));save=result.save;storageAvailable=result.available;}
 else if(save.date!==today)save=decode(encode(save),today,wordLength,language);
 globalDifficulty=readGlobalDifficulty(globalDifficulty);applySelectedDifficulty();
 return today;
}
function applySelectedDifficulty(){
 const result=applyGlobalDifficulty(current(),globalDifficulty);difficultyBlock=result.error;
 if(result.run!==current()){if(isImpossible(result.run))save.impossible=result.run;else if(save.mode!=='impossible')save[save.mode]=result.run;persist()}
}
function restartForGlobalDifficulty(){
 if(!difficultyBlock)return;
 if(save.mode==='impossible')save.impossible=newImpossible(globalDifficulty,wordLength,language);
 else save[save.mode]=newRun(current().answer,globalDifficulty,language);
 current().assisted=true;
 message='This round started over with your global difficulty. Marked Assisted because you have already seen clues. Other progress stays saved.';difficultyBlock=undefined;persist();render();el(save.mode).focus({preventScroll:true});
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
 if(state.phase==='loading'){status.textContent=opening?`Finding five opening guesses from all ${state.total.toLocaleString('en-US')} possible answers and ${ALLOWED.size.toLocaleString('en-US')} accepted guesses… Longer words may take several seconds; you can keep playing.`:`Checking all ${ALLOWED.size.toLocaleString('en-US')} accepted words in the background…`;updateDefinitions();restoreDefinitionFocus(focus);return;}
 if(state.phase==='unavailable'||state.phase==='error'){status.textContent=state.message;updateDefinitions();restoreDefinitionFocus(focus);return;}
 const {suggestions,totalCandidates,eligibleWords}=state.result;const poolName='possible';
 status.textContent=`${opening?'Opening guesses · ':''}${totalCandidates} ${poolName} ${totalCandidates===1?'answer fits':'answers fit'} the observed clues. ${suggestions.length} of ${eligibleWords.toLocaleString('en-US')} unplayed ${kind==='suboptimal'?'clue-consistent ':''}words shown. ${kind==='optimal'?'Smallest':'Largest'} worst-case remainder first.`;
 for(const item of suggestions.slice(0,5)){
  const li=document.createElement('li'),word=document.createElement('strong'),detail=document.createElement('span');word.textContent=item.word;
  detail.textContent=item.directSolve?`Only remaining ${poolName} answer: direct solve inferred from the clues.`:`Leaves at most ${item.worstCaseLeft} of ${totalCandidates} in the worst case; guarantees ${item.guaranteedEliminations} eliminations.${kind==='optimal'?` Expected survivors: ${item.expectedSurvivors!.toFixed(2)} with uniform candidates.`:''}`;
  li.append(word,detail,inlineDefinition(item.word));list.append(li);
 }
 updateDefinitions();restoreDefinitionFocus(focus);
}
function updateAdvice(run:Run){
 const playing=runOutcome(run)==='playing'&&!difficultyBlock;
 const weak=playing&&save.settings.suboptimal===true,strong=playing&&difficulty(run)==='easy';
 const input=weak||strong?observedClues(run):null;
 suboptimalSession.show(weak?input:null,'suboptimal');optimalSession.show(strong?input:null,'optimal');
}
const symbol:Record<Clue,string>={exact:'✓',elsewhere:'↔',absent:'×'};
const clueName:Record<Clue,string>={exact:'in place',elsewhere:'elsewhere',absent:'no unmatched copy'};
function render(){
 applySelectedDifficulty();
 const focus=captureDefinitionFocus();
 const run=current(),outcome=runOutcome(run),daily=save.mode==='daily',adaptive=isImpossible(run);
 el('difficulty-conflict').hidden=!difficultyBlock;el('difficulty-conflict-message').textContent=difficultyBlock??'';el('restart-for-difficulty').onclick=restartForGlobalDifficulty;
 if(!difficultyBlock&&outcome==='playing'&&(save.settings.suboptimal===true||difficulty(run)==='easy')&&!run.assisted){run.assisted=true;persist();}
 document.body.classList.toggle('contrast',save.settings.contrast);
 (el('language') as HTMLSelectElement).value=language;
 el('word-length-help').textContent=language==='en'?englishLengthHelp:'Separate progress for each language and length. Switching resumes that notebook. Six guesses.';
 el('adaptive-explanation').textContent=language==='en'?englishAdaptiveExplanation:`Absurd adapts after each guess, keeping the largest group consistent with all clues from the ${ANSWERS.length.toLocaleString('en-US')} possible answers. Other accepted words stay playable, subject to difficulty. Six guesses; results stay separate from Daily.`;
 el('language-help').textContent=language==='en'?'English is the default. Each language has separate notebooks; difficulty is global.':`${ANSWERS.length.toLocaleString('en-US')} possible answers at this length, selected by documented base-word senses and general-Spanish frequency (Zipf ≥3.5), without a count cap. Teaching covers all possible answers; other accepted guesses and exploratory suggestions may lack translations/examples. Accents matter; Ñ is not N; CH/LL count twice. Source coverage is incomplete and not exclusively Mexican. Obsolete Spanish rounds restart once for this expanded list; global difficulty stays saved.`;
 el('definition-disclosure').innerHTML=language==='en'?englishDisclosure:'Reviewed teaching translations and examples are original AI-authored educational text, independently model-reviewed—not human/native-certified. Additional English meanings are selected Wiktionary glosses, independently model-translated Spanish dictionary meanings, labelled source-derived grammatical readings using reviewed mappings and AGID or Apertium, or model-reviewed MCR/WordNet lexical meanings; they are general Spanish, not reviewed Mexican teaching or complete translations. Each entry links its source and license notice. These local translations do not send words to a translation service. Missing translations are stated explicitly. All meanings load from bundled files on this site, with their own source/license labels. No words are automatically sent to an external dictionary or translation service. Source links open only when selected. Missing meanings stay unavailable. <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">Reviewed teaching and Wiktionary definitions · CC BY-SA 4.0</a>.';

 el('edition').textContent=adaptive?'ABSURD / ADAPTIVE ROUND':`DISPATCH No. ${String(dayIndex(save.date)+1).padStart(3,'0')} / ${save.date} UTC`;
 for(const mode of ['daily','practice','impossible']){el(mode).setAttribute('aria-pressed',String(save.mode===mode));}
 el('mode-label').textContent=difficulty(run)==='easy'?'EASY · ASSISTED':difficulty(run)==='strict'?'STRICT MODE':difficulty(run)==='hard'?'HARD MODE':adaptive?'NORMAL MODE':daily?'ONE PER DAY':'ROOM TO EXPLORE';
 if(difficultyBlock)el('mode-label').textContent=`${globalDifficulty.toUpperCase()} · ROUND PAUSED`;
 if(run.assisted&&!el('mode-label').textContent?.includes('ASSISTED'))el('mode-label').textContent+=' · ASSISTED';
 el('intro-description').textContent=adaptive?`${wordLength} letters. Six guesses. Make the possibilities disappear.`:`${wordLength} letters. Six fieldnotes. One word waiting to be found.`;
 (el('word-length') as HTMLSelectElement).value=String(wordLength);el('stamp-length').textContent=String(wordLength).padStart(2,'0');
 el('board').style.setProperty('--word-length',String(wordLength));el('board').dataset.wordLength=String(wordLength);el('board').lang=language;el('board').setAttribute('aria-label',`Six fieldnotes, ${wordLength} letters each`);
 el('adaptive-info').hidden=false;el('adaptive-explanation').hidden=!adaptive;
 const remaining=remainingAnswerCount(observedClues(run)),count=`${remaining} possible ${remaining===1?'answer remains':'answers remain'}.`;
 if(el('candidate-count').textContent!==count)el('candidate-count').textContent=count;
 el('candidate-count').title='Words from this language and length’s answer list matching every revealed clue. Possible answer: Yes/No means list membership, not current clue consistency.';
 el('puzzle-label').textContent=adaptive?'YOUR ADAPTIVE FIELDNOTES':daily?'TODAY’S FIELDNOTES':'YOUR PRACTICE FIELDNOTES';
 el('turn-label').textContent=outcome==='playing'?`${run.guesses.length}/6 NOTED`:`${outcome==='won'?'FOUND':adaptive?'CLOSED':'REVEALED'} · ${run.guesses.length}/6`;
 el('opening-help').hidden=!(outcome==='playing'&&difficulty(run)==='easy'&&run.guesses.length===0);
 const board=el('board');board.replaceChildren();
 for(let row=0;row<6;row++){
  const guess=run.guesses[row];const draft=row===run.guesses.length&&outcome==='playing';
  const letters=guess??(draft?run.draft:'');const clues=guess?(adaptive?run.feedback[row]:score(run.answer,guess)):null;
  const line=document.createElement('div');line.className=`board-row${draft?' active':''}${lastAccepted&&row===run.guesses.length-1?' just-noted':''}`;
  line.setAttribute('role','group');line.setAttribute('aria-label',`Fieldnote ${row+1}${draft?', current':''}${guess?`: ${guess}`:''}`);
  for(let i=0;i<wordLength;i++){
   const tile=document.createElement('span');tile.className=`tile ${clues?.[i]??''}${!clues&&letters[i]?' filled':''}`;
   tile.setAttribute('aria-label',`Position ${i+1}: ${letters[i]??'blank'}${clues?`, ${clueName[clues[i]]}`:''}`);
   const letter=document.createElement('b');letter.textContent=letters[i]??'';tile.append(letter);
   if(clues){const icon=document.createElement('small');icon.textContent=symbol[clues[i]];icon.setAttribute('aria-hidden','true');tile.append(icon);}
   line.append(tile);
  }if(guess){const fieldnote=document.createElement('div');fieldnote.className='fieldnote';fieldnote.append(line,inlineDefinition(guess));board.append(fieldnote)}else board.append(line);
 }
 let text=message;
 if(outcome==='won')text=`A little discovery: ${run.answer}. Found in ${run.guesses.length} ${run.guesses.length===1?'fieldnote':'fieldnotes'}.`;
 if(outcome==='lost')text=adaptive?`One surviving possible answer is ${run.answer}. ${run.candidates.length} still ${run.candidates.length===1?'fits':'fit'} all clues; no word was fixed in advance.`:`The word was ${run.answer}. Every fieldnote taught you something.`;
 if(adaptive&&outcome==='won')text=`You forced ${run.answer}: the only possible answer. Found in ${run.guesses.length} fieldnotes.`;
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
 if(!keyboard.childElementCount||keyboard.dataset.language!==language){
  keyboard.replaceChildren();keyboard.dataset.language=language;keyboard.lang=language;
  for(const row of language==='en'?['QWERTYUIOP','ASDFGHJKL','↵ZXCVBNM⌫']:['QWERTYUIOP','ASDFGHJKLÑ','↵ZXCVBNM⌫','ÁÉÍÓÚÜ']){
   const line=document.createElement('div');line.className='key-row';
   for(const key of row){
    const button=document.createElement('button');button.dataset.key=key;button.onclick=()=>input(key);line.append(button);
   }keyboard.append(line);
  }
 }
 for(const button of keyboard.querySelectorAll<HTMLButtonElement>('button')){
  const key=button.dataset.key!;const clue=keys[key];
  button.className=`key ${clue??''}${key==='↵'||key==='⌫'?' wide':''}`;
  button.textContent=key==='↵'?'ENTER':key;
  button.setAttribute('aria-label',key==='↵'?'Enter: submit guess':key==='⌫'?'Erase letter':`${key}${clue?`, ${clueName[clue]}`:''}`);
  if(clue){const small=document.createElement('small');small.textContent=symbol[clue];button.append(small);}
  button.disabled=outcome!=='playing'||!!difficultyBlock;
 }
 const stats=statistics(save.results,save.date,save.history,wordLength,language);
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
 const run=current();if(difficultyBlock){message=difficultyBlock;render();return}if(runOutcome(run)!=='playing')return;
 if(key==='↵'){
  const result=isImpossible(run)?submitImpossible(run,run.draft):submit(run,run.draft);
  if(save.mode==='impossible'&&isImpossible(result.run))save.impossible=result.run;else if(save.mode!=='impossible')save[save.mode]=result.run;
  if(result.error)message=result.error;
  else{lastAccepted=true;message=`Fieldnote ${result.run.guesses.length} noted. Follow the clues.`;if(save.mode==='daily')recordDaily(save,save.date,result.run);}
 }else if(key==='⌫'){run.draft=run.draft.slice(0,-1);message='Take your time. Follow the clues.';}
 else if(isLetter(key,language)&&run.draft.length<wordLength){run.draft+=key;message='Ready when you are.';}
 persist();render();
}
function setLanguage(selected:Language){
 if(selected===language)return;sync();persist();const mode=save.mode;
 suboptimalSession.stop();optimalSession.stop();definitions.close();expandedDefinitions.clear();
 language=selected;LENGTH_KEY=lengthPreferenceKey(language);wordLength=readLength();SAVE_KEY=saveKeyForPath(location.pathname,wordLength,language);({answers:ANSWERS,allowed:ALLOWED}=vocabulary(wordLength,language));
 definitions=createDefinitions(language);save=decode(read(),dateKey(new Date()),wordLength,language);save.mode=mode;
 try{localStorage.setItem(LANGUAGE_KEY,language)}catch{storageAvailable=false}
 message=`${languageLabel(language)} notebook opened. Other languages stay saved.`;lastAccepted=false;persist();render();
}
function setWordLength(length:WordLength){
 if(length===wordLength)return;sync();persist();const mode=save.mode;
 suboptimalSession.stop();optimalSession.stop();definitions.close();
 wordLength=length;SAVE_KEY=saveKeyForPath(location.pathname,length,language);({answers:ANSWERS,allowed:ALLOWED}=vocabulary(length,language));
 save=decode(read(),dateKey(new Date()),length,language);save.mode=mode;
 try{localStorage.setItem(LENGTH_KEY,String(length))}catch{storageAvailable=false}
 message=`${length}-letter notebook opened. Existing fieldnotes stay with their own length.`;lastAccepted=false;persist();render();
}
function setMode(mode:'daily'|'practice'|'impossible'){sync();save.mode=mode;message=mode==='impossible'?'The answer adapts to your guesses. Keep narrowing the possibilities.':mode==='daily'?'Your daily dispatch is waiting.':'Practice freely. Your daily marks stay separate.';persist();render();}
function nextPractice(){sync();save.practice=choosePractice(save.practice.answer,Math.random,globalDifficulty,wordLength,language);save.mode='practice';message='A fresh page. A new possibility.';persist();dialog.close();render();}
function nextImpossible(){sync();save.impossible=newImpossible(globalDifficulty,wordLength,language);save.mode='impossible';message=`A fresh adaptive round: ${ANSWERS.length.toLocaleString('en-US')} possibilities, six guesses.`;persist();dialog.close();render();}
function openImpossibleConfirm(){modal(`<h2>Restart the adaptive round?</h2><p>This replaces only your unfinished Absurd fieldnotes. Daily and Practice stay safe. Every new round starts with the same ${ANSWERS.length.toLocaleString('en-US')} possibilities and deterministic rules.</p><div class="dialog-actions"><button id="keep-impossible">Keep exploring</button><button id="next-impossible" class="primary">New Absurd round</button></div>`);el('keep-impossible').onclick=()=>dialog.close();el('next-impossible').onclick=nextImpossible;}
function modal(html:string){el('modal-content').innerHTML=html;const heading=el('modal-content').querySelector('h2');if(heading){heading.id='dialog-title';dialog.setAttribute('aria-labelledby','dialog-title');}if(!dialog.open)dialog.showModal();}
function openPracticeConfirm(){modal('<h2>Turn a fresh page?</h2><p>This replaces your unfinished practice fieldnotes. Your daily dispatch is safe.</p><div class="dialog-actions"><button id="keep-practice">Keep exploring</button><button id="next-practice" class="primary">Fresh practice</button></div>');el('keep-practice').onclick=()=>dialog.close();el('next-practice').onclick=nextPractice;}
function openHelp(){modal(`<h2>A little field guide.</h2>${language==='es-MX'?'<p>Spanish: accents count as distinct letters, including Ñ versus N. Use the accented on-screen keys or your Spanish keyboard. Each language and length has separate saved progress and statistics; difficulty is global. Learning examples are AI-authored with independent model review; other accepted words can have incomplete teaching coverage.</p>':''}<p>Choose 4–7 letters using Word length above the board, then find a word in six guesses. Each length has its own notebook and daily statistics; difficulty is global. Switching preserves other lengths and opens or resumes the selected notebook. Type letters or use the keyboard below the board; press Enter to submit.</p><div class="help-clues"><p><b>✓ In place</b> — right letter, right spot.</p><p><b>↔ Elsewhere</b> — right letter, another spot.</p><p><b>× Not here</b> — no unmatched copy left.</p></div><h3>One letter, one clue.</h3><p>Repeated letters count only as often as they appear. Exact matches are reserved first.</p><p>If the answer is <b>APPLE</b>, guessing <b>ALLEY</b> gives:</p><div class="example">${score('APPLE','ALLEY').map((c,i)=>`<span class="tile ${c}"><b>${'ALLEY'[i]}</b><small>${symbol[c]}</small></span>`).join('')}</div><p>Only one L exists: the first L is elsewhere, the second L has no remaining copy. E is elsewhere; Y is absent.</p><h3>Discover a word’s meaning.</h3><p>Definitions appear automatically below every submitted guess, advice suggestion and revealed answer. Only these displayed words are requested individually from Wiktionary; each displayed word is sent separately and the provider can see those words and your IP address. No puzzle identifier, draft, hidden answer or saved statistics is sent. Possible answer: Yes means membership in the selected language and length’s answer list, not whether the word still fits your clues. No gives a verified exclusion reason when available; otherwise it means the valid guess was not selected for this list. Coverage is incomplete and definitions never affect accepted guesses. Choose More meanings to see other definitions of the word, then Fewer meanings to collapse them.</p><h3>Choose your difficulty.</h3><p>Settings offers Easy, Normal, Hard and Strict. Easy permits any word and shows Optimal guesses based only on observed clues. Optional Show Suboptimal guesses is off by default and available in every mode. Advice marks the round Assisted permanently; its one-step ranking does not guarantee an optimal overall strategy. Hard fixes greens and reuses green/yellow copies. Strict also rules out prior yellow positions and gray letters, enforces duplicate limits, and checks all earlier clues. Any consistent dictionary word is allowed. Hard/Strict can be selected mid-round when every earlier guess meets the chosen rules; incompatible rounds pause until you change difficulty or explicitly start that round over. Easy can be enabled midgame on an unfinished puzzle; assistance stays marked after switching it off. Difficulty is global across modes, languages and lengths. Completed results keep their recorded difficulty.</p><h3>Three ways to explore.</h3><p><b>Absurd:</b> adaptive answers, not a preselected word. Only the ${ANSWERS.length.toLocaleString('en-US')} possible answers can be answers. Each valid guess keeps the largest consistent answer group. Ties avoid a win when possible, then follow a fixed clue order. All four difficulties are available in Settings and use only revealed adaptive clues. The global difficulty also applies to Absurd. Surviving possibilities are shown. Six guesses, separate saved round/results, and no daily statistics. It is a greedy adversary, not a proof of an optimal strategy or an unwinnable game.</p><p><b>Daily dispatch:</b> one shared puzzle per word length and UTC date. It changes at midnight UTC, even if your local date is different. Unfinished daily fieldnotes expire without a recorded loss.</p><p><b>Practice:</b> replay as often as you like. It resumes after reload and never changes daily statistics.</p><p>Words must be in our accepted-guess guide; unknown and repeated guesses use no turn. Winning or the sixth accepted guess completes the puzzle.</p><button id="start" class="primary">Let’s make a mark</button>`);el('start').onclick=()=>dialog.close();}
function openStats(){sync();const s=statistics(save.results,save.date,save.history,wordLength,language);modal(`<h2>Your ${wordLength}-letter daily notebook.</h2><p>${languageLabel(language)} · Small discoveries, counted once. Other lengths and languages have separate statistics.</p><div class="stats-grid"><div><b>${s.played}</b><span>Played</span></div><div><b>${s.percent}%</b><span>Win rate</span></div><div><b>${s.current}</b><span>Current streak</span></div><div><b>${s.best}</b><span>Best streak</span></div></div><h3>Fieldnotes to find the word</h3><div class="histogram">${s.histogram.map((count,i)=>`<div><span>${i+1}</span><div style="width:${Math.max(8,count/Math.max(1,...s.histogram)*100)}%"><b>${count}</b></div></div>`).join('')}</div><p class="fine-print">${s.wins} wins in ${s.played} completed daily dispatches. Streaks count consecutive UTC dates won. A loss or missed date breaks the streak. Yesterday’s winning streak remains current until today ends or is lost. Practice and Absurd do not count. Daily statistics combine difficulties; Easy/advice-enabled shares are marked Assisted.</p><p class="fine-print">Saved only in this browser. Clearing browser data or erasing the notebook removes these marks.</p>`);}
function openSettings(){sync();const run=current(),selected=globalDifficulty;modal(`<h2>Make yourself at home.</h2><label class="setting"><span><b>Difficulty</b><small>Global · all modes, languages and word lengths.</small></span><select id="difficulty" class="difficulty-select" aria-label="Difficulty" aria-describedby="difficulty-help">${(['easy','normal','hard','strict'] as const).map(mode=>`<option value="${mode}" ${mode===selected?'selected':''}>${mode==='easy'?'Easy':mode==='normal'?'Normal':mode==='hard'?'Hard':'Strict'}</option>`).join('')}</select></label><p id="global-difficulty-status" class="fine-print" role="status"></p><div id="difficulty-help" class="fine-print"><p><b>Easy:</b> unrestricted guesses with five Optimal guesses inferred only from observed clues. This marks the round Assisted permanently; turning Easy off cannot remove that label. Easy may be enabled midgame on an unfinished puzzle.</p><p><b>Normal:</b> any accepted word.</p><p><b>Hard:</b> keep greens fixed and reuse green/yellow copies. Gray letters, extra copies and previous yellow positions are allowed.</p><p><b>Strict:</b> match every previous clue. Move yellows, avoid ruled-out letters, and obey known minimum and maximum copy counts. Any consistent dictionary word is allowed.</p><p>Difficulty is shared across every mode, language and word length. Ongoing rounds adopt it if all earlier guesses meet its rules. Incompatible rounds pause without losing guesses: choose another difficulty or explicitly start that round over (marked Assisted because you have already seen clues). Easy/Normal allow unrestricted guesses. Assistance stays marked on shares. Completed rounds keep their recorded difficulty; your choice applies to new and unfinished rounds.</p></div><label class="setting"><span><b>Show Suboptimal guesses</b><small>Optional weak guesses in Daily, Practice and Absurd. Off by default. Enabling advice marks each active round Assisted permanently.</small></span><input id="suboptimal-toggle" type="checkbox" aria-label="Show Suboptimal guesses" ${save.settings.suboptimal?'checked':''}></label><label class="setting"><span><b>High contrast clues</b><small>Deeper tones; symbols always stay visible.</small></span><input id="contrast" type="checkbox" ${save.settings.contrast?'checked':''}></label><h3>Your notebook stays here.</h3><p>We save your daily and practice fieldnotes on this browser. There’s no account, tracking, or external posting.</p><button id="reset" class="danger">Erase saved notebook…</button>`);el('global-difficulty-status').textContent=difficultyBlock??(runOutcome(run)!=='playing'?`This completed result keeps ${difficulty(run)} difficulty. Your global choice applies to new and unfinished rounds.`:'Your selection follows you across every mode, language and length.');const selector=document.getElementById('difficulty');if(selector)selector.onchange=()=>{
 const selected=(el('difficulty') as HTMLSelectElement).value as Difficulty;sync();
 globalDifficulty=selected;applySelectedDifficulty();message=difficultyBlock??`${selected[0].toUpperCase()+selected.slice(1)} saved globally for every mode, language and word length. Completed results keep their recorded difficulty.`;
 persist();render();openSettings();el('difficulty').focus();
 };el('suboptimal-toggle').onchange=()=>{const enabled=(el('suboptimal-toggle') as HTMLInputElement).checked;sync();if(enabled)save.settings.suboptimal=true;else delete save.settings.suboptimal;persist();render();};el('contrast').onchange=()=>{sync();save.settings.contrast=(el('contrast') as HTMLInputElement).checked;persist();render();};el('reset').onclick=()=>{resetPending=true;modal(`<h2>Erase your notebook?</h2><p>This clears the current ${languageLabel(language)} ${wordLength}-letter notebook, including its guesses, daily statistics and local settings. Your global difficulty and other lengths and languages stay saved. It cannot be undone.</p><div class="dialog-actions"><button id="cancel-reset">Keep my notebook</button><button id="confirm-reset" class="danger">Erase everything</button></div>`);el('cancel-reset').onclick=()=>{resetPending=false;openSettings();};el('confirm-reset').onclick=()=>{if(!resetPending)return;resetPending=false;try{localStorage.removeItem(SAVE_KEY)}catch{storageAvailable=false;}save=emptySave(dateKey(new Date()),false,wordLength,language);message='A clean notebook. Make your first mark.';persist();dialog.close();render();};};}
function openAbout(){if(language==='es-MX'){const covered=ANSWERS.filter(word=>teachingFor(word,language)).length;modal(`<h2>Spanish word and learning guide.</h2><p>${ANSWERS.length.toLocaleString('en-US')} possible answers and ${ALLOWED.size.toLocaleString('en-US')} accepted guesses at ${wordLength} letters. All modes use the same possible-answer pool, independently of teaching coverage. RLA-es 2.9 es-MX spelling covers shared Spanish vocabulary; it does not certify frequency or exclusive Mexican usage.</p><p>Possible answers require a documented independent base-word sense in the pinned Spanish Wiktionary extract and wordfreq Zipf ≥3.5 (about three occurrences per million), with no per-length cap. Plural-only and conjugated-only senses are excluded, including gerunds/participles without independent meanings. Other ordinary base words, including adverbs and fixed interjections, can qualify. Source-labelled rare, outdated, offensive or regionally unsuitable senses are excluded; reviewed exceptions address ambiguous homographs. Independent ordinary senses such as VINO (wine) and TRAJE (suit) remain. Frequency measures spellings across general Spanish, not individual senses or Mexico specifically; dictionary labels and model review have gaps. This is a transparent selection, not every Spanish word or certified Mexican frequency data.</p><p>${covered} of this length’s ${ANSWERS.length} possible answers have complete bundled teaching material. The ${SPANISH_TEACHING_TOTAL.toLocaleString('en-US')} original reviewed teaching records remain unchanged, with translations, Mexican Spanish examples and English sentence translations. Across all lengths, ${translationCoverage.translated.toLocaleString('en-US')} of ${translationCoverage.accepted.toLocaleString('en-US')} accepted words have at least one English meaning or reviewed grammatical reading; ${translationCoverage.missing.toLocaleString('en-US')} remain without a verified bundled English meaning. This does not cover every meaning or every grammatical use. Example-sentence coverage remains ${translationCoverage.completeExamples.toLocaleString('en-US')} words.</p><p>Additional meanings load locally by length. English Wiktionary supplies dictionary meanings and explicitly labelled, automatically generated forms from reviewed English predicates and source grammar; these are not dictionary quotations or native-reviewed Mexican examples. Context-dependent clause readings are labelled. Spanish-edition Wiktionary supplies selected English equivalents where available. Apertium/AGID form data is separately identified under GPL version2, with original sources and notices bundled. Word-list membership, possible-answer eligibility and advice never depend on translation coverage. Unknown forms remain unavailable rather than receiving a placeholder translation. Sources can contain errors; independent model review does not constitute native-human certification. Empty teaching fields stay hidden, and definitions remain a separate sourced section.</p><p>Lexical selection metadata: Spanish Wiktionary contributors, extracted through <a href="https://kaikki.org/dictionary/rawdata.html" target="_blank" rel="noopener noreferrer">Kaikki / Wiktextract</a>, and wordfreq v3.0.2 by Robyn Speer and contributors, under CC BY-SA 4.0. Full <a href="./third-party/spanish-selection/wordfreq-README.md" target="_blank" rel="noopener noreferrer">wordfreq acknowledgments and notices</a> retain the underlying sources and freely available SUBTLEX credits. RLA-es sources and modified word lists are used under the offered <a href="./third-party/es-MX/MPL-1.1.txt" target="_blank" rel="noopener noreferrer">MPL 1.1</a>; complete original <a href="./third-party/es-MX/README.txt" target="_blank" rel="noopener noreferrer">authors/notices</a>, dictionary and affix sources are bundled. The nspell 2.1.5 MIT parser is development-only. Teaching data and modified Wiktionary definitions are <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. See WORDS-LICENSE.md for sources, hashes, transformations and review limits.</p><p>Accents stay distinct and count once after NFC normalization. Ñ is never N; CH and LL each count as two letters. Each language/length has an independent UTC daily cycle, notebooks and statistics; Subsequent progress stays separate when switching languages. Lexi Conquest is independent, not affiliated with The New York Times, Wordle, Wiktionary or RLA-es.</p>`);return;}modal(`<h2>An independent field guide.</h2><p>Lexi Conquest is an original, independent word game. It is not affiliated with or endorsed by The New York Times or Wordle.</p><p>Lexi Conquest accepts <b>${ALLOWED.size.toLocaleString('en-US')} ${wordLength}-letter guesses</b> and selects answers only from <b>${ANSWERS.length.toLocaleString('en-US')} filtered common-tier SCOWL words</b> in Daily, Practice and Absurd. Other accepted words remain exploratory guesses; advice counts the possible answers.</p><p>Both lists are modified selections from <a href="https://github.com/en-wl/wordlist/tree/5ef55f9c42730ebe4394a78b77855468a6f15dd2/scowl" target="_blank" rel="noopener noreferrer">SCOWL 2020.12.07</a>, pinned by release revision and checksums. Guesses use size80. Answers start at size35, then remove recognized plural nouns and past-tense verbs using pinned AGID2016.01.19 morphology and reviewed exceptions. Regular and irregular forms are covered. Common independent senses such as FOUND (establish) and WOUND (injury) remain; present-tense and participle-only forms may remain. Grammar data has gaps, so this is a documented curation policy, not a claim of perfect classification. Both lists retain lowercase ${wordLength}-letter ASCII entries from general, American and British word categories. Names, abbreviation categories, contractions and accented forms are excluded. These are independent English lists, with different coverage from Wordle; no official NYT parity is claimed.</p><p><b>Word-list notices:</b> SCOWL collective work Copyright 2000-2018 Kevin Atkinson. Includes <b>UK Advanced Cryptics Dictionary: Copyright (c) J Ross Beresford 1993-1999. All Rights Reserved.</b> AGID morphology Copyright2000-2016/2000-2014 Kevin Atkinson and contributors; its <a href="./third-party/AGID-Copyright.txt" target="_blank" rel="noopener noreferrer">complete source notices</a> are retained. Other contributor notices also apply. Redistribution is permitted under the retained <a href="./third-party/SCOWL-Copyright.txt" target="_blank" rel="noopener noreferrer">complete permission notices</a>, including WordNet and VarCon terms. This is a modified selection for the chosen length, not an unmodified official dictionary. See WORDS-LICENSE.md for exact provenance and transformations.</p><p class="fine-print">SCOWL common35 guide · ${ANSWERS.length.toLocaleString('en-US')}-day cycle in alphabetical order, starting January1,2026 UTC. Your device clock determines the date. Existing notebooks and settings continue under the new name.</p>`);}

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
el('language').onchange=()=>{const value=(el('language') as HTMLSelectElement).value;if(isLanguage(value))setLanguage(value)};
el('word-length').onchange=()=>{const value=Number((el('word-length') as HTMLSelectElement).value);if(isWordLength(value))setWordLength(value)};
el('help').onclick=openHelp;el('guide').onclick=openHelp;el('stats').onclick=openStats;el('settings').onclick=openSettings;el('about').onclick=openAbout;
el('daily').onclick=()=>setMode('daily');el('practice').onclick=()=>setMode('practice');el('impossible').onclick=()=>setMode('impossible');
window.addEventListener('pointerdown',()=>{typingOnButton=false;});
window.addEventListener('keydown',event=>{
 if(event.key==='Tab')typingOnButton=false;
 if(event.ctrlKey||event.metaKey||event.altKey||dialog.open||event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLSelectElement)return;
 const key=event.key==='Enter'?'↵':event.key==='Backspace'?'⌫':normalizeGuess(event.key,language);
 // Disclosure summaries and source links keep native keyboard activation.
 if(event.key==='Enter'&&event.target instanceof HTMLElement&&event.target.closest('summary,a'))return;
 // Native buttons own Enter/Space activation; letter input still works while a key has focus.
 if(event.key==='Enter'&&event.target instanceof HTMLButtonElement&&!typingOnButton)return;
 if(key==='↵'||key==='⌫'||isLetter(key,language)){event.preventDefault();typingOnButton=true;input(key);}
});
function refresh(){const before=save.date;sync();if(before!==save.date)message='A fresh UTC dispatch has arrived.';render();}
window.addEventListener('beforeunload',()=>{definitions.close();suboptimalSession.stop();optimalSession.stop();});
window.addEventListener('focus',refresh);window.addEventListener('storage',event=>{if(event.key===SAVE_KEY||event.key===DIFFICULTY_KEY)refresh();});
setInterval(()=>{if(dateKey(new Date())!==save.date)refresh();},15_000);
persist();render();
