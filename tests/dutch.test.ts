import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {LANGUAGES,isLanguage,normalizeSpelling,normalizeGuess,isLetter,isLetterInput,keyboardRows,languageLabel,validLetters} from '../src/language.ts';
import {vocabulary,supportedLengths,answerDataset,absurdDataset} from '../src/words.ts';
import {newRun,submit,score,dailyAnswer,shareText,choosePractice,type Difficulty} from '../src/domain.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
import {newImpossible,submitImpossible,impossibleSnapshot,restoreImpossible,impossibleShare} from '../src/impossible.ts';
import {saveKeyForPath,activeSaveKeyForPath,resetStorageForUpdate,preserveEnglishStorageForUpdate,storageEpochKey,STORAGE_EPOCH} from '../src/site.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {adviceKey} from '../src/advice-protocol.ts';
import {analyzeObservations,feedbackCode} from '../src/evil-advice.ts';
import {dailyOneMix,dailyAbsurdTarget} from '../src/daily-variants.ts';
import {smashPairCount,dailySmashPair,newSmashRun,submitSmash,restoreSmashRun} from '../src/smashare.ts';
import {dailyHiddenLetroso,practiceHiddenLetroso,newLetroso,submitLetroso,restoreLetroso,suggestLetroso,letrosoShare} from '../src/letroso.ts';
import {invalidDraft} from '../src/draft-validity.ts';
import {localDefinition} from '../src/local-definitions.ts';
import {DefinitionClient,parseDefinitions} from '../src/definitions.ts';
import {answerEligibility} from '../src/answer-eligibility.ts';
import {initializeNotebookStats,beginStatsPuzzle,settleNotebookStats,notebookStatistics} from '../src/notebook-statistics.ts';
import dutchWords from '../src/data/dutch/vocabulary.json';
const definitions=Object.assign({},...[3,4,5,6,7,8,9,10,11].map(length=>JSON.parse(readFileSync(new URL(`../src/data/dutch/definitions-${length}.json`,import.meta.url),'utf8'))));
const language='nl-NL' as const,date='2026-11-06';

test('Dutch registry and spelling keep IJ as two tiles and fold accents while retaining canonical spelling',()=>{
 assert.ok(LANGUAGES.includes(language));assert.ok(isLanguage(language));assert.equal(isLanguage('nl'),false);
 assert.equal(languageLabel(language),'Nederlands (Nederland)');
 for(const word of ['ijs','ĳs','ĲS'])assert.equal(normalizeGuess(word,language),'IJS');
 assert.equal(normalizeGuess('ĳzer',language),'IJZER');assert.equal(normalizeGuess('ĳzer',language).length,5);
 assert.notEqual(normalizeGuess('ij',language),normalizeGuess('y',language));
 assert.equal(normalizeGuess('cafe\u0301',language),'CAFE');assert.equal(normalizeGuess('ree\u0308el',language),'REEEL');
 assert.equal(normalizeGuess('café',language),normalizeGuess('cafe',language));
 assert.equal(normalizeGuess('coöperatie',language),normalizeGuess('cooperatie',language));
 assert.equal(normalizeGuess('ĳs','en'),'ĲS');assert.equal(normalizeGuess('búhay','fil-PH'),'BUHAY');
 assert.equal(isLetter('IJ',language),false);assert.equal(isLetterInput('IJ',language),true);assert.equal(isLetterInput('IJ','en'),false);
 for(const invalid of ['-',' ',"'",'Ñ','ß'])assert.equal(isLetter(invalid,language),false);
 for(const letter of 'ÉËÏÖÜ')assert.ok(keyboardRows(language,1).join('').includes(letter));
});

