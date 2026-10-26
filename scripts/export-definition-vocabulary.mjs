/** Feed this output to import-local-definitions.py; no network or game state. */
import {vocabulary} from '../src/words.ts';
console.log(JSON.stringify(Object.fromEntries([4,5,6,7].map(n=>[n,[...vocabulary(n,'en').allowed].sort()]))));
