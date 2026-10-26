"""Replay frozen Spanish lexical and form evidence from its pinned CC snapshot.
No English dictionary gloss, quotation, media, example or runtime API is invented.
"""
from pathlib import Path
import argparse,json,hashlib,gzip,unicodedata
from spanish_form_descriptions import normalize
p=argparse.ArgumentParser();p.add_argument('archive',type=Path);p.add_argument('--batch',type=int,choices=[1,2],default=1);p.add_argument('--check',action='store_true');args=p.parse_args();R=Path(__file__).resolve().parent.parent;D=R/'src/data/spanish'
prefix='spanish-derived'+(f'-{args.batch}'if args.batch!=1 else '')
def sha(raw):return hashlib.sha256(raw).hexdigest()
candidates=json.loads((D/(prefix+'-candidates.json')).read_text());policy=json.loads((D/'spanish-form-source.json').read_text());assert sha(args.archive.read_bytes())==candidates['spanishArtifactSha256']==policy['spanishArtifactSha256'];assert sha((R/'scripts/spanish_form_descriptions.py').read_bytes())==policy['normalizerModuleSha256'];roots={(r['spanish'],r['partOfSpeech']):r for r in candidates['roots']};targets={w for r in candidates['roots'] for w in r['missingWords']};semantics={};forms=[]
with gzip.open(args.archive,'rb') as f:
 for line in f:
  row=json.loads(line)
  if row.get('lang_code')!='es':continue
  key=(row.get('word'),row.get('pos'));pos=row.get('pos');record_sha=sha(line)
  if key in roots:
   senses=[{k:s[k] for k in ['glosses','tags','raw_tags','categories','sense_index'] if k in s} for s in row.get('senses',[]) if s.get('glosses') and not s.get('form_of') and not s.get('alt_of') and not set(s.get('tags',[]))&{'form-of','alt-of','no-gloss'}]
   if senses:semantics.setdefault(key,[]).append({'word':row['word'],'pos':pos,'wordTags':row.get('tags',[]),'wordRawTags':row.get('raw_tags',[]),'categories':row.get('categories',[]),'senses':senses,'recordSha256':record_sha})
  word=unicodedata.normalize('NFC',row.get('word','')).upper()
  if word not in targets or pos not in {'verb','adj'}:continue
  for sense in row.get('senses',[]):
   for link in sense.get('form_of',[]):
    lemma=link['word']
    if (lemma,pos) not in roots:continue
    norm=normalize(pos,sense,lemma)
    if norm:forms.append({'word':word,'sourceWord':row['word'],'partOfSpeech':pos,'spanishLemma':lemma,'wordRecordSha256':record_sha,'wordTags':row.get('tags',[]),'wordRawTags':row.get('raw_tags',[]),'sourceSense':{k:sense[k] for k in ['glosses','tags','raw_tags','categories','form_of'] if k in sense},'normalized':norm})
for key,r in roots.items():assert semantics.get(key,[])==r['spanishMeanings'],'Frozen lexical source differs: '+str(key)
forms.sort(key=lambda x:(x['word'],x['spanishLemma'],x['partOfSpeech'],x['wordRecordSha256'],json.dumps(x['sourceSense'],sort_keys=True,ensure_ascii=False)))
evidence={'artifactSha256':candidates['spanishArtifactSha256'],'candidateSha256':sha((D/(prefix+'-candidates.json')).read_bytes()),'normalizerSha256':policy['normalizerModuleSha256'],'forms':forms};raw=json.dumps(evidence,ensure_ascii=False,separators=(',',':'))+'\n'
manifest={'sourceUrl':policy['spanishArtifactUrl'],'artifactSha256':candidates['spanishArtifactSha256'],'candidateSha256':evidence['candidateSha256'],'evidenceSha256':sha(raw.encode()),'normalizerSha256':policy['normalizerModuleSha256'],'grammarPolicySourceSha256':sha((D/'spanish-form-source.json').read_bytes()),'license':'CC-BY-SA-4.0','englishProvenance':'Original model translations of selected Spanish dictionary senses, independently model-reviewed. Not source-provided English glosses, complete examples or native-Mexican certification.','scope':'Frozen semantic roots and explicit source form descriptions only; recognition is not translation coverage.'}
for name,obj in [(prefix+'-evidence.json',evidence),(prefix+'-source.json',manifest)]:
 text=json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n';path=D/name
 if args.check:assert path.read_text()==text,'Regenerate '+name
 else:path.write_text(text)
print('Verified lexical roots',len(roots),'retained form descriptions',len(forms),'not translation coverage')