test('Dutch separates source-backed guesses, common answers and local meanings at every supported length',()=>{
 assert.deepEqual(supportedLengths(language),[3,4,5,6,7,8,9,10,11]);
 for(const length of supportedLengths(language)){
  const {answers,allowed}=vocabulary(length,language),data=dutchWords[String(length) as keyof typeof dutchWords];
  assert.deepEqual(answers,data.answers);assert.equal(allowed.size,data.guesses.length);assert.ok(answers.length>=10,`sufficient answers at ${length}`);
  assert.ok(allowed.size>answers.length);assert.equal(new Set(answers).size,answers.length);
  for(const word of allowed){assert.equal(word.length,length);assert.equal(normalizeSpelling(word,language),word);assert.ok(validLetters(word,language));assert.ok((definitions as Record<string,unknown>)[word],word)}
  for(const word of answers){assert.ok(allowed.has(word));assert.equal(answerEligibility(word,length,language).possible,true);}
  assert.equal(answerDataset(length,language),`nl-NL-wiktionary-wordfreq-${length}-v1`);
  assert.equal(absurdDataset(length,language),`nl-NL-wiktionary-wordfreq-absurd-${length}-v1`);
 }
 for(const word of ['WATER','BROOD','GROEN','FIETS'])assert.ok(vocabulary(5,language).allowed.has(word));
 assert.ok(vocabulary(3,language).allowed.has('IJS'));assert.ok(vocabulary(5,language).allowed.has('IJZER'));
 assert.ok(vocabulary(4,language).allowed.has('CAFÉ'));assert.ok(vocabulary(5,language).allowed.has('REËEL'));
 assert.ok(!vocabulary(5,language).allowed.has('APPLE'));
});

for(const length of [3,4,5,6,7,8,9,10,11] as const)for(const level of ['easy','normal','hard','strict'] as Difficulty[])test(`Dutch ${length}-letter ${level}: scoring, daily/practice, adaptive play, persistence`,()=>{
 const {answers}=vocabulary(length,language),answer=dailyAnswer(date,length,language);
 assert.ok(answers.includes(answer));assert.equal(dailyAnswer(date,length,language),answer);
 const run=newRun(answer,level,language),solved=submit(run,answer.toLocaleLowerCase(language));assert.equal(solved.error,undefined);assert.equal(solved.run.guesses[0],normalizeGuess(answer,language));
 assert.deepEqual(score(answer,answer),Array(length).fill('exact'));
 const fresh=choosePractice(answer,()=>0,level,length,language);assert.equal(fresh.language,language);assert.notEqual(fresh.answer,answer);
 const save=emptySave(date,level,length,language);save.practice=run;save.practice.draft=answer.slice(0,2);assert.deepEqual(decode(encode(save),date,length,language),save);
 const adaptive=submitImpossible(newImpossible(level,length,language),answer);assert.equal(adaptive.error,undefined);assert.deepEqual(restoreImpossible(impossibleSnapshot(adaptive.run)),adaptive.run);
 assert.ok(adaptive.run.candidates.every(word=>answers.includes(word)));assert.match(impossibleShare(adaptive.run),/Nederlands/);assert.match(shareText(date,solved.run),/Nederlands/);assert.ok(!shareText(date,solved.run).includes(answer));
});

test('Dutch guesses normalize ligatures and accents without changing duplicate scoring',()=>{
 assert.deepEqual(score('WATER','KATER'),['absent','exact','exact','exact','exact']);
 assert.equal(submit(newRun('IJZER','normal',language),'ĳzer').run.guesses[0],'IJZER');
 assert.equal(submit(newRun('REËEL','normal',language),'ree\u0308el').run.guesses[0],'REEEL');
 assert.equal(invalidDraft('IJZER','fixed',5,language),false);
});

