import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailySmashPair,newSmashRun,restoreSmashRun,submitSmash,changeSmashDifficulty} from '../src/smashare.ts';
import {dailyHiddenLetroso,newLetroso,restoreLetroso,submitLetroso,changeLetrosoDifficulty} from '../src/letroso.ts';

test('unstarted custom rounds survive reload, and pre-existing rounds retain their state',()=>{
 const pair=dailySmashPair('2026-11-02',5,'en'),smash=newSmashRun(pair,'en','normal');
 assert.equal(restoreSmashRun({...smash,started:false},'en',5,pair)?.started,false);
 assert.notEqual(restoreSmashRun(smash,'en',5,pair)?.started,false);
 const played=submitSmash(smash,pair.merged).run;
 assert.equal(restoreSmashRun(played,'en',5,pair)?.guesses.length,1);
 assert.equal(restoreSmashRun({...played,started:false},'en',5,pair),undefined);
 const answer=dailyHiddenLetroso('2026-11-02','en'),letroso=newLetroso(answer,'en','normal');
 assert.equal(restoreLetroso({...letroso,started:false},'en',answer.length)?.started,false);
 assert.notEqual(restoreLetroso(letroso,'en',answer.length)?.started,false);
 const noted=submitLetroso(letroso,answer).run;
 assert.equal(restoreLetroso(noted,'en',answer.length)?.guesses.length,1);
 assert.equal(restoreLetroso({...noted,started:false},'en',answer.length),undefined);
});
test('ongoing difficulty changes keep assistance history for each custom mode',()=>{
 const pair=dailySmashPair('2026-11-02',5,'en'),s=newSmashRun(pair,'en','normal');
 assert.equal(changeSmashDifficulty(changeSmashDifficulty(s,'easy').run,'normal').run.assisted,true);
 const answer=dailyHiddenLetroso('2026-11-02','en'),l=newLetroso(answer,'en','normal');
 assert.equal(changeLetrosoDifficulty(changeLetrosoDifficulty(l,'easy').run,'normal').run.assisted,true);
});
