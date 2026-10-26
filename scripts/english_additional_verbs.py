"""Sense-bound intersection of two independent lexical reviews.
These selected readings do not authorize unreviewed senses or constructions.
"""
import hashlib,json

def sense_key(sense):
 return json.dumps({k:sense[k] for k in ['glosses','tags','raw_tags'] if k in sense},sort_keys=True,ensure_ascii=False)

def additional_verb_frames(data,source,batch=1):
 prefix='english-additional-verb'+(f'-{batch}' if batch!=1 else '')
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name=prefix+'-candidates.json';candidate=read(name);digest=sha(name);roots={r['spanish']:r for r in candidate['roots']};reviews=[];hashes={}
 for name in [prefix+'-review-spec.json',prefix+'-review-standards.json']:
  review=read(name);assert review['inputSha256']==digest
  yes={r['spanish']:r for r in review['approved']};no={r['spanish'] for r in review['rejected']}
  assert len(yes)==len(review['approved']) and len(no)==len(review['rejected']) and not set(yes)&no and set(yes)|no==set(roots)
  for lemma,r in yes.items():
   sense=roots[lemma]['englishMeanings'][r['meaningIndex']];assert r['recordSha256']==sense['recordSha256'];assert r['profile'] in {'ordinary','it-only'};assert set(r['aspectModes'])<={'progressive','state-past'}
  reviews.append((review['reviewer'],yes));hashes[name]=sha(name)
 assert reviews[0][0]!=reviews[1][0]
 merged=read(prefix+'-dual-approval.json');assert merged['candidateSha256']==digest
 for role in ['spec','standards']:assert merged['reviewHashes'][f'additional-verb-review-{role}-{batch}.json']==hashes[prefix+f'-review-{role}.json']
 authorized={r['spanish'] for r in merged['approved']};assert len(authorized)==len(merged['approved'])
 frames={};withheld=[]
 for lemma in sorted(set(reviews[0][1])&set(reviews[1][1])):
  a,b=reviews[0][1][lemma],reviews[1][1][lemma]
  # Pronominal lemmas require a separately reviewed clitic construction. Merely
  # stripping -se or translating a bare finite form would invent that context.
  if lemma not in authorized or lemma.endswith('se') or any(a.get(k)!=b.get(k) for k in ['meaningIndex','recordSha256','frame','profile','past','participle']):withheld.append(lemma);continue
  sense=roots[lemma]['englishMeanings'][a['meaningIndex']];key=sense_key({k:v for k,v in sense.items() if k!='recordSha256'})
  assert any(row['recordSha256']==a['recordSha256'] and any(sense_key(s)==key for s in row['senses']) for row in source['lemmas'].get(lemma,[]) if row['pos']=='verb')
  context='; '.join(dict.fromkeys(x['context'] for x in [a,b] if x.get('context')))
  notes=list(dict.fromkeys(x['notes'] for x in [a,b] if x.get('notes')))
  frames[(lemma,a['recordSha256'],key)]={'frame':a['frame'],'profile':a['profile'],'aspectModes':set(a['aspectModes'])&set(b['aspectModes']),'context':context,'notes':notes,'meaningIndex':a['meaningIndex']}
 reviewed={(r['spanish'],r['recordSha256'],r['meaningIndex'],r['frame'],r['profile'],tuple(sorted(r['aspectModes']))) for r in merged['approved']}
 actual={(key[0],key[1],r['meaningIndex'],r['frame'],r['profile'],tuple(sorted(r['aspectModes']))) for key,r in frames.items()};assert actual==reviewed,'Reconciled semantic registry changed'
 return frames,{'candidateSha256':digest,'dualApprovalSha256':sha(prefix+'-dual-approval.json'),'reviewHashes':hashes,'approvedExactSenseFrames':len(frames),'withheldDifferentOrPronominal':withheld,'limitations':'Only exact jointly selected senses/frames. Qualified English past/participle remain withheld by the renderer unless separately supported; no assumed clitic constructions.'}
