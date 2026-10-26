"""Exact Spanish-sense-bound AGID slot selection; no global head override.
AGID inflections retain their independent permissive notice; lexical bindings
are modified Wiktionary data under CC BY-SA 4.0, selected by two model reviews.
"""
import json,hashlib,re
from english_form_rendering import make_finite
SLOTS=['past','pastParticiple','gerund','thirdPersonSingular']
def load_qualified_slots(data,root,source,agid,qualified):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='qualified-agid-review-spec.json';spec=read(name);digest=sha(name);std=read('qualified-agid-review-standards.json')
 assert spec['reviewer']!=std['reviewer']
 # Both reviews bind the unchanged exact lexical proposal and AGID slots.
 assert std['inputSha256']==digest
 pins=spec['sourcePins'];assert pins['englishManifestSha256']==sha('english-translation-source.json') and pins['englishEvidenceSha256']==sha('english-translation-evidence.json')
 raw=(root/'public/third-party/apertium-translations/agid-infl.txt').read_bytes();assert hashlib.sha256(raw).hexdigest()==pins['agidDataSha256'];lines=raw.decode().splitlines()
 def identity(r):return (r['sourceKind'],r['spanish'],r['recordSha256'],r['senseIndex'],r['frame'])
 approved={identity(r):r for r in std['approved']};assert len(approved)==len(std['approved'])
 entries={};proof={'candidateSha256':digest,'reviewHashes':{name:digest,'qualified-agid-review-standards.json':sha('qualified-agid-review-standards.json')},'bindings':[]}
 for row in spec['approved']:
  k=identity(row)
  if k not in approved:continue
  a=approved[k];assert all(a[field]==row[field] for field in ['partOfSpeech','sourceSenseKey','englishHead','existingEffectiveProfile','approvedSlots','slotEvidence','agidRawLine','agidLineSha256'])
  assert row['sourceSenseKey']==json.dumps(row['sourceSense'],ensure_ascii=False,sort_keys=True)
  head=row['englishHead'];assert row['frame'].split(' ',1)[0]==head
  line=row['agidRawLine'];assert line in lines and line.startswith(head+' V: ') and hashlib.sha256(line.encode()).hexdigest()==row['agidLineSha256']
  rawslots=line.split(': ',1)[1].split('|');assert len(rawslots) in [3,4]
  selected=[[],[],[],[]]
  for i,slot in enumerate(SLOTS):
   if slot not in row['approvedSlots']:continue
   e=row['slotEvidence'][slot];idx=e['rawSlotIndex'];assert rawslots[idx].strip()==e['rawSlot'] and e['sharedPastAndParticipleSlot']==(len(rawslots)==3 and i<2)
   assert idx==([0,0,1,2] if len(rawslots)==3 else [0,1,2,3])[i]
   tokens=[x.strip() for x in e['rawSlot'].split(',')];assert all(t in tokens for t in e['selectedRawTokens'])
   forms=[re.fullmatch(r'([a-z]+)(?:\s+.*)?',t).group(1) for t in e['selectedRawTokens']]
   assert forms==row['approvedSlots'][slot] and forms
   selected[i]=forms
  if row['sourceKind']=='english-wiktionary':
   candidates=[r for r in source['lemmas'][row['spanish']] if r['recordSha256']==row['recordSha256']];assert len(candidates)==1 and candidates[0]['senses'][row['senseIndex']]==row['sourceSense']
  assert k not in entries
  local=dict(agid);local[head,'V']=selected
  entries[k]=(row,selected,make_finite(local,qualified-{(head,'V')}))
  proof['bindings'].append(row)
 assert set(approved)<=set(entries)
 def resolve(kind,lemma,record,sense,frame,profile):
  matches=[v for k,v in entries.items() if k[0]==kind and k[1]==lemma and k[2]==record and k[4]==frame and v[0]['sourceSense']==sense]
  assert len(matches)<=1
  if not matches:return None
  r,slots,renderer=matches[0];assert r['existingEffectiveProfile']==profile
  return {'slots':slots,'finite':renderer,'proof':{'candidateSha256':digest,'binding':identity(r),'approvedSlots':r['approvedSlots'],'slotEvidence':r['slotEvidence'],'agidLineSha256':r['agidLineSha256']}}
 return resolve,proof
