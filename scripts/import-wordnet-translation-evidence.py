"""Verify the frozen review candidate selection against pinned MCR/WordNet files.
Usage: script /path/wn-data-spa.tab /path/data.noun [--check]
The reviewed selection is deliberately frozen, not recomputed against later coverage.
"""
import argparse,json,hashlib,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('spanish',type=Path);p.add_argument('english',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args();D=Path(__file__).resolve().parent.parent/'src/data/spanish';source=json.loads((D/'wordnet-translation-source.json').read_text())
assert hashlib.sha256(args.spanish.read_bytes()).hexdigest()==source['mcrSha256'];assert hashlib.sha256(args.english.read_bytes()).hexdigest()=='489f145e0f68877c0be5bd0eb4117adaaac52f38f6204eb8d85dbe2158b614cc'
path=D/'wordnet-noun-candidates.json';chosen=json.loads(path.read_text());keys={(r['spanish'],r['synset']) for r in chosen};synsets={}
for line in args.english.read_text().splitlines():
 if not re.match(r'^\d{8} ',line):continue
 body,gloss=line.split('|',1);tokens=body.split();count=int(tokens[3],16);words=[tokens[4+2*i].replace('_',' ') for i in range(count)];i=4+2*count;np=int(tokens[i]);pointers=[tokens[i+1+4*k] for k in range(np)]
 if '@i' in pointers:continue
 synsets[tokens[0]+'-n']={'synonyms':words,'definition':gloss.strip(),'recordSha256':hashlib.sha256(line.encode()).hexdigest()}
rows=[]
for line in args.spanish.read_text().splitlines():
 if line.startswith('#'):continue
 parts=line.split('\t')
 if len(parts)!=3:continue
 synset,field,spanish=parts
 if field=='spa:lemma' and (spanish,synset) in keys and synset in synsets:rows.append({'spanish':spanish,'synset':synset,**synsets[synset],'spanishRecordSha256':hashlib.sha256(line.encode()).hexdigest()})
rows.sort(key=lambda r:(r['spanish'],r['synset']));raw=json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n';assert rows==chosen and raw==path.read_text(),'Frozen review candidates differ from source'
print('Verified',len(rows),'frozen source noun pairs')
