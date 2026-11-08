import germanCanonical from './data/german/canonical-spellings.json';
import {frenchTileSpelling,frenchDisplaySpelling} from './french-orthography.ts';
// Bare en is retained solely to validate historical notebooks, never offered for play.
export type Language = 'en' | 'en-US' | 'en-GB' | 'en-AU' | 'es-MX' | 'es-ES' | 'fr-FR' | 'fr-CA' | 'fil-PH' | 'nl-NL' | 'de-DE' | 'pt-BR' | 'pt-PT' | 'ru-RU' | 'it-IT' | 'sv-SE' | 'uk-UA' | 'ro-RO';
export type DutchRules = 1 | 2;
/** Unmarked persisted rounds predate accent folding. */
export function savedDutchRules(value: unknown): DutchRules {
 return value !== null && typeof value === 'object' && 'dutchRules' in value && value.dutchRules === 2 ? 2 : 1;
}
export const LANGUAGES: readonly Language[] = ['en-US', 'en-GB', 'en-AU', 'es-MX', 'es-ES', 'fr-FR', 'fr-CA', 'fil-PH', 'nl-NL', 'de-DE', 'pt-BR', 'pt-PT', 'ru-RU', 'it-IT', 'sv-SE', 'uk-UA', 'ro-RO'];
export const LANGUAGE_FAMILIES = [
 {id:'en',label:'English',varieties:[{id:'en-US',label:'United States'},{id:'en-GB',label:'United Kingdom'},{id:'en-AU',label:'Australia'}]},
 {id:'es',label:'Español',varieties:[{id:'es-MX',label:'México'},{id:'es-ES',label:'España'}]},
 {id:'fr',label:'Français',varieties:[{id:'fr-FR',label:'France'},{id:'fr-CA',label:'Canada'}]},
 {id:'fil',label:'Filipino',varieties:[{id:'fil-PH',label:'Philippines'}]},
 {id:'nl',label:'Nederlands',varieties:[{id:'nl-NL',label:'Nederland'}]},
 {id:'de',label:'Deutsch',varieties:[{id:'de-DE',label:'Deutschland'}]},
 {id:'pt',label:'Português',varieties:[{id:'pt-BR',label:'Brasil'},{id:'pt-PT',label:'Portugal'}]},
 {id:'ru',label:'Русский',varieties:[{id:'ru-RU',label:'Россия'}]},
 {id:'it',label:'Italiano',varieties:[{id:'it-IT',label:'Italia'}]},
 {id:'sv',label:'Svenska',varieties:[{id:'sv-SE',label:'Sverige'}]},
 {id:'uk',label:'Українська',varieties:[{id:'uk-UA',label:'Україна'}]},
 {id:'ro',label:'Română',varieties:[{id:'ro-RO',label:'România'}]},
] as const;
export type LanguageFamily = typeof LANGUAGE_FAMILIES[number]['id'];
export function languageFamily(language:Language):LanguageFamily {return language.split('-')[0] as LanguageFamily}
export function varietiesFor(family:string):readonly {id:Language;label:string}[] {return LANGUAGE_FAMILIES.find(item=>item.id===family)?.varieties??[]}
/** Old mixed-English preference opens a fresh US notebook, never replays mixed clues. */
export function selectedLanguage(value:unknown):Language {return value!=='en'&&isLanguage(value)?value:'en-US'}
export function isFrench(language:Language):language is 'fr-FR'|'fr-CA' {return language==='fr-FR'||language==='fr-CA'}
export function isPortuguese(language:Language):language is 'pt-BR'|'pt-PT' {return language==='pt-BR'||language==='pt-PT'}
export function usesAccentEquivalence(language:Language='en',dutchRules:DutchRules=2):boolean {return language==='it-IT'||isPortuguese(language)||isFrench(language)||language==='nl-NL'&&dutchRules===2}
export function displaySpelling(raw:string,language:Language):string {return language==='de-DE'?(germanCanonical as Record<string,string>)[normalizeGuess(raw,language)]??raw:isFrench(language)?frenchDisplaySpelling(raw):raw}
export function isSpanish(language:Language):boolean {return language==='es-MX'||language==='es-ES'}
export function isEnglish(language:Language):boolean {return language==='en'||language.startsWith('en-')}

export function isLanguage(value: unknown): value is Language {
 return value==='en'||LANGUAGES.some(language => language === value);
}
/** Filipino gameplay uses everyday spelling: optional vowel stress/glottal marks
 * are folded, but Ñ remains distinct. NG is entered as two ordinary tiles. */
