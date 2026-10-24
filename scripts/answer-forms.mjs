/** Interpret pinned AGID grammar, never guess grammatical number/tense from word suffixes. */
export function curateAnswers(base,raw,overrides){
 const candidates=new Set(base),matches=new Map();
 for(const line of raw.split(/\r?\n/)){
  const record=/^([A-Za-z']+) ([VNA])(\?)?: (.*)$/.exec(line);if(!record)continue;
  const [,lemma,pos,uncertain,forms]=record;
  if((pos!=='N'&&pos!=='V')||uncertain)continue;
  const groups=forms.split(' | '),selected=pos==='N'?forms:groups.slice(0,lemma==='be'?2:1).join(' | ');
  for(const item of selected.split(/, | \| /)){
   const form=/^([A-Za-z']+)([~<!?]*)(?: (\d+(?:\.\d+)?))?(?: \{[^}]*\})?$/.exec(item);if(!form)continue;
   const [,word,flags,variant]=form;
   if(flags||Number(variant??0)>=2||word===lemma||!candidates.has(word))continue;
   const reasons=matches.get(word)??[];const reason={kind:pos==='N'?'plural':'past',lemma};if(!reasons.some(x=>x.kind===reason.kind&&x.lemma===lemma))reasons.push(reason);matches.set(word,reasons);
  }
 }
 for(const [word,reason] of Object.entries(overrides.keep)){if(!/^[A-Z]{5}$/.test(word)||typeof reason!=='string'||!reason.trim()||!candidates.has(word.toLowerCase())||!matches.has(word.toLowerCase()))throw new Error(`Invalid/redundant answer keep override: ${word}`);matches.delete(word.toLowerCase())}
 for(const [word,reason] of Object.entries(overrides.exclude)){if(!/^[A-Z]{5}$/.test(word)||typeof reason!=='string'||!reason.trim()||!candidates.has(word.toLowerCase()))throw new Error(`Invalid answer exclusion: ${word}`);matches.set(word.toLowerCase(),[{kind:'reviewed',reason}])}
 return {answers:base.filter(word=>!matches.has(word)),removed:[...matches].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([word,reasons])=>({word:word.toUpperCase(),reasons}))};
}
