import {test} from 'node:test';import assert from 'node:assert/strict';
import {isCuratedSpanishAnswer} from '../scripts/spanish-answer-policy.mjs';
test('finite verb forms in every tense/mood and nonlexical gerunds/participles cannot be answers',()=>{
 for(const [word,kind]of [['HABLO','finite-verb'],['COMES','finite-verb'],['VIVÍA','finite-verb'],['HABLE','finite-verb'],['HABLARÉ','finite-verb'],['COMED','finite-verb'],['HABLANDO','gerund'],['COMIDO','participle']] as const)assert.equal(isCuratedSpanishAnswer({word,kind,base:true,independentSense:true,review:'independent-model'}),false,word);
});
test('infinitives and independent ordinary noun/base-adjective senses survive verbal homographs',()=>{
 for(const [word,kind]of [['HABLAR','infinitive'],['COMER','infinitive'],['VIVIR','infinitive'],['TRAJE','noun'],['VINO','noun'],['OÍDO','noun'],['COMIDA','noun'],['BEBIDA','noun'],['CANSADO','adjective']] as const)assert.equal(isCuratedSpanishAnswer({word,kind,base:true,independentSense:true,review:'independent-model'}),true,word);
 assert.equal(isCuratedSpanishAnswer({word:'TRAJE',kind:'finite-verb',base:false,independentSense:false,review:'independent-model'}),false);
 assert.equal(isCuratedSpanishAnswer({word:'HABLAR',kind:'infinitive',base:true,independentSense:true,review:'unreviewed'}),false);
});

import {readFileSync} from 'node:fs';import {vocabulary} from '../src/words.ts';import {learningFor} from '../src/learning.ts';
test('the400 original answer senses remain a reviewed teaching archive; current eligibility is independent',()=>{
 const audit=JSON.parse(readFileSync(new URL('../src/data/spanish/answer-policy.json',import.meta.url),'utf8'));assert.equal(Object.keys(audit.words).length,400);
 for(const word of Object.keys(audit.words)){const sense=audit.words[word];assert.ok(isCuratedSpanishAnswer(sense),word);assert.equal(sense.sense,learningFor(word,'es-MX')!.translation)}
 for(const word of ['HABLO','COMES','VIVÍA','HABLE','HABLARÉ','DANDO','COMIDO']){assert.ok(vocabulary(word.length,'es-MX').allowed.has(word),word);assert.ok(!vocabulary(word.length,'es-MX').answers.includes(word),word)}
 assert.equal(isCuratedSpanishAnswer({word:'BONITAS',kind:'adjective',base:false,independentSense:true,review:'independent-model'}),false);
 const teaching=JSON.parse(readFileSync(new URL('../src/data/spanish/learning.ts',import.meta.url),'utf8').split(' = ')[1].trim().replace(/;$/,''));assert.equal(Object.keys(teaching).length,439);
});
