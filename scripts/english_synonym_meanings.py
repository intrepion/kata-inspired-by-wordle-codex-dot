"""Source-bound, independently cross-reviewed lexical synonym meanings.
No generic Spanish synonym string, target-sense expansion or finite authorization.
Modified Wiktionary data / CC-BY-SA-4.0; reviewer language is not certification.
"""
from pathlib import Path
from urllib.parse import quote
import json,hashlib
TARGET_GRAMMAR={"masculine","feminine","neuter","common-gender","singular","plural","dual","invariable","invariant","countable","uncountable","singulare-tantum","plurale-tantum","m","f","n"}

def selected_synonym_meanings(data,source,allowed,reviewed):
 def raw(n):return (data/n).read_bytes()
 def sha(n):return hashlib.sha256(raw(n)).hexdigest()
 def read(n):return json.loads(raw(n))
 manifest=read('english-synonym-source.json');candidate=read('english-synonym-candidates.json');digest=sha('english-synonym-candidates.json');english=read('english-translation-source.json')
 assert manifest['candidateSha256']==digest and manifest['artifactSha256']==candidate['artifactSha256']==english['artifactSha256']
 cases=candidate['cases'];reviews={};hashes={}
 for role in ['root','standards']:
  name=f'english-synonym-review-{role}.json';r=read(name);assert r['inputSha256']==digest
  yes={x['caseIndex']:x for x in r['approved']};no={x['caseIndex'] for x in r['rejected']};assert len(yes)==len(r['approved']) and len(no)==len(r['rejected']) and not set(yes)&no and set(yes)|no==set(range(len(cases)))
  reviews[role]=(r,yes);hashes[name]=sha(name)
 assert reviews['root'][0]['reviewer']!=reviews['standards'][0]['reviewer']
 followup=read('english-synonym-review-standards-measures.json');assert followup['inputSha256']==digest and followup['originalReviewSha256']==hashes['english-synonym-review-standards.json'] and followup['reviewer']==reviews['standards'][0]['reviewer']
 assert {r['caseIndex'] for r in followup['approved']}=={12,38}
 standards=dict(reviews['standards'][1]);standards.update({r['caseIndex']:r for r in followup['approved']});hashes['english-synonym-review-standards-measures.json']=sha('english-synonym-review-standards-measures.json')
 cross=read('english-synonym-cross-approval.json');assert cross['inputSha256']==digest and cross['reviewer']==reviews['root'][0]['reviewer']
 assert cross['reviewHashes']==hashes
 selected={r['caseIndex']:r for r in cross['approved']};withheld={r['caseIndex']for r in cross['withheld']};assert len(selected)==len(cross['approved']) and not set(selected)&withheld and set(selected)|withheld==set(range(len(cases)))
 context=read('english-synonym-spanish-context.json');assert manifest['spanishContextSha256']==sha('english-synonym-spanish-context.json') and context['artifactSha256']==read('spanish-form-source.json')['spanishArtifactSha256'];selection=manifest['spanishContextSelection'];assert selection['word']=='copino'and selection['partOfSpeech']=='noun';context_row=next(row for row in context['records']if row['word']==selection['word']and row['pos']==selection['partOfSpeech']and row['recordSha256']==selection['recordSha256']);assert context_row['senses'][selection['senseIndex']]['glosses']==selection['glosses'];assert any('localidad'in g for g in selection['glosses'])
 fields=['caseIndex','word','sourceRecordSha256','targetRecordSha256','targetSenseIndex','english','profile','aspectModes','context','notes'];output={};proof={}
 for i,r in sorted(selected.items()):
  assert i in reviews['root'][1] and i in standards and r['originalRootSelection']==reviews['root'][1][i]
  assert all(r[k]==standards[i][k]for k in fields);x=cases[i];word=x['word'];row=x['row'];sense=x['sense'];assert r['word']==word and r['sourceRecordSha256']==row['recordSha256']
  assert row in source['acceptedRecords'].get(word,[]) and sense in row['senses']
  assert not sense.get('form_of') and not sense.get('alt_of') and '; '.join(sense.get('glosses',[])).startswith('synonym of ')
  assert isinstance(r['english'],str)and r['english'].strip()==r['english']and r['english']and not r['english'].lower().startswith(('synonym of ','form of ','inflection of '))
  assert r['profile']in {'ordinary','it-only'} and r['aspectModes']==[]
  target=None;target_sense=None
  if r['targetRecordSha256']:
   target=next(v for v in x['targetRows']if v['recordSha256']==r['targetRecordSha256']);assert target['pos']==row['pos'];target_sense=target['senses'][r['targetSenseIndex']];assert target_sense.get('glosses')and not target_sense.get('form_of')and not target_sense.get('alt_of')
  else:assert r['targetSenseIndex']is None
  if word not in allowed or word in reviewed:continue
  tags=set(sense.get('tags',[])+sense.get('raw_tags',[])+['selected source-linked synonym meaning','independently model-reviewed lexical selection; not a complete sentence'])
  # Gender/number/countability describe the target spelling, not this synonym.
  # Keep the complete target sense in the audit; inherit only usage qualifiers.
  if target_sense:tags.update(t for t in target_sense.get('tags',[])+target_sense.get('raw_tags',[])if t not in TARGET_GRAMMAR)
  tags.add('meaning context: '+r['context'])
  if i==12:tags.add('capacity varies by locality; selected approximate historical measure')
  url='https://en.wiktionary.org/wiki/'+quote(row['word'])+'#Spanish';entry=output.setdefault(word,{'sourceUrl':url,'senses':[]});links=entry.setdefault('sourceLinks',[])
  if target:
   link={'label':'English synonym meaning','url':'https://en.wiktionary.org/wiki/'+quote(target['word'])+'#Spanish'}
   if link not in links:links.append(link)
  if i==12:links.append({'label':'Spanish measure context','url':'https://es.wiktionary.org/wiki/copino'})
  entry['senses'].append({'partOfSpeech':row['pos'],'senseIndex':str(len(entry['senses'])+1),'english':[r['english']],'tags':sorted(tags)})
  proof.setdefault(word,[]).append({'kind':'reviewed-synonym-meaning','caseIndex':i,'wordRecordSha256':row['recordSha256'],'sourceGlosses':sense['glosses'],'sourceTags':sense.get('tags',[]),'targetRecord':target,'targetSenseIndex':r['targetSenseIndex'],'english':r['english'],'context':r['context'],'candidateSha256':digest,'crossReviewSha256':sha('english-synonym-cross-approval.json'),'reviewHashes':hashes,'spanishContextSha256':manifest['spanishContextSha256']if i==12 else None})
 return output,proof,{'words':len(output),'approvedCases':len(selected),'candidateSha256':digest,'crossReviewSha256':sha('english-synonym-cross-approval.json'),'reviewHashes':hashes,'scope':'Lexical surface meanings only, no finite-form authority or unreviewed target-sense propagation.'}
