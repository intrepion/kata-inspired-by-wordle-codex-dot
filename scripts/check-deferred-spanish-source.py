"""Replay supplemental Spanish sense context from the pinned licensed archive."""
from pathlib import Path
import hashlib,json,gzip,sys
D=Path(__file__).resolve().parent.parent/'src/data/spanish';p=json.loads((D/'deferred-accusative-proposals-standards.json').read_text());archive=Path(sys.argv[1]);h=hashlib.sha256()
with archive.open('rb')as f:
 for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
assert h.hexdigest()==p['sourcePins']['spanishArtifactSha256']
wanted={}
for d in p['decisions']:
 if d['status']!='proposed':continue
 for s in d['supplementalSpanishEvidence']:wanted.setdefault(s['recordSha256'],[]).append(s)
found=set();senses=0
with gzip.open(archive,'rb')as f:
 for line in f:
  key=hashlib.sha256(line).hexdigest()
  if key not in wanted:continue
  assert key not in found;found.add(key);r=json.loads(line)
  for s in wanted[key]:
   ss=r['senses'][s['senseIndex']];assert r['lang_code']=='es'and r['word']==s['lemma']and r['pos']==s['partOfSpeech'];assert ss.get('glosses',[])==s['glosses']and ss.get('tags',[])==s['tags']and ss.get('raw_tags',[])==s['rawTags'];assert r.get('tags',[])==s['wordTags']and r.get('raw_tags',[])==s['wordRawTags'];senses+=1
assert found==set(wanted);print('Exact supplemental Spanish records/senses reproduced:',len(found),senses)
