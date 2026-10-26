"""Read-only exact Spanish-word + retained-English-lemma replay.
Usage: PYTHONDONTWRITEBYTECODE=1 python3 SCRIPT ROOT SPANISH_JSONL_GZ
No fresh original English multi-GB archive replay is claimed.
"""
import pathlib,sys,json,gzip,hashlib
R=pathlib.Path(sys.argv[1]);D=R/'src/data/spanish';archive=pathlib.Path(sys.argv[2]);sys.path.insert(0,str(R/'scripts'))
from spanish_form_evidence import spanish_form_records
from translation_subject_policy import load_subject_policy
from english_form_rendering import load_agid,make_finite
from reviewed_mian_adapter import load_mian_adapter
source=json.loads((D/'english-translation-evidence.json').read_text());policy,_=load_subject_policy(D,'english');v=json.loads((D/'vocabulary.ts').read_text().split(' = ',1)[1].strip().removesuffix(';'));allowed={w for a in v.values()for w in a['guesses']};foreign,_=spanish_form_records(D,source,allowed);agid,q,lines=load_agid((R/'public/third-party/apertium-translations/agid-infl.txt').read_bytes());finite=make_finite(agid,q);resolve,_=load_mian_adapter(D,R,source,policy,agid,q,lines,finite,foreign);p=json.loads((D/'mian-foreign-animal-proposal-spec.json').read_text());a=p['proposals'][0];assert'MÍAN'not in source['acceptedRecords'];assert a['englishLemmaProof']['lemmaRow']in source['lemmas']['miar'];h=hashlib.sha256()
with archive.open('rb')as f:
 for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
assert h.hexdigest()==p['sourcePins']['spanishArtifactSha256'];wanted={a['sourceWord']['recordSha256'],a['selectedSpanishAnimalMeaning']['recordSha256']};found={}
with gzip.open(archive,'rb')as f:
 for raw in f:
  d=hashlib.sha256(raw).hexdigest()
  if d in wanted:found[d]=json.loads(raw)
assert set(found)==wanted;keys={'glosses','tags','raw_tags','categories','topics','sense_index','form_of','alt_of'}
for selected in [a['sourceWord'],a['selectedSpanishAnimalMeaning']]:
 r=found[selected['recordSha256']];assert r['lang_code']=='es'and r['word']==selected['word']and r['pos']==selected['pos']and r.get('tags',[])==selected['wordTags']and r.get('raw_tags',[])==selected['wordRawTags'];assert[{k:v for k,v in s.items()if k in keys}for s in r['senses']]==selected['senses']
row=next(r for r in foreign['MÍAN']if r['recordSha256']==a['sourceWord']['recordSha256']);ep=a['englishLemmaProof'];result=resolve(row,a['sourceFeatures'],'miar',ep['lemmaRow'],ep['sourceSense'],'meow','it-only');assert result['english']==['they meow'];print(json.dumps({'spanishRawRecordsReplayed':2,'exactRetainedEnglishLemmaVerified':True,'foreignRowAndSelectedFeaturesVerified':True,'englishWholeWordAttestationClaimed':False,'selectedEnglish':result['english']}))
