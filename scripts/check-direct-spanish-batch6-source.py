"""Replay exact dual-reviewed lexical-only batch6 proof. No writes.
Usage: PYTHONDONTWRITEBYTECODE=1 python3 SCRIPT ROOT SPANISH_JSONL_GZ
"""
import pathlib,sys,json,gzip,hashlib
root=pathlib.Path(sys.argv[1]);archive=pathlib.Path(sys.argv[2]);data=root/'src/data/spanish';sys.path.insert(0,str(root/'scripts'));from reviewed_direct_batch6 import load_direct_batch6
selected,pins=load_direct_batch6(data);p=json.loads((data/'direct-spanish-batch6-proposals-v2.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest();h=hashlib.sha256()
with archive.open('rb')as f:
 for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
assert h.hexdigest()==p['sourcePins']['spanishArtifactSha256'];wanted={a['source']['recordSha256']for a,b,h in selected};found={}
with gzip.open(archive,'rb')as f:
 for raw in f:
  d=sha(raw)
  if d in wanted:found[d]=json.loads(raw)
assert set(found)==wanted
for a,b,h in selected:
 s=a['source'];r=found[s['recordSha256']];assert r['lang_code']=='es'and r['word']==s['word']==a['sourceWord']and r['pos']==s['partOfSpeech']==a['partOfSpeech'];assert r.get('pos_title')==s['posTitle'];assert r.get('tags',[])==s['rowTags']and r.get('raw_tags',[])==s['rowRawTags'];q=r['senses'][a['senseIndex']];assert not q.get('form_of')and not q.get('alt_of')
 for rk,sk in [('glosses','glosses'),('tags','tags'),('raw_tags','rawTags'),('categories','categories'),('topics','topics')]:assert q.get(rk,[])==s.get(sk,[])
assert len(selected)==49;assert 'MANGOTE'not in {a['word']for a,b,h in selected};print(json.dumps(dict(exactRawLexicalRecords=len(found),approvedWordReadings=len(selected),MANGOTEHeld=True,LINDAZOCorrectedOnly=True,JOYANTEDisplayOnly=True)))
