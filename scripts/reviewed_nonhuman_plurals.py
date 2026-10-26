"""Fourteen exact animal/plant plural readings, never a global profile change.
Modified Wiktionary lexical evidence and model-reviewed readings / CC BY-SA 4.0.
"""
import hashlib,json

def load_nonhuman_plurals(data):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='nonhuman-plural-proposals-standards.json';p=read(name);digest=sha(name);r=read('nonhuman-plural-review-spec.json');assert r['inputSha256']==digest and p['reviewer']!=r['reviewer']
 assert p['inputHashes']['englishEvidence']==sha('english-translation-evidence.json')
 assert p['sourcePins']['englishArtifactSha256']==read('english-translation-source.json')['artifactSha256']
 assert p['sourcePins']['spanishArtifactSha256']==read('spanish-derived-source.json')['artifactSha256']
 def key(a):return(a['word'],a['lemma'])
 approvals={key(a):a for a in r['approved']};held={key(a) for a in r['held']};allkeys={key(a)for a in p['approvedProposals']}
 assert len(approvals)==len(r['approved']) and not set(approvals)&held and set(approvals)|held==allkeys
 rows={}
 for a in p['approvedProposals']:
  if key(a)not in approvals:continue
  b=approvals[key(a)];e=a['sourceEvidence']
  assert all(a[k]==b[k]for k in ['word','lemma','english','frame','features','context'])
  assert all(e[k]==b[k]for k in ['sourceEdition','lemmaRecordSha256','lemmaSenseIndex','wordRecordSha256'])
  assert a['existingProfile']=='it-only' and a['english']=='they '+a['frame']
  assert a['features']=={'kind':'finite','tense':'present','mood':'indicative','person':'third-person','number':'plural'}
  assert a['word']not in rows;rows[a['word']]=a
 proof={'candidateSha256':digest,'reviewSha256':sha('nonhuman-plural-review-spec.json'),'words':sorted(rows),'scope':'Exact present indicative plural animal/plant subjects only; no human, ustedes, command, weather or global profile permission.'}
 def resolve(edition,word,lemma,lemma_hash,lemma_sense,frame,word_hash,word_sense,features,profile):
  a=rows.get(word)
  if not a or a['sourceEvidence']['sourceEdition']!=edition or a['lemma']!=lemma or a['frame']!=frame:return None
  e=a['sourceEvidence'];assert e['lemmaRecordSha256']==lemma_hash and e['sourceSense']==lemma_sense
  # A spelling can have unrelated source senses. Only the approved complete
  # word entry/form sense may use this narrow exception.
  if e['wordRecordSha256']!=word_hash or e['sourceForm']!=word_sense:return None
  assert profile=='it-only'
  if any(features.get(k)!=v for k,v in a['features'].items() if k!='mood') or 'indicative'not in features.get('tags',[]):return None
  return {'english':[a['english']],'context':a['context'],'proof':{'candidateSha256':digest,'reviewSha256':proof['reviewSha256'],'word':word,'lemmaRecordSha256':lemma_hash,'wordRecordSha256':word_hash,'selectedSourceSense':lemma_sense,'sourceForm':word_sense,'features':a['features'],'context':a['context']}}
 return resolve,proof
