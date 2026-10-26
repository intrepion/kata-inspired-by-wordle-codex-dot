"""Replay exact lexical source evidence from the pinned raw archive; no network."""
from pathlib import Path
import sys,json,gzip,hashlib
D=Path(__file__).resolve().parent.parent/'src/data/spanish';p=json.loads((D/'direct-spanish-batch3-proposals.json').read_text());archive=Path(sys.argv[1]);h=hashlib.sha256()
with archive.open('rb')as f:
 for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
assert h.hexdigest()==p['sourcePins']['spanishArtifactSha256'],'Wrong raw Spanish artifact'
proposals=list(p['proposals'])
next_path=D/'direct-spanish-batch4-proposals.json'
if next_path.exists():
 next_batch=json.loads(next_path.read_text());assert next_batch['sourcePins']['spanishArtifactSha256']==p['sourcePins']['spanishArtifactSha256'];proposals+=next_batch['proposals']
next_path=D/'direct-spanish-batch5-proposals-v2.json'
if next_path.exists():
 next_batch=json.loads(next_path.read_text());assert next_batch['sourcePins']['spanishArtifactSha256']==p['sourcePins']['spanishArtifactSha256'];proposals+=next_batch['proposals']
wanted={x['source']['recordSha256']:x for x in proposals};assert len(wanted)==len(proposals);found=set()
with gzip.open(archive,'rb')as f:
 for line in f:
  key=hashlib.sha256(line).hexdigest()
  if key not in wanted:continue
  assert key not in found;found.add(key);a=wanted[key];r=json.loads(line);s=a['source'];sense=r['senses'][a['senseIndex']]
  assert r['lang_code']=='es' and r['word']==s['word']==a['sourceWord'] and r['pos']==s['partOfSpeech']==a['partOfSpeech'] and r.get('pos_title')==s['posTitle']
  for raw,field in [('glosses','glosses'),('tags','tags'),('raw_tags','rawTags'),('categories','categories')]:assert sense.get(raw,[])==s[field],(a['word'],field)
  assert r.get('tags',[])==s['rowTags'] and r.get('raw_tags',[])==s['rowRawTags'] and not sense.get('form_of') and not sense.get('alt_of')
assert found==set(wanted);print('Exact raw Spanish direct lexical records reproduced:',len(found))
