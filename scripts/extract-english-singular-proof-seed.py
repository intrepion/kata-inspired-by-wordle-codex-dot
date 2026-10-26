#!/usr/bin/env python3
"""Deterministically extract bootstrap proofs from active frozen proposals only.
No full generated audit, unpublished research, network or model call is an input.
"""
import argparse,pathlib,json,hashlib
P=pathlib.Path
EXPECTED={'nonhuman-indicative2-proposals-standards.json':'23fc84357a949b0eaa4809b8b073c310c1d368a0228acf7a9bc03a21d4db9bb7','nonhuman-indicative3-proposals-standards.json':'0255a2a25fdbaa54c15a00f25ad857c595edf5a80d9787d8a90b372faa6bef22'}
ap=argparse.ArgumentParser();ap.add_argument('--root',required=True,type=P);ap.add_argument('--out',required=True,type=P);a=ap.parse_args();data=a.root/'src/data/spanish';proofs={};inputs=[]
for name,digest in EXPECTED.items():
 raw=(data/name).read_bytes();assert hashlib.sha256(raw).hexdigest()==digest,name;p=json.loads(raw);inputs.append({'file':name,'sha256':digest,'archivedSingularAuditSha256':p['sourcePins'].get('existingSingularAuditSha256')})
 for r in p['proposals']:
  selected=r['existingSelectedSingularEvidence'];word=selected['word'];proof=selected['proof'];f=proof['features'];assert f['kind']=='finite'and f['person']=='third-person'and f['number']=='singular'
  assert proof['lemmaRecordSha256']==r['sourceEvidence']['lemmaRecordSha256']and proof['englishLemma']==r['frame']
  entries=proofs.setdefault(word,[])
  if proof not in entries:entries.append(proof)
assert len(proofs)==37 and sum(map(len,proofs.values()))==37
seed={'schemaVersion':1,'purpose':'Frozen inherited singular proof seed for reproducible generator bootstrap. This is not a full generated translation audit.','proposalInputs':inputs,'evidence':{w:proofs[w]for w in sorted(proofs)}}
encoded=(json.dumps(seed,ensure_ascii=False,indent=2)+'\n').encode();target=a.out.resolve();assert not target.is_relative_to(a.root.resolve()),'Extraction review output must remain outside the app tree.'
if target.exists():assert target.read_bytes()==encoded,'Refusing to overwrite a different frozen seed.'
else:target.write_bytes(encoded)
print(json.dumps({'file':str(target),'sha256':hashlib.sha256(encoded).hexdigest(),'bytes':len(encoded),'words':len(proofs),'proofs':sum(map(len,proofs.values()))}))
