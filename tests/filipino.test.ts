import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {LANGUAGES,isLanguage,normalizeGuess,isLetter,keyboardRows,languageLabel,type Language} from '../src/language.ts';
import {vocabulary,supportedLengths,isSupportedLength,answerDataset,absurdDataset} from '../src/words.ts';
import {newRun,submit,score,dailyAnswer,shareText,choosePractice,type Difficulty} from '../src/domain.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
import {newImpossible,submitImpossible,impossibleSnapshot,restoreImpossible,impossibleShare} from '../src/impossible.ts';
import {saveKeyForPath,resetStorageForUpdate,storageEpochKey,STORAGE_EPOCH} from '../src/site.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {adviceKey} from '../src/advice-protocol.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
import {dailyOneMix} from '../src/daily-variants.ts';
import {smashPairCount,dailySmashPair,newSmashRun,submitSmash,restoreSmashRun} from '../src/smashare.ts';
import {dailyHiddenLetroso,practiceHiddenLetroso,newLetroso,submitLetroso,restoreLetroso,suggestLetroso,letrosoShare} from '../src/letroso.ts';
import {invalidDraft} from '../src/draft-validity.ts';
import {localDefinition} from '../src/local-definitions.ts';
import {DefinitionClient,parseDefinitions} from '../src/definitions.ts';
import {answerEligibility} from '../src/answer-eligibility.ts';
import {initializeNotebookStats,beginStatsPuzzle,settleNotebookStats,notebookStatistics} from '../src/notebook-statistics.ts';
import coverage from '../src/data/filipino/coverage.json';
const language='fil-PH' as const,date='2026-11-06';

test('Filipino registry, spelling and keyboard preserve Ñ while folding only optional vowel marks',()=>{
 assert.ok(LANGUAGES.includes(language));assert.ok(isLanguage(language));assert.equal(isLanguage('tl'),false);
 assert.equal(languageLabel(language),'Filipino (Philippines)');
 for(const word of ['búhay','bu\u0301hay','bùhay','bûhay'])assert.equal(normalizeGuess(word,language),'BUHAY');
 assert.equal(normalizeGuess('nin\u0303os',language),'NIÑOS');assert.notEqual(normalizeGuess('ñ',language),'N');
 assert.equal(normalizeGuess('ë',language),'Ë');assert.equal(isLetter('Ë',language),false);
 assert.equal(normalizeGuess('café','es-MX'),'CAFÉ');assert.equal(normalizeGuess('café','en'),'CAFÉ');
 assert.equal(isLetter('Ñ',language),true);assert.equal(isLetter('NG',language),false);
 assert.ok(keyboardRows(language).join('').includes('Ñ'));assert.ok(!keyboardRows(language).join('').includes('Á'));
 assert.equal(normalizeGuess('ngiti',language).length,5);
});

test('Filipino has five-letter source-backed guesses, independent common answers and complete bounded meaning coverage',()=>{
 const {answers,allowed}=vocabulary(5,language);assert.deepEqual(supportedLengths(language),[5]);
 for(const n of [3,4,6,7,8,9,10,11]){assert.equal(isSupportedLength(n,language),false);assert.throws(()=>vocabulary(n,language));}
 assert.equal(answers.length,coverage.answers);assert.equal(allowed.size,coverage.accepted);assert.ok(answers.length>=200);assert.ok(allowed.size>answers.length);
 assert.equal(new Set(answers).size,answers.length);assert.ok(answers.every(w=>/^[A-ZÑ]{5}$/.test(w)&&allowed.has(w)));
 assert.ok([...allowed].every(w=>/^[A-ZÑ]{5}$/.test(w)));assert.ok(answers.includes('BAHAY'));assert.ok(answers.includes('TUBIG'));assert.ok(answers.includes('NGITI'));
 for(const word of ['AMANG','BURAT','DIREK','KOREA','MAARI','MAYOR','TAONG']){assert.ok(allowed.has(word));assert.ok(!answers.includes(word));}

 assert.ok(!allowed.has('APPLE'));assert.ok(!allowed.has('MAKA-'));assert.equal(coverage.definedGuesses,allowed.size);
 for(const other of ['en','es-MX'] as const){assert.notEqual(answerDataset(5,language),answerDataset(5,other));assert.notEqual(absurdDataset(5,language),absurdDataset(5,other));assert.equal(supportedLengths(other).length,9);}
});