for(const length of [3,4,5,6,7,8,9,10,11] as const)test(`Dutch ${length}-letter variant pools support daily Absurd, One possibility and Smashare`,()=>{
 const mix=dailyOneMix(date,length,language);assert.equal(new Set(mix.map(p=>p.answer)).size,5);assert.deepEqual(dailyOneMix(date,length,language),mix);
 for(const pair of mix){const pattern=score(pair.answer,pair.clue,language);assert.equal(vocabulary(length,language).answers.filter(word=>score(word,pair.clue,language).every((v,i)=>v===pattern[i])).length,1);}
 const target=dailyAbsurdTarget(date,length,language);assert.ok(vocabulary(length,language).answers.includes(target.target));
 assert.ok(smashPairCount(length,language)>0);const pair=dailySmashPair(date,length,language);
 for(const level of ['easy','normal','hard','strict'] as Difficulty[]){const run=newSmashRun(pair,language,level),solved=submitSmash(run,pair.merged);assert.equal(solved.error,undefined);assert.deepEqual(restoreSmashRun(solved.run,language,length),solved.run);}
});

test('Dutch Letroso accepts every supported length and preserves accent spelling',()=>{
 for(let day=1;day<=28;day++){const answer=dailyHiddenLetroso(`2026-11-${String(day).padStart(2,'0')}`,language);assert.ok(vocabulary(answer.length,language).answers.includes(answer));}
 assert.ok(vocabulary(11,language).answers.includes(practiceHiddenLetroso(language,'',()=>0.99)));
 for(const length of supportedLengths(language))for(const level of ['easy','normal','hard','strict'] as Difficulty[]){
  const answer=vocabulary(length,language).answers[0],run=newLetroso(answer,language,level),solved=submitLetroso(run,answer);assert.equal(solved.error,undefined);
  assert.deepEqual(restoreLetroso(solved.run,language,length),solved.run);assert.ok(submitLetroso(run,'AA').error);assert.match(letrosoShare(solved.run,date),/Nederlands/);
 }
 const run=newLetroso('WATER',language,'easy');assert.ok(suggestLetroso(run).words.every(word=>vocabulary(word.length,language).answers.includes(word)));
});

test('Dutch advice uses matching pools and separate language cache identity',()=>{
 const run=submit(newRun('WATER','easy',language),'KATER').run,input=observedClues(run);
 assert.ok(!JSON.stringify(input).includes('WATER'));assert.notEqual(adviceKey(input),adviceKey({...input,language:'en'}));
 const result=analyzeObservations(input,'optimal'),candidates=possibleAnswers(input);assert.equal(result.totalCandidates,candidates.length);
 for(const item of result.suggestions){assert.ok(vocabulary(5,language).allowed.has(item.word));const counts=new Map<string,number>();for(const word of candidates){const key=score(word,item.word,language).join();counts.set(key,(counts.get(key)??0)+1)}assert.equal(item.worstCaseLeft,Math.max(...counts.values()));}
});

test('Dutch saves and statistics stay isolated without resetting existing languages',()=>{
 for(const path of ['/','/kata-inspired-by-wordle-codex-dot/']){
  const keys=LANGUAGES.map(lang=>activeSaveKeyForPath(path,5,lang));assert.equal(new Set(keys).size,LANGUAGES.length);assert.ok(keys.at(-1)!.endsWith('.nl-NL'));
  const state=new Map([[keys[0],'english'],[keys[1],'spanish'],[keys[2],'filipino'],[keys[3],'dutch'],[storageEpochKey(path),STORAGE_EPOCH],['unrelated','keep'],[activeSaveKeyForPath(path)+'.import-complete','1']]);
  const storage={get length(){return state.size},key:(i:number)=>[...state.keys()][i]??null,getItem:(key:string)=>state.get(key)??null,setItem:(key:string,value:string)=>{state.set(key,value)},removeItem:(key:string)=>{state.delete(key)}};
  const before=[...state];assert.equal(resetStorageForUpdate(storage,path),false);assert.equal(preserveEnglishStorageForUpdate(storage,path),0);assert.deepEqual([...state],before);
  assert.equal(saveKeyForPath(path,5,'fil-PH').replace('.fil-PH',''),saveKeyForPath(path));
 }
 const save=emptySave(date,false,5,language);initializeNotebookStats(save,true);assert.equal(beginStatsPuzzle(save,'daily','normal'),true);save.daily=submit(save.daily,save.daily.answer).run;settleNotebookStats(save);settleNotebookStats(save);
 const restored=decode(encode(save),date,5,language);assert.equal(notebookStatistics(restored,'daily','all',date).played,1);assert.equal(notebookStatistics(restored,'daily','all',date).wins,1);
 for(const wrong of ['en','es-MX','fil-PH'])assert.deepEqual(decode(encode(save),date,5,wrong as typeof language).daily.guesses,[]);
});

