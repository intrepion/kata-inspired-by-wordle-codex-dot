/** Reproducible, offline Spain pack. No downloads or runtime dependencies. */
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import nspell from 'nspell';
import {SPAIN_MIN_ZIPF, qualifyingSpainSenses} from './spanish-spain-policy.mjs';
const data = new URL('../src/data/spanish-spain/', import.meta.url);
const shared = new URL('../src/data/spanish/', import.meta.url);
const upstream = new URL('../public/third-party/es-ES/', import.meta.url);
const read = (name, root = data) => readFileSync(new URL(name, root), 'utf8');
const json = (name, root = data) => JSON.parse(read(name, root));
const hash = value => createHash('sha256').update(value).digest('hex');
const source = json('source.json');
for (const [name, digest] of Object.entries(source.dictionary.files)) if (hash(readFileSync(new URL(name, upstream))) !== digest) throw Error('Pinned es-ES source changed: ' + name);
for (const [name, digest] of Object.entries(source.inputs)) if (hash(read(name, shared)) !== digest) throw Error('Pinned shared Spanish evidence changed: ' + name);
if (source.minimumZipf !== SPAIN_MIN_ZIPF) throw Error('Spain frequency policy does not match source manifest');
const lexical = {...json('lexical-evidence.json', shared), ...json('extended-lexical-evidence.json', shared)};
const frequency = {...json('frequency-evidence.json', shared), ...json('extended-frequency-evidence.json', shared)};
const inherited = json('selection-overrides.json', shared).words;
const review = json('review.json');
const spell = nspell(readFileSync(new URL('es-ES.aff', upstream)), readFileSync(new URL('es-ES.dic', upstream)));
const words = [...new Set(Object.keys(spell.data).filter(word => word === word.normalize('NFC') && /^[a-záéíóúüñ]{3,11}$/.test(word) && spell.correct(word)).map(word => word.toLocaleUpperCase('es-ES')))].sort();
const vocabulary = Object.fromEntries(Array.from({length: 9}, (_, index) => [index + 3, {answers: [], guesses: []}]));
const definitions = {}, selection = {};
for (const word of words) {
 vocabulary[word.length].guesses.push(word);
 const entries = lexical[word] ?? [], qualified = qualifyingSpainSenses(entries);
 const preferred = review.preferred[word];
 if (preferred && !qualified.some(ref => ref.entry === preferred.entry && ref.sense === preferred.sense)) throw Error('Reviewed Spain sense no longer qualifies: ' + word);
 const inheritedPreferred = inherited[word]?.preferredEvidence;
 const first = preferred ?? qualified.find(ref => inheritedPreferred?.source === 'lexical' && ref.entry === inheritedPreferred.entry && ref.sense === inheritedPreferred.sense) ?? qualified[0];
 const blocked = review.excluded[word] || (inherited[word]?.exclude && !preferred?.overrideInheritedExclusion);
 const answer = frequency[word] >= SPAIN_MIN_ZIPF && first && !blocked;
 if (answer) {
  vocabulary[word.length].answers.push(word);
  const entry = entries[first.entry], sense = entry.senses[first.sense];
  selection[word] = {zipf: frequency[word], entry: first.entry, sense: first.sense, partOfSpeech: entry.pos_title ?? entry.pos, glosses: sense.glosses, tags: [...new Set([...(entry.tags ?? []), ...(sense.tags ?? [])])], rawSha256: entry.rawSha256, sourceUrl: `https://es.wiktionary.org/wiki/${encodeURIComponent(word.toLocaleLowerCase('es-ES'))}`};
 }
 // Answers show only source-qualified Spain senses, selected sense first. Guess-only
 // records retain source labels and grammar, never invent an English translation.
 let refs = answer ? [first, ...qualified.filter(ref => ref.entry !== first.entry || ref.sense !== first.sense)] : entries.flatMap((entry, i) => entry.senses.map((_, j) => ({entry: i, sense: j})));
 refs = refs.filter(ref => entries[ref.entry].senses[ref.sense].glosses?.length).slice(0, 8);
 if (refs.length) definitions[word] = refs.map(ref => {
  const entry = entries[ref.entry], sense = entry.senses[ref.sense];
  const tags = [...new Set([...(entry.tags ?? []), ...(sense.tags ?? []), ...(sense.raw_tags ?? [])])];
  return {partOfSpeech: entry.pos_title ?? entry.pos, senses: sense.glosses.map(gloss => (tags.length ? '[' + tags.join(', ') + '] ' : '') + gloss)};
 });
}
for (const [length, values] of Object.entries(vocabulary)) if (values.answers.length < 40) throw Error('Insufficient Spain answers at length ' + length);
for (const word of [...Object.keys(review.preferred), ...review.newlyEligibleReviewed]) if (!selection[word]) throw Error('Reviewed Spain answer is missing: ' + word);
for (const word of Object.keys(review.excluded)) if (selection[word]) throw Error('Excluded Spain word became an answer: ' + word);
const outputs = {'vocabulary.json': JSON.stringify(vocabulary) + '\n', 'answer-selection.json': JSON.stringify(selection, null, 2) + '\n'};
for (let length = 3; length <= 11; length++) outputs[`definitions-${length}.json`] = JSON.stringify(Object.fromEntries(Object.entries(definitions).filter(([word]) => word.length === length))) + '\n';
const coverage = {version: source.version, locale: source.locale, minimumZipf: SPAIN_MIN_ZIPF, lengths: Object.fromEntries(Object.entries(vocabulary).map(([length, values]) => [length, {answers: values.answers.length, guesses: values.guesses.length, definedAnswers: values.answers.filter(word => definitions[word]?.length).length, definedGuesses: values.guesses.filter(word => definitions[word]?.length).length}])), reviewSha256: hash(read('review.json')), inputs: source.inputs, outputs: Object.fromEntries(Object.entries(outputs).map(([name, text]) => [name, hash(text)])), limitations: source.sourceNotes + ' Definitions are selected Spanish-language Wiktionary meanings, not English translations. General spelling frequency and source labels do not certify every sense as common throughout Spain. No native-human review.'};
outputs['coverage.json'] = JSON.stringify(coverage, null, 2) + '\n';
for (const [name, text] of Object.entries(outputs)) {
 if (process.argv.includes('--check')) {if (read(name) !== text) throw Error('Regenerate Spain pack: ' + name);}
 else writeFileSync(new URL(name, data), text);
}
console.log(JSON.stringify(coverage.lengths));
