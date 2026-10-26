"""Shared guarded English grammatical rendering.
Only pinned AGID forms and the closed BE paradigm; no guessed English spelling,
Spanish suffix inference, invented arguments or universal aspect paraphrase.
"""
import re

def load_agid(raw):
 agid={};qualified=set();agid_lines={}
 for line in raw.decode().splitlines():
  m=re.fullmatch(r'([a-z]+) ([NV]): (.+)',line)
  if not m:continue
  slots=[[x.strip() for x in slot.split(',') if re.fullmatch('[a-z]+',x.strip())] for slot in m[3].split('|')]
  if m[2]=='V' and len(slots)==3:slots=[slots[0],slots[0],slots[1],slots[2]]
  # Explicit sense binding: AGID distinguishes dying {expire} from dieing {shape}.
  if m[1]=='die' and m[2]=='V' and len(slots)==4:slots[2]=['dying']
  agid[m[1],m[2]]=slots;agid_lines[m[1],m[2]]=line
  if '{' in m[3] or '}' in m[3]:qualified.add((m[1],m[2]))
 return agid,qualified,agid_lines

subjects={('first-person','singular'):['I'],('second-person','singular'):['you'],('third-person','singular'):['he/she/it','you (formal)'],('first-person','plural'):['we'],('second-person','plural'):['you (plural, Spain)'],('third-person','plural'):['they','you (plural)']}
def make_finite(agid,qualified):
 def finite(frame,tense,person,number,profile,aspect_modes=frozenset()):
  en=frame.split(' ',1)[0];tail=' '+frame.split(' ',1)[1] if ' ' in frame else ''
  if profile=='it-only':
   if (person,number)!=('third-person','singular') or tense=='imperative':return None
   subs=['it']
  else:subs=subjects.get((person,number),[])
  if not subs:return None
  f=agid.get((en,'V'),[])
  if tense=='imperative':
   labels={('first-person','plural'):None,('second-person','singular'):'informal singular',('third-person','singular'):'formal singular',('second-person','plural'):'plural, Spain',('third-person','plural'):'plural'}
   if (person,number) not in labels:return None
   return ["let's "+frame] if (person,number)==('first-person','plural') else [frame+'! ('+labels[person,number]+')']
  out=[]
  for sub in subs:
   if tense=='present':
    if en=='be':verbs=['am' if sub=='I' else 'is' if sub in {'he/she/it','it'} else 'are']
    elif sub in {'he/she/it','it'}:
     if len(f)!=4 or not f[3]:return None
     verbs=f[3]
    else:verbs=[en]
   elif tense=='preterite':
    if en=='be':verbs=['was' if sub in {'I','he/she/it','it'} else 'were']
    elif (en,'V') in qualified or len(f)!=4 or not f[0]:return None
    else:verbs=f[0]
   elif tense=='subjunctive-present':verbs=[en]
   elif tense=='subjunctive-imperfect':
    if en=='be':verbs=['were']
    elif (en,'V') in qualified or len(f)!=4 or not f[0]:return None
    else:verbs=f[0]
   elif tense=='subjunctive-future':verbs=['should '+en]
   elif tense=='imperfect':
    verbs=[]
    if 'state-past' in aspect_modes:
     if en=='be':verbs+=['was' if sub in {'I','he/she/it','it'} else 'were']
     elif (en,'V') not in qualified and len(f)==4:verbs+=f[0]
    if 'progressive' in aspect_modes:
     gerunds=['being'] if en=='be' else f[2] if len(f)==4 else []
     verbs += [('was' if sub in {'I','he/she/it','it'} else 'were')+' '+g for g in gerunds]
    if not verbs:return None
   elif tense=='future':verbs=['will '+en]
   elif tense=='conditional':verbs=['would '+en]
   else:return None
   prefix='that ' if tense=='subjunctive-present' else 'if ' if tense in {'subjunctive-imperfect','subjunctive-future'} else ''
   out.extend(prefix+sub+' '+v+tail for v in verbs)
  return out

 return finite

def source_features(row,sense):
 tags=set(sense.get('tags',[]));gloss=' '.join(sense.get('glosses',[]))
 if 'combined with' in gloss or any(t.startswith('object-') for t in tags) or tags&{'reflexive','combined-form','negative','comparative','superlative'}:return []
 if row['pos'] in {'adj','noun'}:
  # Only explicit agreement forms, never inferred from spelling/suffixes.
  if not tags&{'singular','plural','masculine','feminine'}:return []
  return [{'kind':'agreement','tags':sorted(tags-{'form-of'})}]
 if row['pos']!='verb':return []
 if 'gerund' in tags:return [{'kind':'gerund','tags':sorted(tags-{'form-of'})}]
 if 'participle' in tags and 'past' in tags:return [{'kind':'participle','tags':sorted(tags-{'form-of'})}]
 if 'subjunctive' in tags:
  tenses=[t for t in ['present','imperfect','future'] if t in tags];nums=[n for n in ['singular','plural'] if n in tags];people=[p for p in ['first-person','second-person','third-person'] if p in tags]
  if len(tenses)!=1 or len(nums)!=1 or not people:return []
  return [{'kind':'finite','tense':'subjunctive-'+tenses[0],'person':p,'number':nums[0],'tags':sorted(tags-{'form-of'})} for p in people]
 tenses=[t for t in ['present','preterite','imperfect','future','conditional','imperative'] if t in tags]
 if len(tenses)!=1 or (tenses[0] in {'present','preterite','imperfect','future'} and 'indicative' not in tags):return []
 nums=[n for n in ['singular','plural'] if n in tags];people=[p for p in ['first-person','second-person','third-person'] if p in tags]
 if len(nums)!=1 or not people:return []
 return [{'kind':'finite','tense':tenses[0],'person':p,'number':nums[0],'tags':sorted(tags-{'form-of'})} for p in people]
