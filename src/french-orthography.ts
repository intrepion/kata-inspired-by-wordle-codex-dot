import canonical from './data/french/canonical-spellings.json';
/** Keep accents for answer/reveal identity; ligatures explicitly occupy two tiles. */
export function frenchTileSpelling(raw: string): string {
 return raw.normalize('NFC').toLocaleUpperCase('fr').replace(/Œ/g,'OE').replace(/Æ/g,'AE');
}
/** French puzzle keys fold accent marks and cedilla, never the letters themselves. */
export function frenchGuessKey(raw: string): string {
 return frenchTileSpelling(raw).normalize('NFD').replace(/\p{M}/gu,'').normalize('NFC');
}
/** Answer input must retain its accented identity; do not guess accents for plain input. */
export function frenchDisplaySpelling(raw: string): string {
 const word=frenchTileSpelling(raw);
 return (canonical as Record<string,string>)[word]??raw.normalize('NFC').toLocaleUpperCase('fr');
}
