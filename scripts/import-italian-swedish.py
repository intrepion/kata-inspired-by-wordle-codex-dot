#!/usr/bin/env python3
"""Extract a pinned Italian or Swedish lexical snapshot. Builds never download data.
Usage: python3 scripts/import-italian-swedish.py italian|swedish SOURCE.jsonl FREQUENCY.gz [--check]
"""
import argparse, gzip, hashlib, json, re, unicodedata
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('language',choices=['italian','swedish']);p.add_argument('lexical',type=Path);p.add_argument('frequency',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parents[1];data=root/'src/data'/args.language
config=json.loads((root/'scripts/italian-swedish-sources.json').read_text())[args.language]
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
assert digest(args.lexical)==config['lexicalSha256'],'Lexical snapshot differs'
assert digest(args.frequency)==config['frequencySha256'],'Frequency snapshot differs'
def normalize(word):return unicodedata.normalize('NFC',word).upper()
alphabet='[A-ZÀÈÉÌÒÓÙ]' if args.language=='italian' else '[A-ZÅÄÖ]'
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
 raise ValueError('Unsupported MessagePack tag '+hex(tag))
bins=unpack();assert offset==len(raw) and bins[0]=={'format':'cB','version':1}
frequency={}
for index,words in enumerate(bins[1:]):
 for word in words:
  key=normalize(word)
  if re.fullmatch(alphabet+'{3,11}',key):frequency[key]=max(frequency.get(key,0),round(9-index/100,2))
lexical={};positions={'noun','verb','adj','adv','pron','det','num','conj','prep','intj','particle','article'}
foreign=re.compile('Switzerland|Swiss|Ticino' if args.language=='italian' else 'Finland|Finland-Swedish|Estonia',re.I)
with args.lexical.open() as rows:
 for line in rows:
  entry=json.loads(line);word=entry.get('word','');key=normalize(word)
  if entry.get('lang_code')!=config['code'] or not re.fullmatch(alphabet+'{3,11}',key) or entry.get('pos') not in positions or frequency.get(key,0)<2.5:continue
  senses=[]
  for sense in entry.get('senses',[]):
   if foreign.search(' '.join(entry.get('tags',[])+sense.get('tags',[])+sense.get('raw_tags',[]))):continue
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
frequency={key:frequency[key] for key in sorted(lexical)}
outputs={'lexical-evidence.json':json.dumps(lexical,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n','frequency-evidence.json':json.dumps(frequency,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n'}
name=args.language.title()
manifest={'language':config['locale'],'sourceLanguage':config['code'],'version':config['locale']+'-v1','retrieved':'2026-11-07','wiktionary':{'edition':f'English Wiktionary, {name} entries','contributors':'Wiktionary contributors','artifactUrl':f'https://kaikki.org/dictionary/{name}/kaikki.org-dictionary-{name}.jsonl','artifactBytes':args.lexical.stat().st_size,'artifactSha256':config['lexicalSha256'],'format':'Kaikki postprocessed per-language JSONL; deprecated upstream, not raw Wiktextract data','landingPage':f'https://kaikki.org/dictionary/{name}/','rightsUrl':'https://kaikki.org/dictionary/','dataLicense':'CC-BY-SA-4.0','modifications':'Retain 3–11-letter lexical headwords with Zipf >=2.5, English glosses, tags and form/alternative relationships. Exclude proper-name POS and explicitly other-country labelled senses. Preserve original spelling and record hashes. Exclude punctuation, spaces and unsupported characters. Omit enrichment, audio, examples, quotations, translations and etymology. No exact article revision is supplied. Regional source labels are incomplete.'},'wordfreq':{'author':'Robyn Speer and contributors','version':'3.0.2','revision':'372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b','artifactUrl':f"https://raw.githubusercontent.com/rspeer/wordfreq/372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b/wordfreq/data/small_{config['code']}.msgpack.gz",'artifactBytes':args.frequency.stat().st_size,'artifactSha256':config['frequencySha256'],'dataLicense':'CC-BY-SA-4.0','softwareLicense':'MIT','modifications':'Exact NFC uppercase spelling frequencies, taking maximum across case variants, never adding them. No accent aliases in frequency evidence. Historical mixed-corpus spelling frequency, not individual-sense or exclusive regional frequency.'},'inputs':{name:hashlib.sha256(content.encode()).hexdigest() for name,content in outputs.items()}}
outputs['source.json']=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
for name,content in outputs.items():
 path=data/name
 if args.check:assert path.read_text()==content,'Regenerate '+str(path)
 else:path.write_text(content)
print(args.language,len(lexical),'dictionary-backed spellings')