export function normalizeSpelling(raw: string, language: Language = 'en'): string {
 // Romanian comma-below letters are distinct; legacy cedillas are input aliases.
 if(language==='ro-RO')return [...raw.normalize('NFC').replace(/[şŞ]/g,'ș').replace(/[ţŢ]/g,'ț')].map(letter=>/^[A-Za-zĂăÂâÎîȘșȚț]$/u.test(letter)?letter.toLocaleUpperCase('ro-RO'):letter).join('');
 // Ukrainian letters compose without folding: Й/И, Ї/І, Є/Е and Ґ/Г stay distinct.
 if(language==='uk-UA')return raw.normalize('NFC').toLocaleUpperCase('uk-UA');
 // Russian short-i and yo are letters, never marks to strip. Compose before casing.
 if(language==='ru-RU')return raw.normalize('NFC').toLocaleUpperCase('ru-RU');
 // Dutch IJ is a digraph (two tiles); compatibility ligatures are equivalent, not Y.
 if(language==='de-DE')return raw.normalize('NFC').replace(/ß/g,'ẞ').toLocaleUpperCase('de-DE');
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
 // Only Italian vowel accents are aliases; foreign diacritics are never erased.
 if(language==='it-IT')return spelling.replace(/À/g,'A').replace(/[ÈÉ]/g,'E').replace(/Ì/g,'I').replace(/[ÒÓ]/g,'O').replace(/Ù/g,'U');
 return usesAccentEquivalence(language,dutchRules) ? spelling.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC') : spelling;
}
export function isLetter(raw: string, language: Language = 'en'): boolean {
 return (language==='ro-RO' ? /^[A-ZĂÂÎȘȚ]$/u : language==='uk-UA' ? /^[АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ]$/u : language==='it-IT' ? /^[A-ZÀÈÉÌÒÓÙ]$/ : language==='sv-SE' ? /^[A-ZÅÄÖ]$/ : language==='ru-RU' ? /^[А-ЯЁ]$/u : language==='de-DE' ? /^[A-ZÄÖÜẞ]$/ : isPortuguese(language) ? /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ]$/ : isFrench(language) ? /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ]$/ : language === 'nl-NL' ? /^[A-ZÀÁÂÄÇÈÉÊËÍÎÏÓÔÖÙÚÛÜ]$/ : isSpanish(language) ? /^[A-ZÁÉÍÓÚÜÑ]$/ : language === 'fil-PH' ? /^[A-ZÑ]$/ : /^[A-Z]$/).test(raw);
}
/** One keyboard event may contain the Dutch IJ ligature, normalized to two tiles. */
export function isLetterInput(raw: string, language: Language): boolean {
 return isLetter(raw, language) || isFrench(language)&&(raw==='OE'||raw==='AE') || language === 'nl-NL' && raw === 'IJ';
}
export function validLetters(raw: string, language: Language = 'en'): boolean {
 return [...raw].every(letter => isLetter(letter, language));
}
export function languageLabel(language: Language): string {
 return {en: 'English (legacy mixed list)', 'en-US':'American English', 'en-GB':'British English', 'en-AU':'Australian English', 'es-MX': 'Español (México)', 'es-ES':'Español (España)', 'fr-FR':'Français (France)', 'fr-CA':'Français (Canada)', 'fil-PH': 'Filipino (Philippines)', 'nl-NL': 'Nederlands (Nederland)', 'de-DE':'Deutsch (Deutschland)', 'pt-BR':'Português (Brasil)', 'pt-PT':'Português (Portugal)', 'ru-RU':'Русский (Россия)', 'it-IT':'Italiano (Italia)', 'sv-SE':'Svenska (Sverige)', 'uk-UA':'Українська (Україна)', 'ro-RO':'Română (România)'}[language];
}
export function keyboardRows(language: Language,dutchRules:DutchRules=2): readonly string[] {
 return language==='ro-RO' ? ['QWERTYUIOP','ASDFGHJKL','↵ZXCVBNM⌫','ĂÂÎȘȚ'] : language==='uk-UA' ? ['ЙЦУКЕНГШЩЗХЇ','ФІВАПРОЛДЖЄ','↵ЯЧСМИТЬБЮ⌫','Ґ'] : language==='sv-SE' ? ['QWERTYUIOPÅ','ASDFGHJKLÖÄ','↵ZXCVBNM⌫'] : language==='ru-RU' ? ['ЙЦУКЕНГШЩЗХЪ', 'ФЫВАПРОЛДЖЭ', '↵ЯЧСМИТЬБЮ⌫', 'Ё'] : language==='de-DE' ? ['QWERTZUIOP', 'ASDFGHJKL', '↵YXCVBNM⌫', 'ÄÖÜẞ'] : language === 'nl-NL' && dutchRules === 2 ? ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'] : language === 'nl-NL'
  ? ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫', 'ÀÁÂÄÇÈÉÊË', 'ÍÎÏÓÔÖÙÚÛÜ']
  : isSpanish(language)
  ? ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫', 'ÁÉÍÓÚÜ']
  : language === 'fil-PH'
   ? ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫']
   : ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'];
}
