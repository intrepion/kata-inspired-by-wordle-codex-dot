import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import VOCABULARY from '../src/data/spanish-spain/vocabulary.json';
import SELECTION from '../src/data/spanish-spain/answer-selection.json';
import COVERAGE from '../src/data/spanish-spain/coverage.json';
import {spanishSpainDefinition} from '../src/spanish-spain-definitions.ts';
import {qualifyingSpainSenses, spainSenseExclusion} from '../scripts/spanish-spain-policy.mjs';
const vocabulary: Record<number, {answers: string[]; guesses: string[]}> = VOCABULARY;
const selection = SELECTION as Record<string, {zipf: number; glosses: string[]; tags: string[]}>;
const hasAnswer = (word: string) => vocabulary[word.length].answers.includes(word);
const hasGuess = (word: string) => vocabulary[word.length].guesses.includes(word);

test('Spain pack covers every length with unique source-backed answers and broader guesses', () => {
 assert.deepEqual(Object.keys(vocabulary), ['3','4','5','6','7','8','9','10','11']);
 for (const [size, data] of Object.entries(vocabulary)) {
  const length = Number(size), guesses = new Set(data.guesses);
  assert.equal(guesses.size, data.guesses.length);
  assert.equal(new Set(data.answers).size, data.answers.length);
  assert.ok(data.answers.length >= 40);
  assert.ok(data.answers.length < data.guesses.length);
  for (const word of data.guesses) {assert.equal(word.length, length); assert.match(word, /^[A-ZÁÉÍÓÚÜÑ]+$/); assert.equal(word, word.normalize('NFC'));}
  const coverage = COVERAGE.lengths[size as keyof typeof COVERAGE.lengths];
  assert.equal(coverage.answers, data.answers.length);
  assert.equal(coverage.definedAnswers, data.answers.length);
  for (const word of data.answers) {assert.ok(guesses.has(word), word); assert.ok(selection[word].zipf >= 3.5, word); assert.ok(selection[word].glosses.length, word);}
 }
});

test('Spain-specific lexical selection is genuinely different from Mexico', () => {
 for (const word of ['PATATA','CHAVAL','GUAY','JUDÍA','VÍDEO','COGER','ORDENADOR','VENGA','CERCANÍAS']) assert.ok(hasAnswer(word), word);
 for (const word of ['FLASH','SALIDO','TUS','VOSOTROS','HABLO','COMES','HABLARÉ','GAFAS']) {assert.ok(hasGuess(word), word); assert.equal(hasAnswer(word), false, word);}
 for (const word of ['HABLÁIS','COMÉIS','VIVÍS']) assert.ok(hasGuess(word), word);
 assert.equal(hasAnswer('CHILE'), false);
 assert.match(selection.COCHE.glosses[0], /motor/);
 assert.match(selection.PISO.glosses[0], /Vivienda/);
 assert.match(selection.MÓVIL.glosses[0], /teléfono/);
 assert.match(selection.COGER.glosses[0], /Agarrar/);
 for (const word of ['AGARRAR','COLA','CABALLO','ENTENDER','OJO','TRES']) assert.doesNotMatch(selection[word].glosses[0], /acto sexual|Pene|[Hh]eroína|homosexual|lejía|regidor/);
});

test('Spain sense policy accepts Spain, blocks foreign-only, plural and inflected-only senses', () => {
 const entry = {pos: 'noun', categories: ['ES:Lemas'], senses: []};
 const sense = {glosses: ['Una palabra.']};
 assert.equal(spainSenseExclusion(entry, {...sense, tags: ['Spain','Mexico']}), undefined);
 assert.equal(spainSenseExclusion(entry, {...sense, tags: ['Mexico']}), 'region');
 assert.equal(spainSenseExclusion(entry, {...sense, tags: ['Andalusia']}), 'region');
 assert.equal(spainSenseExclusion(entry, {...sense, tags: ['Spain','vulgar']}), 'usage');
 assert.equal(spainSenseExclusion(entry, {...sense, form_of: [{word: 'algo'}]}), 'grammar');
 assert.equal(spainSenseExclusion({...entry, categories: ['ES:Lemas','ES:Sustantivos solo en plural']}, sense), 'plural');
 assert.equal(spainSenseExclusion({...entry, pos: 'pron'}, {glosses: ['Pronombre de segunda persona del plural.']}), 'plural');
 assert.deepEqual(qualifyingSpainSenses([{...entry, senses: [{...sense, tags: ['Mexico']}, {...sense, tags: ['Spain']}]}]), [{entry: 0, sense: 1}]);
});

test('every Spain answer has an offline meaning matching its selected source sense', async () => {
 for (const [size, data] of Object.entries(vocabulary)) {
  const table = JSON.parse(readFileSync(new URL(`../src/data/spanish-spain/definitions-${size}.json`, import.meta.url), 'utf8'));
  for (const word of data.answers) assert.ok(table[word][0].senses[0].endsWith(selection[word].glosses[0]), word);
 }
 const car = await spanishSpainDefinition('coche');
 assert.match(car.entries[0].senses[0], /motor/);
 assert.equal(car.sourceUrl, 'https://es.wiktionary.org/wiki/coche');
 assert.match(car.note!, /Spanish-language/);
 assert.match((await spanishSpainDefinition('co\u0301ger')).note!, /Accents/);
 const video = await spanishSpainDefinition('vi\u0301deo');
 assert.equal(video.word, 'VÍDEO');
 assert.ok(video.entries.length);
 const missing = await spanishSpainDefinition('zzzzz');
 assert.deepEqual(missing.entries, []);
 assert.equal(missing.sourceUrl, './third-party/es-ES/NOTICE.txt');
});

test('Spain generation is offline and byte-for-byte reproducible from pinned sources', () => {
 const result = spawnSync(process.execPath, ['scripts/generate-spanish-spain.mjs','--check'], {cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8'});
 assert.equal(result.status, 0, result.stderr || result.stdout);
});
