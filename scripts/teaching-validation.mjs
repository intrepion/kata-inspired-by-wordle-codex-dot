/** Structural quality gate; semantic accuracy still requires independent linguistic review. */
export function validateTeaching(rows,expected){
 const errors=[],wanted=new Set(expected),seen=new Set(),sentences=new Set();
 if(!Array.isArray(rows))return ['Teaching batch must be an array.'];
 for(const [index,row]of rows.entries()){
  if(!row||typeof row!=='object'){errors.push(`Row${index}: not a record`);continue}
  if(Object.keys(row).some(key=>!['word','translation','example','exampleTranslation'].includes(key)))errors.push(`Row${index}: unexpected metadata or dictionary attribution`);
  const word=row.word;
  if(typeof word!=='string'||!wanted.has(word)){errors.push(`Unexpected word: ${String(word)}`);continue}
  if(seen.has(word))errors.push(`${word}: duplicate record`);seen.add(word);
  for(const field of ['translation','example','exampleTranslation']){
   const value=row[field];
   if(typeof value!=='string'||!value.trim()){errors.push(`${word}: missing ${field}`);continue}
   if(value!==value.normalize('NFC'))errors.push(`${word}: non-NFC ${field}`);
   if(/^\s*(?:TODO|TBD)\s*$/i.test(value)||/\b(?:placeholder|lorem ipsum|translation pending|example pending)\b|\{word\}/i.test(value))errors.push(`${word}: placeholder ${field}`);
   if(/[<>]/.test(value))errors.push(`${word}: markup in ${field}`);
  }
  if(typeof row.example==='string'){
   const token=new RegExp(`(?<![\\p{L}\\p{M}])${word}(?![\\p{L}\\p{M}])`,'iu');
   if(!token.test(row.example))errors.push(`${word}: target word missing from example`);
   const sentence=row.example.trim().toLocaleLowerCase('es-MX');if(sentences.has(sentence))errors.push(`${word}: duplicate Spanish example`);sentences.add(sentence);
   if(typeof row.exampleTranslation==='string'&&row.exampleTranslation.trim().toLocaleLowerCase('es-MX')===sentence)errors.push(`${word}: untranslated sentence`);
   if(/\b(?:la palabra es|usamos la palabra|la palabra significa)\b/i.test(row.example))errors.push(`${word}: metalinguistic placeholder example`);
  }
 }
 for(const word of wanted)if(!seen.has(word))errors.push(`${word}: missing record`);
 return errors;
}
