import {test} from 'node:test';import assert from 'node:assert/strict';
import {TranslationClient} from '../src/translations.ts';
test('exploratory words show sense-linked English equivalents without invented examples or lemma substitution',async()=>{
 const client=new TranslationClient();const bee=await client.lookup('abeja','es-MX');assert.equal(bee.phase,'ready');if(bee.phase==='ready'){assert.ok(bee.entry.senses.some(s=>s.english.some(e=>/\bbee\b/.test(e))));assert.ok(bee.entry.sourceUrl.includes('/abeja'));assert.equal('example' in bee.entry,false)}
 const rare=await client.lookup('abatido','es-MX');assert.equal(rare.phase,'ready');if(rare.phase==='ready')assert.ok(rare.entry.senses.some(s=>s.english.some(e=>/discouraged|abject/.test(e))));
 assert.equal((await client.lookup('abeja','en')).phase,'missing');
});
test('local translation chunks deduplicate requests, isolate English and failures, and preserve accents',async()=>{
 let calls=0;let release!:(table:Record<string,never[]>)=>void;const client=new TranslationClient(()=>{calls++;return new Promise(resolve=>{release=resolve})});
 assert.equal((await client.lookup('NIÑO','en')).phase,'missing');assert.equal(calls,0);
 const one=client.lookup('niño','es-MX'),two=client.lookup('NIN\u0303O','es-MX');await Promise.resolve();assert.equal(calls,1);release({'NIÑO':[]});assert.equal((await one).phase,'ready');assert.equal((await two).phase,'ready');assert.equal(calls,1);assert.equal(client.peek('NINO','es-MX')?.phase,'missing');
 const broken=new TranslationClient(async()=>{throw Error('offline')});assert.equal((await broken.lookup('ABEJA','es-MX')).phase,'error');assert.equal((await broken.lookup('ABEJA','es-MX')).phase,'error');
});
import {readFileSync} from 'node:fs';import {vocabulary} from '../src/words.ts';import {teachingFor} from '../src/learning.ts';
test('coverage audit counts actual intersection and leaves inflections and unavailable source data explicit',async()=>{
 const audit=JSON.parse(readFileSync('src/data/spanish/translation-coverage-audit.json','utf8'));const client=new TranslationClient();let reviewed=0,translated=0,missing=0;
 for(const length of [4,5,6,7])for(const word of vocabulary(length,'es-MX').allowed){if(teachingFor(word,'es-MX')){reviewed++;assert.equal(audit.providerByWord[word],'reviewed-teaching')}else {const state=await client.lookup(word,'es-MX');if(state.phase==='ready'){translated++;assert.equal(audit.providerByWord[word],state.entry.kind,word);assert.ok(state.entry.senses.length);assert.match(state.entry.sourceUrl,/^(?:https:\/\/|\.\/third-party\/)/);for(const link of state.entry.sourceLinks??[]){assert.equal(typeof link.label,'string');assert.match(link.url,/^(?:https:\/\/|\.\/third-party\/)/)}for(const sense of state.entry.senses){assert.equal(typeof sense.partOfSpeech,'string');assert.equal(typeof sense.senseIndex,'string');assert.ok(Array.isArray(sense.tags));assert.ok(sense.tags.every(t=>typeof t==='string'));assert.ok(Array.isArray(sense.english));assert.ok(sense.english.length);for(const text of sense.english){assert.ok(text.trim(),word);assert.ok(!/^(?:TODO|TBD|form of |inflection of )/i.test(text),word)}}}else{missing++;assert.equal(state.phase,'missing',word);assert.ok(audit.uncoveredWords.includes(word),word)}}}
 assert.deepEqual([reviewed,translated,missing],[3410,57719,15541]);assert.equal(audit.coverage.translated,reviewed+translated);assert.equal(audit.coverage.completeExamples,3410);assert.equal(audit.uncoveredWords.length,missing);
 const sourceAudit=JSON.parse(readFileSync('src/data/spanish/guess-translation-audit.json','utf8'));
 for(const length of [4,5,6,7]){const table=JSON.parse(readFileSync(`src/data/spanish/translations/${length}.json`,'utf8'));for(const [word,senses]of Object.entries(table) as [string,{senseIndex:string;english:string[];partOfSpeech:string}[]][]){const rows=sourceAudit.evidence[word];assert.ok(rows);for(const sense of senses)for(const english of sense.english)assert.ok(rows.some((r:{senseIndex:string;english:string;partOfSpeech:string})=>r.senseIndex===sense.senseIndex&&r.english===english&&r.partOfSpeech===sense.partOfSpeech),word)}}

});
test('known broken source fragments and mismatched senses are withheld rather than repeated',async()=>{
 for(const length of [4,5,6,7]){const table=JSON.parse(readFileSync(`src/data/spanish/translations/${length}.json`,'utf8'));for(const [word,bad]of [['MAMAR','to'],['ÁNIMA','bore'],['PUTA','bitch'],['TASADOR','assesor'],['TASADOR','eveluative']])if(table[word])assert.ok(!table[word].flatMap((s:{english:string[]})=>s.english).includes(bad));}

});
import {translationUsage,translationPartOfSpeech} from '../src/translations.ts';
test('source usage is readable and excludes unexplained template codes',()=>{assert.deepEqual(translationUsage(['rare','utci','Mexico']),['rare','Mexico']);assert.equal(translationPartOfSpeech('adj'),'adjective')});
test('supported morphology produces actual English forms with provenance, not bare lemma placeholders',async()=>{
 const client=new TranslationClient();for(const [word,english]of [['HABLO','I talk'],['COMISTE','you ate'],['GATOS','cats'],['ABIERTA','open']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.english.some(e=>e===english||(word==='ABIERTA'&&/^open\b/.test(e)))),word);assert.ok(['CC-BY-SA-4.0','GPL-2.0'].includes(state.entry.license));assert.ok(['english-wiktionary','derived-forms'].includes(state.entry.kind))}}
 assert.equal((await client.lookup('COMERME','es-MX')).phase,'missing');
});
test('impersonal and structurally unsafe bilingual senses never invent ordinary personal statements',async()=>{
 const c=new TranslationClient();for(const [word,bad] of [['LLUEVE','you (formal) rain'],['PASASTE','you happened'],['PASARÉ','I will happen'],['CONSTA','he/she/it states'],['REFRENO','I refrain']]){const state=await c.lookup(word,'es-MX');if(state.phase==='ready')assert.ok(!state.entry.senses.flatMap(s=>s.english).includes(bad),word)}
});
test('imperative forms address the listener rather than inheriting a third-person subject',async()=>{
 const c=new TranslationClient();const state=await c.lookup('COMAN','es-MX');assert.equal(state.phase,'ready');if(state.phase==='ready')assert.ok(state.entry.senses.some(s=>s.english.includes('eat! (plural)')&&s.tags.includes('imperative')));
});
test('English-edition dictionary meanings cover words without fabricating equivalents or inheriting a defective source',async()=>{
 const c=new TranslationClient();for(const [word,meaning]of [['ABSCESO','abscess'],['TROMBÓN','trombone']]){const state=await c.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.equal(state.entry.kind,'english-wiktionary');assert.ok(state.entry.senses.some(s=>s.english.includes(meaning)));assert.equal(state.entry.license,'CC-BY-SA-4.0');assert.match(state.entry.sourceUrl,/en.wiktionary.org/);assert.equal('example' in state.entry,false)}}
});
test('English-source forms preserve be, irregular past, ambiguity and safe impersonal subjects',async()=>{
 const c=new TranslationClient();for(const [word,expected]of [['SOMOS','we are'],['SIENDO','being'],['FUIMOS','we went'],['FUIMOS','we were'],['LLUEVE','it rains']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){assert.equal(s.entry.kind,'english-wiktionary');assert.ok(s.entry.senses.some(x=>x.english.includes(expected)),word+' '+expected)}}
});
test('reviewed background-past readings preserve state and ongoing events rather than blanket used-to glosses',async()=>{
 const client=new TranslationClient();for(const [word,expected]of [['SABÍA','I knew'],['NACÍA','I was being born'],['MORÍA','I was dying'],['LLOVÍA','it was raining']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.english.includes(expected)),word+' '+expected);assert.ok(!state.entry.senses.some(s=>s.english.some(x=>x.includes('used to'))))}}
});
test('reviewed aligned noun meanings preserve the selected sense and reject known source misalignments',async()=>{
 const c=new TranslationClient();const s=await c.lookup('CIERVA','es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready'){assert.ok(s.entry.senses.some(x=>x.english.some(e=>/female deer|doe/.test(e))));assert.equal(s.entry.kind,'reviewed-wordnet')}
});
test('tense-restricted senses and reviewed noun usage warnings survive translation rendering',async()=>{
 const c=new TranslationClient();const known=await c.lookup('CONOCÍA','es-MX');assert.equal(known.phase,'ready');if(known.phase==='ready')assert.ok(!known.entry.senses.some(s=>s.english.includes('I was meeting')));
 const papism=await c.lookup('PAPISMO','es-MX');assert.equal(papism.phase,'ready');if(papism.phase==='ready')assert.ok(papism.entry.senses.some(s=>s.tags.some(t=>/disparag|historical/i.test(t))));
});
test('supported subjunctives show explicitly contextual clause readings, not misleading standalone tense claims',async()=>{
 const c=new TranslationClient();for(const [word,reading,context]of [['COMIERA','if I ate','hypothetical'],['PUEDA','that I be able to','desired/required'],['HABLARE','if I should talk','formal/legal']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(x=>x.english.includes(reading)&&x.tags.some(t=>t.includes(context))),word)}
});
test('explicit spelling aliases inherit real target meanings with source usage labels, not untranslated references',async()=>{
 const c=new TranslationClient();for(const [word,expected,usage]of [['ABORRIR',/abhor|hate|detest/,'alternative'],['ESER',/to be/,'obsolete'],['ATREZO',/props|stage properties/,'alternative']] as const){const state=await c.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready')assert.ok(state.entry.senses.some(s=>s.english.some(e=>expected.test(e))&&s.tags.includes(usage)),word)}
});
test('inflections of a source-defined spelling variant use the canonical source meaning and retain the variant warning',async()=>{
 const c=new TranslationClient();const s=await c.lookup('AMIBOS','es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready')assert.ok(s.entry.senses.some(x=>x.english.includes('amoebas')&&x.tags.includes('alternative')));
});
test('reviewed noun forms preserve countable phrase heads, feminine senses and irregular kinship plurals',async()=>{
 const c=new TranslationClient();for(const [word,expected]of [['ABABAS','red poppies'],['ABACERA','female grocer'],['YERNOS','sons-in-law']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(x=>x.english.includes(expected)),word)}
});
test('reviewed clitic readings preserve object roles, formal commands and unspecified nonfinite subjects',async()=>{
 const c=new TranslationClient();for(const [word,expected]of [['DÁMELO','give it to me! (informal singular)'],['DÍGAME','tell me! (formal singular)'],['DARTE','to give you'],['DATE','give yourself! (informal singular)'],['DÁNDOTE','giving you']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){assert.ok(s.entry.senses.some(x=>x.english.includes(expected)&&x.tags.some(t=>t.includes('selected clitic'))),word);if(word==='DARTE'||word==='DÁNDOTE')assert.ok(!s.entry.senses.some(x=>x.tags.some(t=>t.includes('selected clitic'))&&x.english.some(t=>t.includes('yourself'))),word)}}
 const se=await c.lookup('DARSE','es-MX');if(se.phase==='ready')assert.ok(!se.entry.senses.some(x=>x.tags.some(t=>t.includes('selected clitic'))));
});
test('feminine person forms never borrow an independent same-spelling object or event meaning',async()=>{
 const c=new TranslationClient();for(const [word,wrong]of [['TORERA','bolero jacket'],['CURDA','drinking session']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(!s.entry.senses.some(x=>x.tags.includes('model-reviewed noun-form reading')&&x.english.includes(wrong)),word)}
});
test('changed reviewed noun senses never inherit notes from the rejected older sense',async()=>{
 const c=new TranslationClient();const s=await c.lookup('CATETA','es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready')assert.ok(!s.entry.senses.some(x=>x.tags.includes('model-reviewed noun-form reading')&&x.english.some(e=>/hick/.test(e))&&x.tags.some(t=>/Geometry sense only/.test(t))));
});
test('inherited spelling warnings keep their regional scope and nonstandard status',async()=>{
 const c=new TranslationClient();const obscure=await c.lookup('OBSCURA','es-MX');assert.equal(obscure.phase,'ready');if(obscure.phase==='ready')assert.ok(!obscure.entry.senses.some(s=>s.tags.includes('source-linked spelling equivalent')&&s.tags.includes('archaic')&&!s.tags.includes('in Spain')));
 const wafers=await c.lookup('OSTIAS','es-MX');assert.equal(wafers.phase,'ready');if(wafers.phase==='ready')assert.ok(!wafers.entry.senses.some(s=>s.tags.includes('model-reviewed noun-form reading')&&s.english.some(e=>e.includes('communion wafers'))&&!s.tags.includes('nonstandard')));
});
test('multi-hop spelling provenance identifies the terminal semantic record rather than an intermediate alias',()=>{
 const audit=JSON.parse(readFileSync('src/data/spanish/english-translation-audit.json','utf8'));const senses=audit.evidence.SAETAR.filter((s:{kind:string})=>s.kind==='source-alias');assert.ok(senses.length);for(const s of senses){assert.equal(s.canonicalSourceWord,'asaetear');assert.equal(s.canonicalSourceRecordSha256,'36f7c688e3c4ddfcb8e80d4340d69d3c04ed7ba3437fb3452786ec5eff8cc526')}
});
test('the sourced adjective unknown is a real translation, distinct from an unavailable-translation fallback',async()=>{
 const c=new TranslationClient();for(const word of ['IGNOTO','IGNOTA']){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(x=>x.partOfSpeech==='adj'&&x.english.includes('unknown')&&x.tags.includes('formal')),word)}assert.equal((await c.lookup('COMERME','es-MX')).phase,'missing');
});
test('Spanish-edition form evidence can supply a qualified future-subjunctive reading from an already-reviewed English lemma',async()=>{
 const c=new TranslationClient();const s=await c.lookup('AFOGARE','es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready'){assert.ok(s.entry.senses.some(x=>x.english.includes('if I should drown')&&x.tags.includes('future')));assert.ok(s.entry.senses.some(x=>x.english.includes('that I scorch stews')&&x.tags.includes('present')));const urls=[s.entry.sourceUrl,...(s.entry.sourceLinks??[]).map(x=>x.url)];assert.ok(urls.some(url=>/afogar#Spanish$/.test(url)));assert.ok(urls.some(url=>/afogarar#Spanish$/.test(url)));assert.ok(s.entry.sourceLinks?.some(x=>x.label==='Spanish form evidence'&&x.url.endsWith('/afogare')))}
});
test('reviewed additional verb senses render the actual finite subject and keep their selected context',async()=>{
 const c=new TranslationClient();const state=await c.lookup('ASGO','es-MX');assert.equal(state.phase,'ready');if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.english.includes('I grab')&&s.tags.some(t=>t.includes('hand'))));assert.ok(!state.entry.senses.some(s=>s.english.some(e=>e==='to grab')));assert.ok(!state.entry.senses.some(s=>s.tags.includes('reflexive')))}
});
test('questionable accented spellings and unexplained ethnonym forms are not promoted by source grammar alone',async()=>{
 const c=new TranslationClient();for(const word of ['REÍNA','TOBOSA'])assert.equal((await c.lookup(word,'es-MX')).phase,'missing',word);
});

test('new reviewed finite readings keep tense and do not infer unsupported clitics or homograph paradigms',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['COLÉ','I strained'],['TIRÉ','I threw'],['ASIERA','if I grabbed'],['SACARÉ','I will take out']]){const state=await c.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready')assert.ok(state.entry.senses.some(s=>s.english.includes(text)),word)}
 for(const [word,unsupported]of [['DIGNABA','I was deigning'],['QUEJABA','I was complaining'],['FUELLO','I have sex'],['BASÉ','I based on'],['HISPÍ','I made spongy']]){const state=await c.lookup(word,'es-MX');if(state.phase==='ready')assert.ok(!state.entry.senses.some(s=>s.english.includes(unsupported)),word)}const archaic=await c.lookup('QUEJABA','es-MX');assert.equal(archaic.phase,'ready');if(archaic.phase==='ready')assert.ok(archaic.entry.senses.some(s=>s.english.includes('I was afflicting')&&s.tags.includes('archaic')));
});
test('a newly reviewed accented extraction verb keeps its actor and past tense distinct from the milk noun',async()=>{
 const c=new TranslationClient();const state=await c.lookup('LECHÉ','es-MX');assert.equal(state.phase,'ready');if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.partOfSpeech==='verb'&&s.english.includes('I milked')));assert.ok(!state.entry.senses.some(s=>s.english.includes('I produced milk')))}
});
test('an independently cross-reviewed alternative preserves its selected nautical meaning and progressive aspect',async()=>{
 const c=new TranslationClient();const state=await c.lookup('ADUJABA','es-MX');assert.equal(state.phase,'ready');if(state.phase==='ready')assert.ok(state.entry.senses.some(s=>s.english.includes('I was coiling')&&s.tags.some(t=>/coil|rope|nautic/i.test(t))));
});
test('a weather-caused crop sense is not presented as an unrestricted first-person human action',async()=>{
 const state=await new TranslationClient().lookup('ACAMÉ','es-MX');if(state.phase==='ready')assert.ok(!state.entry.senses.some(s=>s.english.includes('I flattened')&&s.tags.some(t=>/wind|rain/.test(t))));
});
test('Spanish-only dictionary senses have transparent English translations without invented English-dictionary attribution',async()=>{
 const client=new TranslationClient();for(const [word,expected]of [['FAÑA','he/she/it earmarks'],['FAÑÓ','he/she/it earmarked'],['ADRARE','if I should distribute irrigation water'],['FAÑARON','they earmarked']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.equal(state.entry.kind,'reviewed-spanish',word);assert.match(state.entry.sourceUrl,/es.wiktionary.org/);assert.ok(state.entry.senses.some(s=>s.english.includes(expected)),word)}}
});
test('literal animal-agent readings retain supported it forms without unrestricted human clauses',async()=>{
 const client=new TranslationClient();for(const [word,unsupported]of [['OVAMOS','we lay eggs'],['CROAMOS','we croak'],['OVARÍA','I would lay eggs']]){const state=await client.lookup(word,'es-MX');if(state.phase==='ready')assert.ok(!state.entry.senses.some(s=>s.english.includes(unsupported)),word)}
 const third=await client.lookup('OVARÍA','es-MX');assert.equal(third.phase,'ready');if(third.phase==='ready')assert.ok(third.entry.senses.some(s=>s.english.includes('it would lay eggs')&&!s.tags.includes('first-person')));
 for(const [word,expected]of [['MAMÉ','I suckled'],['TRINÉ','I warbled']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready')assert.ok(state.entry.senses.some(s=>s.english.includes(expected)),word)}
});

test('prefixed dictionary template abbreviations stay in the audit rather than learner usage text',()=>{
 assert.deepEqual(translationUsage(['source use: utsf','form source use: utci','source use: Mexico','rare']),['source use: Mexico','rare']);
});

test('further source-bound verbs cover human carrying and musical warbling without inventing animal subjects',async()=>{
 const client=new TranslationClient();for(const [word,expected]of [['PORTABA','I was carrying'],['TRINABA','I was warbling']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.equal(state.entry.kind,'english-wiktionary');assert.ok(state.entry.senses.some(s=>s.english.includes(expected)),word)}}
 const mouse=await client.lookup('RATONÓ','es-MX');assert.equal(mouse.phase,'ready');if(mouse.phase==='ready'){assert.ok(mouse.entry.senses.some(s=>s.english.includes('it gnawed')));assert.ok(!mouse.entry.senses.some(s=>s.english.some(m=>/^(?:I|he\/she|you|we|they) gnawed/.test(m))))}
 const first=await client.lookup('RATONÉ','es-MX');if(first.phase==='ready')assert.ok(!first.entry.senses.some(s=>s.english.includes('I gnawed')));
});

test('reviewed synonym meanings stay sense-specific and preserve usage qualifications',async()=>{
 const client=new TranslationClient();for(const [word,meaning]of [['ALDABÓN','doorknocker'],['MULILLA','Roman'],['ZEDA','letter Z'],['COPINO','capacity varies by locality']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.equal(state.entry.kind,'english-wiktionary');assert.ok(state.entry.senses.some(s=>s.english.some(m=>m.includes(meaning))),word);assert.ok(!state.entry.senses.some(s=>s.english.some(m=>/^synonym of /i.test(m))),word)}}
 const knocker=await client.lookup('ALDABÓN','es-MX');if(knocker.phase==='ready')assert.ok(!knocker.entry.senses.some(s=>s.english.some(m=>/latch|bolt/.test(m))));
 const letter=await client.lookup('ZEDA','es-MX');if(letter.phase==='ready')assert.ok(!letter.entry.senses.some(s=>s.english.some(m=>/theta|Greek/.test(m))));
 const measure=await client.lookup('COPINO','es-MX');if(measure.phase==='ready')assert.ok(measure.entry.senses.some(s=>s.tags.includes('historical')));
});

test('a source-backed personal figurative reading survives alongside literal entity restrictions',async()=>{
 const state=await new TranslationClient().lookup('ZOZOBRÉ','es-MX');assert.equal(state.phase,'ready');if(state.phase==='ready'){assert.equal(state.entry.kind,'english-wiktionary');assert.ok(state.entry.senses.some(s=>s.english.includes('I worried')));assert.ok(state.entry.senses.some(s=>s.tags.some(t=>/worry|personal|person|figurative/.test(t))))}
});

test('synonym targets do not relabel the source word grammatical gender',async()=>{
 const client=new TranslationClient();for(const word of ['COLLADA','SEXMA']){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.tags.includes('feminine')),word);assert.ok(!state.entry.senses.some(s=>s.tags.includes('masculine')),word)}}
});

