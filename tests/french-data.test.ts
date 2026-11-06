import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import canada from '../src/data/french/vocabulary-fr-CA.json';
import france from '../src/data/french/vocabulary-fr-FR.json';
import canonical from '../src/data/french/canonical-spellings.json';
import normalized from '../src/data/french/normalized-keys.json';
import {frenchTileSpelling,frenchGuessKey,frenchDisplaySpelling} from '../src/french-orthography.ts';
import {frenchDefinition} from '../src/french-definitions.ts';
type Vocabulary=Record<string,{answers:string[];guesses:string[]}>;
const root=new URL('../src/data/french/',import.meta.url);
const read=(file:string)=>readFileSync(new URL(file,root),'utf8');
const referenceKey=(word:string)=>word.toLocaleUpperCase('fr').replaceAll('Œ','OE').replaceAll('Æ','AE').normalize('NFD').replace(/[\u0300-\u036f]/g,'');

test('French accents, cedilla, composed input and two-tile ligatures have explicit contracts',()=>{
 for(const [raw,tiles,key] of [['été','ÉTÉ','ETE'],['e\u0301te\u0301','ÉTÉ','ETE'],['façon','FAÇON','FACON'],['franc\u0327ais','FRANÇAIS','FRANCAIS'],['noël','NOËL','NOEL'],['cœur','COEUR','COEUR'],['nœud','NOEUD','NOEUD'],['œil','OEIL','OEIL'],['sœur','SOEUR','SOEUR'],['œuvre','OEUVRE','OEUVRE'],['æther','AETHER','AETHER']]){
  assert.equal(frenchTileSpelling(raw),tiles);assert.equal(frenchGuessKey(raw),key);assert.equal(tiles.length,key.length);
 }
 assert.notEqual(frenchGuessKey('cœur'),frenchGuessKey('cor'));
 assert.notEqual(frenchGuessKey('æ'),frenchGuessKey('e'));
 assert.equal(frenchDisplaySpelling('COEUR'),'CŒUR');assert.equal(frenchDisplaySpelling('NOEUD'),'NŒUD');assert.equal(frenchDisplaySpelling('OEUVRE'),'ŒUVRE');
 assert.equal(frenchDisplaySpelling('ÉTÉ'),'ÉTÉ');assert.equal(frenchDisplaySpelling('COTE'),'COTE');
});

for(const [locale,pack] of Object.entries({'fr-CA':canada,'fr-FR':france}) as [string,Vocabulary][])test(`${locale} has distinct-length, source-backed and normalized-unique pools`,()=>{
 assert.deepEqual(Object.keys(pack),['3','4','5','6','7','8','9','10','11']);
 for(const [length,{answers,guesses}] of Object.entries(pack)){
  assert.ok(answers.length>=40);assert.ok(guesses.length>answers.length);assert.equal(new Set(answers).size,answers.length);assert.equal(new Set(guesses).size,guesses.length);
  const allowed=new Set(guesses),keys=new Set<string>();
  const definitions=JSON.parse(read(`definitions-${length}.json`)) as Record<string,unknown>;
  for(const word of guesses){assert.equal(word.length,Number(length));assert.equal(frenchTileSpelling(word),word);assert.match(referenceKey(word),/^[A-Z]+$/);assert.equal((normalized as Record<string,string>)[word],referenceKey(word));assert.ok(definitions[word],word);}
  for(const word of answers){assert.ok(allowed.has(word));assert.ok(!keys.has(referenceKey(word)),word);keys.add(referenceKey(word));assert.equal(referenceKey(frenchDisplaySpelling(word)),referenceKey(word));}
 }
 assert.ok(pack[5].answers.includes('COEUR'));assert.ok(pack[5].answers.includes('NOEUD'));assert.ok(pack[4].answers.includes('OEIL'));assert.ok(pack[6].answers.includes('OEUVRE'));
 assert.ok(!pack[4].answers.includes('COEUR'));assert.ok(!pack[4].guesses.includes('CŒUR'));
});

