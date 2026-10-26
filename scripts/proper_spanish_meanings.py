"""Closed source-bound named meanings, not identity or inflection fallback.
Modified Spanish Wiktionary data / CC BY-SA 4.0; model-reviewed English text.
"""
import json,hashlib

def load_proper_meanings(data):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='proper-name-lexical-proposals-spec.json';review='proper-name-lexical-review-standards.json'
 hashes={name:sha(name),review:sha(review)}
 assert hashes[name]=='eb528897c26d570deb9bd45459af53630a9ee2ee826b9cf346273c44bd424ea6'
 assert hashes[review]=='becc29e5d9a4b125c39b89e1bfe8aa121306bf2b42f8571a5c78824715ebc4f9'
 display_name='proper-name-display-review-standards.json';display_hash=sha(display_name);assert display_hash=='df788604278921c1ace467f688b894560f103c747b61616b107c7899c5ac9487'
 display=read(display_name);assert display['approved']and display['word']=='ESCOCIA'and display['sourceProposalSha256']==hashes[name]
 p=read(name);r=read(review);assert r['inputSha256']==hashes[name]and p['reviewer']!=r['reviewer']
 assert p['sourcePins']['license']=='CC-BY-SA-4.0'and p['sourcePins']['spanishArtifactSha256']==read('spanish-derived-source.json')['artifactSha256']
 assert len(p['proposals'])==len(r['approved'])==27 and not r['held']
 out=[]
 for approval in r['approved']:
  a=p['proposals'][approval['proposalIndex']]
  assert a['partOfSpeech']=='name'and a['sourceWord'][0].isupper()and a['sourceCapitalizationPreserved']
  for key in ['word','partOfSpeech','sourceWord','senseIndex','english','context']:assert a[key]==approval[key]
  assert a['source']['recordSha256']==approval['recordSha256']
  own_hashes=dict(hashes)
  if a['word']=='ESCOCIA':
   # Keep audit/review bookkeeping in the proof, not the player's meaning.
   assert display['sourceRecordSha256']==a['source']['recordSha256']and display['originalReviewedContext']==a['context']
   assert display['approvedDisplayContext']=='The nation in northern Great Britain; escocia also names an architectural moulding.'
   a={**a,'displayContext':display['approvedDisplayContext']};own_hashes[display_name]=display_hash
  out.append((a,approval,own_hashes))
 assert len({a['word']for a,_,_ in out})==27
 return out,{**hashes,display_name:display_hash}
