"""Read-only source projection replay without the quote-bearing research payload.
Usage: PYTHONDONTWRITEBYTECODE=1 python3 SCRIPT V2_JSON V1_MANIFEST_JSON V2_DELTA_JSON ENGLISH_EVIDENCE_JSON SPANISH_JSONL_GZ SEMANTIC_REVIEW_JSON V2_APPROVAL_JSON
Reverses the one pinned display delta in memory to verify v1 origin; no v1 payload or quote-bearing original is needed.
"""
import json,pathlib,sys,hashlib,gzip
from urllib.parse import quote
sp,mp,dp,ep,archive,rp,vp=map(pathlib.Path,sys.argv[1:]);sha=lambda b:hashlib.sha256(b).hexdigest();s=json.loads(sp.read_text());m=json.loads(mp.read_text());d=json.loads(dp.read_text());e=json.loads(ep.read_text());review=json.loads(rp.read_text());v=json.loads(vp.read_text())
assert sha(sp.read_bytes())=="3455b20d6a21707b71129658d3e964a0db31dd2f4beca0e40bcbfdf2907c8d6d"
assert sha(mp.read_bytes())=="5252024b75dfff3d356213496a4ff6a66f2927d2e62de3700e0f3a0833f59324"
assert sha(dp.read_bytes())=="479677c668729def29d50ab9ca680579d617daf2872437a31009c8a27e9a56c7"
assert sha(vp.read_bytes())=="ff75e5176a4646183c228ca46b41ac8501bc291f620c9bfb22a8a56fc063b925"
assert v['approved']and v['inputSha256']==d['derivative']['sha256']==sha(sp.read_bytes())and v['deltaManifestSha256']==sha(dp.read_bytes())
assert len(d['changes'])==1;change=d['changes'][0];assert change['pointer']=='/proposals/2/displayContext'and change['word']=='CUALES'and change['recordIndex']==2
assert s['proposals'][2]['recordIndex']==2 and s['proposals'][2]['word']=='CUALES'and s['proposals'][2]['displayContext']==change['after']==v['correctedPresentation']['displayContext']
new=json.dumps(change['after'],ensure_ascii=False).encode();previous=json.dumps(change['before'],ensure_ascii=False).encode();assert sp.read_bytes().count(new)==1
base=sp.read_bytes().replace(new,previous);assert sha(base)==d['baseDerivative']['sha256']==m['derivativeSha256']
assert sha(rp.read_bytes())==m['semanticReviewSha256']==s['sanitization']['semanticReviewSha256'];assert review['inputSha256']==m['originalSha256']==s['sanitization']['originalSha256'];assert sha(ep.read_bytes())==s['sourcePins']['englishEvidenceSha256']
assert d['fieldPolicy']==m['fieldPolicy']and d['spanishRecordDecisions']==m['spanishRecordDecisions']and d['dropCounts']==m['dropCounts']

