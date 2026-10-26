"""Validate each frozen Spanish semantic/grammar batch before compilation.
Modified Wiktionary evidence / CC-BY-SA-4.0; original English model translations.
"""
import json,hashlib,re,unicodedata
from spanish_form_descriptions import normalize

def load_reviewed_spanish_batch(D,R,batch=1):
 prefix='spanish-derived'+(f'-{batch}' if batch!=1 else '')
 def read(n):return json.loads((D/n).read_text())
 def sha(n):return hashlib.sha256((D/n).read_bytes()).hexdigest()
 manifest=read(prefix+'-source.json');candidates=read(prefix+'-candidates.json');evidence=read(prefix+'-evidence.json');grammar=read('spanish-form-source.json');assert manifest['candidateSha256']==sha(prefix+'-candidates.json')==evidence['candidateSha256'];assert manifest['evidenceSha256']==sha(prefix+'-evidence.json');assert manifest['artifactSha256']==evidence['artifactSha256']==candidates['spanishArtifactSha256']==grammar['spanishArtifactSha256'];assert manifest['grammarPolicySourceSha256']==sha('spanish-form-source.json');assert manifest['normalizerSha256']==hashlib.sha256((R/'scripts/spanish_form_descriptions.py').read_bytes()).hexdigest()==grammar['normalizerModuleSha256'];samples=read('spanish-form-policy-samples.json');assert sha('spanish-form-policy-samples.json')==grammar['sampleSha256']
 grammar_reviews=[]
 for n in ['spanish-form-policy-review-spec.json','spanish-form-policy-review-standards.json']:
  review=read(n);assert review['approvedPolicy'] and review['inputSha256']==grammar['sampleSha256'] and review['parserSha256']==grammar['reviewedResearchParserSha256'] and review['researchSha256']==samples['researchSha256'] and review['spanishArtifactSha256']==manifest['artifactSha256'];grammar_reviews.append(review['reviewer'])
 assert len(set(grammar_reviews))==2
 for sample in samples['samples']:assert normalize(sample['pos'],sample['sense'],sample['lemma'])==sample['normalized']
 roots={(r['spanish'],r['partOfSpeech']):r for r in candidates['roots']};reviews=[];review_hashes={}
 for role in ['spec','standards']:
  name=f'{prefix}-review-{role}.json';review=read(name);assert review['inputSha256']==sha(prefix+'-candidates.json');yes={(r['spanish'],r['partOfSpeech']):r for r in review['approved']};no={(r['spanish'],r['partOfSpeech']) for r in review['rejected']};assert len(yes)==len(review['approved']) and len(no)==len(review['rejected']) and not set(yes)&no and set(yes)|no==set(roots);reviews.append((review['reviewer'],yes));review_hashes[name]=sha(name)
 assert reviews[0][0]!=reviews[1][0];merged=read(prefix+'-dual-approval.json');assert merged['candidateSha256']==sha(prefix+'-candidates.json')
 for role in ['spec','standards']:assert merged['reviewHashes'][f'spanish-only-lemma-review-{role}-{batch}.json']==review_hashes[f'{prefix}-review-{role}.json']
 profiles={}
 for r in merged['approved']:
  key=(r['spanish'],r['partOfSpeech']);assert key not in profiles and not key[0].endswith('se');a,b=[rs[1][key] for rs in reviews]
  for field in ['recordSha256','senseIndex','frame','profile']:assert r[field]==a[field]==b[field]
  assert isinstance(r['frame'],str) and r['frame'].strip()==r['frame'] and r['frame'] and unicodedata.normalize('NFC',r['frame'])==r['frame'] and not re.fullmatch(r'(?i)(?:TODO|TBD|translation unavailable|untranslated|form of|inflection of|no definition)',r['frame'])
  assert r['partOfSpeech']!='verb' or (not r['frame'].startswith('to ') and re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*",r['frame'].split(' ',1)[0]))
  assert set(r['aspectModes'])==set(a['aspectModes'])&set(b['aspectModes']) and set(r['aspectModes'])<={'progressive','state-past'} and r['profile'] in {'ordinary','it-only'}
  row=next(x for x in roots[key]['spanishMeanings'] if x['recordSha256']==r['recordSha256']);sense=row['senses'][r['senseIndex']];assert sense.get('glosses');profiles[key]={**r,'sourceRow':row,'sourceSense':sense,'reviewBatch':batch}
 assert len(profiles)==len(merged['approved'])
 return profiles,evidence['forms'],{'batch':batch,'sourceManifestSha256':sha(prefix+'-source.json'),'candidateSha256':sha(prefix+'-candidates.json'),'reviewHashes':review_hashes,'dualApprovalSha256':sha(prefix+'-dual-approval.json'),'approvedLexicalReadings':len(profiles)}
