#!/usr/bin/env python3
"""Gap-fill English definitions from a pinned raw English Wiktionary extract.
Usage: python3 scripts/import-english-definitions.py SOURCE.gz ACCEPTED.json [--check]
Keeps Simple English selection unchanged. No examples, quotations, media or inferred senses.
"""
import gzip,hashlib,json,pathlib,re,sys,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
EXPECTED_SHA='784574cc577d333bbf9e659be38efa27e75e9bfc0a2a8c7ab2371bb5fec29b2d'
EXPECTED_BYTES=3082185963
source=pathlib.Path(sys.argv[1]); allowed=json.loads(pathlib.Path(sys.argv[2]).read_text());check='--check' in sys.argv
assert source.stat().st_size==EXPECTED_BYTES,'Unexpected source size'
h=hashlib.sha256()
with source.open('rb') as f:
 while chunk:=f.read(1024*1024):h.update(chunk)
assert h.hexdigest()==EXPECTED_SHA,'Unexpected source checksum'
base={str(n):json.loads((ROOT/f'src/data/definitions/{n}.json').read_text()) for n in range(4,8)}
gaps={n:set(words)-base[n].keys() for n,words in allowed.items()}
tables={str(n):{} for n in range(4,8)}; records=0;selected=0;started=time.monotonic()
english_record=re.compile(r'"lang_code"\s*:\s*"en"')
with gzip.open(source,'rt',encoding='utf-8') as rows:
 for row in rows:
  records+=1
  if not english_record.search(row):continue
  item=json.loads(row); word=item.get('word','');n=str(len(word));key=word.upper()
  if item.get('lang_code')!='en' or n not in gaps or key not in gaps[n] or word!=word.lower():continue
  senses=[]
  for sense in item.get('senses',[]):
   glosses=sense.get('glosses',[])
   if not glosses:continue
   gloss=glosses[-1].strip();labels=list(dict.fromkeys(sense.get('tags',[])+sense.get('raw_tags',[])))
   value=('['+', '.join(labels)+'] ' if labels else '')+gloss
   if gloss and len(value)<=1800 and value not in senses:senses.append(value)
   if len(senses)==4:break
  if not senses:continue
  entries=tables[n].setdefault(key,[]);entry={'partOfSpeech':item.get('pos','unknown'),'senses':senses}
  if entry not in entries and len(entries)<4:entries.append(entry);selected+=1
  if selected%10000==0:print(f'{records} records read; {selected} selected entries; {int(time.monotonic()-started)}s',flush=True)
manifest={'edition':'English Wiktionary','contributors':'English Wiktionary contributors','artifactUrl':'https://kaikki.org/dictionary/raw-wiktextract-data.jsonl.gz','artifactBytes':EXPECTED_BYTES,'artifactSha256':EXPECTED_SHA,'dumpDate':'2026-10-01','retrieved':'2026-10-29','lastModified':'2026-10-25T08:19:16Z','dataLicense':'CC-BY-SA-4.0','rightsUrl':'https://en.wiktionary.org/wiki/Wiktionary:Copyrights','rawIndex':'https://kaikki.org/dictionary/rawdata.html','modifications':'Only lowercase English-language headwords matching existing accepted 4–7-letter spellings missing from Simple English selection. Up to four POS entries, four senses each, 1800 characters per sense, with supplied tags/raw_tags. No inferred meanings or inflections; examples, quotations, media and other fields omitted. Source article history provides attribution; extract does not provide exact entry revisions.','recordsScanned':records,'byLength':{}}
for n,table in tables.items():
 data=(json.dumps(dict(sorted(table.items())),ensure_ascii=False,separators=(',',':'))+'\n').encode()
 p=ROOT/f'src/data/definitions/english-{n}.json'
 manifest['byLength'][n]={'accepted':len(allowed[n]),'existing':len(base[n]),'added':len(table),'defined':len(base[n])+len(table),'missing':len(allowed[n])-len(base[n])-len(table),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 if check:assert p.read_bytes()==data,f'{p} differs'
 else:p.write_bytes(data)
p=ROOT/'src/data/definitions/english-source.json';data=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
if check:assert p.read_bytes()==data,'Manifest differs'
else:p.write_bytes(data)
print(json.dumps(manifest['byLength']),flush=True)
