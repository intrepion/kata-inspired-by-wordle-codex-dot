export type Language = 'en' | 'es-MX' | 'fil-PH' | 'nl-NL';
export type DutchRules = 1 | 2;
/** Unmarked persisted rounds predate accent folding. */
export function savedDutchRules(value: unknown): DutchRules {
 return value !== null && typeof value === 'object' && 'dutchRules' in value && value.dutchRules === 2 ? 2 : 1;
}
export const LANGUAGES = ['en', 'es-MX', 'fil-PH', 'nl-NL'] as const;
export function isLanguage(value: unknown): value is Language {
 return LANGUAGES.some(language => language === value);
}
/** Filipino gameplay uses everyday spelling: optional vowel stress/glottal marks
 * are folded, but Ñ remains distinct. NG is entered as two ordinary tiles. */
export function normalizeSpelling(raw: string, language: Language = 'en'): string {
 // Dutch IJ is a digraph (two tiles); compatibility ligatures are equivalent, not Y.
 const spelling = language === 'nl-NL' ? raw.replace(/[Ĳĳ]/g, 'ij') : raw;
 const normalized = spelling.normalize('NFC').toLocaleUpperCase(language);
 return language === 'fil-PH'
  ? normalized.replace(/[ÁÀÂ]/g, 'A').replace(/[ÉÈÊ]/g, 'E').replace(/[ÍÌÎ]/g, 'I').replace(/[ÓÒÔ]/g, 'O').replace(/[ÚÙÛ]/g, 'U')
  : normalized;
}
/** Canonical spelling is retained separately for answer reveals. */
export function normalizeGuess(raw: string, language: Language = 'en', dutchRules: DutchRules = 2): string {
 const spelling = normalizeSpelling(raw, language);
 return language === 'nl-NL' && dutchRules === 2 ? spelling.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC') : spelling;
}
export function isLetter(raw: string, language: Language = 'en'): boolean {
 return (language === 'nl-NL' ? /^[A-ZÀÁÂÄÇÈÉÊËÍÎÏÓÔÖÙÚÛÜ]$/ : language === 'es-MX' ? /^[A-ZÁÉÍÓÚÜÑ]$/ : language === 'fil-PH' ? /^[A-ZÑ]$/ : /^[A-Z]$/).test(raw);
}
/** One keyboard event may contain the Dutch IJ ligature, normalized to two tiles. */
export function isLetterInput(raw: string, language: Language): boolean {
 return isLetter(raw, language) || language === 'nl-NL' && raw === 'IJ';
}
export function validLetters(raw: string, language: Language = 'en'): boolean {
 return [...raw].every(letter => isLetter(letter, language));
}
export function languageLabel(language: Language): string {
 return {en: 'English', 'es-MX': 'Español (México)', 'fil-PH': 'Filipino (Philippines)', 'nl-NL': 'Nederlands (Nederland)'}[language];
}
export function keyboardRows(language: Language,dutchRules:DutchRules=2): readonly string[] {
 return language === 'nl-NL' && dutchRules === 2 ? ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'] : language === 'nl-NL'
  ? ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫', 'ÀÁÂÄÇÈÉÊË', 'ÍÎÏÓÔÖÙÚÛÜ']
  : language === 'es-MX'
  ? ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫', 'ÁÉÍÓÚÜ']
  : language === 'fil-PH'
   ? ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫']
   : ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'];
}
