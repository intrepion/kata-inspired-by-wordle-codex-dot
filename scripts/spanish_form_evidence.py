"""Bridge reviewed Spanish grammar evidence to the guarded English renderer.
No translations are manufactured here. Verbs still need positive lexical,
subject/aspect and English inflection evidence; adjectives retain source meaning.
"""
import json,hashlib,unicodedata
from pathlib import Path
from spanish_form_descriptions import normalize
GRAMMAR={'first-person','second-person','third-person','singular','plural','present','preterite','imperfect','future','conditional','imperative','indicative','subjunctive','gerund','participle','past','infinitive','masculine','feminine','form-of'}
def spanish_form_records(data,source,allowed):
 def read(name):return json.loads((data/name).read_text())
 def sha(name):return hashlib.sha256((data/name).read_bytes()).hexdigest()
 manifest=read('spanish-form-source.json');samples=read('spanish-form-policy-samples.json');assert sha('spanish-form-policy-samples.json')==manifest['sampleSha256'];assert sha('spanish-form-targets.json')==manifest['targetSha256'];assert sha('spanish-form-evidence.json')==manifest['evidenceSha256'];assert sha('english-translation-evidence.json')==manifest['englishEvidenceSha256'];module=data.parent.parent.parent/'scripts/spanish_form_descriptions.py';assert hashlib.sha256(module.read_bytes()).hexdigest()==manifest['normalizerModuleSha256'];reviews=[];hashes={}
 for name in ['spanish-form-policy-review-spec.json','spanish-form-policy-review-standards.json']:
  review=read(name);assert review['approvedPolicy'] and review['inputSha256']==manifest['sampleSha256'] and review['parserSha256']==manifest['reviewedResearchParserSha256'] and review['researchSha256']==samples['researchSha256'];assert review['spanishArtifactSha256']==manifest['spanishArtifactSha256'] and review['englishArtifactSha256']==manifest['englishArtifactSha256'];reviews.append(review);hashes[name]=sha(name)
 assert reviews[0]['reviewer']!=reviews[1]['reviewer']
 for item in samples['samples']:assert normalize(item['pos'],item['sense'],item['lemma'])==item['normalized'],'Reviewed parser sample changed'
 integration=read('spanish-form-integration-review-standards.json');assert sha('spanish-form-integration-review-standards.json')==manifest['integrationReviewSha256'];blocked={(r['word'],r['wordRecordSha256']) for r in integration['withholdAdapterAdditions']}
 records={};input=read('spanish-form-evidence.json');assert input['spanishArtifactSha256']==manifest['spanishArtifactSha256'] and input['normalizerModuleSha256']==manifest['normalizerModuleSha256']
 for record in input['records']:
  word=unicodedata.normalize('NFC',record['word']).upper();
  if (word,record['recordSha256']) in blocked:continue
  pos=record['pos'];lemma=record['lemma'];norm=record['normalized']
  assert pos in {'verb','adj'} and word in allowed and normalize(pos,record['sense'],lemma)==norm
  if not any(r['pos']==pos for r in source['lemmas'].get(lemma,[])):continue
  usage=set(record['wordTags']+record['wordRawTags']+record['sense'].get('tags',[])+record['sense'].get('raw_tags',[]))-GRAMMAR
  if usage&{'reflexive','combined-form','negative','passive','compound'}:continue
  records.setdefault(word,[]).append({'word':record['word'],'pos':pos,'recordSha256':record['recordSha256'],'sourceArticle':lemma,'spanishForm':record,'foreignUsageTags':sorted(usage),'senses':[{'glosses':record['sense'].get('glosses',[]),'tags':norm['tags']+['form-of'],'form_of':[{'word':lemma}]}]})
 return records,{'sourceManifestSha256':sha('spanish-form-source.json'),'evidenceSha256':manifest['evidenceSha256'],'reviewHashes':hashes,'sourceWords':len(records),'integrationReviewSha256':manifest['integrationReviewSha256'],'withheldWordRecords':len(blocked),'limitations':'Reviewed recognition of source grammar, not approval of every English meaning or actual translation coverage.'}
