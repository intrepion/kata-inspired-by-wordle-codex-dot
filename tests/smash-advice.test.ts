import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LANGUAGES,normalizeGuess,type DutchRules} from '../src/language.ts';
import {supportedLengths} from '../src/words.ts';
import {score} from '../src/domain.ts';
import {analyzeSmashObservations,observedSmashClues,smashAdviceKey} from '../src/smash-advice.ts';
import {newSmashRun,practiceSmashPair,parseSmashGuess,suggestSmash,smashPairCount} from '../src/smashare.ts';
for(const language of ['en',...LANGUAGES] as const)for(const length of supportedLengths(language))for(const dutchRules of (language==='nl-NL'?[1,2]:[2]) as DutchRules[])test(`Smash Easy complete pool: ${language}/${length}/${dutchRules}`,()=>{
 const answer=practiceSmashPair(length,language,()=>1),run=newSmashRun(answer,language,'easy',dutchRules),opening=observedSmashClues(run);
 const all=analyzeSmashObservations(opening,1_000_000);
 assert.equal(all.scanned,smashPairCount(length,language));assert.equal(all.truncated,false);assert.ok(all.pairs.length);
 const play=(s:string)=>normalizeGuess(s,language,dutchRules);
 for(const pair of all.pairs)assert.ok(parseSmashGuess(pair.merged,length,language,dutchRules));
 assert.equal(new Set(all.pairs.map(p=>play(p.merged))).size,all.pairs.length);
 const guess=all.pairs.find(p=>play(p.merged)!==play(answer.merged));if(!guess)return;
 const clues=score(answer.merged,guess.merged,language,dutchRules),input={...opening,guesses:[play(guess.merged)],feedback:[clues]};
 const oracle=all.pairs.filter(p=>play(p.merged)!==play(guess.merged)&&JSON.stringify(score(p.merged,guess.merged,language,dutchRules))===JSON.stringify(clues));
 const actual=analyzeSmashObservations(input);assert.deepEqual(actual.pairs,oracle.slice(0,5));assert.ok(actual.pairs.length);
 assert.deepEqual(suggestSmash({...run,guesses:input.guesses},5,1),actual);
 assert.deepEqual(analyzeSmashObservations({...input,finished:true}).pairs,[]);
});
test('late survivor after the former 30,000-pair cap is still suggested',()=>{
 const run=newSmashRun(practiceSmashPair(8,'en-US',()=>1),'en-US','easy');
 const all=analyzeSmashObservations(observedSmashClues(run),1_000_000).pairs;
 const guess=all.find(p=>p.second===run.answer.second&&p.first!==run.answer.first)!;assert.ok(guess);
 run.guesses=[guess.merged];const result=suggestSmash(run);
 assert.ok(result.scanned>30000);assert.ok(result.pairs.some(p=>p.merged===run.answer.merged));
});
test('public clue cache separates lengths, varieties and Dutch rule generations',()=>{
 const input=observedSmashClues(newSmashRun(practiceSmashPair(5,'nl-NL'),'nl-NL','easy',1));
 assert.notEqual(smashAdviceKey(input),smashAdviceKey({...input,dutchRules:2}));
 assert.notEqual(smashAdviceKey(input),smashAdviceKey({...input,length:6}));
 assert.notEqual(smashAdviceKey(input),smashAdviceKey({...input,language:'en-US'}));
});
