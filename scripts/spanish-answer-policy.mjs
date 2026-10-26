/** Curation follows the documented sense, never a suffix or any other possible homograph. */
export function isCuratedSpanishAnswer(entry){
 return entry.review==='independent-model'&&entry.base===true&&(entry.kind==='infinitive'||((entry.kind==='noun'||entry.kind==='adjective')&&entry.independentSense===true));
}
