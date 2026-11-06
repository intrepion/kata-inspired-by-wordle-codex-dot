import {frenchTileSpelling,frenchDisplaySpelling} from './french-orthography.ts';
// Bare en is retained solely to validate historical notebooks, never offered for play.
export type Language = 'en' | 'en-US' | 'en-GB' | 'en-AU' | 'es-MX' | 'es-ES' | 'fr-FR' | 'fr-CA' | 'fil-PH' | 'nl-NL';
export type DutchRules = 1 | 2;
/** Unmarked persisted rounds predate accent folding. */
export function savedDutchRules(value: unknown): DutchRules {
 return value !== null && typeof value === 'object' && 'dutchRules' in value && value.dutchRules === 2 ? 2 : 1;
}
export const LANGUAGES: readonly Language[] = ['en-US', 'en-GB', 'en-AU', 'es-MX', 'es-ES', 'fr-FR', 'fr-CA', 'fil-PH', 'nl-NL'];
export const LANGUAGE_FAMILIES = [
 {id:'en',label:'English',varieties:[{id:'en-US',label:'United States'},{id:'en-GB',label:'United Kingdom'},{id:'en-AU',label:'Australia'}]},
 {id:'es',label:'Español',varieties:[{id:'es-MX',label:'México'},{id:'es-ES',label:'España'}]},
 {id:'fr',label:'Français',varieties:[{id:'fr-FR',label:'France'},{id:'fr-CA',label:'Canada'}]},
 {id:'fil',label:'Filipino',varieties:[{id:'fil-PH',label:'Philippines'}]},
 {id:'nl',label:'Nederlands',varieties:[{id:'nl-NL',label:'Nederland'}]},
] as const;
export type LanguageFamily = typeof LANGUAGE_FAMILIES[number]['id'];
export function languageFamily(language:Language):LanguageFamily {return language.split('-')[0] as LanguageFamily}
export function varietiesFor(family:string):readonly {id:Language;label:string}[] {return LANGUAGE_FAMILIES.find(item=>item.id===family)?.varieties??[]}
/** Old mixed-English preference opens a fresh US notebook, never replays mixed clues. */
export function selectedLanguage(value:unknown):Language {return value!=='en'&&isLanguage(value)?value:'en-US'}
export function isFrench(language:Language):language is 'fr-FR'|'fr-CA' {return language==='fr-FR'||language==='fr-CA'}
export function usesAccentEquivalence(language:Language='en',dutchRules:DutchRules=2):boolean {return isFrench(language)||language==='nl-NL'&&dutchRules===2}
export function displaySpelling(raw:string,language:Language):string {return isFrench(language)?frenchDisplaySpelling(raw):raw}
export function isSpanish(language:Language):boolean {return language==='es-MX'||language==='es-ES'}
export function isEnglish(language:Language):boolean {return language==='en'||language.startsWith('en-')}

export function isLanguage(value: unknown): value is Language {
 return value==='en'||LANGUAGES.some(language => language === value);
}
/** Filipino gameplay uses everyday spelling: optional vowel stress/glottal marks
 * are folded, but Ñ remains distinct. NG is entered as two ordinary tiles. */
export function normalizeSpelling(raw: string, language: Language = 'en'): string {
 // Dutch IJ is a digraph (two tiles); compatibility ligatures are equivalent, not Y.
 if(isFrench(language))return frenchTileSpelling(raw);
 const spelling = language === 'nl-NL' ? raw.replace(/[Ĳĳ]/g, 'ij') : raw;
 const normalized = spelling.normalize('NFC').toLocaleUpperCase(language);
 return language === 'fil-PH'
  ? normalized.replace(/[ÁÀÂ]/g, 'A').replace(/[ÉÈÊ]/g, 'E').replace(/[ÍÌÎ]/g, 'I').replace(/[ÓÒÔ]/g, 'O').replace(/[ÚÙÛ]/g, 'U')
  : normalized;
}
/** Canonical spelling is retained separately for answer reveals. */
export function normalizeGuess(raw: string, language: Language = 'en', dutchRules: DutchRules = 2): string {
 const spelling = normalizeSpelling(raw, language);
 return usesAccentEquivalence(language,dutchRules) ? spelling.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC') : spelling;
}
export function isLetter(raw: string, language: Language = 'en'): boolean {
 return (isFrench(language) ? /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]$/ : language === 'nl-NL' ? /^[A-ZÀÁÂÄÇÈÉÊËÍÎÏÓÔÖÙÚÛÜ]$/ : isSpanish(language) ? /^[A-ZÁÉÍÓÚÜÑ]$/ : language === 'fil-PH' ? /^[A-ZÑ]$/ : /^[A-Z]$/).test(raw);
}
/** One keyboard event may contain the Dutch IJ ligature, normalized to two tiles. */
export function isLetterInput(raw: string, language: Language): boolean {
 return isLetter(raw, language) || isFrench(language)&&(raw==='OE'||raw==='AE') || language === 'nl-NL' && raw === 'IJ';
}
export function validLetters(raw: string, language: Language = 'en'): boolean {
 return [...raw].every(letter => isLetter(letter, language));
}
export function languageLabel(language: Language): string {
 return {en: 'English (legacy mixed list)', 'en-US':'American English', 'en-GB':'British English', 'en-AU':'Australian English', 'es-MX': 'Español (México)', 'es-ES':'Español (España)', 'fr-FR':'Français (France)', 'fr-CA':'Français (Canada)', 'fil-PH': 'Filipino (Philippines)', 'nl-NL': 'Nederlands (Nederland)'}[language];
}
export function keyboardRows(language: Language,dutchRules:DutchRules=2): readonly string[] {
 return language === 'nl-NL' && dutchRules === 2 ? ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'] : language === 'nl-NL'
  ? ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫', 'ÀÁÂÄÇÈÉÊË', 'ÍÎÏÓÔÖÙÚÛÜ']
  : isSpanish(language)
  ? ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫', 'ÁÉÍÓÚÜ']
  : language === 'fil-PH'
   ? ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫']
   : ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'];
}
