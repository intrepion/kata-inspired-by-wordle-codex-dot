"""Closed, independently reviewed MERAR life-ending sense / CC BY-SA 4.0.
AGID English slots retain their separate permissive notice. No global override.
"""
import hashlib,json,re
from english_form_rendering import make_finite

def load_merar_slots(data,root,profiles,agid,qualified):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 specname='merar-qualified-slots-spec.json';stdname='merar-qualified-slots-standards.json'
 digest=sha(specname);assert digest=='dfd1d5b36abb83f70d0067fb54d8f5e781e2e111b3a0daae3d68a0c9a926516a'
 spec=read(specname);std=read(stdname)
 assert sha(stdname)=='87b5d25ab382e540915b362bb9518c870f881f44789c3cdc84b7b8e135d5b8cc'
 assert std['inputSha256']==digest and spec['reviewer']!=std['reviewer'] and spec['sourcePins']==std['sourcePins']
 pins=spec['sourcePins']
 for pin,name in [('spanishManifestSha256','spanish-derived-source.json'),('spanishCandidateSha256','spanish-derived-candidates.json'),('spanishEvidenceSha256','spanish-derived-evidence.json'),('dualApprovalSha256','spanish-derived-dual-approval.json')]:assert pins[pin]==sha(name)
 assert read('spanish-derived-source.json')['artifactSha256']==pins['spanishArtifactSha256']
 for name,d in pins['existingReviewHashes'].items():assert sha(name)==d
 raw=(root/'public/third-party/apertium-translations/agid-infl.txt').read_bytes()
 assert hashlib.sha256(raw).hexdigest()==pins['agidDataSha256']
 assert len(spec['approved'])==len(std['approved'])==1
 row=spec['approved'][0];approval=std['approved'][0]
 for key,value in approval.items():assert row[key]==value
 profile=profiles['merar','verb'];source=spec['sourceProof']
 assert profile['sourceRow']==source['selectedSpanishRow'] and profile['sourceSense']==row['sourceSense']
 assert {k:profile[k] for k in source['existingExactDualApproval']}==source['existingExactDualApproval']
 for rk,pk in [('spanish','spanish'),('partOfSpeech','partOfSpeech'),('recordSha256','recordSha256'),('senseIndex','senseIndex'),('frame','frame'),('existingEffectiveProfile','profile'),('aspectModes','aspectModes'),('context','context')]:assert row[rk]==profile[pk]
 assert row['sourceSenseKey']==json.dumps(profile['sourceSense'],ensure_ascii=False,sort_keys=True)
 line=row['agidRawLine'];assert line in raw.decode().splitlines() and hashlib.sha256(line.encode()).hexdigest()==row['agidLineSha256']
 rawslots=line.split(': ',1)[1].split('|');assert len(rawslots)==3
 slots=[]
 for i,name in enumerate(['past','pastParticiple','gerund','thirdPersonSingular']):
  e=row['slotEvidence'][name];idx=[0,0,1,2][i]
  assert e['rawSlotIndex']==idx and rawslots[idx].strip()==e['rawSlot'] and e['sharedPastAndParticipleSlot']==(i<2)
  assert all(t in [t.strip()for t in rawslots[idx].split(',')]for t in e['selectedRawTokens'])
  forms=[re.fullmatch(r'([a-z]+)(?:\s+.*)?',t).group(1)for t in e['selectedRawTokens']]
  assert forms==row['approvedSlots'][name];slots.append(forms)
 assert slots==[['died'],['died'],['dying'],['dies']]
 local=dict(agid);local['die','V']=slots;renderer=make_finite(local,qualified-{('die','V')})
 proof={'candidateSha256':digest,'reviewHashes':{specname:digest,stdname:sha(stdname)},'binding':row}
 def resolve(p,form):
  if p['spanish']!='merar':return None
  assert p==profile
  if form not in source['formEvidence'] or form['word']not in row['candidateWords']:return None
  return {'slots':slots,'finite':renderer,'proof':proof}
 return resolve,proof
