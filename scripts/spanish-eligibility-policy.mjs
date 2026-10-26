/** Source-label policy, not a suffix heuristic or an exhaustive Spanish grammar classifier. */
export const SPANISH_MIN_ZIPF=3.5;
const parts=new Set(['noun','adj','verb','adv','intj','pron','num','prep','conj','article']);
const unsuitable=new Set(['outdated','obsolete','archaic','dated','rare','uncommon','nonstandard','proscribed','misspelling','derogatory','offensive','pejorative','slur','vulgar','obscene','literary','neologism','no-gloss','jocular']);
const regions=new Set(['Southern-Chile','Spain','Argentina','Chile','Mexico','Bolivia','Guatemala','Río-de-la-Plata','Lunfardo','Colombia','Peru','Costa-Rica','Venezuela','Cuba','Chiloé','Puerto-Rico','Philippines','Honduras','America','Paraguay','Uruguay','Nicaragua','El-Salvador','Caribbean','Central-America','Ecuador','Mexico-City','Andalusia','Dominican-Republic','Aragon','Cádiz','Zamora','Panama','South-America','South-Cone','Murcia','León','Salamanca','Canaries','Cantabria','Palencia','Galicia','Castile','Asturias','Brazil','US','Equatorial-Guinea','Basque Country','Extremadura','Catalonia','Navarra','Álava','Balearic-Islands','Seville','Yucatán','Soria','La Rioja','Córdoba','Europe','Grenada']);
const inclusiveRegions=new Set(['Mexico','Mexico-City','Yucatán','America']);
function senseExclusion(entry,sense){
 const tags=new Set([...(entry.tags??[]),...(sense.tags??[])]),categories=[...(entry.categories??[]),...(sense.categories??[])];
 if(entry.pos==='noun'&&categories.includes('ES:Sustantivos solo en plural'))return 'plural';
 if(!parts.has(entry.pos)||!entry.categories?.includes('ES:Lemas')||entry.pos_title?.startsWith('Forma')||sense.form_of?.length||sense.alt_of?.length||['form-of','plural','participle','gerund'].some(tag=>tags.has(tag))){
  if((sense.glosses??[]).some(gloss=>/plural (?:de|del)/i.test(gloss)))return 'plural';
  return entry.pos==='verb'||entry.pos==='participle'?'verb-form':'grammar';
 }
 const raw=(sense.raw_tags??[]).join(' ').toLowerCase();
 if([...tags].some(tag=>unsuitable.has(tag))||/desusad|anticuad|arcaic|poco usado|poco usada|vulgar|peyorativ|soez|sexista/.test(raw)||categories.some(category=>/^(ES:Términos |ES:Variantes ).*(anticuad|obsolet|arcaic|desusad|raros)/i.test(category)))return 'usage';
 if([...tags].some(tag=>regions.has(tag))&&![...tags].some(tag=>inclusiveRegions.has(tag)))return 'region';
 if(!sense.glosses?.length)return 'missing-sense';
 return undefined;
}
export function selectSpanishAnswer(word,zipf,entries,review){
 if(review?.exclude)return {possible:false,reason:'review',detail:review.exclude};
 if(zipf===undefined)return {possible:false,reason:'missing-frequency'};
 if(zipf<SPANISH_MIN_ZIPF)return {possible:false,reason:'frequency'};
 if(review?.validatedNounEvidence)return {possible:true,evidence:{source:'supplemental',entry:review.validatedNounEvidence.entry,sense:review.validatedNounEvidence.sense}};
 if(review?.preferredEvidence?.source==='lexical'){const {entry,sense}=review.preferredEvidence;if(!entries?.[entry]?.senses[sense]||senseExclusion(entries[entry],entries[entry].senses[sense]))throw Error('Reviewed sense does not qualify: '+word);return {possible:true,evidence:{source:'lexical',entry,sense}}}
 const reasons=[];
 for(let entry=0;entry<(entries?.length??0);entry++)for(let sense=0;sense<entries[entry].senses.length;sense++){
  const reason=senseExclusion(entries[entry],entries[entry].senses[sense]);
  if(!reason)return {possible:true,evidence:{entry,sense}};
  reasons.push(reason);
 }
 const unique=[...new Set(reasons)];
 return {possible:false,reason:unique.length===1?unique[0]:'missing-sense'};
}