test('Dutch definitions are local English senses with original Dutch attribution, never homograph fallback',async()=>{
 const parsed=parseDefinitions({nl:[{language:'Dutch',partOfSpeech:'Noun',definitions:[{definition:'water'}]}],en:[{language:'English',partOfSpeech:'Noun',definitions:[{definition:'wrong language'}]}]},'water',language);assert.deepEqual(parsed.entries[0].senses,['water']);assert.match(parsed.sourceUrl,/#Dutch$/);
 const bread=await localDefinition('BROOD',language);assert.match(bread.entries.flatMap(e=>e.senses).join(' '),/bread/i);assert.match(bread.sourceUrl,/#Dutch$/);assert.equal(bread.license,'CC-BY-SA-4.0');
 const missing=await localDefinition('APPLE',language);assert.equal(missing.entries.length,0);assert.match(missing.sourceUrl,/nl-NL/);
 const client=new DefinitionClient(undefined,6000,Date.now,language);assert.equal((await client.lookup('ĳzer')).word,'IJZER');assert.equal(new DefinitionClient(undefined,6000,Date.now,'en').peek('IJZER'),null);
});

test('Dutch pinned source evidence and generated vocabulary reproduce offline',()=>{
 const root=new URL('../src/data/dutch/',import.meta.url),read=(name:string)=>readFileSync(new URL(name,root));
 const source=JSON.parse(read('source.json').toString());for(const [name,digest] of Object.entries(source.inputs))assert.equal(createHash('sha256').update(read(name)).digest('hex'),digest);
 const notice=readFileSync(new URL('../public/third-party/nl-NL/NOTICE.txt',import.meta.url),'utf8');assert.match(notice,/CC BY-SA 4.0/);assert.match(notice,/Wiktionary contributors/);assert.match(notice,/Robyn Speer/);
 execFileSync(process.execPath,['scripts/generate-dutch.mjs','--check'],{encoding:'utf8'});
});

for(const length of [8,9,10,11] as const)test(`Dutch ${length}-letter advice matches independent scoring without NaN`,()=>{
 const {answers,allowed}=vocabulary(length,language),run=newRun(answers[0],'easy',language),input=observedClues(run);
 const encode=(word:string)=>[...word].map(letter=>letter.charCodeAt(0)-65);
 for(const answer of answers.slice(0,5))for(const guess of [...allowed].slice(0,5)){
  const expected=score(answer,guess).reduce((code,clue)=>code*3+({absent:0,elsewhere:1,exact:2}[clue]),0);
  assert.equal(feedbackCode(encode(answer),encode(guess)),expected);
 }
 for(const kind of ['optimal','suboptimal'] as const){
  const result=analyzeObservations(input,kind);assert.equal(result.suggestions.length,5);
  for(const item of result.suggestions){
   const counts=new Map<string,number>();for(const answer of answers){const code=score(answer,item.word,language).join();counts.set(code,(counts.get(code)??0)+1)}
   assert.equal(item.worstCaseLeft,Math.max(...counts.values()));assert.equal(item.guaranteedEliminations,answers.length-item.worstCaseLeft);
   if(kind==='optimal')assert.equal(item.expectedSurvivors,[...counts.values()].reduce((sum,n)=>sum+n*n,0)/answers.length);
  }
 }
});
