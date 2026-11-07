import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,normalizeGuess,displaySpelling,languageLabel} from '../src/language.ts';
import {vocabulary,answerDataset,absurdDataset,supportedLengths} from '../src/words.ts';
import {newRun,submit,status,score,dailyAnswer,shareText,type Difficulty} from '../src/domain.ts';
import {newImpossible,submitImpossible,impossibleStatus,impossibleSnapshot,restoreImpossible} from '../src/impossible.ts';
import {newLetroso,submitLetroso,restoreLetroso,letrosoStatus,orderFeedback,dailyHiddenLetroso,practiceHiddenLetroso} from '../src/letroso.ts';
import {dailySmashPair,practiceSmashPair,makeSmashPair,newSmashRun,submitSmash,restoreSmashRun,smashStatus,smashPairCount} from '../src/smashare.ts';
import {dailyOneMix,dailyAbsurdTarget} from '../src/daily-variants.ts';
import {validUniqueClue,uniqueCluePairs} from '../src/one.ts';
import {emptySave,encode,decode,recordDaily} from '../src/persistence.ts';
import {activeSaveKeyForPath,PROJECT_PATH,resetStorageForUpdate} from '../src/site.ts';
import {variantKey,type Rules} from '../src/variant-context.ts';
import {DefinitionClient} from '../src/definitions.ts';
import {answerEligibility} from '../src/answer-eligibility.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {analyzeObservations} from '../src/evil-advice.ts';
const locales=['pt-BR','pt-PT'] as const,date='2026-11-07',levels:Difficulty[]=['easy','normal','hard','strict'];
for(const language of locales){
 test(`${language}: distinct datasets, keys and canonical answer pools at all lengths`,()=>{
  assert.deepEqual(supportedLengths(language),[3,4,5,6,7,8,9,10,11]);
  for(const length of supportedLengths(language)){
   const {answers,allowed}=vocabulary(length,language);assert.ok(answers.length>=5);assert.ok(allowed.size>=answers.length);
   assert.ok(answers.every(word=>word.length===length&&allowed.has(word)&&allowed.has(normalizeGuess(word,language))));
   assert.equal(new Set(answers.map(word=>normalizeGuess(word,language))).size,answers.length,'accent collision cannot be competing answers');
   assert.match(answerDataset(length,language),new RegExp(language));assert.match(absurdDataset(length,language),new RegExp(language));
   for(const other of LANGUAGES.filter(value=>value!==language))for(const path of ['/',PROJECT_PATH]){
    assert.notEqual(answerDataset(length,language),answerDataset(length,other));
    const own=activeSaveKeyForPath(path,length,language),theirs=activeSaveKeyForPath(path,length,other);assert.notEqual(own,theirs);
    for(const rules of ['conquest','absurd','one','smashare','letroso'] as Rules[])for(const schedule of ['daily','practice'] as const)assert.notEqual(variantKey(own,{rules,schedule},date),variantKey(theirs,{rules,schedule},date));
   }
  }
 });
 for(const length of [3,4,5,6,7,8,9,10,11])test(`${language} ${length}: all five modes, four difficulties, daily replay and practice`,()=>{
  const {answers,allowed}=vocabulary(length,language),answer=answers.find(word=>word!==normalizeGuess(word,language))??answers[0];
  assert.equal(displaySpelling(answer,language),answer);assert.ok(answers.includes(dailyAnswer(date,length,language)));
  const save=emptySave(date,'normal',length,language);save.daily=submit(save.daily,normalizeGuess(save.daily.answer,language)).run;recordDaily(save,date,save.daily);assert.deepEqual(decode(encode(save),date,length,language),save);
  const mix=dailyOneMix(date,length,language);assert.equal(mix.length,5);assert.deepEqual(dailyOneMix(date,length,language),mix);
  const practiceClues=uniqueCluePairs(answers,[...allowed],12,language);assert.ok(practiceClues.length>0);
  for(const pair of mix)assert.ok(validUniqueClue(pair.answer,pair.clue,answers,language));
  assert.ok(smashPairCount(length,language)>0);const dailyPair=dailySmashPair(date,length,language),practicePair=practiceSmashPair(length,language,()=>0.5);assert.deepEqual(dailySmashPair(date,length,language),dailyPair);
  for(const level of levels){
   const solved=submit(newRun(answer,level,language),answer.toLocaleLowerCase(language).normalize('NFD'));assert.equal(solved.error,undefined);assert.equal(status(solved.run),'won');assert.deepEqual(solved.run.guesses,[normalizeGuess(answer,language)]);
   const practice=emptySave(date,level,length,language);practice.practice=solved.run;assert.deepEqual(decode(encode(practice),date,length,language).practice,solved.run);
   const plain=submit(newRun(answer,level,language),normalizeGuess(answer,language));assert.equal(plain.error,undefined);assert.equal(status(plain.run),'won');
   const ordered=submitLetroso(newLetroso(answer,language,level),normalizeGuess(answer,language));assert.equal(ordered.error,undefined);assert.equal(letrosoStatus(ordered.run),'won');assert.deepEqual(restoreLetroso(ordered.run,language,length),ordered.run);
   for(const pair of [dailyPair,practicePair]){const joined=submitSmash(newSmashRun(pair,language,level),normalizeGuess(pair.merged,language));assert.equal(joined.error,undefined);assert.equal(smashStatus(joined.run),'won');assert.deepEqual(restoreSmashRun(joined.run,language,length),joined.run)}
   for(const pair of [mix[0],practiceClues[0]]){const clueRun=submit(newRun(pair.answer,level,language),pair.clue);assert.equal(clueRun.error,undefined);const finished=submit(clueRun.run,normalizeGuess(pair.answer,language));assert.equal(finished.error,undefined);assert.equal(status(finished.run),'won')}
   const target=dailyAbsurdTarget(date,length,language);let adaptive={...newImpossible(level,length,language),target:target.target};
   for(const guess of target.witness){if(adaptive.continuation==='pending')adaptive={...adaptive,continuation:'unlimited'};const result=submitImpossible(adaptive,normalizeGuess(guess,language));assert.equal(result.error,undefined);adaptive={...result.run,target:target.target};assert.ok(adaptive.candidates.every(word=>answers.includes(word)))}
   assert.equal(impossibleStatus(adaptive),'won');const {target:_,...snapshot}=adaptive;assert.deepEqual(restoreImpossible(impossibleSnapshot(adaptive)),snapshot);
  }
 });
 test(`${language}: accent collisions, repeated letters and dictionary-safe advice`,()=>{
  assert.deepEqual(score('AÇÃO','ACAO',language),Array(4).fill('exact'));
  assert.deepEqual(score('ÓRGÃO','OOOOO',language),['exact','absent','absent','absent','exact']);
  assert.deepEqual(orderFeedback('AÇÃO','ACAO',language),orderFeedback('ACAO','ACAO',language));
  assert.equal(makeSmashPair('AVÓ','AVÔ',language),undefined);
  const seam=makeSmashPair('ÓDIO','CAÓD',language);assert.deepEqual(seam,{first:'ÓDIO',second:'CAÓD',merged:'CAÓDIO'});assert.equal(makeSmashPair('ÓDIO','CAOD',language)?.merged,'CAODIO');
  const {answers}=vocabulary(5,language),answer=answers[0],guess=answers.find(word=>normalizeGuess(word,language)!==normalizeGuess(answer,language))!;
  const run=submit(newRun(answer,'easy',language),guess).run;assert.match(submit(run,guess.normalize('NFD')).error!,/Already/);
  const clues=observedClues(run),candidates=possibleAnswers(clues),advice=analyzeObservations(clues,'optimal');assert.ok(candidates.includes(answer));assert.equal(advice.totalCandidates,candidates.length);assert.ok(advice.suggestions.every(item=>vocabulary(5,language).allowed.has(item.word)));
  assert.ok(shareText(date,run).includes(languageLabel(language)));assert.equal(answerEligibility(answer,5,language).possible,true);
  for(const word of [dailyHiddenLetroso(date,language),practiceHiddenLetroso(language,'',()=>0.5)])assert.ok(vocabulary(word.length,language).answers.includes(word));
 });
 test(`${language}: sourced English meanings keep accented reveals and homographs apart`,async()=>{
  const client=new DefinitionClient(undefined,6000,Date.now,language);
  for(const [word,meaning] of [['casa',/house|home/i],['avó',/grandmother/i],['avô',/grandfather/i]] as const){const result=await client.lookup(word);assert.ok(result.entries.length,word);assert.match(result.entries.flatMap(entry=>entry.senses).join(' '),meaning);assert.match(result.sourceUrl,/#Portuguese$/);assert.equal(result.license,'CC-BY-SA-4.0');assert.ok(result.sourceLinks?.some(link=>decodeURIComponent(link.url).includes(`/wiki/${word}#Portuguese`)));if(word==='avó')assert.ok(result.entries.every(entry=>!entry.partOfSpeech.includes('avô')));if(word==='avô')assert.ok(result.entries.every(entry=>!entry.partOfSpeech.includes('avó')))}
  const plain=await client.lookup('avo');assert.ok(plain.sourceLinks?.some(link=>decodeURIComponent(link.url).includes('/avó#')));assert.ok(plain.sourceLinks?.some(link=>decodeURIComponent(link.url).includes('/avô#')));
  assert.deepEqual((await client.lookup('ZZZZZ')).entries,[]);
 });
}
test('the Portuguese feature does not reset or migrate existing language saves',()=>{
 const values=new Map<string,string>();for(const language of LANGUAGES.filter(value=>!value.startsWith('pt-')))for(const length of supportedLengths(language)){const save=emptySave(date,'normal',length,language);save.practice=submit(save.practice,save.practice.answer).run;values.set(activeSaveKeyForPath('/',length,language),encode(save))}
 const original=[...values];const storage={get length(){return values.size},key:(index:number)=>[...values.keys()][index]??null,getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)},removeItem:(key:string)=>{values.delete(key)}};
 assert.equal(resetStorageForUpdate(storage,'/'),false);
 for(const language of locales){const save=emptySave(date,'normal',5,language);storage.setItem(activeSaveKeyForPath('/',5,language),encode(save))}
 for(const [key,value] of original)assert.equal(storage.getItem(key),value,key);
});
test('regional Portuguese spelling lists distinguish BR ÔNIBUS/TÊNIS from PT TÉNIS',()=>{
 assert.ok(vocabulary(6,'pt-BR').allowed.has('ÔNIBUS'));assert.equal(vocabulary(6,'pt-PT').allowed.has('ONIBUS'),false);
 // Accent folding intentionally makes both TÊNIS and TÉNIS valid input aliases;
 // the source lists and answer reveals, not the plain gameplay keys, retain the regional spelling.
 assert.ok([...vocabulary(5,'pt-BR').allowed].includes('TÊNIS'));assert.equal([...vocabulary(5,'pt-BR').allowed].includes('TÉNIS'),false);
 assert.ok([...vocabulary(5,'pt-PT').allowed].includes('TÉNIS'));assert.equal([...vocabulary(5,'pt-PT').allowed].includes('TÊNIS'),false);
});
