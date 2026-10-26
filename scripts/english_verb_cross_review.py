"""Explicit second-author approval of a prior selected sense/frame proposal.
Different earlier meanings remain archival; their notes never join this reading.
"""
import json,hashlib
from english_additional_verbs import sense_key

def cross_reviewed_frames(data,source,batch=1):
 prefix='english-verb-cross'+(f'-{batch}'if batch!=1 else '')
 base_prefix='english-additional-verb'+(f'-{batch}'if batch!=1 else '')
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 inputs=read(prefix+'-candidates.json');review=read(prefix+'-review.json');assert review['inputSha256']==sha(prefix+'-candidates.json')
 base=read(base_prefix+'-candidates.json');assert inputs['candidateSha256']==sha(base_prefix+'-candidates.json');roots={r['spanish']:r for r in base['roots']}
 spec=read(base_prefix+'-review-spec.json');standards=read(base_prefix+'-review-standards.json');assert spec['inputSha256']==standards['inputSha256']==sha(base_prefix+'-candidates.json');assert inputs['proposedReviewSha256']==sha(base_prefix+'-review-spec.json') and inputs['otherReviewSha256']==sha(base_prefix+'-review-standards.json');assert review['reviewer']==standards['reviewer'] and review['reviewer']!=spec['reviewer']
 proposals={r['spanish']:r for r in spec['approved']};older={r['spanish']:r for r in standards['approved']};catalogue={r['source']['spanish']:r for r in inputs['roots']};yes={r['spanish']:r for r in review['approved']};no={r['spanish'] for r in review['rejected']};assert len(catalogue)==len(inputs['roots']) and len(yes)==len(review['approved']) and len(no)==len(review['rejected']) and not set(yes)&no and set(yes)|no==set(catalogue)
 for lemma,row in catalogue.items():assert row['source']==roots[lemma] and row['proposed']==proposals[lemma] and row['priorOtherReview']==older[lemma]
 frames={}
 for lemma,approval in yes.items():
  p=proposals[lemma];assert not lemma.endswith('se');assert set(approval['aspectModes'])<=set(p['aspectModes']);sense=roots[lemma]['englishMeanings'][p['meaningIndex']];assert sense['recordSha256']==p['recordSha256'];key=sense_key({k:v for k,v in sense.items() if k!='recordSha256'})
  assert any(row['recordSha256']==p['recordSha256'] and any(sense_key(s)==key for s in row['senses']) for row in source['lemmas'].get(lemma,[]) if row['pos']=='verb')
  frames[lemma,p['recordSha256'],key]={'frame':p['frame'],'profile':p['profile'],'aspectModes':set(approval['aspectModes']),'context':p['context'],'notes':[p['notes'],approval['notes']],'meaningIndex':p['meaningIndex']}
 hashes={n:sha(n) for n in [prefix+'-candidates.json',prefix+'-review.json',base_prefix+'-review-spec.json']}
 return frames,{'reviewHashes':hashes,'approvedExactSenseFrames':len(frames),'limitations':'Exact proposed sense only, second-author approval; differing prior other-review notes stay archival. Unverified qualified English past/participle overrides remain withheld.'}
