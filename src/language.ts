export type Language = 'en' | 'es-MX' | 'fil-PH';
export const LANGUAGES = ['en', 'es-MX', 'fil-PH'] as const;
export function isLanguage(value: unknown): value is Language {
 return LANGUAGES.some(language => language === value);
}
/** Filipino gameplay uses everyday spelling: optional vowel stress/glottal marks
 * are folded, but Ñ remains distinct. NG is entered as two ordinary tiles. */
export function normalizeGuess(raw: string, language: Language = 'en'): string {
 const normalized = raw.normalize('NFC').toLocaleUpperCase(language);
 return language === 'fil-PH'
  ? normalized.replace(/[ÁÀÂ]/g, 'A').replace(/[ÉÈÊ]/g, 'E').replace(/[ÍÌÎ]/g, 'I').replace(/[ÓÒÔ]/g, 'O').replace(/[ÚÙÛ]/g, 'U')
  : normalized;
}
export function isLetter(raw: string, language: Language = 'en'): boolean {
 return (language === 'es-MX' ? /^[A-ZÁÉÍÓÚÜÑ]$/ : language === 'fil-PH' ? /^[A-ZÑ]$/ : /^[A-Z]$/).test(raw);
}
export function validLetters(raw: string, language: Language = 'en'): boolean {
 return [...raw].every(letter => isLetter(letter, language));
}
export function languageLabel(language: Language): string {
 return {en: 'English', 'es-MX': 'Español (México)', 'fil-PH': 'Filipino (Philippines)'}[language];
}
export function keyboardRows(language: Language): readonly string[] {
 return language === 'es-MX'
  ? ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫', 'ÁÉÍÓÚÜ']
  : language === 'fil-PH'
   ? ['QWERTYUIOP', 'ASDFGHJKLÑ', '↵ZXCVBNM⌫']
   : ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'];
}