rowkeys=['word','pos','pos_title','lang_code','lang','tags','raw_tags'];sensekeys=['glosses','tags','raw_tags','sense_index','form_of'];erow=['word','pos','recordSha256'];esense=['glosses','tags','raw_tags','form_of','alt_of'];assert m['fieldPolicy']['spanishRowWhitelist']==rowkeys and m['fieldPolicy']['spanishSenseWhitelist']==sensekeys and m['fieldPolicy']['englishRowWhitelist']==erow and m['fieldPolicy']['englishSenseWhitelist']==esense
selected={d['recordSha256']:d for d in m['spanishRecordDecisions']if d['selectedSenseIndices']};assert len(selected)==27 and len(m['spanishRecordDecisions'])==29;projected={};approvals={a['recordIndex']:a for a in review['approved']};assert len(approvals)==28
for a in s['proposals']:
 b=approvals[a['recordIndex']];src=a['source']
 for k in ['word','partOfSpeech','english','context']:assert a[k]==b[k]
 assert src['wordRecord']['recordSha256']==b['wordRecordSha256']and src['senseIndex']==b['wordSenseIndex']and src['lemmaRecordSha256']==b['lemmaRecordSha256']and src['lemmaSenseIndex']==b['lemmaSenseIndex']and src['lemma']==b['lemma']
 fullword=next(r for r in e['acceptedRecords'][a['word']]if r['recordSha256']==b['wordRecordSha256']);fulllemma=next(r for r in e['lemmas'][src['lemma']]if r['recordSha256']==src['lemmaRecordSha256'])
 for full,out,index,chosen in [(fullword,src['wordRecord'],src['senseIndex'],src['formSense']),(fulllemma,src['lemmaRecord'],src['lemmaSenseIndex'],src['lemmaSense'])]:
  extract={k:full[k]for k in erow};sense={k:full['senses'][index][k]for k in esense if k in full['senses'][index]};extract['senses']=[{'sourceSenseIndex':index,**sense}];assert extract==out and sense==chosen
 tags=src['formSense'].get('tags',[]);numbers=[v for v in ['singular','plural']if v in tags];genders=[v for v in ['feminine','masculine','neuter']if v in tags];assert len(numbers)==1 and len(genders)<=1;assert a['runtimeGrammar']=={'partOfSpeech':a['partOfSpeech'],'number':numbers[0],'gender':genders[0]if genders else None,'provenance':'Exact selected child sense tags; never union lemma gender/number tags.'}
 for c in a['spanishCorroboration']:
  h=c['recordSha256'];assert h in selected
  if h in projected:assert projected[h]==c
  projected[h]=c
assert set(projected)==set(selected);h=hashlib.sha256()
with archive.open('rb')as f:
 for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
assert h.hexdigest()==s['sourcePins']['spanishRawArtifactSha256'];found={}
with gzip.open(archive,'rb')as f:
 for line in f:
  d=sha(line)
  if d in selected:found[d]=json.loads(line)
assert set(found)==set(selected)
for h,d in selected.items():
 full=found[h];assert full['lang_code']=='es'and full['word']==d['word']and full['pos']==d['partOfSpeech'];out={k:full[k]for k in rowkeys if k in full};out['senses']=[{'sourceSenseIndex':i,**{k:full['senses'][i][k]for k in sensekeys if k in full['senses'][i]}}for i in d['selectedSenseIndices']];assert projected[h]=={'recordSha256':h,'sourceUrl':'https://es.wiktionary.org/wiki/'+quote(full['word']),'record':out}
assert s['heldAnalyses']==review['held'];assert{a['recordIndex']for a in s['proposals']}|{a['recordIndex']for a in s['heldAnalyses']}==set(range(31))
forbidden={'examples','example','quotations','quotes','sounds','audio','image','images','etymology_texts','etymology_links','translations','synonyms','related','idioms','proverbs','forms','hyphenations','antonyms','categories'}
def check(v):
 if isinstance(v,dict):
  assert not set(v)&forbidden,set(v)&forbidden
  for x in v.values():check(x)
 elif isinstance(v,list):
  for x in v:check(x)
for a in s['proposals']:check(a['source']);check(a['spanishCorroboration'])
a=next(a for a in s['proposals']if a['recordIndex']==29);assert a['english']=='these ones'and a['source']['lemmaSense']['glosses']==['this one']and a['source']['formSense']['form_of'][0]['extra']=='those ones';assert a['sourceCorrection']==m['estasCorrection'];assert any(c['recordSha256']==a['sourceCorrection']['spanishRecordSha256']and c['record']['senses'][0]['glosses']==['Forma del femenino plural de este.']for c in a['spanishCorroboration'])
print(json.dumps({'retainedEnglishPairsVerified':28,'keptSpanishRawRecordsReplayed':len(found),'originalSemanticFieldsUnchanged':28,'heldAnalysesPreserved':3,'forbiddenQuoteMediaPayloadAbsent':True,'childOnlyRuntimeGrammarVerified':28,'rawLineHashVersusProjectedBytesDistinguished':True,'noOriginalResearchPayloadRequired':True,'v2DisplayDeltaAndApprovalVerified':True,'noV1PayloadRequired':True}))