test('additional Spanish-source meanings distinguish adjective agreement, caregivers and animal-only actions',async()=>{
 const client=new TranslationClient();for(const [word,meaning]of [['BÓVIDA','bovid'],['MAMANTE','that I breastfeed'],['AMARECE','it mates with a ewe']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.equal(state.entry.kind,'reviewed-spanish');assert.ok(state.entry.senses.some(s=>s.english.includes(meaning)),word)}}
 const first=await client.lookup('AMARECÍ','es-MX');if(first.phase==='ready')assert.ok(!first.entry.senses.some(s=>s.english.includes('I mated with a ewe')));
});

test('explicit accusative clitics render selected objects and formal commands without indicative subjects',async()=>{
 const client=new TranslationClient();for(const [word,meaning]of [['BÉBELO','drink it! (informal singular)'],['LÉALO','read it! (formal singular)'],['MÍRENLO','look at it! (plural)'],['VERLO','to see it'],['OÍRLO','to hear it']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.english.includes(meaning)),word);assert.ok(state.entry.senses.some(s=>s.tags.some(t=>/selected inanimate direct object/.test(t))),word)}}
 const formal=await client.lookup('LÉALO','es-MX');if(formal.phase==='ready')assert.ok(!formal.entry.senses.some(s=>s.english.some(m=>/he\/she|they read/.test(m))));
 const love=await client.lookup('AMARLO','es-MX');assert.equal(love.phase,'ready');if(love.phase==='ready')assert.ok(love.entry.senses.some(s=>s.tags.includes('literary')));
});

