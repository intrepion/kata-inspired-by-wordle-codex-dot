/** Generate the input for import-extended-definitions.py from the curated guess lists. */
import {EXTENDED_VOCABULARY} from '../src/data/extended-vocabulary.ts';
console.log(JSON.stringify(Object.fromEntries(Object.entries(EXTENDED_VOCABULARY).map(([n,data])=>[n,[...data.guesses].sort()]))));
