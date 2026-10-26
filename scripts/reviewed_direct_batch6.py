"""Forty-nine exact lexical readings / modified Spanish Wiktionary CC BY-SA 4.0.
Original rejected wording stays archival; no form or answer-selection authority.
"""
import json,hashlib,copy

def load_direct_batch6(data):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 pins={
  'direct-spanish-batch6-proposals.json':'10b51829f25b55dde0352ea56d83b2bbd90685efe26df537e639e8244cc4d772',
  'direct-spanish-batch6-review-standards.json':'fa8c56901bf1650ac018d4d7b0703c752a34a8b7e7a59676a6bac7665eba5c08',
  'direct-spanish-batch6-proposals-v2.json':'7b55aa1d08de21ca19c7391b1ec4124f41fb7eae554733e91d0909b63c903ebe',
  'direct-spanish-batch6-v2-delta-spec.json':'52d5286f29538f74ab6f64e8b0cb4c766f782b3755c2eb849d5ba9ca8255d30b',
  'direct-spanish-batch6-v2-delta-review-standards.json':'5a9ed627fdd175f111d50d71f7c8feb3a2c365b321484e22dac2f5255bf4c3e0'}
 for n,digest in pins.items():assert sha(n)==digest
 p=read('direct-spanish-batch6-proposals.json');r=read('direct-spanish-batch6-review-standards.json');v2=read('direct-spanish-batch6-proposals-v2.json');delta=read('direct-spanish-batch6-v2-delta-review-standards.json')
 assert r['inputSha256']==pins['direct-spanish-batch6-proposals.json']and p['reviewer']!=r['reviewer']
 assert delta['inputSha256']==pins['direct-spanish-batch6-proposals-v2.json']and delta['approved']and delta['reviewer']==r['reviewer']
 assert delta['originalCandidateSha256']==r['inputSha256']and delta['originalReviewSha256']==pins['direct-spanish-batch6-review-standards.json']and delta['deltaProofSha256']==pins['direct-spanish-batch6-v2-delta-spec.json']
 assert p['sourcePins']['license']=='CC-BY-SA-4.0'and p['sourcePins']['spanishArtifactSha256']==read('spanish-derived-source.json')['artifactSha256']
 c=delta['correctedApproval'];assert c['proposalIndex']==37 and c['word']=='LINDAZO'
 expected=copy.deepcopy(p)
 for k in ['english','context']:expected['proposals'][37][k]=c[k]
 assert expected==v2 and delta['changedJSONPointers']==['/proposals/37/english','/proposals/37/context']and delta['allOtherBytesUnchanged']
 assert len(p['proposals'])==50 and len(r['approved'])==48 and {a['word']for a in r['held']}=={'LINDAZO','MANGOTE'}and delta['remainingHeldWords']==['MANGOTE']
 display_name='direct-spanish-batch6-joyante-display-review-standards.json';display_hash=sha(display_name)
 assert display_hash=='d52e163e523d381ef0bd152a3ec0f53af2d8d19bd125cfcd566657dc7263ce53'
 display=read(display_name);assert display['approved']and display['word']=='JOYANTE'and display['originalProposalSha256']==r['inputSha256']and display['selectedCandidateSha256']==delta['inputSha256']
 out=[]
 for approval in r['approved']+[c]:
  a=v2['proposals'][approval['proposalIndex']]
  for k in ['word','partOfSpeech','sourceWord','senseIndex','english','context']:assert a[k]==approval[k]
  assert a['source']['recordSha256']==approval['recordSha256'];own_hashes=dict(pins)
  if a['word']=='JOYANTE':
   assert a['partOfSpeech']==display['partOfSpeech']and a['source']['recordSha256']==display['sourceRecordSha256']and a['senseIndex']==display['sourceSenseIndex']and a['english']==display['englishUnchanged']and a['context']==display['originalReviewedContext']
   assert display['approvedDisplayContext']=='Used almost only in seda joyante, describing fine, lustrous silk.'
   a={**a,'displayContext':display['approvedDisplayContext']};own_hashes[display_name]=display_hash
  out.append((a,approval,own_hashes))
 assert len({a['word']for a,_,_ in out})==49 and 'MANGOTE'not in {a['word']for a,_,_ in out}
 return out,{**pins,display_name:display_hash}
