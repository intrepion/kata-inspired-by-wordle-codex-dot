"""Generate doubly reviewed noun alignments and exact additional lexical mappings.
Spanish MCR: CC BY 3.0; Princeton English WordNet: included original license.
Renderings are model-reviewed derivatives, not verbatim bilingual quotations.
"""
import json,hashlib,argparse
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');p.add_argument('--audit-only',action='store_true');args=p.parse_args();root=Path(__file__).resolve().parent.parent;D=root/'src/data/spanish'
def read(name):return json.loads((D/name).read_text())
def sha(name):return hashlib.sha256((D/name).read_bytes()).hexdigest()
candidates=read('wordnet-noun-candidates.json');input_sha=sha('wordnet-noun-candidates.json');rows={(r['spanish'],r['synset']):r for r in candidates};approvals=[];hashes={}
for filename in ['wordnet-review-spec.json','wordnet-review-standards.json']:
 review=read(filename);assert review['inputSha256']==input_sha
 approved={(r['spanish'],r['synset']):r for r in review['approvedPairs']};rejected={(r['spanish'],r['synset']) for r in review['rejectedPairs']}
 assert len(approved)==len(review['approvedPairs']) and not set(approved)&rejected and set(approved)|rejected==set(rows)
 approvals.append(approved);hashes[filename]=sha(filename)
assert len({read(n)['reviewer'] for n in ['wordnet-review-spec.json','wordnet-review-standards.json']})==2
cross=read('wordnet-rendering-approval.json');assert cross['inputSha256']==sha('wordnet-rendering-cross-review.json');cross_ok={(r['spanish'],r['synset']) for r in cross['approvedPairs']};cross_rows={(r['spanish'],r['synset']):r for r in read('wordnet-rendering-cross-review.json')};assert len(cross_ok)==len(cross['approvedPairs']) and cross_ok==set(cross_rows) and not cross['rejectedPairs'];hashes['wordnet-rendering-approval.json']=sha('wordnet-rendering-approval.json')
vocab=json.loads((D/'vocabulary.ts').read_text().split(' = ',1)[1].strip().removesuffix(';'));allowed={w for v in vocab.values() for w in v['guesses']};output={};audit={}
for pair in sorted(set(approvals[0])&set(approvals[1])):
 spec,other=approvals[0][pair],approvals[1][pair];english=[e for e in spec['english'] if e in other['english']]
 if not english:
  assert pair in cross_ok;proposed=cross_rows[pair];assert proposed['proposedEnglish']==spec['english'] and all(proposed[k]==rows[pair][k] for k in ['spanish','synset','definition','recordSha256','spanishRecordSha256']);english=spec['english']
 word=pair[0].upper();assert word in allowed and 4<=len(word)<=7
 sense={'partOfSpeech':'noun','senseIndex':pair[1],'english':english,'tags':['model-reviewed aligned noun meaning',spec['notes']]}
 assert sense['english'] and all(isinstance(x,str) and x.strip() for x in sense['english'])
 output.setdefault(word,[]).append(sense);audit.setdefault(word,[]).append({'source':rows[pair],'rendering':spec,'reviewers':[read('wordnet-review-spec.json')['reviewer'],read('wordnet-review-standards.json')['reviewer']]})
from reviewed_wordnet_additions import reviewed_wordnet_additions
new_words,new_evidence,new_proof=reviewed_wordnet_additions(D,allowed,rows)
for word,senses in new_words.items():
 existing=output.setdefault(word,[])
 for sense in senses:
  assert not any(v['senseIndex']==sense['senseIndex']and v['partOfSpeech']==sense['partOfSpeech']for v in existing),'Duplicate reviewed synset'
  existing.append(sense)
 audit.setdefault(word,[]).extend(new_evidence[word])
files={f'wordnet-translations/{n}.json':{w:output[w] for w in sorted(output) if len(w)==n} for n in [4,5,6,7]};files['wordnet-translation-audit.json']={'candidateSha256':input_sha,'reviewHashes':hashes,'additionalLexicalReview':new_proof,'words':len(output),'senses':sum(map(len,output.values())),'evidence':audit}
for name,value in files.items():
 path=D/name;text=json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n'
 if args.check or (args.audit_only and not path.name.endswith('-audit.json')):assert path.read_text()==text,name
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
print('Reviewed WordNet lexical words',len(output))