for(const difficulty of ['easy','normal','hard','strict'] as Difficulty[])test(`Filipino ${difficulty} supports scoring, daily/practice, adaptive reconstruction and isolated persistence`,()=>{
 const answer=dailyAnswer(date,5,language);assert.equal(dailyAnswer(date,5,language),answer);
 const first=submit(newRun('BUHAY',difficulty,language),'bahay');assert.equal(first.error,undefined);assert.deepEqual(score('BUHAY','BAHAY'),['exact','absent','exact','exact','exact']);
 const solved=submit(first.run,'búhay');assert.equal(solved.error,undefined);assert.equal(solved.run.guesses.at(-1),'BUHAY');
 const fresh=choosePractice('BAHAY',()=>0,difficulty,5,language);assert.equal(fresh.language,language);assert.notEqual(fresh.answer,'BAHAY');
 const save=emptySave(date,difficulty,5,language);save.practice=first.run;save.practice.draft='TUB';const restored=decode(encode(save),date,5,language);assert.deepEqual(restored,save);
 const adaptive=submitImpossible(newImpossible(difficulty,5,language),'BAHAY');assert.equal(adaptive.error,undefined);assert.deepEqual(restoreImpossible(impossibleSnapshot(adaptive.run)),adaptive.run);
 assert.ok(adaptive.run.candidates.every(word=>vocabulary(5,language).answers.includes(word)));
 assert.match(impossibleShare(adaptive.run),/Filipino/);assert.match(shareText(date,solved.run),/Filipino/);assert.ok(!shareText(date,solved.run).includes('BUHAY'));
});

test('Filipino save keys and resets preserve existing English/Spanish notebooks and reject wrong-language metadata',()=>{
 for(const path of ['/','/kata-inspired-by-wordle-codex-dot/']){
  const allKeys=LANGUAGES.map(lang=>saveKeyForPath(path,5,lang));assert.equal(new Set(allKeys).size,LANGUAGES.length);const keys=['en','es-MX','fil-PH'].map(lang=>saveKeyForPath(path,5,lang as Language));assert.ok(keys[1].endsWith('.es-MX'));assert.ok(keys[2].endsWith('.fil-PH'));
  const state=new Map([[keys[0],'english'],[keys[1],'spanish'],[keys[2],'filipino'],[storageEpochKey(path),STORAGE_EPOCH],['unrelated','keep']]);
  const storage={get length(){return state.size},key:(i:number)=>[...state.keys()][i]??null,getItem:(k:string)=>state.get(k)??null,setItem:(k:string,v:string)=>{state.set(k,v)},removeItem:(k:string)=>{state.delete(k)}};
  assert.equal(resetStorageForUpdate(storage,path),false);assert.equal(state.get(keys[0]),'english');assert.equal(state.get(keys[1]),'spanish');assert.equal(state.get('unrelated'),'keep');
 }
 const saved=emptySave(date,false,5,language);saved.practice=submit(newRun('BUHAY','normal',language),'BAHAY').run;
 for(const wrong of ['en','es-MX',undefined]){const value=JSON.parse(encode(saved));value.language=wrong;assert.deepEqual(decode(JSON.stringify(value),date,5,language).practice.guesses,[]);}
 const english=emptySave(date);english.practice.draft='CRA';assert.deepEqual(decode(encode(english),date),english);
});

test('Filipino completed daily statistics are recorded and restored within its notebook',()=>{
 const save=emptySave(date,false,5,language);initializeNotebookStats(save,true);assert.equal(beginStatsPuzzle(save,'daily','normal'),true);
 save.daily=submit(save.daily,save.daily.answer).run;settleNotebookStats(save);settleNotebookStats(save);
 const restored=decode(encode(save),date,5,language);assert.equal(notebookStatistics(restored,'daily','all',date).played,1);assert.equal(notebookStatistics(restored,'daily','all',date).wins,1);
});

test('Filipino One possibility and Smashare have viable deterministic daily pools',()=>{
 const mix=dailyOneMix(date,5,language);assert.equal(new Set(mix.map(p=>p.answer)).size,5);assert.deepEqual(dailyOneMix(date,5,language),mix);
 for(const pair of mix){const pattern=score(pair.answer,pair.clue);assert.equal(vocabulary(5,language).answers.filter(word=>score(word,pair.clue).every((v,i)=>v===pattern[i])).length,1);}
 assert.ok(smashPairCount(5,language)>0);const pair=dailySmashPair(date,5,language);const run=newSmashRun(pair,language,'normal');const solved=submitSmash(run,pair.merged);assert.equal(solved.error,undefined);assert.deepEqual(restoreSmashRun(solved.run,language,5),solved.run);
});

test('Filipino Letroso uses only supported lengths, rejects other lengths without throwing and restores safely',()=>{
 for(let i=1;i<=28;i++){const answer=dailyHiddenLetroso(`2026-11-${String(i).padStart(2,'0')}`,language);assert.equal(answer.length,5);}
 assert.equal(practiceHiddenLetroso(language,'',()=>0.99).length,5);
 const run=newLetroso('BUHAY',language,'normal');for(const word of ['ARAW','BAHAYAN','BA'])assert.ok(submitLetroso(run,word).error);
 assert.equal(submitLetroso(run,'búhay').run.guesses[0],'BUHAY');assert.equal(invalidDraft('ARAW','letroso',5,language),true);assert.equal(invalidDraft('BAHAY','letroso',5,language),false);
 assert.equal(restoreLetroso({...run,draft:'BAHAYA'},language,5),undefined);assert.equal(restoreLetroso({...run,length:4,answer:'ARAW'},language,4),undefined);
 assert.ok(suggestLetroso(run).words.every(word=>word.length===5));assert.match(letrosoShare(run,date),/Filipino/);
});

