"""Rebuild the compact English Wiktionary snapshots from the pinned gzip.
Offline file only. Full archive checksum verified before any output is written.
The frozen lemma-selection manifest retains the original form-reference scope.
No quotations, examples, audio or other-language content is copied.
"""
import argparse,gzip,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('archive',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args();root=Path(__file__).resolve().parent.parent;D=root/'src/data/spanish';manifest=json.loads((D/'english-translation-source.json').read_text())
h=hashlib.sha256()
with args.archive.open('rb') as f:
 for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
assert h.hexdigest()==manifest['artifactSha256'] and args.archive.stat().st_size==manifest['artifactBytes'],'Use the exact pinned raw archive, not a newer or postprocessed source'
vocab=json.loads((D/'vocabulary.ts').read_text().split(' = ',1)[1].strip().removesuffix(';'));allowed={w for v in vocab.values() for w in v['guesses']};needed=set(json.loads((D/'english-evidence-lemma-selection.json').read_text()));records={};lemmas={};tables=[]
with gzip.open(args.archive,'rb') as f:
 for line in f:
  if b'"lang_code": "es"' not in line and b'"lang_code":"es"' not in line:continue
  row=json.loads(line)
  if row.get('lang_code')!='es':continue
  word=row.get('word','');senses=[{k:s[k] for k in ['glosses','tags','raw_tags','form_of','alt_of'] if k in s} for s in row.get('senses',[])];digest=hashlib.sha256(line).hexdigest()
  if senses:
   compact={'word':word,'pos':row.get('pos'),'senses':senses,'recordSha256':digest}
   if word==word.lower() and word.upper() in allowed:records.setdefault(word.upper(),[]).append(compact)
   if word in needed and any(not s.get('form_of') and 'form-of' not in s.get('tags',[]) and 'inflection-of' not in s.get('tags',[]) for s in senses):lemmas.setdefault(word,[]).append(compact)
  forms=[];table_tags=[]
  for form in row.get('forms',[]):
   tags=form.get('tags',[])
   if 'table-tags' in tags:
    table_tags=[] if form.get('form')=='no-table-tags' else form.get('form','').split();continue
   value=form.get('form','')
   if value!=value.lower() or value.upper() not in allowed:continue
   forms.append({k:form[k] for k in ['form','tags','source','raw_tags'] if k in form}|{'tableTags':table_tags[:]})
  if forms and any(not s.get('form_of') and not s.get('alt_of') and not set(s.get('tags',[]))&{'form-of','alt-of'} for s in senses):tables.append({'word':word,'pos':row.get('pos'),'forms':forms,'senses':senses,'recordSha256':digest})
outputs={'english-translation-evidence.json':{'acceptedRecords':records,'lemmas':lemmas},'english-form-tables.json':{'artifactSha256':manifest['artifactSha256'],'records':tables}}
for name,value in outputs.items():
 raw=(json.dumps(value,ensure_ascii=False,separators=(',',':'))+('\n' if 'evidence' in name else '')).encode();expected=manifest['evidenceSha256' if 'evidence' in name else 'formTablesSha256'];assert hashlib.sha256(raw).hexdigest()==expected,name+' differs from pinned filtered snapshot'
 if args.check:assert (D/name).read_bytes()==raw,name
 else:(D/name).write_bytes(raw)
print('Pinned English evidence reproduced')
