import {previousEnglishDataset,previousEnglishAnswers} from './legacy-english.ts';
import {notebookDailyAnswer,DAILY_SCHEDULE_VERSION,DAILY_SHUFFLE_START,LEGACY_DAILY_SCHEDULE,type DailyScheduleContext} from './daily-schedule.ts';
import {readNotebookStats,recordCompletion,initializeNotebookStats,type NotebookStats} from './notebook-statistics.ts';
import {validUniqueClue} from './one.ts';
import {isEnglish,usesAccentEquivalence,normalizeGuess,savedDutchRules,validLetters,type DutchRules,type Language} from './language.ts';
import {newImpossible,restoreImpossible,impossibleSnapshot,type ImpossibleRun} from './impossible.ts';
import {vocabulary,answerDataset,PREVIOUS_ANSWER_DATASET} from './words.ts';
import {dailyAnswer, difficulty, DAY, newRun, status, submit, continueGuessing, awaitingContinuation, validDate, type Run,type Difficulty} from './domain.ts';
export const SAVE_KEY='morrowmark.v1';
export interface HistoricalResult {dutchRules?:DutchRules;won:boolean;turns:number;gaveUp?:boolean;extended?:boolean}
export interface Save extends DailyScheduleContext {
 version:3; englishAnswerUpdate?:true; dailyScheduleVersion?:1; dataset:string; notebookStats?:NotebookStats; language?:Language; history:Record<string,HistoricalResult>; date:string; dailyDate?:string; daily:Run; practice:Run; mode:'daily'|'practice'|'impossible'|'one'; impossible:ImpossibleRun; one:Run;
 results:Record<string,string[]>; settings:{contrast:boolean;hardMode:boolean;strictMode?:boolean;easyMode?:boolean;suboptimal?:boolean};
}
export function emptySave(date:string,mode:boolean|Difficulty=false,length=5,language:Language='en'):Save {
 return {version:3,dailyScheduleVersion:DAILY_SCHEDULE_VERSION,dataset:answerDataset(length,language),...(language==='en'?{}:{language}),history:{},date,daily:newRun(dailyAnswer(date,length,language),mode,language),practice:newRun(isEnglish(language)&&length===5?'APPLE':vocabulary(length,language).answers[0],mode,language),mode:'daily',one:newRun(vocabulary(length,language).answers[0],false,language),impossible:newImpossible('normal',length,language),results:{},settings:{contrast:false,hardMode:mode===true||mode==='hard',...(mode==='strict'?{strictMode:true}:mode==='easy'?{easyMode:true}:{})}};
}
function object(value:unknown):value is Record<string,unknown> {return typeof value==='object' && value!==null && !Array.isArray(value)}
function storedMode(value:unknown):Save['mode'] {return value==='evil'||value==='absurd'?'impossible':value==='practice'||value==='impossible'||value==='one'?value:'daily'}
function storedDifficulty(value:Record<string,unknown>):Difficulty {return value.difficulty==='easy'||value.difficulty==='hard'||value.difficulty==='strict'||value.difficulty==='normal'?value.difficulty:value.strictMode===true?'strict':value.hardMode===true?'hard':value.easyMode===true?'easy':'normal'}
function validatedRun(value:unknown, answer:string,language:Language='en'):Run|null {
 if(!object(value)||!Array.isArray(value.guesses))return null;
 if(value.dutchRules!==undefined&&value.dutchRules!==1&&value.dutchRules!==2)return null;
 const dutchRules=savedDutchRules(value),key=(word:string)=>usesAccentEquivalence(language,dutchRules)?normalizeGuess(word,language,dutchRules):word;
 const ALLOWED=vocabulary(answer.length,language,dutchRules).allowed,guesses:string[]=[],seen=new Set<string>();
 if(value.guesses.length>ALLOWED.size||value.guesses.length>6&&value.continuation!=='unlimited')return null;
 for(const guess of value.guesses){if(typeof guess!=='string'||!ALLOWED.has(guess)||seen.has(key(guess))||seen.has(key(answer)))return null;guesses.push(key(guess));seen.add(key(guess))}
 const continuation=value.continuation==='pending'||value.continuation==='unlimited'?value.continuation:undefined;
 if(continuation==='pending'&&(guesses.length!==6||seen.has(key(answer)))||continuation==='unlimited'&&(guesses.length<6||guesses.length===6&&seen.has(key(answer))))return null;
 const draft=typeof value.draft==='string'&&validLetters(key(value.draft),language)&&key(value.draft).length<=answer.length?key(value.draft):'';
 const run:Run={answer,guesses,draft,...(language==='nl-NL'?{dutchRules}:{}),...(language==='en'?{}:{language}),...(continuation?{continuation}:{}),...(value.assisted===true||value.easyMode===true||value.difficulty==='easy'?{assisted:true}:{}),...(value.gaveUp===true&&!seen.has(key(answer))&&(guesses.length<6||continuation)?{gaveUp:true}:{})};
 if(status(run)!=='playing'||awaitingContinuation(run))run.draft='';
 const selected=storedDifficulty(value);if(selected==='easy')run.easyMode=true;
 if(selected==='strict'||selected==='hard'){
  let replay=newRun(answer,selected,language,dutchRules);
  for(const guess of guesses){if(awaitingContinuation(replay)&&continuation==='unlimited')replay=continueGuessing(replay);const next=submit(replay,guess);if(next.error)return run;replay=next.run}
  if(selected==='strict')run.strictMode=true;else run.hardMode=true;
 }
 return run;
}
export function dailyPuzzleDate(save:Pick<Save,'date'|'dailyDate'>):string {return save.dailyDate??save.date}
export function recordDaily(save:Save,date:string,run:Run):void {
 if('variant' in run&&run.variant==='impossible')return;
 if((run.language??'en')===(save.language??'en')&&run.answer.length===save.daily.answer.length&&validDate(date) && run.answer===notebookDailyAnswer(save,date,run.answer.length,run.language) && status(run)!=='playing' && !save.results[date]) {save.results[date]=[...run.guesses];save.history[date]={...(run.language==='nl-NL'?{dutchRules:run.dutchRules??2}:{}),won:status(run)==='won',turns:run.guesses.length,...(run.gaveUp?{gaveUp:true}:{}),...(run.continuation==='unlimited'?{extended:true}:{})};}
}
export function decode(raw:string|null,today:string,length=5,language:Language='en',target?:string):Save {
 const {answers:ANSWERS}=vocabulary(length,language);const save=emptySave(today,false,length,language); if(!raw)return save;
 try{
  const value:unknown=JSON.parse(raw);
  if(!object(value)||value.version!==3)return save;
  if((value.language!==undefined&&value.language!==language)||(language!=='en'&&value.language!==language))return save;
  const updatedEnglish=language==='en'&&value.dataset===previousEnglishDataset(length);let restartedDaily=false;
  if(language==='en'&&(updatedEnglish||value.englishAnswerUpdate===true))save.englishAnswerUpdate=true;
  const replacedGuide=(language==='en'&&length===5&&value.dataset===PREVIOUS_ANSWER_DATASET)||(language==='es-MX'&&(value.dataset===`es-MX-rla2.9-starter-${length}-v1`||value.dataset===`es-MX-rla2.9-common-${length}-v2`));
  if(value.dataset!==answerDataset(length,language)&&!replacedGuide&&!updatedEnglish)return save;
  if(value.dailyScheduleVersion!==undefined&&value.dailyScheduleVersion!==DAILY_SCHEDULE_VERSION)return save;
  const schedules:NonNullable<Save['dailySchedules']>={};
  if(object(value.dailySchedules))for(const [date,kind] of Object.entries(value.dailySchedules))if(validDate(date)&&date>=DAILY_SHUFFLE_START&&date<=today&&kind===LEGACY_DAILY_SCHEDULE)schedules[date]=kind;
  if(value.dailyScheduleVersion===undefined){
   // A pre-shuffle client can remain cached after activation. Preserve its dated rounds,
   // including a started zero-guess round, using the known old rule, never its raw answer.
   const dates=new Set([...Object.keys(object(value.results)?value.results:{}),...Object.keys(object(value.history)?value.history:{})]);
   if(object(value.daily))dates.add(validDate(value.dailyDate)?value.dailyDate:String(value.date));
   for(const date of dates)if(validDate(date)&&date>=DAILY_SHUFFLE_START&&date<=today)schedules[date]=LEGACY_DAILY_SCHEDULE;
  }
  if(Object.keys(schedules).length)save.dailySchedules=schedules;
  if(language==='en'&&previousEnglishDataset(length)){
   const previous:NonNullable<Save['englishAnswerSchedules']>={};
   if(object(value.englishAnswerSchedules))for(const [date,kind] of Object.entries(value.englishAnswerSchedules))if(kind==='previous'&&validDate(date)&&date<=today)previous[date]='previous';
   if(updatedEnglish){
    const dates=new Set([...Object.keys(object(value.results)?value.results:{}),...Object.keys(object(value.history)?value.history:{})]);
    if(object(value.daily))dates.add(validDate(value.dailyDate)?value.dailyDate:String(value.date));
    for(const date of dates)if(validDate(date)&&date<=today)previous[date]='previous';
   }
   if(Object.keys(previous).length)save.englishAnswerSchedules=previous;
  }
  save.settings.hardMode=object(value.settings)&&(value.settings.hardMode===true||value.settings.difficulty==='hard');
  if(object(value.settings)&&(value.settings.easyMode===true||value.settings.difficulty==='easy')){save.settings.easyMode=true;save.settings.hardMode=false;}
  if(object(value.settings)&&value.settings.suboptimal===true)save.settings.suboptimal=true;
  if(object(value.settings)&&(value.settings.strictMode===true||value.settings.difficulty==='strict')){save.settings.strictMode=true;save.settings.hardMode=false;delete save.settings.easyMode;}
  save.daily=newRun(notebookDailyAnswer(save,today,length,language),difficulty(save.settings),language);
  save.practice=newRun(isEnglish(language)&&length===5?'APPLE':ANSWERS[0],difficulty(save.settings),language);
  save.settings.contrast=object(value.settings)&&value.settings.contrast===true;
  if(replacedGuide){
   // Read only preferences from the known previous guide, never its clues, answers or outcomes.
   save.daily=newRun(notebookDailyAnswer(save,today,length,language),validDate(value.date)&&value.date===today&&object(value.daily)?storedDifficulty(value.daily):difficulty(save.settings),language);
   save.practice=newRun(isEnglish(language)&&length===5?'APPLE':ANSWERS[0],object(value.practice)?storedDifficulty(value.practice):difficulty(save.settings),language);
   const adaptive=object(value.impossible)?value.impossible:object(value.absurd)?value.absurd:object(value.evil)?value.evil:null;
   save.impossible=newImpossible(adaptive?storedDifficulty(adaptive):'normal',length,language);save.mode=storedMode(value.mode);if(save.mode==='one')save.mode='daily';
   return save;
  }
  const marks=readNotebookStats(value.notebookStats,today);if(marks)save.notebookStats=marks;
  if(object(value.history))for(const [date,result] of Object.entries(value.history)){
   if(validDate(date)&&date<=today&&object(result)&&typeof result.won==='boolean'&&Number.isInteger(result.turns)&&Number(result.turns)>=0&&Number(result.turns)<=vocabulary(length,language).allowed.size&&(Number(result.turns)<=6||result.extended===true)&&(result.gaveUp===true?!result.won:result.won?Number(result.turns)>=1:result.turns===6&&result.extended!==true))save.history[date]={...(language==='nl-NL'?{dutchRules:savedDutchRules(result)}:{}),won:result.won,turns:Number(result.turns),...(result.gaveUp===true?{gaveUp:true}:{}),...(result.extended===true?{extended:true}:{})};
  }
  if(object(value.results)) for(const [date,guesses] of Object.entries(value.results)){
   if(!validDate(date)||date>today)continue;
   const run=validatedRun({guesses,dutchRules:save.history[date]?.dutchRules??1,...(save.history[date]?.gaveUp?{gaveUp:true}:{}),...(save.history[date]?.extended?{continuation:'unlimited'}:save.history[date]?.gaveUp&&Array.isArray(guesses)&&guesses.length===6?{continuation:'pending'}:{})},notebookDailyAnswer(save,date,length,language),language);
   if(run && status(run)!=='playing')recordDaily(save,date,run);
  }
  const roundDate=validDate(value.dailyDate)&&value.dailyDate<=today?value.dailyDate:value.date;
  if(validDate(roundDate)&&roundDate<=today){
   const run=validatedRun(value.daily,notebookDailyAnswer(save,roundDate,length,language),language);
   if(run&&status(run)==='playing'&&!save.results[roundDate]&&save.englishAnswerSchedules?.[roundDate]==='previous'&&!ANSWERS.includes(run.answer)){
    // A removed answer cannot remain a live puzzle: advice must use the eligible pool.
    restartedDaily=true;delete save.englishAnswerSchedules[roundDate];if(!Object.keys(save.englishAnswerSchedules).length)delete save.englishAnswerSchedules;
    save.daily=newRun(notebookDailyAnswer(save,today,length,language),storedDifficulty(object(value.daily)?value.daily:{}),language);
    if(save.notebookStats){save.notebookStats.exposure.daily=null;delete save.notebookStats.setupPending?.daily;}
   }else if(run){recordDaily(save,roundDate,run);recordCompletion(save,'daily',roundDate,run);
    if(roundDate===today){save.daily=run}
    else if(status(run)==='playing'&&run.continuation&&!save.results[roundDate]){save.daily=run;save.dailyDate=roundDate}
   }
  }
  // A terminal ledger entry is authoritative when a stale tab saved an unfinished run.
  const activeDate=dailyPuzzleDate(save);
  if(save.results[activeDate]){
   const guesses=save.results[activeDate];
   const matching=save.daily.guesses.length===guesses.length&&save.daily.guesses.every((guess,i)=>guess===guesses[i]);
   save.daily={...newRun(notebookDailyAnswer(save,activeDate,length,language),matching?difficulty(save.daily):'normal',language,save.history[activeDate]?.dutchRules??1),guesses:[...guesses],...(matching&&save.daily.assisted?{assisted:true}:{}),...(save.history[activeDate]?.gaveUp?{gaveUp:true}:{}),...(save.history[activeDate]?.extended?{continuation:'unlimited' as const}:save.history[activeDate]?.gaveUp&&guesses.length===6?{continuation:'pending' as const}:{})};
  }
  if(object(value.practice)&&typeof value.practice.answer==='string'&&(ANSWERS.includes(value.practice.answer)||save.englishAnswerUpdate&&previousEnglishAnswers(length)?.includes(value.practice.answer))){
   const run=validatedRun(value.practice,value.practice.answer,language);
   if(run&&(ANSWERS.includes(run.answer)||save.englishAnswerUpdate&&status(run)!=='playing'&&previousEnglishAnswers(length)?.includes(run.answer)))save.practice=run;
  }
  const adaptive=restoreImpossible(value.impossible)??restoreImpossible(value.absurd)??restoreImpossible(value.evil);
  save.impossible=adaptive?.answer.length===length&&(adaptive.language??'en')===language?adaptive:newImpossible(updatedEnglish&&object(value.impossible)?storedDifficulty(value.impossible):'normal',length,language);if(target)save.impossible.target=target;
  if(updatedEnglish)initializeNotebookStats(save);
  if(updatedEnglish&&save.notebookStats){
   const marks=save.notebookStats;if(restartedDaily){marks.exposure.daily=null;delete marks.setupPending?.daily;}
   // New practice rounds must not inherit completed round IDs or exposure.
   for(const mode of ['practice','impossible'] as const){
    const restarted=mode==='impossible'?!adaptive:!object(value.practice)||save.practice.answer!==value.practice.answer;
    if(restarted&&mode==='practice'&&object(value.practice))save.practice=newRun(save.practice.answer,storedDifficulty(value.practice),language);
    if(restarted&&!(mode==='impossible'&&target)){
     marks.active[mode]=`${mode}:${marks.nextId++}`;marks.exposure[mode]=null;delete marks.setupPending?.[mode];
    }else if(restarted&&!marks.records[marks.active[mode]]){marks.exposure[mode]=null;delete marks.setupPending?.[mode];}
   }
  }
  recordCompletion(save,'daily',dailyPuzzleDate(save));recordCompletion(save,'practice',today);recordCompletion(save,'impossible',today);
  if(object(value.one)&&typeof value.one.answer==='string'&&(ANSWERS.includes(value.one.answer)||save.englishAnswerUpdate&&previousEnglishAnswers(length)?.includes(value.one.answer))){
   const one=validatedRun(value.one,value.one.answer,language),previous=previousEnglishAnswers(length);
   if(one&&one.guesses.length&&(ANSWERS.includes(one.answer)&&validUniqueClue(one.answer,one.guesses[0],ANSWERS,language,one.dutchRules)||save.englishAnswerUpdate&&status(one)!=='playing'&&previous?.includes(one.answer)&&validUniqueClue(one.answer,one.guesses[0],previous,language,one.dutchRules)))save.one=one;
  }
  if(updatedEnglish&&object(value.one)&&Array.isArray(value.one.guesses)&&value.one.guesses.length&&!save.one.guesses.length&&save.notebookStats){save.notebookStats.exposure.one=null;delete save.notebookStats.setupPending?.one;}
  recordCompletion(save,'one',today);
  save.mode=storedMode(value.mode);if(save.mode==='one'&&!save.one.guesses.length)save.mode='daily';
  save.settings.contrast=object(value.settings)&&value.settings.contrast===true;
  return save;
 }catch{return save}
}
export function statistics(results:Record<string,string[]>,today:string,history:Record<string,HistoricalResult>={},length=5,language:Language='en'){
 const outcomes={...history};for(const [date,guesses] of Object.entries(results))if(!outcomes[date])outcomes[date]={won:guesses.includes(dailyAnswer(date,length,language)),turns:guesses.length};
 const dates=Object.keys(outcomes).filter(date=>date<=today).sort();
 const histogram=[0,0,0,0,0,0];let wins=0,best=0,chain=0,last='';
 for(const date of dates){
  if(outcomes[date].won){
   wins++;if(outcomes[date].turns<=6)histogram[outcomes[date].turns-1]++;
   chain=last&&Date.parse(date)-Date.parse(last)===DAY?chain+1:1;
   best=Math.max(best,chain);last=date;
  }else{chain=0;last='';}
 }
 const yesterday=new Date(Date.parse(today)-DAY).toISOString().slice(0,10);
 const current=last===today||last===yesterday?chain:0;
 return {played:dates.length,wins,percent:dates.length?Math.round(wins/dates.length*100):0,current,best,histogram};
}

/** Read external state before an action; a failing storage boundary must not freeze the UTC date. */
export function synchronize(previous:Save,today:string,read:()=>string|null,length=previous.daily.answer.length,language:Language=previous.language??'en',target?:string):{save:Save;available:boolean}{
 try{return {save:decode(read(),today,length,language,target),available:true};}
 catch{return {save:decode(encode(previous),today,length,language,target),available:false};}
}

/** Persist adaptive guesses only; candidates, feedback and the representative are reconstructed. */
export function encode(save:Save):string {const {one,...rest}=save;return JSON.stringify({...rest,...(one.guesses.length?{one}:{}),impossible:impossibleSnapshot(save.impossible)})}
