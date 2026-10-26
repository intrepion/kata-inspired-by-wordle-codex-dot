export type Language='en'|'es-MX';
export const LANGUAGES=['en','es-MX'] as const;
export function isLanguage(value:unknown):value is Language {return value==='en'||value==='es-MX'}
export function normalizeGuess(raw:string,language:Language='en'):string {return raw.normalize('NFC').toLocaleUpperCase(language)}
export function isLetter(raw:string,language:Language='en'):boolean {return (language==='es-MX'?/^[A-ZÁÉÍÓÚÜÑ]$/:/^[A-Z]$/).test(raw)}
export function validLetters(raw:string,language:Language='en'):boolean {return [...raw].every(letter=>isLetter(letter,language))}
export function languageLabel(language:Language):string {return language==='es-MX'?'Español (México)':'English'}
