"""Replay exact Spanish noun-number context from the pinned raw archive.
English source records and both reviews are additionally bound by the compiler.
No data is fetched or written.
"""
from pathlib import Path
import argparse,json,gzip,hashlib
p=argparse.ArgumentParser();p.add_argument('archive',type=Path);args=p.parse_args();D=Path(__file__).resolve().parent.parent/'src/data/spanish';expected=json.loads((D/'english-noun-number-spanish-context.json').read_text());h=hashlib.sha256()
with args.archive.open('rb')as f:
 for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
assert h.hexdigest()==expected['artifactSha256'];words={r['word']for r in expected['records']};actual=[]
with gzip.open(args.archive,'rb')as f:
 for line in f:
  if b'"gente"'not in line:continue
  r=json.loads(line)
  if r.get('lang_code')!='es'or r.get('word')not in words or r.get('pos')!='noun':continue
  actual.append({'word':r['word'],'pos':r['pos'],'wordTags':r.get('tags',[]),'senses':[{k:s[k]for k in ['glosses','tags','raw_tags']if k in s}for s in r.get('senses',[])],'recordSha256':hashlib.sha256(line).hexdigest()})
assert actual==expected['records'];print('Exact raw Spanish human-collective context reproduced:',len(actual),'records')
