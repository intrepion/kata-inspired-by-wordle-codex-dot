"""Reproduce only the licensed selection evidence from two pinned source artifacts.
Usage: python3 scripts/import-spanish-selection.py /path/es-extract.jsonl.gz /path/large_es.msgpack.gz --check
No downloads, executable source content or third-party Python modules.
"""
import argparse,gzip,json,hashlib
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('lexical',type=Path);parser.add_argument('frequency',type=Path);parser.add_argument('--check',action='store_true');args=parser.parse_args()
data=Path(__file__).resolve().parent.parent/'src/data/spanish';manifest=json.loads((data/'selection-source.json').read_text())
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
assert digest(args.lexical)==manifest['wiktionary']['artifactSha256'],'Lexical artifact differs from pinned source'
assert digest(args.frequency)==manifest['wordfreq']['artifactSha256'],'Frequency artifact differs from pinned source'
text=(data/'vocabulary.ts').read_text();vocabulary=json.loads(text.split(' = ',1)[1].strip().removesuffix(';'));allowed={word for pool in vocabulary.values() for word in pool['guesses']}
# Minimal MessagePack integer/string/array/map reader for the pinned, documented cBpack format.
raw=gzip.open(args.frequency,'rb').read();offset=0
def unpack():
 global offset
 tag=raw[offset];offset+=1
 def integer(size):
  global offset
  value=int.from_bytes(raw[offset:offset+size],'big');offset+=size;return value
 def string(size):
  global offset
  value=raw[offset:offset+size].decode('utf8');offset+=size;return value
 if tag<128:return tag
 if 0xa0<=tag<=0xbf:return string(tag-0xa0)
 if 0x90<=tag<=0x9f:return [unpack() for _ in range(tag-0x90)]
 if 0x80<=tag<=0x8f:return {unpack():unpack() for _ in range(tag-0x80)}
 if tag in [0xd9,0xda,0xdb]:return string(integer({0xd9:1,0xda:2,0xdb:4}[tag]))
 if tag in [0xdc,0xdd]:return [unpack() for _ in range(integer(2 if tag==0xdc else 4))]
 if tag in [0xcc,0xcd,0xce]:return integer({0xcc:1,0xcd:2,0xce:4}[tag])
 raise ValueError('Unexpected pinned MessagePack tag: '+hex(tag))
bins=unpack();assert offset==len(raw) and bins[0]=={'format':'cB','version':1}
frequency={word.upper():round(9-index/100,2) for index,words in enumerate(bins[1:]) for word in words if word.upper() in allowed}
wanted={word for word in allowed if frequency.get(word,0)>=manifest['minimumZipf']};lexical={}
with gzip.open(args.lexical,'rt',encoding='utf8') as f:
 for line in f:
  source=json.loads(line);word=source.get('word','')
  if source.get('lang_code')!='es' or word!=word.lower() or word.upper() not in wanted:continue
  entry={key:source[key] for key in ['pos','pos_title','tags'] if key in source};entry['rawSha256']=hashlib.sha256(line.encode()).hexdigest();entry['senses']=[]
  for sense in source.get('senses',[]):
   retained={key:sense[key] for key in ['glosses','tags','raw_tags','form_of','alt_of','sense_index'] if key in sense};retained['categories']=[category for category in sense.get('categories',[]) if category.startswith('ES:')];entry['senses'].append(retained)
  entry['categories']=[category for category in source.get('categories',[]) if category.startswith('ES:')];lexical.setdefault(word.upper(),[]).append(entry)
outputs={'frequency-evidence.json':json.dumps(frequency,ensure_ascii=False,sort_keys=True),'lexical-evidence.json':json.dumps(lexical,ensure_ascii=False,separators=(',',':'),sort_keys=True)+'\n'}
for name,content in outputs.items():
 path=data/name
 if args.check:assert path.read_text()==content,'Regenerate '+name
 else:path.write_text(content)
print(f'Reproduced {len(frequency)} frequency estimates and {len(lexical)} lexical word records from pinned sources.')
