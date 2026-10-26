"""Read-only selected lexical proof replay; explicit proposal/evidence/archive arguments."""
import json,hashlib,gzip,sys
from pathlib import Path
sha=lambda b:hashlib.sha256(b).hexdigest()
p=Path(sys.argv[1]);j=json.loads(p.read_text());e=Path(sys.argv[2]);assert sha(e.read_bytes())==j['sourcePins']['englishEvidence']['sha256'];en=json.loads(e.read_text());rows={}
for collection in en.values():
 for bucket in collection.values():
  for r in bucket:rows[r['recordSha256']]=r
wanted={};english_count=0
for a in j['proposals']:
 s=a['source']
 for x in [s['englishForm'],s['englishLemma']]+s['englishAliasTargets']:
  r=rows[x['recordSha256']];assert r['word']==x['word']and r['pos']==x['partOfSpeech']and r['senses'][x['sourceSenseIndex']]==x['sense'];english_count+=1
 assert set(s['requiredSourceFormTags'])<=set(s['englishForm']['sense'].get('tags',[]))
 for x in s['spanishSelectedLexicalProof']:wanted[x['recordSha256']]=x
archive=Path(sys.argv[3]);h=hashlib.sha256()
with archive.open('rb')as f:
 for b in iter(lambda:f.read(1048576),b''):h.update(b)
assert h.hexdigest()==j['sourcePins']['spanishLexicalInventory']['rawArtifactSha256']
found={}
with gzip.open(archive,'rb')as f:
 for raw in f:
  d=sha(raw)
  if d in wanted:found[d]=json.loads(raw)
assert set(found)==set(wanted)
selected_count=0
for a in j['proposals']:
 for x in a['source']['spanishSelectedLexicalProof']:
  r=found[x['recordSha256']];assert r['lang_code']=='es'and r['word']==x['word']and r['pos']==x['partOfSpeech']and r.get('pos_title')==x['posTitle']
  assert r.get('tags',[])==x['rowTags']and r.get('raw_tags',[])==x['rowRawTags'];sense=dict(x['sense']);assert sense.pop('sourceSenseIndex')==x['sourceSenseIndex'];assert all(r['senses'][x['sourceSenseIndex']].get(k)==v for k,v in sense.items());assert set(sense)<=set(['glosses','tags','raw_tags','form_of','alt_of','sense_index','categories','topics']);selected_count+=1
print(json.dumps({'proposalSha256':sha(p.read_bytes()),'englishSelectedObjectChecks':english_count,'spanishExactRawRecords':len(found),'spanishSelectedSenseChecks':selected_count,'freshEnglishRawReplay':False}))
