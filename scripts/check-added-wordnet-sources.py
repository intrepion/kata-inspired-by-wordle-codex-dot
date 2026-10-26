"""Replay selected WordNet/MCR lines and Spanish proofs from pinned raw sources.
Usage: script SPANISH_GZIP ORIGINAL_WORDNET_DIR EXPANDED_WORDNET_DIR
No network, examples import, model calls or production mutation.
"""
from pathlib import Path
import sys,json,hashlib,gzip
D=Path(__file__).resolve().parent.parent/'src/data/spanish'
read=lambda n:json.loads((D/n).read_text())
packs=[read(n)for n in ['mcr-recovery-proposals-standards.json','expanded-wordnet-proposals-v2-standards.json','expanded-wordnet-gap-subset2-standards.json']]
archive=Path(sys.argv[1]);noun=Path(sys.argv[2]);expanded=Path(sys.argv[3])
def file_sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
assert all(p['sourcePins']['supplementalSpanishArtifactSha256']==file_sha(archive)for p in packs)
assert file_sha(noun/'wn-data-spa.tab')==packs[0]['sourcePins']['mcrSha256']
mcr=set((noun/'wn-data-spa.tab').read_text().splitlines())
hashes={'data.noun':packs[0]['sourcePins']['englishNounDataSha256'],**packs[1]['sourcePins']['englishExpandedFileHashes']};english={}
for name,h in hashes.items():
 path=(noun if name=='data.noun'else expanded)/name;assert file_sha(path)==h
 english[name]={line[:8]:line for line in path.read_text().splitlines()if line[:8].isdigit()}
proofs=[];pairs=[]
for pi,p in enumerate(packs):
 for a in p['proposals']:
  if pi==0:e=a['wordnetEvidence'];name='data.noun';pos='n'
  else:e=a['sourceEvidence'];name=e['sourceFile'];pos=a.get('actualWordNetPOS',e.get('actualSynsetPOS'))
  line=english[name][a['synset'][:-2]];assert hashlib.sha256(line.encode()).hexdigest()==e['recordSha256']and line.split()[2]==pos
  assert a['synset'].endswith('-'+('a'if pos=='s'else pos))
  parts=line.split();count=int(parts[3],16);synonyms=[parts[4+2*i].replace('_',' ')for i in range(count)];assert synonyms==e['synonyms']
  definition=line.split('|',1)[1].strip();assert e['definition']in{definition,definition.split('; "',1)[0]}
  ml=a['synset']+'\tspa:lemma\t'+a['spanish'];assert ml in mcr and hashlib.sha256(ml.encode()).hexdigest()==e['spanishRecordSha256'];pairs.append((a['spanish'],a['synset']))
  proofs+=([a['wholeWordSpanishEvidence']]+a['supportingSpanishEvidence'])if pi==2 else[a['supplementalSpanishEvidence']]
assert len(set(pairs))==len(pairs)
wanted={p['recordSha256']for p in proofs};raw={}
with gzip.open(archive,'rb')as f:
 for line in f:
  h=hashlib.sha256(line).hexdigest()
  if h in wanted:assert h not in raw;raw[h]=json.loads(line)
assert set(raw)==wanted
for e in proofs:
 r=raw[e['recordSha256']];s=r['senses'][e['senseIndex']]
 assert r['lang_code']=='es'and r['word']==e['word']and r['pos']==e['partOfSpeech']and s['glosses']==e['glosses']and s.get('tags',[])==e['tags']and s.get('raw_tags',[])==e['rawTags']and r.get('tags',[])==e['wordTags']and r.get('raw_tags',[])==e['wordRawTags']
print('Exact additional mappings / Spanish records / lexical sense proofs / English files:',len(pairs),len(raw),len(proofs),len(hashes))
