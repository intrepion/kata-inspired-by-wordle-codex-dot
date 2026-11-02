import {test} from 'node:test';
import assert from 'node:assert/strict';
import {invalidDraft} from '../src/draft-validity.ts';
import {vocabulary} from '../src/words.ts';
import {dailySmashPair} from '../src/smashare.ts';

test('fixed drafts change color only when complete and outside their language dictionary',()=>{
 for(const language of ['en','es-MX'] as const)for(let length=3;length<=11;length++){
  const word=vocabulary(length,language).answers[0];
  assert.equal(invalidDraft(word.slice(0,-1),'fixed',length,language),false);
  assert.equal(invalidDraft(word,'fixed',length,language),false);
  assert.equal(invalidDraft('Z'.repeat(length),'fixed',length,language),!vocabulary(length,language).allowed.has('Z'.repeat(length)));
 }
});
test('Letroso updates at three letters, independently of answer length and after deletion',()=>{
 assert.equal(invalidDraft('QQ','letroso',11,'en'),false);
 assert.equal(invalidDraft('QQQ','letroso',11,'en'),true);
 assert.equal(invalidDraft('CAT','letroso',11,'en'),false);
 assert.equal(invalidDraft('CATZ','letroso',3,'en'),true);
 assert.equal(invalidDraft('CAT','letroso',3,'en'),false);
 const spanish=vocabulary(3,'es-MX').answers.find(word=>/[ÁÉÍÓÚÜÑ]/.test(word));
 if(spanish)assert.equal(invalidDraft(spanish,'letroso',11,'es-MX'),false);
});
test('Smashare checks both overlapping words and avoids unfinished guesses',()=>{
 for(const language of ['en','es-MX'] as const){
  const pair=dailySmashPair('2026-11-02',5,language);
  assert.equal(invalidDraft(pair.merged.slice(0,-1),'smashare',5,language),false);
  assert.equal(invalidDraft(pair.merged,'smashare',5,language),false);
  assert.equal(invalidDraft('ZZZZZZZZ','smashare',5,language),true);
 }
});
