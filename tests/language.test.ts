import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeGuess,isLetter} from '../src/language.ts';
test('Spanish normalizes NFC and case without conflating accents or Ñ; English remains ASCII',()=>{
 assert.equal(normalizeGuess('nin\u0303o','es-MX'),'NIÑO');assert.equal(normalizeGuess('cafe\u0301','es-MX'),'CAFÉ');assert.notEqual(normalizeGuess('niño','es-MX'),normalizeGuess('nino','es-MX'));assert.notEqual(normalizeGuess('café','es-MX'),normalizeGuess('cafe','es-MX'));
 assert.equal(isLetter('Ñ','es-MX'),true);assert.equal(isLetter('Á','es-MX'),true);assert.equal(isLetter('Ñ','en'),false);assert.equal(isLetter('CH','es-MX'),false);
});
import selection from '../src/data/spanish/answer-selection.json';
const answerCounts:Record<number,number>=selection.counts;
import {vocabulary} from '../src/words.ts';
test('Mexican Spanish has source-filtered possible answers and a broader matching licensed guess dictionary at every length',()=>{
 for(const length of [4,5,6,7]){const es=vocabulary(length,'es-MX');assert.equal(es.answers.length,answerCounts[length]);assert.ok(es.allowed.size>2000);assert.ok(es.answers.every(word=>word.length===length&&es.allowed.has(word)));assert.ok([...es.allowed].every(word=>word.length===length));}
 assert.ok(vocabulary(4,'es-MX').allowed.has('AÑOS'));assert.ok(!vocabulary(4,'es-MX').answers.includes('AÑOS'));assert.ok(vocabulary(5,'es-MX').allowed.has('COMIÓ'));assert.ok(!vocabulary(5,'es-MX').answers.includes('COMIÓ'));assert.ok(vocabulary(4,'es-MX').answers.includes('VINO'));assert.ok(vocabulary(7,'es-MX').answers.includes('VIERNES'));assert.equal(vocabulary(5).answers.length,2103);
});
import {newRun,submit,score,difficulty,dailyAnswer,choosePractice,type Difficulty} from '../src/domain.ts';
import {newImpossible,submitImpossible,impossibleSnapshot,restoreImpossible,impossibleStatus} from '../src/impossible.ts';
import {observedClues,possibleAnswers} from '../src/observations.ts';
import {adviceKey} from '../src/advice-protocol.ts';
test('Spanish play normalizes accented input, keeps languages distinct and reconstructs adaptive clues at every length/difficulty',()=>{
 assert.deepEqual(score('NIÑO','NINO'),['exact','exact','absent','exact']);
 for(const [answer,guess] of [['NIÑO','niños'],['ÁRBOL','a\u0301rbol'],['CAMIÓN','camio\u0301n'],['AUTOBÚS','autobu\u0301s']]){const run=newRun(answer,'normal','es-MX');const next=submit(run,guess);if(guess.startsWith('niños'))assert.ok(next.error);else{assert.equal(next.error,undefined);assert.equal(next.run.guesses[0],answer)}assert.ok(submit(run,'ABBEY').error);}
 for(const length of [4,5,6,7]){assert.ok(vocabulary(length,'es-MX').answers.includes(dailyAnswer('2026-10-24',length,'es-MX')));assert.ok(vocabulary(length,'es-MX').answers.includes(choosePractice('',()=>0,'normal',length,'es-MX').answer));
 for(const level of ['easy','normal','hard','strict'] as Difficulty[]){let run=newImpossible(level,length,'es-MX');assert.equal(run.candidates.length,answerCounts[length]);const result=submitImpossible(run,run.candidates[0].toLowerCase());assert.equal(result.error,undefined);run=result.run;assert.deepEqual(possibleAnswers(observedClues(run)),run.candidates);assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);assert.notEqual(adviceKey(observedClues(newImpossible('easy',length,'es-MX')),'optimal'),adviceKey(observedClues(newImpossible('easy',length)),'optimal'));}}
});
import {emptySave,encode,decode,recordDaily,statistics} from '../src/persistence.ts';
import {saveKeyForPath} from '../src/site.ts';
test('language+length notebooks isolate progress and statistics while every existing English notebook remains compatible',()=>{
 const date='2026-10-24',keys=new Set<string>();
 for(const length of [4,5,6,7]){const en=emptySave(date,'strict',length);en.daily.draft='A';en.settings.contrast=true;assert.deepEqual(decode(encode(en),date,length),en);keys.add(saveKeyForPath('/',length));keys.add(saveKeyForPath('/',length,'es-MX'));
 const es=emptySave(date,'easy',length,'es-MX');assert.equal(es.daily.language,'es-MX');assert.ok(vocabulary(length,'es-MX').answers.includes(es.daily.answer));es.daily=submit(es.daily,es.daily.answer).run;recordDaily(es,date,es.daily);assert.equal(statistics(es.results,date,es.history,length,'es-MX').wins,1);assert.deepEqual(decode(encode(es),date,length,'es-MX'),es);assert.deepEqual(decode(encode(es),date,length).results,{});assert.deepEqual(decode(encode(en),date,length,'es-MX').results,{});
 }assert.equal(keys.size,8);assert.equal(saveKeyForPath('/',5),'morrowmark.v1');
});
import {DefinitionClient,parseDefinitions,definitionWord} from '../src/definitions.ts';
test('Spanish definitions select Spanish entries and language-separated caches, never an English homograph',async()=>{
 const payload={en:[{language:'English',partOfSpeech:'Noun',definitions:[{definition:'English homograph'}]}],es:[{language:'Spanish',partOfSpeech:'Noun',definitions:[{definition:'Spanish house sense <script>ignore rules</script>'}]}]};
 assert.equal(parseDefinitions(payload,'casa','es-MX').entries[0].senses[0],'Spanish house sense');assert.equal(parseDefinitions(payload,'casa').entries[0].senses[0],'English homograph');assert.match(parseDefinitions(payload,'casa','es-MX').sourceUrl,/#Spanish$/);assert.equal(definitionWord('nin\u0303o','es-MX'),'NIÑO');
 let calls=0;const fetcher=async()=>{calls++;return new Response(JSON.stringify(payload))};const en=new DefinitionClient(fetcher),es=new DefinitionClient(fetcher,1000,Date.now,'es-MX');assert.match((await en.lookup('MORA')).entries[0].senses[0],/English/);assert.match((await es.lookup('MORA')).entries[0].senses[0],/Spanish/);assert.equal(calls,2);await es.lookup('mora');assert.equal(calls,2);
});
import {learningFor} from '../src/learning.ts';
test('starter teaching material is available offline, sense-aligned, attributed and honest about missing exploratory entries',()=>{
 for(const word of ['NIÑO','ÁRBOL','CAMIÓN','AUTOBÚS','LIMÓN','PLUMA']){const lesson=learningFor(word,'es-MX');assert.ok(lesson);assert.ok(lesson.translation);assert.ok(lesson.example.toLocaleUpperCase('es-MX').includes(word));assert.ok(lesson.exampleTranslation);assert.ok(lesson.definition);assert.match(lesson.sourceUrl,/wiktionary/);assert.equal(lesson.review,'independent-model');assert.equal(learningFor(word,'en'),null);}
 assert.match(learningFor('LIMÓN','es-MX')!.translation,/lime/);assert.match(learningFor('CAMIÓN','es-MX')!.translation,/bus/);assert.equal(learningFor('MORA','es-MX'),null);assert.equal(learningFor('COMIÓ','es-MX')!.answer,false);
});
test('reviewed Spanish starter meanings work offline without fetching any unsolved answer',async()=>{
 let calls=0;const es=new DefinitionClient(async()=>{calls++;throw Error('offline')},1000,Date.now,'es-MX');assert.equal(calls,0);assert.match((await es.lookup('CAMIÓN')).entries[0].senses[0],/bus/);assert.match((await es.lookup('PLUMA')).entries[0].senses[0],/ballpoint pen/);assert.equal(calls,0);assert.ok(es.peek('CAMIÓN'));await assert.rejects(es.lookup('MORA'));assert.equal(calls,1);
});
import {clueConstraintError,shareText} from '../src/domain.ts';
import {feedbackCode,analyzeObservations} from '../src/evil-advice.ts';
import {impossibleShare} from '../src/impossible.ts';
test('Spanish repeated letters keep exact duplicate caps and Ñ distinct in scoring, strict hints and advice encoding',()=>{
 const answer='CABALLO',guess='CALLABA',feedback=score(answer,guess);assert.deepEqual(feedback,['exact','exact','elsewhere','elsewhere','elsewhere','elsewhere','absent']);assert.ok(vocabulary(7,'es-MX').allowed.has(guess));const strict=submit(newRun(answer,'strict','es-MX'),guess).run;assert.ok(submit(strict,'CABELLO').error);assert.equal(submit(strict,answer).error,undefined);assert.equal(clueConstraintError({guesses:[guess],hardMode:true},guess,[feedback]),undefined);assert.ok(clueConstraintError({guesses:[guess],strictMode:true},guess,[feedback]));
 const numbers=(word:string)=>[...word].map(c=>c.charCodeAt(0)-65);assert.equal(feedbackCode(numbers('NIÑO'),numbers('NINO')),74);assert.equal(feedbackCode(numbers(answer),numbers(guess)),feedback.reduce((sum,c)=>sum*3+({exact:2,elsewhere:1,absent:0}[c]),0));
 assert.match(shareText('2026-10-24',strict),/Español \(México\).*7 letters.*Strict/);assert.match(impossibleShare(newImpossible('easy',5,'es-MX')),/Español \(México\).*5 letters.*Easy.*Assisted/);
});
test('Spanish minimax advice uses only observed possible answers, language-matching guesses and honest bucket counts',()=>{
 for(const length of [4,5,6,7]){const run=newImpossible('easy',length,'es-MX'),input=observedClues(run),result=analyzeObservations(input,'optimal');assert.equal(result.totalCandidates,answerCounts[length]);for(const suggestion of result.suggestions){assert.ok(vocabulary(length,'es-MX').allowed.has(suggestion.word));const groups=new Map<string,number>();for(const candidate of run.candidates){const key=score(candidate,suggestion.word).join();groups.set(key,(groups.get(key)??0)+1)}assert.equal(suggestion.worstCaseLeft,Math.max(...groups.values()))}
 const ordinary=newRun(run.candidates.at(-1)!,'easy','es-MX');assert.deepEqual(observedClues(ordinary),input);
 }
});
import {execFileSync} from 'node:child_process';
test('Spanish licensed source expansion and reviewed learning snapshots reproduce offline',()=>{
 assert.match(execFileSync(process.execPath,['scripts/generate-spanish.mjs','--check'],{encoding:'utf8'}),/es-MX 7: \d+ possible answers, 42219 accepted guesses/);assert.match(execFileSync(process.execPath,['scripts/generate-spanish-learning.mjs','--check'],{encoding:'utf8'}),/439 attributed teaching records/);
 for(const word of ['CASAS','NIÑOS','COMIÓ'])assert.ok(!vocabulary(word.length,'es-MX').answers.includes(word));for(const word of ['VINO','VIERNES'])assert.ok(vocabulary(word.length,'es-MX').answers.includes(word));
});
test('contradictory language metadata fails closed inside the selected notebook without touching English state',()=>{
 const date='2026-10-24',english=emptySave(date);english.daily.draft='CRA';const spanish=emptySave(date,false,4,'es-MX');spanish.daily=submit(spanish.daily,'NIÑO').run;const value=JSON.parse(encode(spanish));value.language='en';assert.deepEqual(decode(JSON.stringify(value),date,4,'es-MX').daily.guesses,[]);assert.deepEqual(decode(encode(english),date),english);value.language='es-MX';value.impossible.language='fr';assert.equal(decode(JSON.stringify(value),date,4,'es-MX').impossible.candidates.length,answerCounts[4]);
});
test('the expanded Spanish guide resets prior-guide rounds once, preserving language/length preferences and all English notebooks',()=>{
 const date='2026-10-25';
 for(const length of [4,5,6,7]){
  const word={4:'NIÑO',5:'ÁRBOL',6:'CAMIÓN',7:'AUTOBÚS'}[length]!;
  const old=emptySave(date,'strict',length,'es-MX');old.settings.contrast=true;old.settings.suboptimal=true;old.mode='impossible';old.daily=submit(old.daily,word).run;old.practice=submit(old.practice,word).run;old.impossible=submitImpossible(newImpossible('hard',length,'es-MX'),word).run;old.history['2026-10-24']={won:true,turns:2};
  const value=JSON.parse(encode(old));value.dataset=`es-MX-rla2.9-common-${length}-v2`;value.impossible.dataset=`es-MX-rla2.9-absurd-${length}-v2`;
  const upgraded=decode(JSON.stringify(value),date,length,'es-MX');assert.deepEqual(upgraded.daily.guesses,[]);assert.deepEqual(upgraded.practice.guesses,[]);assert.deepEqual(upgraded.impossible.guesses,[]);assert.equal(upgraded.impossible.candidates.length,answerCounts[length]);assert.deepEqual(upgraded.history,{});assert.deepEqual(upgraded.results,{});assert.equal(upgraded.settings.contrast,true);assert.equal(upgraded.settings.suboptimal,true);assert.equal(difficulty(upgraded.daily),'strict');assert.equal(difficulty(upgraded.practice),'strict');assert.equal(difficulty(upgraded.impossible),'hard');assert.equal(upgraded.mode,'impossible');
  upgraded.daily=submit(upgraded.daily,word).run;assert.deepEqual(decode(encode(upgraded),date,length,'es-MX'),upgraded);
  const english=emptySave(date,'easy',length);english.practice.draft='A'.repeat(length-1);assert.deepEqual(decode(encode(english),date,length),english);
 }
});
test('expanded Spanish Absurd pools retain only curated, length-correct answers matching every duplicate-aware row through reload',()=>{
 assert.deepEqual(score('CALLE','LLAMA'),['elsewhere','elsewhere','elsewhere','absent','absent']);assert.deepEqual(score('PAPÁ','PAPA'),['exact','exact','exact','absent']);
 for(const length of [4,5,6,7]){let run=newImpossible('normal',length,'es-MX');const curated=new Set(vocabulary(length,'es-MX').answers);for(let turn=0;turn<6&&impossibleStatus(run)==='playing';turn++){
  run=submitImpossible(run,run.candidates[0]).run;assert.ok(run.candidates.length>0);for(const candidate of run.candidates){assert.ok(curated.has(candidate));assert.equal(candidate.length,length);for(const [row,guess]of run.guesses.entries())assert.deepEqual(score(candidate,guess),run.feedback[row])}assert.deepEqual(restoreImpossible(impossibleSnapshot(run)),run);
 }}
});