test('word-level provenance resolves a shared exact review-hash table without duplicating it per reading',()=>{
 const audit=JSON.parse(readFileSync(new URL('../src/data/spanish/english-translation-audit.json',import.meta.url),'utf8'));const proofs=audit.evidence.PORTABA.filter((r:any)=>r.additionalVerbReview);assert.ok(proofs.length);for(const proof of proofs){assert.equal(proof.additionalVerbReview.reviewHashesRef,'#/additionalVerbReview/reviewHashes');assert.equal(proof.additionalVerbReview.reviews,undefined);assert.ok(Number.isInteger(proof.additionalVerbReview.meaningIndex));assert.match(proof.lemmaRecordSha256,/^[a-f0-9]{64}$/)}assert.match(audit.additionalVerbReview.reviewHashes['english-additional-verb-3-review-spec.json'],/^[a-f0-9]{64}$/);
});

test('explicit second-author agreement recovers an exact English-source selected verb sense',async()=>{
 const state=await new TranslationClient().lookup('ADHERÍ','es-MX');assert.equal(state.phase,'ready');if(state.phase==='ready'){assert.equal(state.entry.kind,'english-wiktionary');assert.ok(state.entry.senses.some(s=>s.english.includes('I attached')))}
});

test('Spanish cross-review keeps human operators distinct from literal plant agents',async()=>{
 const client=new TranslationClient();for(const [word,meaning]of [['ACEQUIO','I dig irrigation channels'],['ACEPA','it takes root']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.equal(state.entry.kind,'reviewed-spanish');assert.ok(state.entry.senses.some(s=>s.english.includes(meaning)),word)}}
 const first=await client.lookup('ACEPO','es-MX');if(first.phase==='ready')assert.ok(!first.entry.senses.some(s=>s.english.includes('I take root')&&s.tags.some(t=>/plant/.test(t))));
});

