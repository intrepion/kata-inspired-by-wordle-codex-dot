import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {uniqueCluePairs,validUniqueClue} from '../src/one.ts';
import {vocabulary} from '../src/words.ts';
import {newRun,submit,score} from '../src/domain.ts';
import {emptySave,encode,decode} from '../src/persistence.ts';
import {initializeNotebookStats,beginStatsPuzzle,puzzleNeedsStart,settleNotebookStats} from '../src/notebook-statistics.ts';
import type {Language} from '../src/language.ts';

for(const language of ['en','es-MX'] as Language[])for(const length of [4,5,6,7])test(`${language} ${length}: a given clue is accepted and uniquely identifies an eligible answer`,()=>{
 const {answers,allowed}=vocabulary(length,language);const pairs=uniqueCluePairs(answers,[...allowed]);
 assert.ok(pairs.length>0);const pair=pairs[0];assert.ok(allowed.has(pair.clue));assert.ok(validUniqueClue(pair.answer,pair.clue,answers));
 const base={...newRun(pair.answer,'normal',language),guesses:[pair.clue]};
 const rejected=submit(base,'Z'.repeat(length));assert.ok(rejected.error);assert.equal(rejected.run,base);
 const saved=emptySave('2026-11-02',false,length,language);saved.one=base;saved.mode='one';
 const restored=decode(encode(saved),'2026-11-02',length,language);assert.equal(restored.mode,'one');assert.deepEqual(restored.one?.guesses,[pair.clue]);assert.deepEqual(score(pair.answer,pair.clue),score(restored.one!.answer,restored.one!.guesses[0]));
 assert.equal(restored.daily.answer,saved.daily.answer);assert.equal(restored.practice.answer,saved.practice.answer);
});
test('generation returns no puzzle when uniqueness is impossible',()=>assert.deepEqual(uniqueCluePairs(['AAAA','AAAB'],['CCCC']),[]));
test('invalid or ambiguous saved clue cannot become a One possibility round',()=>{
 const save=emptySave('2026-11-02');save.mode='one';save.one={...newRun('APPLE'),guesses:['APPLE']};const restored=decode(encode(save),'2026-11-02');assert.equal(restored.mode,'daily');assert.deepEqual(restored.one.guesses,[]);
});
test('the given clue and normal guesses use duplicate-aware scoring',()=>{
 assert.deepEqual(score('APPLE','ALLEY'),['exact','elsewhere','absent','elsewhere','absent']);
 assert.deepEqual(score('SHEEP','EERIE'),['elsewhere','elsewhere','absent','absent','absent']);
});

test('the prefilled clue participates in the existing start gate and preserves other statistics',()=>{
 const save=emptySave('2026-11-02');initializeNotebookStats(save,true);const pairs=uniqueCluePairs(vocabulary().answers,[...vocabulary().allowed]);save.one={...newRun(pairs[0].answer),guesses:[pairs[0].clue]};save.mode='one';settleNotebookStats(save);
 assert.equal(puzzleNeedsStart(save),true);assert.equal(beginStatsPuzzle(save,'one','normal'),true);assert.equal(puzzleNeedsStart(save),false);const restored=decode(encode(save),'2026-11-02');assert.equal(restored.mode,'one');assert.equal(puzzleNeedsStart(restored),false);assert.equal(restored.notebookStats?.exposure.daily,null);
});
