#!/usr/bin/env python3
"""Select bounded plain-text senses from the new SHA-pinned Simple Wiktionary extract for extended lengths.
Usage: python3 scripts/import-local-definitions.py SOURCE.gz ACCEPTED.json [--check]
ACCEPTED.json is a mapping of lengths to sorted uppercase English accepted words.
No quotations, media, examples, translations, inferred senses or generated inflections.
"""
import gzip,hashlib,json,sys,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1]);allowed=json.loads(pathlib.Path(sys.argv[2]).read_text());check='--check' in sys.argv
sha=hashlib.sha256(source.read_bytes()).hexdigest()
assert sha=='79afd871e342db3b87c3f2044ed21efa312e4c4ee006814b57c4cf4536ef70a1','Source snapshot mismatch'
tables={str(n):{} for n in [3,8,9,10,11]};seen=set()
with gzip.open(source,'rt') as rows:
 for row in rows:
  item=json.loads(row);word=item.get('word','');key=word.upper();length=str(len(word))
  if item.get('lang_code')!='en' or length not in tables or key not in allowed[length] or word!=word.lower():continue
  senses=[]
  for sense in item.get('senses',[]):
   glosses=sense.get('glosses',[])
   if not glosses:continue
   gloss=glosses[-1].strip()
   labels=list(dict.fromkeys(sense.get('tags',[])+sense.get('raw_tags',[])))
   value=('['+', '.join(labels)+'] ' if labels else '')+gloss
   if gloss and len(value)<=1800 and value not in senses:senses.append(value)
   if len(senses)==4:break
  if not senses:continue
  table=tables[length];entry=table.setdefault(key,[]);definition={'partOfSpeech':item.get('pos','unknown'),'senses':senses}
  if definition not in entry and len(entry)<4:entry.append(definition)
manifest={'edition':'Simple English Wiktionary','contributors':'Simple English Wiktionary contributors','artifactUrl':'https://kaikki.org/dictionary/downloads/simple/simple-extract.jsonl.gz','artifactBytes':source.stat().st_size,'artifactSha256':sha,'retrieved':'2026-11-02','dataLicense':'CC-BY-SA-4.0','rightsUrl':'https://simple.wiktionary.org/wiki/Wiktionary:Copyrights','rawIndex':'https://kaikki.org/dictionary/rawdata.html','modifications':'English accepted 3 and 8–11-letter lowercase headwords only; at most four entries and four senses per entry; preserve sense tags, omit examples/quotations/media. No inferred meanings. Entry source links use Simple English Wiktionary articles; no exact entry revision supplied by extract.','byLength':{}}
for n,table in tables.items():
 table=dict(sorted(table.items()));data=(json.dumps(table,ensure_ascii=False,separators=(',',':'))+'\n').encode();p=root/'src/data/definitions'/f'extended-{n}.json'
 manifest['byLength'][n]={'accepted':len(allowed[n]),'defined':len(table),'missing':len(allowed[n])-len(table),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 if check:assert p.read_bytes()==data,f'{p} differs'
 else:p.write_bytes(data)
data=(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n').encode();p=root/'src/data/definitions/extended-source.json'
if check:assert p.read_bytes()==data,'source manifest differs'
else:p.write_bytes(data)
print(json.dumps(manifest['byLength']))