test('new cross-reviewed literal stork readings do not generate human clattering clauses',async()=>{
 const client=new TranslationClient();const third=await client.lookup('CROTORA','es-MX');assert.equal(third.phase,'ready');if(third.phase==='ready'){assert.ok(third.entry.senses.some(s=>s.english.includes('it clatters')&&s.tags.some(t=>/stork/.test(t))));assert.ok(!third.entry.senses.some(s=>s.english.includes('he/she/it clatters')))}
 const first=await client.lookup('CROTORÉ','es-MX');if(first.phase==='ready')assert.ok(!first.entry.senses.some(s=>s.english.includes('I clattered')&&s.tags.some(t=>/stork/.test(t))));
});

test('selected causative readings scope broader source constructions instead of contradictory standalone labels',async()=>{
 const state=await new TranslationClient().lookup('ADHERÍ','es-MX');assert.equal(state.phase,'ready');if(state.phase==='ready'){const sense=state.entry.senses.find(s=>s.english.includes('I attached'));assert.ok(sense);assert.ok(!sense.tags.includes('intransitive'));assert.ok(!sense.tags.includes('reflexive'));assert.ok(sense.tags.some(t=>t.startsWith('Spanish uses include:')&&t.includes('intransitive')&&t.includes('transitive')&&t.includes('reflexive')))}
 const audit=JSON.parse(readFileSync(new URL('../src/data/spanish/english-translation-audit.json',import.meta.url),'utf8'));assert.ok(audit.evidence['ADHERÍ'].some((r:any)=>r.lemmaUsageInventory?.includes('intransitive')&&r.lemmaUsageInventory?.includes('transitive')&&r.lemmaUsageInventory?.includes('reflexive')));
});