test('French answers and accepted guesses respect reviewed regional usage',()=>{
 const ca=canada as Vocabulary,fr=france as Vocabulary;
 const canadaOnly=['CÉGEP','TUQUE','BLEUET','DÉPANNEUR','MAGASINAGE','POUDRERIE','MITAINE','CLAVARDAGE','BALADO','CHANDAIL','COURRIEL','POURRIEL'];
 const franceOnly=['BONNET','MYRTILLE','PULL','SHOPPING','MAIL','MOUFLE'];
 for(const word of canadaOnly){assert.ok(ca[word.length].answers.includes(word),word);assert.ok(!fr[word.length].answers.includes(word),word);assert.ok(ca[word.length].guesses.includes(word),word);}
 for(const word of franceOnly){assert.ok(fr[word.length].answers.includes(word),word);assert.ok(!ca[word.length].answers.includes(word),word);assert.ok(ca[word.length].guesses.includes(word),word);}
 for(const word of ['CÉGEP','TUQUE','BALADO','CLAVARDAGE','POUDRERIE','SOCCER','CONDO','CONDOS']){assert.ok(ca[word.length].guesses.includes(word),word);assert.ok(!fr[word.length].guesses.includes(word),word);}
 assert.ok(fr[5].guesses.includes('PRÉPA'));assert.ok(!ca[5].guesses.includes('PRÉPA'));
 for(const word of ['BLEUET','DÉPANNEUR','DENTIFRICE','CHOCOLATINE','CARIBOU','ESPOIR','ESPOIRS','LÉGUME','LÉGUMES','POISON','POISONS','TOBOGGAN','BRÈME','BRÈMES'])for(const pack of [ca,fr])assert.ok(pack[word.length].guesses.includes(word),word);
});

test('French local meanings retain canonical source headwords and exact accented identity',async()=>{
 const heart=await frenchDefinition('COEUR');assert.ok(heart.entries.some(entry=>entry.senses.some(sense=>sense.includes('heart (organ)'))));assert.ok(heart.sourceLinks?.some(link=>link.url.includes('c%C5%93ur#French')));
 const plain=await frenchDefinition('sur'),accented=await frenchDefinition('sûr');assert.ok((plain.sourceLinks?.length??0)>1);assert.deepEqual(accented.sourceLinks?.map(link=>link.label),['Wiktionary: sûr']);
 const composed=await frenchDefinition('cafe\u0301');assert.ok(composed.entries.length);assert.ok(composed.sourceLinks?.some(link=>link.label==='Wiktionary: café'));
 const unknown=await frenchDefinition('<script>');assert.equal(unknown.entries.length,0);assert.match(unknown.sourceUrl,/third-party\/fr/);
});

test('French meanings prioritize only explicitly reviewed regional senses without hiding other meanings',async()=>{
 const ca=await frenchDefinition('bleuet','fr-CA'),fr=await frenchDefinition('bleuet','fr-FR');
 assert.match(ca.entries[0].senses[0],/North-America.*blueberry/);assert.match(fr.entries[0].senses[0],/cornflower/);
 assert.ok(fr.entries[0].senses.some(sense=>sense.includes('blueberry')));assert.ok(ca.entries[0].senses.some(sense=>sense.includes('cornflower')));
 assert.match(ca.note??'',/Canada/);assert.match(fr.note??'',/France/);
 const dep=await frenchDefinition('dépanneur','fr-CA');assert.match(dep.entries[0].senses[0],/North-America.*convenience store/);
 const sweater=await frenchDefinition('chandail','fr-CA');assert.match(sweater.entries[0].senses[0],/sweater, jumper/);
 const mail=await frenchDefinition('mail','fr-FR');assert.match(mail.entries[0].senses[0],/email$/);
 const glove=await frenchDefinition('mitaine','fr-CA');assert.match(glove.entries[0].senses[0],/mitten$/);
 const ordinaryCA=await frenchDefinition('char','fr-CA'),ordinaryFR=await frenchDefinition('char','fr-FR');assert.deepEqual(ordinaryCA.entries,ordinaryFR.entries,'ordinary regional labels must not alter sense order');
});

test('French generation is offline, deterministic and checksum-verified',()=>{
 execFileSync(process.execPath,['scripts/generate-french.mjs','--check'],{cwd:new URL('../',import.meta.url),stdio:'pipe'});
 const coverage=JSON.parse(read('coverage.json')),source=JSON.parse(read('source.json'));
 for(const [file,digest] of Object.entries({...coverage.inputs,...coverage.outputs}))assert.equal(createHash('sha256').update(read(file)).digest('hex'),digest,file);
 assert.equal(source.wiktionary.dataLicense,'CC-BY-SA-4.0');assert.equal(source.wordfreq.dataLicense,'CC-BY-SA-4.0');
 assert.equal(source.wiktionary.artifactSha256,'9053b1845fb3e045fa1fbe3f749122fa43e21b49bfa741cadd50255ae6ca0126');
 assert.ok(Object.keys(canonical).length<100,'sparse canonical overrides stay small');
 assert.match(readFileSync(new URL('../public/third-party/fr/NOTICE.txt',import.meta.url),'utf8'),/Wiktionary contributors/);
 assert.ok(readFileSync(new URL('../public/third-party/fr/CC-BY-SA-4.0.txt',import.meta.url),'utf8').length>10000);
});
