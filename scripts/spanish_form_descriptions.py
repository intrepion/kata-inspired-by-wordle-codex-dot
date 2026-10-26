"""Reviewed recognition of explicit Spanish Wiktionary form descriptions.
Word/lemma identity is exact NFC; only grammar labels are accent-folded.
"""
import re,unicodedata

def fold_grammar(text):return ''.join(c for c in unicodedata.normalize('NFD',text.casefold()) if not unicodedata.combining(c))

def normalize(pos,sense,lemma):
 gloss=unicodedata.normalize('NFC',' '.join(sense.get('glosses',[])));target=unicodedata.normalize('NFC',lemma)
 # Match the lexical target in exact accented NFC before folding any grammar.
 # PAPÁ must never match PAPA, and Ñ is distinct from N.
 m=re.search(r'\bde (?:el verbo |verbo )?'+re.escape(target)+r'\b',gloss,re.IGNORECASE)
 if not m:return None
 prefix=fold_grammar(gloss[:m.start()]).strip();suffix=fold_grammar(gloss[m.end():]).strip()
 # Never silently discard a post-target clitic, construction or usage warning.
 if not re.fullmatch(r'[\s.,;:!?\'"“”‘’]*',suffix):return None
 context=prefix+' '+suffix
 if any(x in context for x in ['enclitic','pronombre','compuesto','pluscuamperfecto','anterior']):return None
 if re.search(r'\bperfecto\b',prefix) and 'preterito perfecto simple' not in prefix:return None
 tags=[]
 if pos in {'noun','adj'}:
  if not re.match(r'^(?:forma (?:del |de |)|plural |femenino |masculino )',prefix):return None
  for term,tag in [('plural','plural'),('singular','singular'),('femenino','feminine'),('masculino','masculine')]:
   if re.search(r'\b'+term+r'\b',prefix):tags.append(tag)
  if not tags or {'plural','singular'}<=set(tags):return None
  return {'kind':'agreement','tags':tags,'grammarPrefix':prefix}
 if pos!='verb':return None
 if re.fullmatch(r'gerundio(?: regular| irregular)?',prefix):return {'kind':'gerund','tags':['gerund'],'grammarPrefix':prefix}
 # Bare or negated PARTICIPIO does not positively prove a past reading here.
 if re.fullmatch(r'participio (?:pasado|pasivo)(?: regular| irregular)?',prefix):return {'kind':'participle','tags':['participle','past'],'grammarPrefix':prefix}
 person=re.match(r'^(primera|segunda|tercera) persona del (singular|plural)\b',prefix)
 if not person:return None
 person_tag={'primera':'first-person','segunda':'second-person','tercera':'third-person'}[person[1]];number=person[2];adapter=None
 if re.search(r'\bvos\b',prefix):tags.append('voseo')
 formal='ustedes' if re.search(r'\bustedes\b',prefix) else 'usted' if re.search(r'\busted\b',prefix) else None
 if formal:
  if re.search(r'\bvosotros\b',prefix):return None
  tags.append(formal+'-address')
  if person_tag=='second-person':
   if 'imperativo' not in prefix:return None
   if (formal=='usted')!=(number=='singular'):return None
   person_tag='third-person';adapter='semantic second-person '+formal+' command adapted to shared grammatical-third-person English command renderer'
 tags += [person_tag,number]
 if 'imperativo' in prefix:
  if 'negativo' in prefix:return None
  tags.append('imperative')
  return {'kind':'finite','tags':tags,'grammarPrefix':prefix,'adapter':adapter}
 mood='subjunctive' if 'subjuntivo' in prefix else 'indicative' if 'indicativo' in prefix else None
 if 'futuro' in prefix:tense='future'
 elif 'condicional' in prefix or 'potencial' in prefix:tense='conditional'
 elif 'preterito imperfecto' in prefix:tense='imperfect'
 elif 'preterito perfecto simple' in prefix or 'preterito indefinido' in prefix:tense='preterite'
 elif 'presente' in prefix:tense='present'
 else:return None
 if not mood and tense!='conditional':return None
 tags +=[tense]+([mood] if mood else [])
 return {'kind':'finite','tags':tags,'grammarPrefix':prefix}
