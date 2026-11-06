import {definitionText, type DefinitionResult} from './definitions.ts';
import {normalizeGuess} from './language.ts';
type Entry = {sourceWord: string; partOfSpeech: string; senses: string[]};
type Table = Record<string, Entry[]>;
let pending: Promise<Table> | undefined;
/** Local, language-specific data only. English homographs never supply Filipino meanings. */
export async function filipinoDefinition(raw: string): Promise<DefinitionResult> {
 const word = normalizeGuess(raw, 'fil-PH');
 if (!pending) {
  const request = import('./data/filipino/definitions.json').then(module => module.default as Table);
  pending = request;
  void request.catch(() => {if (pending === request) pending = undefined;});
 }
 const entries = (await pending)[word] ?? [];
 const sourceWord = entries[0]?.sourceWord ?? word.toLocaleLowerCase('fil-PH');
 return {
  word,
  entries: entries.map(entry => ({partOfSpeech: definitionText(entry.partOfSpeech), senses: entry.senses.map(sense => definitionText(sense))})),
  sourceUrl: entries.length ? `https://en.wiktionary.org/wiki/${encodeURIComponent(sourceWord)}#Tagalog` : './third-party/fil-PH/NOTICE.txt',
  sourceLinks: entries.length ? [...new Set(entries.map(entry => entry.sourceWord))].map(source => ({label: `Wiktionary: ${source}`, url: `https://en.wiktionary.org/wiki/${encodeURIComponent(source)}#Tagalog`})) : undefined,
  sourceLabel: 'Wiktionary contributors · selected Tagalog senses · CC BY-SA 4.0',
  license: 'CC-BY-SA-4.0',
  note: 'Bundled English dictionary meanings for Filipino. Optional stress marks are folded for play; this can combine distinct meanings. Not every sense or contemporary Philippine usage is covered; not native-human reviewed.'
 };
}
