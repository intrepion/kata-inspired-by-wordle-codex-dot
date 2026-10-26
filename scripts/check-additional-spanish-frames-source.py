"""Read-only replay of frozen frames2 source proof; no generated-data writes.
Usage: PYTHONDONTWRITEBYTECODE=1 python3 SCRIPT ROOT PINNED_SPANISH_JSONL_GZ
"""
import pathlib,sys,json,hashlib,gzip
root=pathlib.Path(sys.argv[1]);archive=pathlib.Path(sys.argv[2]);data=root/'src/data/spanish';sys.path.insert(0,str(root/'scripts'))
from additional_spanish_frames import load_additional_spanish_frames
profiles,forms,proof=load_additional_spanish_frames(data,root)
p=json.loads((data/'new-spanish-verb-frames2-standards.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest();h=hashlib.sha256()
with archive.open('rb')as f:
 for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
assert h.hexdigest()==p['sourcePins']['spanishArtifactSha256']
keys={'glosses','tags','raw_tags','categories','topics','sense_index','form_of','alt_of'}
lex=lambda s:{k:v for k,v in s.items()if k in keys}
wanted=set()
for a in p['approved']:
 wanted.add(a['recordSha256']);wanted.update(f['wordRecordSha256']for f in a['sourceFormEvidence'])
 if a.get('synonymEvidence'):wanted.add(a['synonymEvidence']['selectedTarget']['recordSha256'])
found={}
with gzip.open(archive,'rb')as f:
 for line in f:
  d=sha(line)
  if d in wanted:found[d]=json.loads(line)
assert set(found)==wanted
row_checks=0;form_checks=0;resolutions=[]
def validate_row(expected):
 global row_checks
 raw=found[expected['recordSha256']];assert raw['lang_code']=='es'and raw['word']==expected['word']and raw['pos']==expected['pos'];assert raw.get('tags',[])==expected['wordTags']and raw.get('raw_tags',[])==expected['wordRawTags'];assert[lex(s)for s in raw['senses']]==expected['senses'];row_checks+=1;return raw
for a in p['approved']:
 validate_row(a['sourceRow']);assert a['sourceRow']['senses'][a['senseIndex']]==a['sourceSense']
 for f in a['sourceFormEvidence']:
  r=found[f['wordRecordSha256']];assert r['lang_code']=='es'and r['word']==f['sourceWord']and r['pos']=='verb'and lex(r['senses'][f['senseIndex']])==f['sourceSense'];assert r.get('tags',[])==f['wordTags']and r.get('raw_tags',[])==f['wordRawTags'];assert{'word':a['spanish']}in f['sourceSense']['form_of'];form_checks+=1
 if a.get('synonymEvidence'):
  q=a['synonymEvidence'];validate_row(q['selectedTarget']);assert q['selectedTarget']['senses'][q['targetSenseIndex']].get('glosses');resolutions.append([a['spanish'],q['selectedTarget']['word'],q['targetSenseIndex']])
print(json.dumps(dict(rawRecordsReplayed=len(found),lexicalAndTargetRows=row_checks,formApplications=form_checks,approvedFrames=len(profiles),resolutions=resolutions,proofCandidateSha256=proof['candidateSha256']),ensure_ascii=False))
