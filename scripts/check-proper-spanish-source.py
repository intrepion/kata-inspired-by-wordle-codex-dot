"""Read-only raw replay for the exact reviewed proper-name lexical tranche.
Usage: PYTHONDONTWRITEBYTECODE=1 python3 SCRIPT ROOT SPANISH_JSONL_GZ
"""
import pathlib,sys,json,hashlib,gzip
from urllib.parse import quote
root=pathlib.Path(sys.argv[1]);data=root/'src/data/spanish';archive=pathlib.Path(sys.argv[2]);sys.path.insert(0,str(root/'scripts'));from proper_spanish_meanings import load_proper_meanings
selected,pins=load_proper_meanings(data);p=json.loads((data/'proper-name-lexical-proposals-spec.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest();h=hashlib.sha256()
with archive.open('rb')as f:
 for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
assert h.hexdigest()==p['sourcePins']['spanishArtifactSha256'];wanted={a['source']['recordSha256']for a,_,_ in selected};found={}
with gzip.open(archive,'rb')as f:
 for raw in f:
  d=sha(raw)
  if d in wanted:found[d]=json.loads(raw)
assert set(found)==wanted
for a,b,h in selected:
 s=a['source'];r=found[s['recordSha256']];assert r['lang_code']=='es'and r['word']==a['sourceWord']==s['word']and r['pos']==a['partOfSpeech']==s['partOfSpeech']=='name';assert r['word'][0].isupper()and a['word']==r['word'].upper();assert s['sourceUrl']=='https://es.wiktionary.org/wiki/'+quote(r['word']);assert r.get('pos_title')==s['posTitle']and r.get('tags',[])==s['rowTags']and r.get('raw_tags',[])==s['rowRawTags'];q=r['senses'][a['senseIndex']]
 for rk,sk in [('glosses','glosses'),('tags','tags'),('raw_tags','rawTags'),('categories','categories'),('topics','topics')]:assert q.get(rk,[])==s.get(sk,[])
 for translation in a['explicitRawEnglishTranslationCandidates']:assert any(all(rt.get(k)==v for k,v in translation.items())for rt in r.get('translations',[])+[t for ss in r['senses']for t in ss.get('translations',[])])
print(json.dumps(dict(exactCapitalizedRawNameRecords=len(found),reviewedNameReadings=len(selected),newSpellings=sum(a['currentlyUncovered']for a,_,_ in selected),alreadyCoveredESCOCIAAlternative=1)))