test('human-collective GENTES keeps English people without globally changing national groups',async()=>{
 const client=new TranslationClient();const state=await client.lookup('GENTES','es-MX');assert.equal(state.phase,'ready');if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.partOfSpeech==='noun'&&s.english.includes('people')&&s.tags.includes('plural')&&s.tags.includes('feminine')));assert.ok(!state.entry.senses.some(s=>s.english.includes('peoples')&&s.tags.includes('source meaning: people')&&!s.tags.some(t=>/nation|ethnic/.test(t))))}
 const nations=await client.lookup('PUEBLOS','es-MX');assert.equal(nations.phase,'ready');if(nations.phase==='ready')assert.ok(nations.entry.senses.some(s=>s.english.includes('nations')));
});

test('additional reviewed direct-object forms preserve commands, particles and homograph roots',async()=>{
 const client=new TranslationClient();for(const [word,meaning]of [['ÚSALO','use it! (informal singular)'],['ÁBRELO','open it! (informal singular)'],['HAZLO','make it! (informal singular)'],['HÁGALO','make it! (formal singular)']]){const state=await client.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.english.includes(meaning)&&s.tags.some(t=>t.includes('selected inanimate direct object'))),word)}}
 const formal=await client.lookup('HÁGALO','es-MX');if(formal.phase==='ready')assert.ok(!formal.entry.senses.some(s=>s.english.some(m=>/he\/she|they make/.test(m))));
 const held=await client.lookup('CAPARLO','es-MX');if(held.phase==='ready')assert.ok(!held.entry.senses.some(s=>s.english.includes('to cut it off')&&s.tags.some(t=>t.includes('selected inanimate direct object'))));
});

// Source-reviewed homographs and regional commands have distinct addressed persons.
test('direct-object homographs keep separate source senses, voseo and regional warnings',async()=>{
 const c=new TranslationClient();for(const [word,meanings]of [['CRÉALO',['create it! (informal singular)','believe it! (formal singular)']],['CRÉELO',['create it! (formal singular)','believe it! (informal singular)']],['PONLO',['turn it on! (informal singular)']]] as const){const state=await c.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready')for(const m of meanings)assert.ok(state.entry.senses.some(s=>s.english.includes(m)),word+': '+m)}
 const voseo=await c.lookup('SABELA','es-MX');assert.equal(voseo.phase,'ready');if(voseo.phase==='ready')assert.ok(voseo.entry.senses.some(s=>s.english.includes('know it! (informal singular)')&&s.tags.includes('voseo')));
 const taking=await c.lookup('COGERLO','es-MX');assert.equal(taking.phase,'ready');if(taking.phase==='ready')assert.ok(taking.entry.senses.some(s=>s.english.includes('to take it')&&s.tags.some(t=>/vulgar sexual uses in Mexico/.test(t))));
});

test('qualified English inflections bind to the selected Spanish sense rather than the English spelling alone',async()=>{
 const c=new TranslationClient();for(const [word,meaning]of [['DEJÉ','I left'],['PAGÓ','he/she/it paid'],['MINTIÓ','he/she/it lied'],['ENLATÉ','I canned']]){const state=await c.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready')assert.ok(state.entry.senses.some(s=>s.english.includes(meaning)),word)}
});

test('qualified homographs keep physical and truth-telling paradigms separate without inventing a participle',async()=>{
 const c=new TranslationClient();for(const [word,good,bad]of [['EMPLOMÓ','he/she/it leaded','he/she/it led'],['COMANDÓ','he/she/it led','he/she/it leaded'],['MINTIÓ','he/she/it lied','he/she/it lay']]){const state=await c.lookup(word,'es-MX');assert.equal(state.phase,'ready',word);if(state.phase==='ready'){assert.ok(state.entry.senses.some(s=>s.english.includes(good)),word);assert.ok(!state.entry.senses.some(s=>s.english.includes(bad)),word)}}
 const mentido=await c.lookup('MENTIDO','es-MX');if(mentido.phase==='ready')assert.ok(!mentido.entry.senses.some(s=>s.english.includes('lain')));
 const audit=JSON.parse(readFileSync('src/data/spanish/english-translation-audit.json','utf8'));const bindings=audit.qualifiedEnglishSlots.bindings;for(const lemma of ['mentir','anillar']){const r=bindings.find((x:any)=>x.spanish===lemma);assert.ok(r);assert.equal(r.approvedSlots.pastParticiple,undefined)}
});

test('reviewed plural animals and plants get they readings without human or plural-weather generalization',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['OVAN','they lay eggs'],['MUGEN','they moo'],['ACEPAN','they take root']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word);assert.ok(!s.entry.senses.some(r=>r.english.some(e=>/you .*lay eggs|you .*moo|you .*take root/.test(e))),word)}}
 for(const word of ['LLUEVEN','NIEVAN','TRUENAN']){const s=await c.lookup(word,'es-MX');if(s.phase==='ready')assert.ok(!s.entry.senses.some(r=>r.english.some(e=>/^they (?:rain|snow|thunder)$/.test(e))),word)}
});

test('exact plural plant readings do not display a contradictory prior singular-only approval note',async()=>{
 const s=await new TranslationClient().lookup('HOJECEN','es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready'){const reading=s.entry.senses.find(r=>r.english.includes('they grow leaves'));assert.ok(reading);assert.ok(reading.tags.some(t=>/rare/.test(t)));assert.ok(!reading.tags.some(t=>/only the selected third-person singular/.test(t)));assert.ok(!reading.tags.includes('ustedes-address'))}
});

