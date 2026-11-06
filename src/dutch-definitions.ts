import {definitionText, type DefinitionResult} from './definitions.ts';
import {normalizeGuess} from './language.ts';
type Entry = {sourceWord: string; partOfSpeech: string; senses: string[]};
type Table = Record<string, Entry[]>;
const loaders: Record<number, () => Promise<Table>> = {
 3: () => import('./data/dutch/definitions-3.json').then(module => module.default as Table),
 4: () => import('./data/dutch/definitions-4.json').then(module => module.default as Table),
 5: () => import('./data/dutch/definitions-5.json').then(module => module.default as Table),
 6: () => import('./data/dutch/definitions-6.json').then(module => module.default as Table),
 7: () => import('./data/dutch/definitions-7.json').then(module => module.default as Table),
 8: () => import('./data/dutch/definitions-8.json').then(module => module.default as Table),
 9: () => import('./data/dutch/definitions-9.json').then(module => module.default as Table),
 10: () => import('./data/dutch/definitions-10.json').then(module => module.default as Table),
 11: () => import('./data/dutch/definitions-11.json').then(module => module.default as Table),
};
const pending = new Map<number, Promise<Table>>();
/** Local, language-specific data only. English homographs never supply Dutch meanings. */
export async function dutchDefinition(raw: string): Promise<DefinitionResult> {
 const word = normalizeGuess(raw, 'nl-NL');
 const length = word.length;
 let request = pending.get(length);
 if (!request && loaders[length]) {
  request = loaders[length]();
  pending.set(length, request);
  void request.catch(() => {if (pending.get(length) === request) pending.delete(length);});
 }
 const entries = request ? (await request)[word] ?? [] : [];
 const sourceWord = entries[0]?.sourceWord ?? word.toLocaleLowerCase('nl-NL');
 return {
  word,
  entries: entries.map(entry => ({partOfSpeech: definitionText(entry.partOfSpeech), senses: entry.senses.map(sense => definitionText(sense))})),
  sourceUrl: entries.length ? `https://en.wiktionary.org/wiki/${encodeURIComponent(sourceWord)}#Dutch` : './third-party/nl-NL/NOTICE.txt',
  sourceLinks: entries.length ? [...new Set(entries.map(entry => entry.sourceWord))].map(source => ({label: `Wiktionary: ${source}`, url: `https://en.wiktionary.org/wiki/${encodeURIComponent(source)}#Dutch`})) : undefined,
  sourceLabel: 'Wiktionary contributors · selected Dutch senses · CC BY-SA 4.0',
  license: 'CC-BY-SA-4.0',
  note: 'Bundled English dictionary meanings for Dutch. Accents and trema remain distinct; IJ uses two tiles. Not every sense or contemporary Netherlands usage is covered; not native-human reviewed.'
 };
}
