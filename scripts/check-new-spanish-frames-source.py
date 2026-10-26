"""Replay exact reviewed lexical/form records from the pinned Spanish archive."""
import json,hashlib,gzip,sys
from pathlib import Path
R=Path(__file__).resolve().parent.parent;D=R/'src/data/spanish';p=D/'new-spanish-verb-frames-standards.json';blob=p.read_bytes();x=json.loads(blob)
assert hashlib.sha256(blob).hexdigest()==json.loads((D/'new-spanish-verb-frames-review-spec.json').read_text())['inputSha256']
archive=Path(sys.argv[1]);h=hashlib.sha256()
with archive.open('rb')as f:
 for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
assert h.hexdigest()==x['sourcePins']['spanishArtifactSha256']
wanted={r['recordSha256'] for r in x['approved']};t=x['approved'][0]['synonymEvidence']['selectedTarget'];wanted.add(t['recordSha256'])
for r in x['approved']:
 for q in r['sourceFormEvidence']:wanted.add(q['wordRecordSha256'])
found={}
with gzip.open(archive,'rb') as f:
 for line in f:
  h=hashlib.sha256(line).hexdigest()
  if h in wanted:found[h]=json.loads(line)
assert set(found)==wanted
lex=lambda s:{k:v for k,v in s.items() if k not in ['examples','quotations']}
for r in x['approved']:
 src=found[r['recordSha256']];assert src['lang_code']=='es' and src['word']==r['spanish'] and src['pos']=='verb'
 assert lex(src['senses'][r['senseIndex']])==r['sourceSense']
 for q in r['sourceFormEvidence']:
  raw=found[q['wordRecordSha256']];assert raw['lang_code']=='es' and raw['word']==q['sourceWord'] and q['sourceSense'] in [lex(s) for s in raw['senses']]
assert found[t['recordSha256']]['senses'][t['senseIndex']]==t['sourceSense']
assert all(a in found[t['recordSha256']]['synonyms'] for a in t['synonymLinks'])
agid=(R/'public/third-party/apertium-translations/agid-infl.txt').read_text().splitlines()
for r in x['approved']:
 e=r['englishInflectionEvidence'];assert e['agidRawLine'] in agid
 assert hashlib.sha256(e['agidRawLine'].encode()).hexdigest()==e['agidLineSha256']
print('Exact new-frame raw records/form applications/AGID lines reproduced:',len(found),sum(len(r['sourceFormEvidence'])for r in x['approved']),len(x['approved']))