test('new plural animal subject labels scope the old singular policy as prior evidence',async()=>{
 const s=await new TranslationClient().lookup('MUGEN','es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready'){const reading=s.entry.senses.find(r=>r.english.includes('they moo'));assert.ok(reading);assert.ok(reading.tags.some(t=>t.startsWith('subject scope: reviewed plural animal/plant agents;')));assert.ok(!reading.tags.some(t=>/Restrict to animal it|singular it is safe/.test(t)))}
});

test('direct Spanish definitions become useful English meanings without fabricated example lessons',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['ANTIER','the day before yesterday'],['ABARCÓN','pipe-support clamp'],['AJICERO','chili container for the table']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){assert.equal(s.entry.kind,'reviewed-spanish');assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word);assert.equal('example' in s.entry,false)}}
});

test('direct lexical readings keep source limits and do not invent cloth fiber or grammatical gender',async()=>{
 const c=new TranslationClient();const cloth=await c.lookup('ALEZO','es-MX');assert.equal(cloth.phase,'ready');if(cloth.phase==='ready'){assert.ok(cloth.entry.senses.some(r=>r.english.includes('strip of cloth')));assert.ok(!cloth.entry.senses.some(r=>r.english.some(e=>/linen/.test(e))))}
 for(const w of ['ACEBEDA','ALFANA']){const s=await c.lookup(w,'es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready')assert.ok(!s.entry.senses.some(r=>r.tags.some(t=>/^(?:source use: )?(?:masculine|feminine)$/.test(t))))}
 const old=await c.lookup('CORNUTO','es-MX');assert.equal(old.phase,'ready');if(old.phase==='ready')assert.ok(old.entry.senses.some(r=>r.english.includes('horned')&&r.tags.some(t=>/completely obsolete.*fixed logical expressions/.test(t))));
});

test('additional reviewed lexical nouns retain precise descriptive English meanings',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['ADENIA','enlargement of the lymph nodes'],['AJUAGAS','ulcers on equine hooves']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word);assert.equal('example' in s.entry,false)}}
});

test('new lexical meanings preserve historical belief, technical distinctions and regional usage',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['ALIDONA','stone once believed to occur inside swallows'],['ALOBARA','line of equal atmospheric-pressure change'],['CEJUELA','guitar nut that aligns the strings']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word)}
 const regional=await c.lookup('ALIFA','es-MX');assert.equal(regional.phase,'ready');if(regional.phase==='ready')assert.ok(regional.entry.senses.some(r=>r.tags.includes('source use: Mexico')&&r.tags.includes('source use: Andalusia')));
});

test('further reviewed direct-object words preserve selected actions and command address',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['TASARLA','to appraise it'],['VÉNDELA','sell it! (informal singular)'],['AGÍTALO','shake it! (informal singular)']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word)}
});

test('further homographs keep legal and obsolete scope without inventing regional labels',async()=>{
 const c=new TranslationClient();for(const [word,text,usage]of [['CASARLA','to overturn it',/judicial ruling/],['FÓLLALA','destroy it! (informal singular)',/obsolete/],['HABERLA','to possess it',/obsolete/]] as const){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes(text)&&r.tags.some(t=>(usage as RegExp).test(t))),word)}
 const giving=await c.lookup('DIÑARLO','es-MX');assert.equal(giving.phase,'ready');if(giving.phase==='ready'){assert.ok(giving.entry.senses.some(r=>r.english.includes('to give it')&&r.tags.includes('colloquial')));assert.ok(!giving.entry.senses.some(r=>r.tags.some(t=>/^(?:Mexico|Spain|Mexican|Spanish regional)$/.test(t))))}
 for(const w of ['HERIRLO','SEDARLA']){const s=await c.lookup(w,'es-MX');if(s.phase==='ready')assert.ok(!s.entry.senses.some(r=>r.tags.includes('selected inanimate direct object: it')))}
});

test('additional source-bound verb frames render observed persons and the resolved agricultural sense',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['EDRO','I plow fields a second time'],['JASÉ','I made cuts in meat']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word)}
 const held=await c.lookup('CONSTO','es-MX');if(held.phase==='ready')assert.ok(!held.entry.senses.some(r=>r.english.includes('I demonstrate')));
});

test('new verb forms preserve an existing noun homograph and both source citations',async()=>{
 const s=await new TranslationClient().lookup('APURE','es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready'){assert.ok(s.entry.senses.some(r=>r.english.includes('refining or purifying a material')));assert.ok(s.entry.senses.some(r=>r.english.includes('that I purify')));const urls=[s.entry.sourceUrl,...(s.entry.sourceLinks??[]).map(x=>x.url)];assert.ok(urls.some(x=>x.endsWith('/apure')));assert.ok(urls.some(x=>x.endsWith('/apurar')))}
});

test('new frames expose conflicting source metadata and preserve literal nonhuman restrictions',async()=>{
 const c=new TranslationClient();const iris=await c.lookup('IRISO','es-MX');assert.equal(iris.phase,'ready');if(iris.phase==='ready')assert.ok(iris.entry.senses.some(r=>r.english.includes('I split light into its colors')&&r.tags.some(t=>t.includes('source metadata conflict'))));
 const gray=await c.lookup('GRISEO','es-MX');if(gray.phase==='ready')assert.ok(!gray.entry.senses.some(r=>r.english.includes('I turn gray')));
 const audit=JSON.parse(readFileSync('src/data/spanish/spanish-derived-translation-audit.json','utf8'));const proof=audit.evidence.EDRO.find((r:any)=>r.newFrameReview);assert.equal(proof.newFrameReview.meaningResolution.selectedTarget.word,'binar');assert.ok(proof.newFrameReview.meaningResolution.selectedTarget.synonymLinks.some((r:any)=>r.word==='edrar'));
});

test('new reviewed WordNet alignments cover noun, adjective and whole pronominal lexical meanings',async()=>{
 const c=new TranslationClient();for(const [word,text,pos]of [['ALCEA','hollyhock genus (Alcea)','noun'],['CANULAR','tube-shaped','adj'],['ALIARSE','to form an alliance','verb']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){assert.equal(s.entry.kind,'reviewed-wordnet');assert.ok(s.entry.senses.some(r=>r.english.includes(text)&&r.partOfSpeech===pos),word)}}
});

test('reviewed whole pronominal words preserve self, reciprocal and inchoative roles',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['LAVARSE','to wash oneself'],['LEERSE','to read'],['POSARSE','to alight (of a flying animal)']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word)}
 const reading=await c.lookup('LEERSE','es-MX');if(reading.phase==='ready')assert.ok(!reading.entry.senses.some(r=>r.english.some(v=>/read oneself/.test(v))));
});

