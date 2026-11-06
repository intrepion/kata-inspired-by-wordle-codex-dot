/** Spain-specific sense selection. Spelling frequency is not regional or sense frequency. */
export const SPAIN_MIN_ZIPF = 3.5;
const parts = new Set(['noun','adj','verb','adv','intj','pron','num','prep','conj','article']);
const unsuitable = new Set(['outdated','obsolete','archaic','dated','rare','uncommon','nonstandard','proscribed','misspelling','derogatory','offensive','pejorative','slur','vulgar','obscene','literary','neologism','no-gloss','jocular']);
const foreignRegions = new Set(['Southern-Chile','Argentina','Chile','Mexico','Bolivia','Guatemala','Río-de-la-Plata','Lunfardo','Colombia','Peru','Costa-Rica','Venezuela','Cuba','Chiloé','Puerto-Rico','Philippines','Honduras','America','Paraguay','Uruguay','Nicaragua','El-Salvador','Caribbean','Central-America','Ecuador','Mexico-City','Dominican-Republic','Panama','South-America','South-Cone','Brazil','US','Equatorial-Guinea','Yucatán','Grenada']);
// Subregional-only senses stay out of the national answer pool. A Spain-labelled
// sense can carry other regions too; it is still valid in the Spain variety.
const localRegions = new Set(['Andalusia','Aragon','Cádiz','Zamora','Murcia','León','Salamanca','Canaries','Cantabria','Palencia','Galicia','Castile','Asturias','Basque Country','Extremadura','Catalonia','Navarra','Álava','Balearic-Islands','Seville','Soria','La Rioja','Córdoba']);
export function spainSenseExclusion(entry, sense) {
 const tags = new Set([...(entry.tags ?? []), ...(sense.tags ?? [])]);
 const categories = [...(entry.categories ?? []), ...(sense.categories ?? [])];
 const gloss = (sense.glosses ?? []).join(' ');
 if (categories.includes('ES:Sustantivos solo en plural') || (entry.pos === 'pron' && /\bplural\b/i.test(gloss))) return 'plural';
 if (!parts.has(entry.pos) || !entry.categories?.includes('ES:Lemas') || entry.pos_title?.startsWith('Forma') || sense.form_of?.length || sense.alt_of?.length || ['form-of','plural','participle','gerund'].some(tag => tags.has(tag))) return 'grammar';
 const raw = (sense.raw_tags ?? []).join(' ').toLowerCase();
 if ([...tags].some(tag => unsuitable.has(tag)) || /desusad|anticuad|arcaic|poco usado|poco usada|vulgar|peyorativ|soez|sexista/.test(raw) || categories.some(category => /^(ES:Términos |ES:Variantes ).*(anticuad|obsolet|arcaic|desusad|raros)/i.test(category))) return 'usage';
 if (!tags.has('Spain') && [...tags].some(tag => foreignRegions.has(tag) || localRegions.has(tag))) return 'region';
 if (!gloss.trim()) return 'missing-sense';
 return undefined;
}
export function qualifyingSpainSenses(entries = []) {
 return entries.flatMap((entry, entryIndex) => entry.senses.flatMap((sense, senseIndex) => spainSenseExclusion(entry, sense) ? [] : [{entry: entryIndex, sense: senseIndex}]));
}
