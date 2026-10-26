"""Import explicit, sense-linked English equivalents, never inferred lemma translations.
Usage: python3 scripts/import-guess-translations.py /path/es-extract.jsonl.gz [--check]
Source is pinned in selection-source.json; no network, dependencies or code execution.
"""
import argparse,gzip,json,hashlib,re,unicodedata
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('artifact',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parent.parent;data=root/'src/data/spanish'
def sha(raw):return hashlib.sha256(raw).hexdigest()
source=json.loads((data/'selection-source.json').read_text())['wiktionary']
assert sha(args.artifact.read_bytes())==source['artifactSha256'],'Source differs from pinned artifact'
def exported(name):return json.loads((data/name).read_text().split(' = ',1)[1].strip().removesuffix(';'))
vocab=exported('vocabulary.ts');allowed={w for v in vocab.values() for w in v['guesses']}
# Retain all original reviewed teaching; these imports never overwrite it.
archive=json.loads((data/'learning.ts').read_text().split(' = ',1)[1].strip().removesuffix(';'))
reviewed={**archive,**exported('additional-teaching.ts')};out={};audit={};seen=set()
exclusions=json.loads((data/'guess-translation-exclusions.json').read_text())
blocked={(x['word'],x['senseIndex'],x['english']) for x in exclusions['pairs']}
def indexes(raw):
 if not isinstance(raw,str) or not re.fullmatch(r'\s*\d+(?:\s*[-–,]\s*\d+)*\s*',raw):return set()
 result=set()
 for token in raw.replace('–','-').split(','):
  bits=[int(x) for x in token.split('-')]
  if len(bits)==1:result.add(str(bits[0]))
  elif bits[1]>=bits[0] and bits[1]-bits[0]<100:result.update(str(i) for i in range(bits[0],bits[1]+1))
 return result
def plain(text):return isinstance(text,str) and 0<len(text.strip())<=160 and not re.search(r'[<>\x00-\x1f]',text) and text==unicodedata.normalize('NFC',text)
with gzip.open(args.artifact,'rt',encoding='utf8') as f:
 for line in f:
  r=json.loads(line);raw=r.get('word','');word=raw.upper()
  if r.get('lang_code')!='es' or raw!=raw.lower() or word not in allowed:continue
  seen.add(word)
  if word in reviewed:continue
  senses=[s for s in r.get('senses',[]) if s.get('sense_index') and s.get('glosses') and not s.get('form_of') and 'form-of' not in s.get('tags',[])]
  for t in r.get('translations',[]):
   if t.get('lang_code')!='en' or not plain(t.get('word')):continue
   # Missing/ambiguous sense references are deliberately not guessed.
   mapped=indexes(t.get('sense_index'))
   for sense in senses:
    if sense['sense_index'] not in mapped:continue
    if (word,sense['sense_index'],t['word']) in blocked or (r.get('pos')=='verb' and t['word'].strip().lower()=='to'):continue
    item={'partOfSpeech':r.get('pos','unknown'),'senseIndex':sense['sense_index'],'english':[t['word'].strip()],'tags':sorted(set(r.get('tags',[])+sense.get('tags',[])+t.get('tags',[])+sense.get('raw_tags',[])))}
    rows=out.setdefault(word,[])
    match=next((x for x in rows if all(x[k]==item[k] for k in ['partOfSpeech','senseIndex','tags'])),None)
    if match:
     if t['word'].strip() not in match['english']:match['english'].append(t['word'].strip())
    else:rows.append(item)
    evidence={'recordSha256':sha(line.encode()),'partOfSpeech':item['partOfSpeech'],'senseIndex':item['senseIndex'],'spanishGlosses':sense['glosses'],'english':t['word'].strip()}
    if evidence not in audit.setdefault(word,[]):audit[word].append(evidence)
for rows in out.values():
 for row in rows:row['english'].sort()
 rows.sort(key=lambda x:(x['partOfSpeech'],int(x['senseIndex']),x['tags']))
outputs={}
for length in [4,5,6,7]:outputs[f'src/data/spanish/translations/{length}.json']={w:out[w] for w in sorted(out) if len(w)==length}
covered=set(reviewed)&allowed;new=set(out);missing=sorted(allowed-covered-new)
outputs['src/data/spanish/guess-translation-audit.json']={'policy':'explicit-sense-linked-English-v1','exclusionsSha256':sha((data/'guess-translation-exclusions.json').read_bytes()),'source':source,'reviewedRecordsSha256':{n:sha((data/n).read_bytes()) for n in ['learning.ts','additional-teaching.ts']},'accepted':len(allowed),'reviewedTeaching':len(covered),'newDictionaryEquivalents':len(new),'translated':len(covered|new),'missing':len(missing),'missingNoSourceRecord':len(set(missing)-seen),'limitations':'Selected explicit dictionary equivalents, not complete senses, reviewed Mexican examples or context-disambiguated translations. Inflected-only senses and missing/ambiguous sense references are withheld. Reviewed teaching is preserved. No lemma substitution or automatic grammatical paraphrase counts as translation.','evidence':{w:audit[w] for w in sorted(audit)},'uncoveredWords':missing}
outputs['src/data/spanish/guess-translation-coverage.json']={k:outputs['src/data/spanish/guess-translation-audit.json'][k] for k in ['accepted','reviewedTeaching','newDictionaryEquivalents','translated','missing','missingNoSourceRecord']}
for name,value in outputs.items():
 dest=root/name;text=json.dumps(value,ensure_ascii=False,sort_keys=False,separators=(',',':'))+'\n'
 if args.check:assert dest.read_text()==text,'Generated data differs: '+name
 else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(text)
print(json.dumps({k:outputs['src/data/spanish/guess-translation-audit.json'][k] for k in ['accepted','reviewedTeaching','newDictionaryEquivalents','translated','missing','missingNoSourceRecord']}))
