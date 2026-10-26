"""Verify frozen lexical-review selections against pinned retained sources.
Candidate priorities/children are a frozen research scope, not translation proofs.
English meanings must match retained English records; Spanish semantic records are
replayed from the exact archive. No raw archive is fetched by this checker.
"""
from pathlib import Path
import argparse,json,hashlib,gzip
p=argparse.ArgumentParser();p.add_argument('archive',type=Path);p.add_argument('--batch',type=int,choices=[1,2,3,4],required=True);p.add_argument('--check',action='store_true');args=p.parse_args();D=Path(__file__).resolve().parent.parent/'src/data/spanish';prefix='english-additional-verb'+(f'-{args.batch}' if args.batch!=1 else '');candidate=json.loads((D/(prefix+'-candidates.json')).read_text());english=json.loads((D/'english-translation-evidence.json').read_text());manifest=json.loads((D/'english-translation-source.json').read_text());assert hashlib.sha256((D/'english-translation-evidence.json').read_bytes()).hexdigest()==manifest['evidenceSha256'];assert candidate['englishArtifactSha256']==manifest['artifactSha256'];assert hashlib.sha256(args.archive.read_bytes()).hexdigest()==candidate['spanishArtifactSha256'];roots={r['spanish']:r for r in candidate['roots']};assert len(roots)==len(candidate['roots']);spanish={}
for lemma,r in roots.items():
 meanings=[]
 for row in english['lemmas'].get(lemma,[]):
  if row['pos']!='verb':continue
  for sense in row['senses']:
   if sense.get('form_of') or sense.get('alt_of') or not sense.get('glosses') or set(sense.get('tags',[]))&{'form-of','alt-of','no-gloss'}:continue
   meanings.append({k:sense[k] for k in ['glosses','tags','raw_tags'] if k in sense}|{'recordSha256':row['recordSha256']})
 assert meanings==r['englishMeanings'],'English lexical selection differs: '+lemma
with gzip.open(args.archive,'rb') as f:
 for line in f:
  row=json.loads(line)
  if row.get('lang_code')!='es' or row.get('word') not in roots or row.get('pos')!='verb':continue
  senses=[{k:s[k] for k in ['glosses','tags','raw_tags','categories'] if k in s} for s in row.get('senses',[]) if not s.get('form_of') and not s.get('alt_of') and 'form-of' not in s.get('tags',[])]
  if senses:spanish.setdefault(row['word'],[]).append({'word':row['word'],'pos':'verb','tags':row.get('tags',[]),'categories':row.get('categories',[]),'senses':senses,'recordSha256':hashlib.sha256(line).hexdigest()})
for lemma,r in roots.items():assert spanish.get(lemma,[])==r['spanishEvidence'],'Spanish lexical selection differs: '+lemma
print('Verified',len(roots),'frozen English/Spanish lexical-review candidates, batch',args.batch)
