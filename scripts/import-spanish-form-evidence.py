"""Retain SHA-pinned Spanish form metadata; no quoted examples or English guesses.
Grammar normalization is independently reviewed. Runtime English meanings are
produced separately only by the guarded lexical/morphological renderer.
"""
from pathlib import Path
import argparse,json,hashlib,gzip,unicodedata,os
from spanish_form_descriptions import normalize
p=argparse.ArgumentParser();p.add_argument('archive',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args();root=Path(__file__).resolve().parent.parent;D=root/'src/data/spanish';manifest=json.loads((D/'spanish-form-source.json').read_text());h=hashlib.sha256()
with args.archive.open('rb') as f:
 for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
assert h.hexdigest()==manifest['spanishArtifactSha256'];assert hashlib.sha256((root/'scripts/spanish_form_descriptions.py').read_bytes()).hexdigest()==manifest['normalizerModuleSha256'];assert hashlib.sha256((D/'spanish-form-targets.json').read_bytes()).hexdigest()==manifest['targetSha256'];targets=set(json.loads((D/'spanish-form-targets.json').read_text()));en=json.loads((D/'english-translation-evidence.json').read_text());records=[]
with gzip.open(args.archive,'rb') as f:
 for line in f:
  row=json.loads(line);word=row.get('word','');key=unicodedata.normalize('NFC',word).upper();pos=row.get('pos')
  if row.get('lang_code')!='es' or word!=word.lower() or key not in targets or pos not in {'verb','adj'}:continue
  for sense in row.get('senses',[]):
   for link in sense.get('form_of',[]):
    lemma=unicodedata.normalize('NFC',link['word']);normalized=normalize(pos,sense,lemma)
    if not normalized or not any(r['pos']==pos for r in en['lemmas'].get(lemma,[])):continue
    records.append({'word':word,'pos':pos,'posTitle':row.get('pos_title'),'recordSha256':hashlib.sha256(line).hexdigest(),'wordTags':row.get('tags',[]),'wordRawTags':row.get('raw_tags',[]),'wordCategories':row.get('categories',[]),'sense':{k:sense[k] for k in ['glosses','tags','raw_tags','categories','form_of','sense_index'] if k in sense},'lemma':lemma,'normalized':normalized})
output={'spanishArtifactSha256':manifest['spanishArtifactSha256'],'normalizerModuleSha256':manifest['normalizerModuleSha256'],'records':records};text=json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n';path=D/'spanish-form-evidence.json'
if args.check:
 assert path.read_text()==text,'Foreign form evidence differs'
 assert hashlib.sha256(text.encode()).hexdigest()==manifest['evidenceSha256']
 assert hashlib.sha256((D/'english-translation-evidence.json').read_bytes()).hexdigest()==manifest['englishEvidenceSha256']
else:
 tmp=path.with_suffix('.json.tmp');tmp.write_text(text);os.replace(tmp,path)
 manifest['evidenceSha256']=hashlib.sha256(text.encode()).hexdigest();manifest['englishEvidenceSha256']=hashlib.sha256((D/'english-translation-evidence.json').read_bytes()).hexdigest();m=D/'spanish-form-source.json';t=m.with_suffix('.json.tmp');t.write_text(json.dumps(manifest,indent=2)+'\n');os.replace(t,m)
print('Retained Spanish source descriptions',len(records),'senses',len({r['word'].upper() for r in records}),'words; not translation coverage')
