"""Second reviewed accusative batch; exact whole source senses, not suffix inference.
Modified Wiktionary data / CC-BY-SA-4.0. Independent reviews and original
first-author chronology stay distinct. No examples are generated here.
"""
import json,hashlib,re
from urllib.parse import quote
DIRECT={'lo':'it','la':'it','los':'them','las':'them'}
def additional_accusative_forms(data,source,allowed,reviewed,features_for,finite):
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 def read(n):return json.loads((data/n).read_text())
 name='additional-accusative-proposals.json';proposal=read(name);digest=sha(name)
 pins=proposal['sourcePins'];assert pins['manifestSha256']==sha('english-translation-source.json') and pins['evidenceSha256']==sha('english-translation-evidence.json') and pins['englishArtifactSha256']==read('english-translation-source.json')['artifactSha256']
 spec=read('additional-accusative-review-spec.json');std=read('additional-accusative-review-standards.json')
 assert spec['inputSha256']==digest and std['proposalSha256']==digest and spec['reviewer']!=std['reviewer']
 hashes={n:sha(n) for n in ['additional-accusative-proposals.json','additional-accusative-review-spec.json','additional-accusative-review-standards.json','additional-accusative-first-author.json']}
 # Research coverage was frozen before admission; it is a prioritization pin,
 # not a requirement that current coverage remain unchanged.
 def key(r):return (r['lemma'],r['word'],r['recordSha256'],r['senseIndex'])
 def unique(rows,fn):
  out={fn(r):r for r in rows};assert len(out)==len(rows);return out
 spec_templates=unique(spec['approvedTemplates'],lambda r:r['lemma'])
 spec_no_templates=unique(spec['rejectedTemplates'],lambda r:r['lemma'])
 assert not set(spec_templates)&set(spec_no_templates)
 assert set(spec_templates)|set(spec_no_templates)=={r['lemma'] for r in proposal['proposals']}
 spec_yes=unique(spec['approved'],lambda r:r['recordIndex']);spec_no=unique(spec['rejected'],lambda r:r['recordIndex'])
 std_yes=unique(std['approvedWordKeys'],key);std_no=unique(std['rejectedWordKeys'],key)
 assert not set(spec_yes)&set(spec_no) and not set(std_yes)&set(std_no)
 input={'records':[]};templates={};allkeys=set();n=0
 for pi,p in enumerate(proposal['proposals']):
  lemma=p['lemma'];row=p['sourceRow'];sense=p['sourceSense'];assert row in source['lemmas'][lemma] and row['recordSha256']==p['recordSha256'] and row['pos']=='verb' and row['senses'][p['senseIndex']]==sense
  assert sense.get('glosses') and not sense.get('form_of') and not sense.get('alt_of')
  if lemma in spec_templates:
   t=spec_templates[lemma];assert all(t[k]==p[k] for k in ['template','recordSha256','senseIndex','context']);assert p['template'].count('{direct}')==1
   templates[lemma]=({'template':p['template'],'senseIndex':p['senseIndex'],'context':p['context']},row,sense)
  for r in p['records']:
   raw=r['source'];si=r['senseIndex'];assert raw in source['acceptedRecords'][r['word']] and raw['senses'][si]==r['sense'] and r['lemma']==lemma
   k=(lemma,r['word'],raw['recordSha256'],si);assert k not in allkeys;allkeys.add(k)
   if n in spec_yes:
    a=spec_yes[n];assert a['proposalIndex']==pi and key(a)==k and a['context']==p['context']
   input['records'].append(r);n+=1
 assert set(spec_yes)|set(spec_no)==set(range(n)) and set(std_yes)|set(std_no)==allkeys
 # Normalize only after verifying both independently authored full identities.
 yes={i:{'word':r['word'],'lemma':r['lemma'],'recordSha256':r['source']['recordSha256']} for i,r in enumerate(input['records']) if i in spec_yes and (r['lemma'],r['word'],r['source']['recordSha256'],r['senseIndex']) in std_yes}
 reviews=[(spec['reviewer'],templates,yes),(std['reviewer'],templates,yes)]
 output={};proof={};selected=[]
 for i in sorted(set(reviews[0][2])&set(reviews[1][2])):
  a,b=[r[2][i]for r in reviews]
  if any(a[k]!=b[k]for k in ['word','lemma','recordSha256']):continue
  item=input['records'][i];word=item['word'];lemma=item['lemma'];row=item['source'];sense=item['sense']
  assert a['word']==word and a['lemma']==lemma and a['recordSha256']==row['recordSha256'];assert row in source['acceptedRecords'][word]and sense in row['senses']
  if lemma not in templates or word not in allowed or word in reviewed:continue
  links=sense.get('form_of',[]);assert len(links)==1 and links[0]['word'].split(' combined with ')[0]==lemma
  gloss=' '.join(sense.get('glosses',[]));assert gloss.count('combined with')==1;body,suffix=gloss.split('combined with');body=body.strip();suffix=suffix.strip().rstrip('.')
  assert suffix in DIRECT and re.search(r'\bof '+re.escape(lemma)+r'\s*$',body)
  if ' combined with 'in links[0]['word']:assert links[0]['word'].split(' combined with ')[1]==suffix
  raw_tags=sense.get('tags',[]);assert 'accusative'in raw_tags and not set(raw_tags)&{'negative','reflexive','pronominal','passive'}
  tags=[t for t in raw_tags if not t.startswith('object-')and t not in {'combined-form'}]
  for match in re.finditer(r'((?:first|second|third)(?:/(?:first|second|third))*)-person',body):tags.extend(p+'-person'for p in match[1].split('/'))
  tags.extend(t for t in ['singular','plural','imperative','infinitive','voseo']if re.search(r'\b'+t+r'\b',body));tags=sorted(set(tags));template,lemma_row,lemma_sense=templates[lemma];frame=template['template']
  if 'infinitive'in tags and 'imperative'not in tags:features=[{'kind':'infinitive','tags':[t for t in tags if t!='form-of']}]
  elif 'imperative'in tags and 'infinitive'not in tags:features=[f for f in features_for(row,{'glosses':[body],'tags':tags})if f['kind']=='finite'and f['tense']=='imperative']
  else:continue
  for feature in features:
   texts=['to '+frame]if feature['kind']=='infinitive'else finite(frame,'imperative',feature['person'],feature['number'],'ordinary',set())
   if not texts:continue
   texts=[t.replace('{direct}',DIRECT[suffix])for t in texts]
   usage=set(lemma_sense.get('tags',[])+lemma_sense.get('raw_tags',[]))-{'intransitive','reflexive','pronominal','sometimes','ambitransitive'}
   labels=(set(feature['tags'])-{'form-of','combined-form'})|usage|set(t for t in raw_tags if t.startswith('object-'))|{'selected inanimate direct object: '+DIRECT[suffix],'source-bound selected accusative-clitic reading; not an example sentence','selected transitive reading; other root constructions remain distinct','meaning context: '+template['context']}
   if feature.get('tense')=='imperative'and feature.get('person')=='third-person':labels.add('command addressed to usted/ustedes; grammatical third-person')
   if feature['kind']=='infinitive':labels.add('subject unspecified')
   entry=output.setdefault(word,{'sourceUrl':'https://en.wiktionary.org/wiki/'+quote(row['word'])+'#Spanish','sourceLinks':[],'senses':[]});link={'label':'English verb meaning','url':'https://en.wiktionary.org/wiki/'+quote(lemma)+'#Spanish'}
   if link not in entry['sourceLinks']:entry['sourceLinks'].append(link)
   entry['senses'].append({'partOfSpeech':'verb','senseIndex':str(len(entry['senses'])+1),'english':texts,'tags':sorted(labels)})
   proof.setdefault(word,[]).append({'kind':'reviewed-additional-accusative-batch-2','recordIndex':i,'wordRecordSha256':row['recordSha256'],'sourceSense':sense,'lemma':lemma,'lemmaRecordSha256':lemma_row['recordSha256'],'lemmaSenseIndex':template['senseIndex'],'template':frame,'direct':suffix,'features':feature,'english':texts,'candidateSha256':digest,'reviewHashes':hashes})
  selected.append(i)
 return output,proof,{'words':len(output),'selectedSourceRecords':len(selected),'candidateSha256':digest,'reviewHashes':hashes,'scope':'Only reviewed explicit accusative lo/la/los/las positive commands and infinitives, selected inanimate it/them; no dative, reflexive, negative, multiple-clitic or other finite indicative authority.'}
