#!/usr/bin/env python3
"""Extract only lexical fields from pinned sources; no runtime downloads.
Usage: python3 scripts/import-portuguese.py PORTUGUESE.jsonl SMALL_PT.msgpack.gz [--check]
The Kaikki input is explicitly postprocessed, NOT the raw multilingual extract.
"""
import argparse, gzip, hashlib, json, re, unicodedata
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('lexical',type=Path);p.add_argument('frequency',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parents[1];data=root/'src/data/portuguese'
LEXICAL_SHA='eae83ef2e7a683d60e4171514704b462be08b706381c4065a326f4dfa3614a64'
FREQUENCY_SHA='fe4e551f6da739583d66cd5ef4fca28a1ccfa2ae5a53a5cbf48aa73dd7c91e0c'
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
assert digest(args.lexical)==LEXICAL_SHA,'Lexical snapshot differs from pinned source'
assert digest(args.frequency)==FREQUENCY_SHA,'Frequency snapshot differs from pinned source'
def normalize(word):return unicodedata.normalize('NFC',word).upper()
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
# Portuguese frequency evidence retains accented spellings.
frequency={}
for index,words in enumerate(bins[1:]):
 for word in words:
  key=normalize(word)
  if re.fullmatch('[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ]{3,11}',key):frequency[key]=max(frequency.get(key,0),round(9-index/100,2))
lexical={};positions={'noun','verb','adj','adv','pron','det','num','conj','prep','intj','particle','article'}
with args.lexical.open() as rows:
 for line in rows:
  entry=json.loads(line);word=entry.get('word','');key=normalize(word)
  if word != word.lower():continue
  if entry.get('lang_code')!='pt' or not re.fullmatch('[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ]{3,11}',key) or entry.get('pos') not in positions:continue
  if frequency.get(key,0)<2.5:continue
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
frequency={key:frequency[key] for key in sorted(lexical) if key in frequency}
outputs={'lexical-evidence.json':json.dumps(lexical,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n','frequency-evidence.json':json.dumps(frequency,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n'}
manifest={'languages':['pt-BR','pt-PT'],'sourceLanguage':'pt','version':'pt-varieties-v1','retrieved':'2026-11-07','wiktionary':{'edition':'English Wiktionary, Portuguese entries','contributors':'Wiktionary contributors','artifactUrl':'https://kaikki.org/dictionary/Portuguese/kaikki.org-dictionary-Portuguese.jsonl','artifactBytes':args.lexical.stat().st_size,'artifactSha256':LEXICAL_SHA,'format':'Kaikki postprocessed per-language JSONL','landingPage':'https://kaikki.org/dictionary/Portuguese/','rightsUrl':'https://kaikki.org/dictionary/','dataLicense':'CC-BY-SA-4.0','modifications':'Retain lowercase 3–11-letter Portuguese lexical headwords, Zipf >=2.5, POS, senses, labels, form/alternative relationships and source-record hashes. Exclude names, punctuation, examples, quotations, etymology and media. Exact article revisions are unavailable. Region membership is verified separately.'},'wordfreq':{'author':'Robyn Speer and contributors','version':'3.0.2','revision':'372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b','artifactUrl':'https://raw.githubusercontent.com/rspeer/wordfreq/372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b/wordfreq/data/small_pt.msgpack.gz','artifactBytes':args.frequency.stat().st_size,'artifactSha256':FREQUENCY_SHA,'dataLicense':'CC-BY-SA-4.0','softwareLicense':'MIT','modifications':'Retain spelling frequencies matching lexical evidence. Historical mixed-region frequency is not sense-specific or proof of regional usage.'},'regionalSources':{'br':{'name':'VERO 3.2, LibreOffice dictionary snapshot','revision':'c0865a85eb67dc377f2cf8e8fe2c4fa9e53f0dcb','url':'https://github.com/LibreOffice/dictionaries/tree/c0865a85eb67dc377f2cf8e8fe2c4fa9e53f0dcb/pt_BR','license':'LGPL-3.0','licenseChoice':'README explicitly offers LGPL version 3 and MPL without a version. This distribution uses LGPL-3.0, not an inferred MPL version.','localSource':'public/third-party/pt-BR'},'pt':{'name':'Natura hunspell-pt_PT-20251001 (post-AO1990; separate preao archive not used)','url':'https://natura.di.uminho.pt/download/sources/Dictionaries/hunspell/hunspell-pt_PT-20251001.tar.gz','archiveSha256':'2066157087e83264484a6d564e1d85258fe2c5eddb9713a42d6f6cf06b0a2ed9','license':'MPL-1.1','licenseChoice':'README/COPYING explicitly offers GPL-2.0, LGPL-2.1 or MPL-1.1. This distribution uses MPL-1.1.','localSource':'public/third-party/pt-PT'}},'inputs':{name:hashlib.sha256(content.encode()).hexdigest() for name,content in outputs.items()}}
for region,code in [('br','BR'),('pt','PT')]:
 manifest['regionalSources'][region]['files']={f.name:digest(f) for f in sorted((root/'public/third-party'/('pt-'+code)).iterdir()) if f.suffix in ['.aff','.dic']}
outputs['source.json']=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
for name,content in outputs.items():
 path=data/name
 if args.check:assert path.read_text()==content,'Regenerate '+name
 else:path.write_text(content)
print(f'{len(lexical)} dictionary-backed 3–11-letter spellings; {len(frequency)} have frequency estimates.')
