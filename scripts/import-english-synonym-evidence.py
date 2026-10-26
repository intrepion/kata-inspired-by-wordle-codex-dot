"""Replay the frozen synonym records, without fetching or modifying data.
Raw mode verifies exact English gzip checksum and raw-record hashes. --cache mode
checks the retained original broad source scan (not a fresh raw archive replay).
COPINO context is separately replayed against the pinned Spanish raw gzip.
"""
from pathlib import Path
import argparse,json,gzip,hashlib
p=argparse.ArgumentParser();p.add_argument('english',type=Path);p.add_argument('--cache',action='store_true');p.add_argument('--spanish-archive',type=Path,required=True);p.add_argument('--check',action='store_true');args=p.parse_args();D=Path(__file__).resolve().parent.parent/'src/data/spanish'
def sha(path):
 h=hashlib.sha256()
 with path.open('rb')as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def read(n):return json.loads((D/n).read_text())
m=read('english-synonym-source.json');candidate=read('english-synonym-candidates.json');assert sha(D/'english-synonym-candidates.json')==m['candidateSha256'];assert candidate['artifactSha256']==m['artifactSha256']==read('english-translation-source.json')['artifactSha256'];expected={}
for case in candidate['cases']:
 for row in [case['row'],*case['targetRows']]:
  key=row['recordSha256']
  if key in expected:assert expected[key]==row
  expected[key]=row
found={}
if args.cache:
 assert sha(args.english)==m['retainedResearchCacheSha256'],'Not the pinned original broad source scan'
 cache=json.loads(args.english.read_text());assert cache['artifactSha256']==m['artifactSha256']
 for group in ['acceptedRecords','lemmas']:
  for rows in cache[group].values():
   for row in rows:
    if row['recordSha256']in expected:
     assert row==expected[row['recordSha256']];found[row['recordSha256']]=row
 mode='retained original broad English-source scan replay (not fresh raw archive replay)'
else:
 assert sha(args.english)==m['artifactSha256'],'Not the exact pinned English raw gzip'
 with gzip.open(args.english,'rb')as f:
  for line in f:
   if b'"lang_code": "es"'not in line and b'"lang_code":"es"'not in line:continue
   digest=hashlib.sha256(line).hexdigest()
   if digest not in expected:continue
   row=json.loads(line);assert row['lang_code']=='es';compact={'word':row['word'],'pos':row.get('pos'),'senses':[{k:s[k]for k in ['glosses','tags','raw_tags','form_of','alt_of']if k in s}for s in row.get('senses',[])],'recordSha256':digest};assert compact==expected[digest];found[digest]=compact
 mode='pinned raw English archive replay'
assert set(found)==set(expected),'Source/target records absent: '+str(set(expected)-set(found))
context=read('english-synonym-spanish-context.json');assert sha(D/'english-synonym-spanish-context.json')==m['spanishContextSha256'];assert sha(args.spanish_archive)==context['artifactSha256']==read('spanish-form-source.json')['spanishArtifactSha256'];actual=[]
with gzip.open(args.spanish_archive,'rb')as f:
 for line in f:
  if b'"copino"'not in line:continue
  row=json.loads(line)
  if row.get('lang_code')!='es'or row.get('word')!='copino'or row.get('pos')!='noun':continue
  actual.append({'word':row['word'],'pos':row['pos'],'wordTags':row.get('tags',[]),'senses':[{k:s[k]for k in ['glosses','tags','raw_tags']if k in s}for s in row.get('senses',[])if s.get('glosses')],'recordSha256':hashlib.sha256(line).hexdigest()})
assert actual==context['records'],'COPINO context differs from pinned raw source'
selection=m['spanishContextSelection'];record=next(r for r in actual if r['recordSha256']==selection['recordSha256']and r['word']==selection['word']and r['pos']==selection['partOfSpeech']);assert record['senses'][selection['senseIndex']]['glosses']==selection['glosses']
print('Verified',len(expected),'exact synonym source/target records via',mode,'and exact raw Spanish COPINO context')
