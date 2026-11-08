#!/usr/bin/env python3
"""Extract only lexical fields from pinned sources; no runtime downloads.
Usage: python3 scripts/import-romanian.py ROMANIAN.jsonl SMALL_UK.msgpack.gz [--check]
The Kaikki input is explicitly postprocessed, NOT the raw multilingual extract.
"""
import argparse, gzip, hashlib, json, re, unicodedata
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('lexical',type=Path);p.add_argument('frequency',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parents[1];data=root/'src/data/romanian'
LEXICAL_SHA='b5e98b66c32271d3df2857d6684f510a0adb634e22bf0382fd44973b00a48708'
FREQUENCY_SHA='c17fe82952ed209bb45b95c56cb5c7f077ca921a84578c3807d48ddc1dd842e2'
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
assert digest(args.lexical)==LEXICAL_SHA,'Lexical snapshot differs from pinned source'
assert digest(args.frequency)==FREQUENCY_SHA,'Frequency snapshot differs from pinned source'
def normalize(word):
 word=unicodedata.normalize('NFC',word).translate(str.maketrans('şŞţŢ','șȘțȚ'))
 return ''.join(letter.upper() if re.fullmatch('[A-Za-zĂăÂâÎîȘșȚț]',letter) else letter for letter in word)
raw=gzip.open(args.frequency,'rb').read();offset=0
def unpack():
 global offset
 tag=raw[offset];offset+=1
 def integer(size):
  global offset
  value=int.from_bytes(raw[offset:offset+size],'big');offset+=size;return value
 def string(size):
  global offset
  value=raw[offset:offset+size].decode();offset+=size;return value
 if tag<128:return tag
 if 0xa0<=tag<=0xbf:return string(tag-0xa0)
 if 0x90<=tag<=0x9f:return [unpack() for _ in range(tag-0x90)]
 if 0x80<=tag<=0x8f:return {unpack():unpack() for _ in range(tag-0x80)}
 if tag in [0xd9,0xda,0xdb]:return string(integer({0xd9:1,0xda:2,0xdb:4}[tag]))
 if tag in [0xdc,0xdd]:return [unpack() for _ in range(integer(2 if tag==0xdc else 4))]
 if tag in [0xcc,0xcd,0xce]:return integer({0xcc:1,0xcd:2,0xce:4}[tag])
 raise ValueError('Unsupported pinned MessagePack tag '+hex(tag))
bins=unpack();assert offset==len(raw) and bins[0]=={'format':'cB','version':1}
# Frequency spelling and lexical tiles preserve all 31 Romanian letters.
frequency={}
for index,words in enumerate(bins[1:]):
 for word in words:
  key=normalize(word)
  if re.fullmatch('[A-ZĂÂÎȘȚ]{3,22}',key):frequency[key]=max(frequency.get(key,0),round(9-index/100,2))
def spelling_frequency(key):return frequency.get(key,0)
lexical={};positions={'noun','verb','adj','adv','pron','det','num','conj','prep','intj','particle','article'}
with args.lexical.open() as rows:
 for line in rows:
  entry=json.loads(line);word=entry.get('word','');key=normalize(word)
  if entry.get('lang_code')!='ro' or not re.fullmatch('[A-ZĂÂÎȘȚ]{3,11}',key) or entry.get('pos') not in positions:continue
  if spelling_frequency(key)<2.5:continue
  senses=[]
  for sense in entry.get('senses',[]):
   glosses=[g.strip() for g in sense.get('glosses',[]) if isinstance(g,str) and g.strip() and len(g)<=1800]
   if not glosses:continue
   item={'gloss':glosses[-1]}
   for field in ['tags','raw_tags','form_of','alt_of']:
    if sense.get(field):item[field]=sense[field]
   senses.append(item)
  if not senses:continue
  record={'sourceWord':word,'partOfSpeech':entry['pos'],'senses':senses,'sourceLineSha256':hashlib.sha256(line.encode()).hexdigest()}
  if entry.get('tags'):record['tags']=entry['tags']
  lexical.setdefault(key,[]).append(record)
frequency={key:spelling_frequency(key) for key in sorted(lexical)}
outputs={'lexical-evidence.json':json.dumps(lexical,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n','frequency-evidence.json':json.dumps(frequency,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n'}
manifest={'language':'ro-RO','sourceLanguage':'ro','version':'ro-RO-v1','retrieved':'2026-11-08','wiktionary':{'edition':'English Wiktionary, Romanian entries','contributors':'Wiktionary contributors','artifactUrl':'https://kaikki.org/dictionary/Romanian/kaikki.org-dictionary-Romanian.jsonl','artifactBytes':args.lexical.stat().st_size,'artifactSha256':LEXICAL_SHA,'format':'Kaikki postprocessed per-language JSONL; deprecated upstream, not raw Wiktextract data','landingPage':'https://kaikki.org/dictionary/Romanian/','rightsUrl':'https://kaikki.org/dictionary/','dataLicense':'CC-BY-SA-4.0','modifications':'Retain 3–11-tile Romanian headwords, excluding proper-name POS, with Zipf >=2.5, parts of speech, glosses, sense tags and form/alternative relationships only. Omit enrichment categories, disambiguation, audio, examples, quotations, translations, etymology and non-Romanian scripts/spellings. Preserve original headwords and per-record input hashes. NFC and uppercase preserve Ă, Â, Î, Ș and Ț as distinct letters. Legacy cedilla ş/ţ map to comma-below ș/ț; no plain-letter aliases or accent stripping. Only the 31 Romanian letters are playable. Apostrophes and hyphens are excluded, never removed to manufacture misspellings. Exact source spelling and case are retained. No exact article revision is supplied by this snapshot.'},'wordfreq':{'author':'Robyn Speer and contributors','version':'3.0.2','revision':'372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b','artifactUrl':'https://raw.githubusercontent.com/rspeer/wordfreq/372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b/wordfreq/data/small_ro.msgpack.gz','artifactBytes':args.frequency.stat().st_size,'artifactSha256':FREQUENCY_SHA,'dataLicense':'CC-BY-SA-4.0','softwareLicense':'MIT','modifications':'Retain 3–11-letter spelling frequency bins matching Romanian lexical evidence. NFC and uppercase with legacy cedilla-to-comma aliases only. No plain-letter folding or transliteration. For case-normalized homographs use the maximum supplied estimate, not a sum. Historical mixed-corpus spelling frequencies do not certify individual senses or contemporary regional usage.'},'inputs':{name:hashlib.sha256(content.encode()).hexdigest() for name,content in outputs.items()}}
outputs['source.json']=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
for name,content in outputs.items():
 path=data/name
 if args.check:assert path.read_text()==content,'Regenerate '+name
 else:path.write_text(content)
print(f'{len(lexical)} dictionary-backed 3–11-letter spellings; {len(frequency)} have frequency estimates.')