test('new adapted lexical data keeps all source notices without relabeling legacy WordNet entries',async()=>{
 const c=new TranslationClient();const added=await c.lookup('CANULAR','es-MX');assert.equal(added.phase,'ready');if(added.phase==='ready')assert.equal(added.entry.license,'CC-BY-SA-4.0 + CC-BY-3.0 + WordNet');
 const legacy=await c.lookup('CIERVA','es-MX');assert.equal(legacy.phase,'ready');if(legacy.phase==='ready')assert.equal(legacy.entry.license,'CC-BY-3.0 + WordNet');
});

test('word-level source links include the reviewed base or synonym page',async()=>{
 const c=new TranslationClient();for(const [word,base]of [['ECHARSE','tenderse'],['ASEARSE','asear'],['FIARSE','fiar']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.sourceLinks?.some(link=>link.url==='https://es.wiktionary.org/wiki/'+base),word)}
});

test('new lexical meanings retain selected voice, register and genus scope',async()=>{
 const c=new TranslationClient();const freeze=await c.lookup('HELARSE','es-MX');assert.equal(freeze.phase,'ready');if(freeze.phase==='ready'){assert.ok(freeze.entry.senses.some(r=>r.english.includes('to freeze into ice')));assert.ok(!freeze.entry.senses.some(r=>r.english.some(e=>/cause.*freeze/.test(e))))}
 const marked=await c.lookup('TIRARSE','es-MX');assert.equal(marked.phase,'ready');if(marked.phase==='ready')assert.ok(marked.entry.senses.some(r=>r.tags.some(t=>t.includes('Spain'))&&r.tags.some(t=>t.includes('vulgar'))));
 const genus=await c.lookup('ATROPA','es-MX');assert.equal(genus.phase,'ready');if(genus.phase==='ready')assert.ok(genus.entry.senses.some(r=>r.english.some(e=>/genus.*Atropa|Atropa.*genus/.test(e))));
});

test('reviewed MERAR expiry forms use died and dying while preserving slang and other guards',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['MERÉ','I died'],['MERABA','I was dying']]){const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){assert.ok(s.entry.senses.some(r=>r.english.includes(text)&&r.tags.includes('source use: slang')),word);assert.ok(!s.entry.senses.some(r=>r.english.some(v=>/dieing/.test(v))),word)}}
 const other=await c.lookup('PALMÉ','es-MX');if(other.phase==='ready')assert.ok(!other.entry.senses.some(r=>r.english.includes('I died')));
});

test('additional exact Spanish frames retain regional and linked-source meanings',async()=>{
 const c=new TranslationClient();
 for(const [word,text]of [['COLEAN','they fail an exam'],['OVILLAS','you form balls of yarn'],['ARUÑO','I scratch']]){
  const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);
  if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word);
 }
 const s=await c.lookup('COLEAN','es-MX');if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes('they fail an exam')&&r.tags.includes('source use: Chile')));
});

test('personal verb senses stay distinct from animal and weather readings and retain source conflicts',async()=>{
 const c=new TranslationClient();
 for(const [word,text]of [['GAÑAMOS','that we breathe noisily and forcefully'],['NEVABAN','they were whitening'],['PIABAN','they were drinking wine'],['HELABAN','they were discouraging'],['CALABAN','they were examining closely'],['BALABAN','they were yearning'],['MANABAN','they were releasing liquid'],['TUTEA','he/she/it addresses someone as tú']]){
  const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);
  if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word);
 }
 const p=await c.lookup('PIABAN','es-MX');if(p.phase==='ready'){
  const s=p.entry.senses.find(r=>r.english.includes('they were drinking wine'));assert.ok(s);
  assert.ok(s.tags.includes('source use: slang'));assert.ok(s.tags.includes('source use: transitive'));
  assert.ok(!s.tags.includes('source use: intransitive'));assert.ok(s.tags.some(t=>t.includes('source metadata conflict')));
 }
});

test('additional direct lexical meanings distinguish regional senses and taxonomic scope',async()=>{
 const c=new TranslationClient();
 for(const [word,text]of [['ACITRÓN','candied biznaga cactus stem'],['CUCHETA','a bunk bed'],['CÍCERO','a typographic unit of twelve points, about 4.5 mm'],['DROSERA','a sundew (Drosera)']]){
  const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);
  if(s.phase==='ready'){assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word);assert.equal('example'in s.entry,false)}
 }
 const d=await c.lookup('DROSERA','es-MX');if(d.phase==='ready')assert.ok(d.entry.senses.some(r=>r.tags.includes('meaning context: Selected carnivorous plant in the genus Drosera; no medicinal uses inferred.')));
 const c1=await c.lookup('CUCHETA','es-MX');if(c1.phase==='ready')for(const region of ['Argentina','Paraguay','Uruguay'])assert.ok(c1.entry.senses.some(r=>r.tags.includes('source use: '+region)));
});

test('proper-name translations preserve capitalization and independent common-word meanings',async()=>{
 const c=new TranslationClient();const peru=await c.lookup('PERÚ','es-MX');assert.equal(peru.phase,'ready');
 if(peru.phase==='ready'){assert.ok(peru.entry.senses.some(s=>s.partOfSpeech==='name'&&s.english.includes('Peru, a country in South America')));assert.equal(peru.entry.sourceUrl,'https://es.wiktionary.org/wiki/Per%C3%BA')}
 const escocia=await c.lookup('ESCOCIA','es-MX');assert.equal(escocia.phase,'ready');if(escocia.phase==='ready'){
  assert.ok(escocia.entry.senses.some(s=>s.partOfSpeech==='name'&&s.english.includes('Scotland')));
  assert.ok(!escocia.entry.senses.some(s=>s.tags.some(t=>/coverage credit|already translated/.test(t))));
  assert.ok(escocia.entry.senses.some(s=>s.partOfSpeech==='noun'&&s.english.some(e=>/moulding/.test(e))));
  assert.ok(escocia.entry.sourceUrl.endsWith('/escocia'));assert.ok(escocia.entry.sourceLinks?.some(l=>l.url.endsWith('/Escocia')));
 }
 assert.equal(translationPartOfSpeech('name'),'proper name');
 assert.equal((await c.lookup('PERÚ','en')).phase,'missing');
});

