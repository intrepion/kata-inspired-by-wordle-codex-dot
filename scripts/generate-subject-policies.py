"""Reproduce restrictive subject/construction policies from frozen cross-reviews.
Source data retains per-provider terms; this compiler never adds a meaning.
"""
from pathlib import Path
import json,hashlib,argparse
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args();D=Path(__file__).resolve().parent.parent;F=D/'src/data/spanish/subject-reviews'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
entries={'english':[],'morph':[]};proofs=[];unresolved=[]
for part,role,other in [(1,'standards','spec'),(2,'spec','standards')]:
 ip=F/f'audit-{part}.json';source=json.loads(ip.read_text());rp=F/f'review-{part}.json';review=json.loads(rp.read_text());xp=F/f'cross-candidates-{part}.json';cross_input=json.loads(xp.read_text());cp=F/f'cross-review-{part}.json';cross=json.loads(cp.read_text());assert review['inputSha256']==sha(ip) and cross['inputSha256']==sha(xp) and review['reviewer']!=cross['reviewer'];catalogue={r['id']:(provider,r) for provider in ['english','morph'] for r in source[provider]};final={i:('keep','') for i in review['keep']}
 for action,name in [('it-only','restrict'),('withhold','withhold')]:
  for r in review[name]:assert r['id'] not in final;final[r['id']]=(action,r['reason'])
 assert set(final)==set(catalogue) and len(final)==len(source['english'])+len(source['morph'])
 proposals={r['source']['id']:r for r in cross_input['proposals']};approved={r['id'] for r in cross['approved']};rejected={r['id']:r for r in cross['rejected']};assert not approved&set(rejected) and approved|set(rejected)==set(proposals)
 for id,item in proposals.items():
  provider,record=catalogue[id];assert item['provider']==provider and item['source']==record
  second=item['proposedAction'] if id in approved else rejected[id]['proposedAction'];action,reason=final[id]
  if second!=action:
   # An unresolved disagreement cannot authorize a positive personal reading.
   unresolved.append(id);action='withhold';reason='Unresolved subject/context disagreement; held pending exact sense/valency evidence. '+reason+' '+rejected[id]['reason']
  if action!='it-only':continue
  assert action in {'it-only','withhold'};keys=['spanish','recordSha256','senseKey','frame'] if provider=='english' else ['spanishPrefix','englishLemma'];entries[provider].append({'id':id,**{k:record[k] for k in keys},'action':action,'reason':reason,'auditPart':part})
 proofs.append({'part':part,'inputSha256':sha(ip),'finalReviewSha256':sha(rp),'crossInputSha256':sha(xp),'crossReviewSha256':sha(cp),'reviewers':[review['reviewer'],cross['reviewer']]})
for provider in ['english','morph']:
 out={'provider':provider,'license':'CC-BY-SA-4.0' if provider=='english' else 'GPL-2.0','scope':'confirmed-literal-subject-restrictions-only','method':'Independently cross-checked literal third-person subject restrictions only. These filters never add a lexical meaning. Construction/valency withholds and unresolved cases are deferred to a separate reviewed patch, preserving existing supported clause translations. No personification or invented arguments; human operators and patients remain distinct.','englishEvidenceSha256':sha(D/'src/data/spanish/english-translation-evidence.json'),'morphSourceManifestSha256':sha(D/'src/data/spanish/morph-translation-source.json'),'reviewProofs':proofs,'unresolvedIds':unresolved,'entries':sorted(entries[provider],key=lambda r:r['id'])};raw=json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n'
 path=D/f'src/data/spanish/{provider}-subject-policy.json'
 if args.check:assert path.read_text()==raw,'Regenerate '+str(path)
 else:path.write_text(raw)
print('English policy entries',len(entries['english']),'morph entries',len(entries['morph']),'unresolved deferred to separate patch',unresolved)
