"""Closed 28 function-word readings for 27 spellings / CC BY-SA 4.0.
Sanitized lexical extracts only. No generic lemma, number or accent inference.
"""
import json,hashlib

def load_function_words(data,source):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 pins={
 'function-word-proposals-sanitized-v2-spec.json':'3455b20d6a21707b71129658d3e964a0db31dd2f4beca0e40bcbfdf2907c8d6d',
 'function-word-sanitization-manifest-spec.json':'5252024b75dfff3d356213496a4ff6a66f2927d2e62de3700e0f3a0833f59324',
 'function-word-sanitization-v2-delta-spec.json':'479677c668729def29d50ab9ca680579d617daf2872437a31009c8a27e9a56c7',
 'function-word-review-standards.json':'37faad93f86394d4da5e9f0b64338a041831892953f7dd5c18c06c864a9a103c',
 'function-word-sanitization-review-standards.json':'03c136b19d13c61f29e97782ca94526e9f0ca374379490221d3ffc84fdc81e82',
 'function-word-sanitization-v2-review-standards.json':'ff75e5176a4646183c228ca46b41ac8501bc291f620c9bfb22a8a56fc063b925'}
 for n,h in pins.items():assert sha(n)==h
 p=read('function-word-proposals-sanitized-v2-spec.json');r=read('function-word-review-standards.json');s=read('function-word-sanitization-review-standards.json');v=read('function-word-sanitization-v2-review-standards.json');m=read('function-word-sanitization-manifest-spec.json');d=read('function-word-sanitization-v2-delta-spec.json')
 assert sha('english-translation-evidence.json')==p['sourcePins']['englishEvidenceSha256']and read('spanish-derived-source.json')['artifactSha256']==p['sourcePins']['spanishRawArtifactSha256']
 assert r['inputSha256']==p['sanitization']['originalSha256']==m['originalSha256']and s['all28OriginalSemanticsAndContextsUnchanged']and s['all28ChildOnlyRuntimeGrammarApproved']
 assert v['approved']and v['readyForProductionUnderOriginalGuards']and v['inputSha256']==pins['function-word-proposals-sanitized-v2-spec.json']and v['baseSanitizationReviewSha256']==pins['function-word-sanitization-review-standards.json']and v['originalSemanticReviewSha256']==pins['function-word-review-standards.json']
 assert d['derivative']['sha256']==v['inputSha256']and d['baseDerivative']['sha256']==s['inputSha256']and v['deltaManifestSha256']==pins['function-word-sanitization-v2-delta-spec.json']
 assert p['heldAnalyses']==r['held']and {x['recordIndex']for x in p['heldAnalyses']}=={16,18,20}
 approvals={x['recordIndex']:x for x in r['approved']};display={x['recordIndex']:x for x in s['approvedPresentation']};display[2]=v['correctedPresentation']
 assert len(approvals)==len(p['proposals'])==28
 out={};proofs={}
 for a in p['proposals']:
  b=approvals[a['recordIndex']];src=a['source'];g=a['runtimeGrammar']
  for k in ['word','partOfSpeech','english','context']:assert a[k]==b[k]
  assert a['displayContext']==display[a['recordIndex']]['displayContext']
  assert a['partOfSpeech']in {'det','pron'}and g['partOfSpeech']==a['partOfSpeech']
  wr=next(r for r in source['acceptedRecords'][a['word']]if r['recordSha256']==b['wordRecordSha256']);lr=next(r for r in source['lemmas'][src['lemma']]if r['recordSha256']==b['lemmaRecordSha256'])
  # Projected senses retain ORIGINAL indices; array positions are not source IDs.
  for full,projected,index,selected in [(wr,src['wordRecord'],src['senseIndex'],src['formSense']),(lr,src['lemmaRecord'],src['lemmaSenseIndex'],src['lemmaSense'])]:
   assert {k:full[k]for k in ['word','pos','recordSha256']}=={k:projected[k]for k in ['word','pos','recordSha256']}
   projected_sense=next(x for x in projected['senses']if x['sourceSenseIndex']==index)
   actual={k:full['senses'][index][k]for k in ['glosses','tags','raw_tags','form_of','alt_of']if k in full['senses'][index]}
   assert selected==actual and projected_sense=={'sourceSenseIndex':index,**actual}
  tags=src['formSense'].get('tags',[]);numbers=[n for n in ['singular','plural']if n in tags];genders=[n for n in ['feminine','masculine','neuter']if n in tags]
  assert numbers==[g['number']]and genders==([g['gender']]if g['gender']else [])
  runtime={'partOfSpeech':a['partOfSpeech'],'senseIndex':str(len(out.get(a['word'],{}).get('senses',[]))+1),'english':[a['english']],'tags':['reviewed grammatical reading',g['number']]+([g['gender']]if g['gender']else [])+['meaning context: '+a['displayContext']]}
  target=out.setdefault(a['word'],{'sourceUrl':src['sourceUrl'],'senses':[],'sourceLinks':[]});target['senses'].append(runtime)
  link={'label':'English Wiktionary selected base meaning','url':src['lemmaSourceUrl']}
  if link not in target['sourceLinks']:target['sourceLinks'].append(link)
  proofs.setdefault(a['word'],[]).append({'kind':'exact-reviewed-function-word','reviewHashes':pins,'selection':a})
 assert len(out)==27
 proof={'reviewHashes':pins,'words':sorted(out),'readings':28,'holds':p['heldAnalyses'],'scope':'Closed reviewed form-specific English readings and child grammar; sanitized lexical source extracts. No generic grammar inference, examples, human certification or fresh full English archive replay.'}
 return out,proofs,proof