test('reviewed animal plural indicatives use only they and keep rare source usage scoped',async()=>{
 const c=new TranslationClient();
 for(const [word,text]of [['CROABAN','they were croaking'],['CROARON','they croaked'],['CROARÁN','they will croak'],['MUGÍAN','they were mooing'],['MUGIRÁN','they will moo'],['MAYABAN','they were meowing'],['MAYARON','they meowed'],['MAYARÁN','they will meow'],['PACÍAN','they were grazing'],['PACERÁN','they will graze'],['OVABAN','they were laying eggs'],['OVARON','they laid eggs'],['OVARÁN','they will lay eggs'],['MIABAN','they were meowing'],['MIARON','they meowed'],['MIARÁN','they will meow']]){
  const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){
   const reading=s.entry.senses.find(r=>r.english.includes(text));assert.ok(reading,word);assert.ok(reading.english.every(e=>e.startsWith('they ')),word);
   assert.ok(reading.tags.includes('third-person'));assert.ok(reading.tags.includes('plural'));assert.ok(!reading.tags.includes('ustedes-address'));
   if(word.startsWith('MIA')){assert.ok(reading.tags.includes('Spanish corroborating source use: rare'));assert.ok(!reading.tags.some(t=>/vulgar|pronominal|urination|Central-America|Venezuela/.test(t)))}
  }
 }
 const singular=await c.lookup('MUGÍA','es-MX');assert.equal(singular.phase,'ready');if(singular.phase==='ready')assert.ok(singular.entry.senses.some(r=>r.english.includes('it was mooing')));
});

test('MÍAN uses its exact Spanish form and rare cat sense without human or accent aliases',async()=>{
 const c=new TranslationClient();const s=await c.lookup('MÍAN','es-MX');assert.equal(s.phase,'ready');if(s.phase==='ready'){
  const meaning=s.entry.senses.find(r=>r.english.includes('they meow'));assert.ok(meaning);assert.deepEqual(meaning.english,['they meow']);assert.ok(meaning.tags.includes('Spanish corroborating source use: rare'));assert.ok(!meaning.tags.includes('ustedes-address'));
  assert.ok(s.entry.sourceLinks?.some(l=>l.url==='https://es.wiktionary.org/wiki/m%C3%ADan'));assert.ok(s.entry.sourceLinks?.some(l=>l.url==='https://es.wiktionary.org/wiki/miar'));
 }
 const plain=await c.lookup('MIAN','es-MX');if(plain.phase==='ready')assert.ok(!plain.entry.senses.some(r=>r.english.includes('they meow')));
 assert.equal((await c.lookup('MÍAN','en')).phase,'missing');
});

test('new direct lexical readings keep marker material and restricted textile/animal senses honest',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['HIDRIA','a large ancient water jar'],['LINDAZO','a boundary, especially one defined by markers or a bank'],['LECHUZO','less than one year old, of a mule'],['JOYANTE','fine and lustrous, of silk']]){
  const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready')assert.ok(s.entry.senses.some(r=>r.english.includes(text)),word);
 }
 const j=await c.lookup('JOYANTE','es-MX');if(j.phase==='ready'){assert.ok(j.entry.senses.some(r=>r.tags.some(t=>t.includes('seda joyante'))));assert.ok(!j.entry.senses.some(r=>r.tags.some(t=>/keep.*visible/.test(t))))}
 const l=await c.lookup('LINDAZO','es-MX');if(l.phase==='ready')assert.ok(!l.entry.senses.flatMap(r=>r.english).some(t=>/stones/.test(t)));
 const held=await c.lookup('MANGOTE','es-MX');if(held.phase==='ready')assert.ok(!held.entry.senses.flatMap(r=>r.english).includes('the cuff of a garment'));
});

test('exact plural nonhuman readings preserve legal, animal and literary subject limits',async()=>{
 const c=new TranslationClient();for(const [word,text]of [['CADUCAN','they expire'],['DESOVAN','they spawn'],['GRILLAN','they chirp'],['RIELAN','they shimmer'],['CRUJÍAN','they were creaking'],['FLUIRÁN','they will flow']]){
  const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){
   const r=s.entry.senses.find(r=>r.english.includes(text));assert.ok(r,word);assert.deepEqual(r.english,[text]);assert.ok(!r.tags.includes('ustedes-address'));
   if(word==='CADUCAN'){assert.ok(r.tags.some(t=>t.includes('laws, wills, contracts')));assert.ok(!r.tags.some(t=>t.includes('animal/plant')))}
   if(word==='GRILLAN')assert.ok(r.tags.some(t=>t.includes('outdated')));
   if(word==='RIELAN'){assert.ok(r.tags.some(t=>/poetic|literary/.test(t)));assert.ok(!r.tags.some(t=>/preserve the/.test(t)))}
  }
 }
});

test('reviewed function words keep child grammar, accent distinctions and plain learner context',async()=>{
 const c=new TranslationClient();for(const [word,text,pos,number]of [['AQUELLA','that (over there)','det','singular'],['ESTAS','these','det','plural'],['ÉSTAS','these ones','pron','plural'],['MUCHAS','many; a lot of','det','plural'],['CUÁNTOS','how many','det','plural'],['CUALES','which','pron','plural'],['TUYOS','yours','pron','plural']]){
  const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){
   const r=s.entry.senses.find(r=>r.partOfSpeech===pos&&r.english.includes(text));assert.ok(r,word);assert.ok(r.tags.includes(number),word);assert.ok(!r.tags.includes(number==='plural'?'singular':'plural'));
   assert.ok(!r.tags.some(t=>/JSON|authorized|FreeDict|form_of|sourceSenseIndex/.test(t)));
   if(word==='ÉSTAS')assert.ok(!r.english.includes('those ones'));
   if(word==='MUCHAS')assert.ok(!s.entry.senses.some(r=>r.partOfSpeech==='pron'));
  }
 }
 assert.equal((await c.lookup('AQUELLA','en')).phase,'missing');
});

test('exact common constructions keep object, existential and habitual meanings separate',async()=>{
 const c=new TranslationClient();for(const [word,meaning]of [['AYÚDAME','help me'],['VERTE','to see you'],['VERNOS','to see us'],['ROPAS','clothing'],['PÁGS','pages'],['HUBO','there were'],['HABRÁ','there will be'],['HABRÍA','there would be'],['HUBIERA','(if) there were'],['HUBIESE','(if) there were'],['SOLÍA','I used to'],['SOLÍAN','they used to']]){
  const s=await c.lookup(word,'es-MX');assert.equal(s.phase,'ready',word);if(s.phase==='ready'){
   const r=s.entry.senses.find(r=>r.english.includes(meaning));assert.ok(r,word);
   assert.ok(!r.tags.some(t=>/proofContext|raw-record|suffix rule|subjectPerson|subjectNumber|objectPerson|objectNumber|spanishPerson|spanishNumber|spanishGender/.test(t)));
   if(word.startsWith('SOLÍ'))assert.ok(r.tags.some(t=>/following action/.test(t)));
   if(word.startsWith('HUB')||word.startsWith('HABR'))assert.ok(r.english.every(e=>e.includes('there ')));
  }
 }
});
