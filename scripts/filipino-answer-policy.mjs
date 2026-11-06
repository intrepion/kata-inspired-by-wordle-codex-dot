/** Conservative starter policy, not exhaustive Filipino morphology classification. */
export const FILIPINO_MIN_ZIPF = 4.5;
const excluded = new Set(['obsolete','archaic','dated','historical','rare','uncommon','dialectal','regional','slang','derogatory','offensive','vulgar','slur','abbreviation','clipping','misspelling','nonstandard','nonce-word','morpheme','name','uppercase','capitalized','alt-of','form-of','alternative','pronunciation-spelling','contraction']);
const formGloss = /\b(?:ligatured form|(?:complete|incomplete|contemplative|completed|progressive) aspect of|imperative mood of|inflection|conjugation|plural of|alternative (?:form|spelling)|misspelling|superseded|obsolete spelling|abbreviation|clipping)\b/i;
export function eligibleFilipinoSenses(entries) {
 return entries.flatMap(entry => entry.senses.filter(sense =>
  !sense.form_of && !sense.alt_of && !formGloss.test(sense.gloss) &&
  ![...(entry.tags ?? []), ...(sense.tags ?? [])].some(tag => excluded.has(tag))
 ).map(sense => ({sourceWord: entry.sourceWord, partOfSpeech: entry.partOfSpeech, gloss: sense.gloss, tags: [...(entry.tags ?? []), ...(sense.tags ?? [])]})));
}
export function selectFilipinoAnswer(entries, frequency, review) {
 if (review?.exclude) return {possible: false, reason: review.reason};
 if (!(frequency >= FILIPINO_MIN_ZIPF)) return {possible: false, reason: 'Below the conservative commonness cutoff, or absent from the small frequency list.'};
 const senses = eligibleFilipinoSenses(entries);
 return senses.length ? {possible: true, senses} : {possible: false, reason: 'No qualifying standalone sense in the pinned lexical source.'};
}
