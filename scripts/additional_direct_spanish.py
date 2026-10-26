"""Exact lexical-only batch; modified Spanish Wiktionary / CC BY-SA 4.0.
Preserve the original DROSERA hold and separately bind its reviewed correction.
"""
import json,hashlib,copy

def load_additional_direct(data):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 pins={
  'direct-spanish-batch5-proposals.json':'53b56db05380ca5a4cda0c07e13a890201aa73f530e8f0f3e9558b37a14d5672',
  'direct-spanish-batch5-review-spec.json':'ebf462ebe3b12f9757e8c174204875032c111981dc7e32e4cbf23c2f011bc376',
  'direct-spanish-batch5-proposals-v2.json':'be82fce3b04514f27249cf1898da42630519a3b97f39d7a4e1c906507e20e92c',
  'direct-spanish-batch5-v2-delta-standards.json':'674bff1543237f38c65c80e9fbdc9ff779fd0084be51ded348dd813d9521ac10',
  'direct-spanish-batch5-v2-delta-review-spec.json':'9a5641656ffaf6e3fcb540fdb8428f5a0eaee1c929a49df5bd5b19a81734520c'}
 for n,digest in pins.items():assert sha(n)==digest
 original=read('direct-spanish-batch5-proposals.json');review=read('direct-spanish-batch5-review-spec.json');updated=read('direct-spanish-batch5-proposals-v2.json');delta=read('direct-spanish-batch5-v2-delta-review-spec.json')
 assert review['inputSha256']==pins['direct-spanish-batch5-proposals.json']and original['reviewer']!=review['reviewer']
 assert delta['inputSha256']==pins['direct-spanish-batch5-proposals-v2.json']and delta['approved']and delta['reviewer']==review['reviewer']
 assert delta['originalCandidateSha256']==review['inputSha256']and delta['originalSemanticReviewSha256']==pins['direct-spanish-batch5-review-spec.json']and delta['firstAuthorDeltaSha256']==pins['direct-spanish-batch5-v2-delta-standards.json']
 assert original['sourcePins']['dataLicense']=='CC-BY-SA-4.0'and original['sourcePins']['spanishArtifactSha256']==read('spanish-derived-source.json')['artifactSha256']
 corrected=delta['correctedApproval'];index=corrected['proposalIndex'];assert index==47 and corrected['word']=='DROSERA'
 expected=copy.deepcopy(original);expected['proposals'][index]['context']=corrected['context'];assert expected==updated
 assert delta['changedJSONPointers']==['/proposals/47/context']and delta['allOtherBytesUnchanged']
 assert len(original['proposals'])==66 and len(review['approved'])==65 and len(review['held'])==1 and review['held'][0]['word']=='DROSERA'
 selections=[]
 for approval in review['approved']+[corrected]:
  a=updated['proposals'][approval['proposalIndex']]
  for k in ['word','partOfSpeech','sourceWord','senseIndex','english','context']:assert a[k]==approval[k]
  assert a['source']['recordSha256']==approval['recordSha256']
  selections.append((a,approval,dict(pins)))
 assert len({a['word']for a,_,_ in selections})==66
 return selections,pins
