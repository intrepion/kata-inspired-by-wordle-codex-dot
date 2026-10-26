"""Direct source-bound model English meanings, not inflection authority.
No examples/media/quotations, runtime remote translation or unlicensed glosses.
Modified Spanish Wiktionary lexical data / CC-BY-SA-4.0.
"""
import json,hashlib,re
from urllib.parse import quote

def direct_spanish_meanings(data,allowed,teaching):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 base='direct-spanish-batch3-proposals.json';p=read(base);digest=sha(base);review='direct-spanish-batch3-review-spec.json';r=read(review)
 metadata_name='direct-spanish-batch3-metadata-review-standards.json';metadata=read(metadata_name);assert metadata['originalProposalSha256']==digest and metadata['genderPolicy']['approved']
 assert p['reviewer']!=r['reviewer'] and r['inputSha256']==digest
 assert p['sourcePins']['spanishArtifactSha256']==read('spanish-derived-source.json')['artifactSha256'] and p['sourcePins']['dataLicense']=='CC-BY-SA-4.0'
 def key(x):
  s=x.get('source',x);return (x['word'],x['partOfSpeech'],s['recordSha256'],x['senseIndex'])
 def approve(proposal,review):
  yes={key(x):x for x in review['approved']};no={key(x)for x in review['held']};keys={key(x)for x in proposal['proposals']}
  assert len(yes)==len(review['approved'])and not set(yes)&no and set(yes)|no==keys
  out=[]
  for a in proposal['proposals']:
   if key(a)not in yes:continue
   b=yes[key(a)];assert all(a[k]==b[k]for k in ['word','partOfSpeech','sourceWord','senseIndex','english','context']);out.append((a,b))
  return out
 selected=approve(p,r);hashes={n:sha(n) for n in [base,review,metadata_name]}
 correction='direct-spanish-batch3-alezo-correction.json';cr='direct-spanish-batch3-alezo-review-spec.json';c=read(correction);q=read(cr)
 assert c['originalProposalSha256']==digest and q['inputSha256']==sha(correction) and c['reviewer']!=q['reviewer'] and c['sourcePins']==p['sourcePins']
 old=next(x for x in p['proposals']if x['word']==c['originalWord']);new=c['proposals'];assert len(new)==1 and new[0]['source']==old['source'] and key(new[0])==key(old) and old['english']==c['originalEnglish'] and any(key(x)==key(old) for x in r['held'])
 selected+=approve(c,q);hashes.update({n:sha(n)for n in [correction,cr]})
 selected=[(a,b,dict(hashes))for a,b in selected]
 next_name='direct-spanish-batch4-proposals.json'
 if (data/next_name).exists():
  next_review='direct-spanish-batch4-review-standards.json';np=read(next_name);nr=read(next_review)
  assert np['reviewer']!=nr['reviewer'] and nr['inputSha256']==sha(next_name)
  assert np['sourcePins']['spanishArtifactSha256']==p['sourcePins']['spanishArtifactSha256'] and np['sourcePins']['dataLicense']=='CC-BY-SA-4.0'
  own_hashes={n:sha(n)for n in [next_name,next_review,metadata_name]}
  selected.extend((a,b,own_hashes)for a,b in approve(np,nr));hashes.update(own_hashes)
 from additional_direct_spanish import load_additional_direct
 more_selected,more_hashes=load_additional_direct(data);selected.extend(more_selected);hashes.update(more_hashes)
 from proper_spanish_meanings import load_proper_meanings
 proper_selected,proper_hashes=load_proper_meanings(data);selected.extend(proper_selected);hashes.update(proper_hashes)
 from reviewed_direct_batch6 import load_direct_batch6
 batch6_selected,batch6_hashes=load_direct_batch6(data);selected.extend(batch6_selected);hashes.update(batch6_hashes)
 output={};proof={}
 for a,b,own_hashes in selected:
  word=a['word'];source=a['source'];assert word in allowed and word not in teaching and word==a['sourceWord'].upper() and len(word)in[4,5,6,7]
  assert a['partOfSpeech']==source['partOfSpeech'] and source['word']==a['sourceWord'] and source['senseIndex']==a['senseIndex'] and source['glosses']
  english=a['english'];assert isinstance(english,str)and english.strip()==english and english and not re.match(r'(?i)^(?:TODO|TBD|form of |inflection of )',english)
  assert source['sourceUrl']=='https://es.wiktionary.org/wiki/'+quote(a['sourceWord'])
  inventory=source['rowTags']+source['rowRawTags']+source['tags']+source['rawTags']
  usage=[t for t in inventory if t not in {'masculine','feminine','singular','plural','countable','uncountable','masculine-and-feminine'}]
  tags=['model-translated Spanish meaning; not copied English dictionary text','selected dictionary meaning; no example sentence or further form authority','meaning context: '+a.get('displayContext',a['context'])]+['source use: '+t for t in usage]
  if word=='CORNUTO':
   m=metadata['cornuto'];assert m['recordSha256']==source['recordSha256']and m['senseIndex']==a['senseIndex']and 'completamente desusado'in source['rawTags']
   tags.append('completely obsolete; preserved in two fixed logical expressions, not an unrestricted modern adjective')
  entry={'sourceUrl':source['sourceUrl'],'sourceLinks':[],'senses':[{'partOfSpeech':a['partOfSpeech'],'senseIndex':'1','english':[english],'tags':sorted(set(tags))}]}
  entry_proof=[{'kind':'direct-model-Spanish-definition','word':word,'sourceArtifactSha256':p['sourcePins']['spanishArtifactSha256'],'source':source,'english':english,'context':a['context'],**({'runtimeContext':a['displayContext']}if a.get('displayContext')else{}),'independentReview':b,'reviewHashes':own_hashes,'suppressedUnreviewedGrammaticalInventory':[t for t in inventory if t not in usage]}]
  if word in output:
   assert word=='ESCOCIA'and a['partOfSpeech']=='name'and all(v['partOfSpeech']=='noun'for v in output[word]['senses']),'Unreviewed direct homograph collision'
   target=output[word];entry['senses'][0]['senseIndex']=str(len(target['senses'])+1);target['senses'].extend(entry['senses'])
   assert entry['sourceUrl']!=target['sourceUrl'];target['sourceLinks'].append({'label':'Spanish proper-name meaning','url':entry['sourceUrl']});proof[word].extend(entry_proof)
  else:output[word]=entry;proof[word]=entry_proof
 return output,proof,{'words':len(output),'reviewHashes':hashes,'limitations':'Selected exact lexical meanings only; no further morphology or examples. Original source grammar retained in audit, not certified as correct. Model-authored and independently model-reviewed, not native/human certification.'}