test('Filipino advice uses matching pools and language-specific cache identity without hidden answers',()=>{
 const run=submit(newRun('BUHAY','easy',language),'BAHAY').run,input=observedClues(run);
 assert.ok(!JSON.stringify(input).includes('BUHAY'));assert.notEqual(adviceKey(input),adviceKey({...input,language:'en'}));
 const result=analyzeObservations(input,'optimal');const candidates=possibleAnswers(input);assert.equal(result.totalCandidates,candidates.length);
 for(const item of result.suggestions){assert.ok(vocabulary(5,language).allowed.has(item.word));const counts=new Map<string,number>();for(const word of candidates){const key=score(word,item.word).join();counts.set(key,(counts.get(key)??0)+1)}assert.equal(item.worstCaseLeft,Math.max(...counts.values()));}
});

test('Filipino definitions are sourced local English meanings, not English/Spanish homograph fallbacks',async()=>{
 const parsed=parseDefinitions({tl:[{language:'Tagalog',partOfSpeech:'Noun',definitions:[{definition:'house'}]}],es:[{language:'Spanish',partOfSpeech:'Noun',definitions:[{definition:'wrong language'}]}]},'bahay',language);assert.equal(parsed.entries[0].senses[0],'house');assert.match(parsed.sourceUrl,/#Tagalog$/);
 const house=await localDefinition('BAHAY',language);assert.match(house.entries.flatMap(e=>e.senses).join(' '),/house/);assert.match(house.sourceUrl,/#Tagalog$/);assert.equal(house.license,'CC-BY-SA-4.0');
 const corrected=await localDefinition('KLASE',language);assert.ok(!corrected.entries.flatMap(e=>e.senses).some(s=>s.includes('above kingdom')));
 const missing=await localDefinition('APPLE',language);assert.equal(missing.entries.length,0);assert.match(missing.sourceUrl,/fil-PH/);
 const client=new DefinitionClient(undefined,6000,Date.now,language);assert.equal((await client.lookup('búhay')).word,'BUHAY');
 const other=new DefinitionClient(undefined,6000,Date.now,'en');assert.equal(other.peek('BUHAY'),null);
});

test('Filipino pinned source evidence, generated outputs and license notices reproduce without downloads',()=>{
 const root=new URL('../src/data/filipino/',import.meta.url),read=(name:string)=>readFileSync(new URL(name,root));
 const source=JSON.parse(read('source.json').toString());for(const [name,digest] of Object.entries(source.inputs))assert.equal(createHash('sha256').update(read(name)).digest('hex'),digest);
 for(const [name,digest] of Object.entries(coverage.outputs))assert.equal(createHash('sha256').update(read(name)).digest('hex'),digest);
 assert.match(source.wiktionary.format,/postprocessed/);assert.match(source.wiktionary.modifications,/Ñ remains distinct/);assert.equal(source.wordfreq.version,'3.0.2');
 const notice=readFileSync(new URL('../public/third-party/fil-PH/NOTICE.txt',import.meta.url),'utf8');assert.match(notice,/CC BY-SA 4.0/);assert.match(notice,/Wiktionary contributors/);assert.match(notice,/Robyn Speer/);
 assert.match(execFileSync(process.execPath,['scripts/generate-filipino.mjs','--check'],{encoding:'utf8'}),/"language":"fil-PH"/);
});

// Form labels are sometimes represented only as gloss text by the source.
test('Filipino answer selection omits form-only readings and retains independent senses',()=>{
 const selected=JSON.parse(readFileSync(new URL('../src/data/filipino/answer-selection.json',import.meta.url),'utf8'));
 for(const word of ['BUMUO','UMAGA','UMUWI','LAGAY','TULOY']){assert.ok(selected[word]);assert.ok(selected[word].senses.every((sense:{gloss:string})=>!/aspect of|imperative mood of/i.test(sense.gloss)));}
});

test('Filipino release removes the Beta wording without invalidating its existing dataset identities',async()=>{
 assert.equal(answerDataset(5,language),'fil-PH-wiktionary-wordfreq-5-beta-v1');
 assert.equal(absurdDataset(5,language),'fil-PH-wiktionary-wordfreq-absurd-5-beta-v1');
 assert.doesNotMatch((await localDefinition('BAHAY',language)).note??'',/\bbeta\b/i);
 for(const word of ['AMANG','DIREK','MAARI','BURAT'])assert.doesNotMatch(answerEligibility(word,5,language).reason,/\bbeta\b/i);
});
