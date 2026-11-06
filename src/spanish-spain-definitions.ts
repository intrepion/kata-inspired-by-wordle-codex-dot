import {definitionText, type DefinitionResult} from './definitions.ts';
type Table = Record<string, {partOfSpeech: string; senses: string[]}[]>;
const loaders: Record<number, () => Promise<Table>> = {
 3: () => import('./data/spanish-spain/definitions-3.json').then(module => module.default),
 4: () => import('./data/spanish-spain/definitions-4.json').then(module => module.default),
 5: () => import('./data/spanish-spain/definitions-5.json').then(module => module.default),
 6: () => import('./data/spanish-spain/definitions-6.json').then(module => module.default),
 7: () => import('./data/spanish-spain/definitions-7.json').then(module => module.default),
 8: () => import('./data/spanish-spain/definitions-8.json').then(module => module.default),
 9: () => import('./data/spanish-spain/definitions-9.json').then(module => module.default),
 10: () => import('./data/spanish-spain/definitions-10.json').then(module => module.default),
 11: () => import('./data/spanish-spain/definitions-11.json').then(module => module.default),
};
const pending = new Map<number, Promise<Table>>();
/** Same-origin Spain meanings only; never reuse Mexican-context authored lessons. */
export async function spanishSpainDefinition(raw: string): Promise<DefinitionResult> {
 const word = raw.normalize('NFC').toLocaleUpperCase('es-ES');
 let request = pending.get(word.length);
 if (!request && loaders[word.length]) {
  request = loaders[word.length]();
  pending.set(word.length, request);
  void request.catch(() => {if (pending.get(word.length) === request) pending.delete(word.length);});
 }
 const table = request ? await request : undefined;
 const entries = table?.[word] ?? [];
 return {
  word,
  entries: entries.map(entry => ({partOfSpeech: definitionText(entry.partOfSpeech), senses: entry.senses.map(sense => definitionText(sense))})),
  sourceUrl: entries.length ? `https://es.wiktionary.org/wiki/${encodeURIComponent(word.toLocaleLowerCase('es-ES'))}` : './third-party/es-ES/NOTICE.txt',
  sourceLabel: 'Wiktionary contributors · Spanish meanings · CC BY-SA 4.0',
  license: 'CC-BY-SA-4.0',
  note: 'Selected Spanish-language dictionary meanings, not English translations. Answer senses are filtered for Spain; guess-only entries may retain other regional or grammatical labels. Coverage is incomplete and is not native-human certified. Accents, Ü and Ñ stay distinct.'
 };
}
