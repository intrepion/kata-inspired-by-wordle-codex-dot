"""Reviewed accusative readings for eleven source-bound ordinary verb frames.
No suffix decomposition, dative/reflexive inference, or noncommand finite forms.
Modified Wiktionary data / CC-BY-SA-4.0; selected readings are not examples.
"""
import json,hashlib,re
from urllib.parse import quote
DIRECT={'lo':'it','la':'it','los':'them','las':'them'}

def additional_clitic_forms(data,source,allowed,reviewed,features_for,finite):
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 def read(n):return json.loads((data/n).read_text())
 name='additional-clitic-candidates.json';input=read(name);digest=sha(name);assert input['englishArtifactSha256']==read('english-translation-source.json')['artifactSha256'];roots=set(input['proposedTemplates']);reviews=[];hashes={}
 for role in ['spec','standards']:
  name=f'additional-clitic-review-{role}.json';r=read(name);assert r['inputSha256']==digest
  templates={v['lemma']:v for v in r['approvedTemplates']};no={v['lemma']for v in r['rejectedTemplates']};assert len(templates)==len(r['approvedTemplates'])and not set(templates)&no and set(templates)|no==roots
  yes={v['recordIndex']:v for v in r['approved']};no={v['recordIndex']for v in r['rejected']};assert len(yes)==len(r['approved'])and len(no)==len(r['rejected'])and not set(yes)&no and set(yes)|no==set(range(len(input['records'])))
  reviews.append((r['reviewer'],templates,yes));hashes[name]=sha(name)
 assert reviews[0][0]!=reviews[1][0]
 templates={}
 for lemma in sorted(set(reviews[0][1])&set(reviews[1][1])):
  a,b=[r[1][lemma]for r in reviews]
  if any(a[k]!=b[k]for k in ['template','recordSha256','senseIndex']):continue
  assert a['template']==input['proposedTemplates'][lemma]and a['template'].count('{direct}')==1
  row=next(r for r in input['lemmas'][lemma]if r['recordSha256']==a['recordSha256']);assert row in source['lemmas'][lemma]and row['word']==lemma and row['pos']=='verb';sense=row['senses'][a['senseIndex']];assert sense.get('glosses')and not sense.get('form_of')and not sense.get('alt_of')
  templates[lemma]=(a,row,sense)
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
   proof.setdefault(word,[]).append({'kind':'reviewed-additional-accusative-clitic','recordIndex':i,'wordRecordSha256':row['recordSha256'],'sourceSense':sense,'lemma':lemma,'lemmaRecordSha256':lemma_row['recordSha256'],'lemmaSenseIndex':template['senseIndex'],'template':frame,'direct':suffix,'features':feature,'english':texts,'candidateSha256':digest,'reviewHashes':hashes})
  selected.append(i)
 return output,proof,{'words':len(output),'selectedSourceRecords':len(selected),'candidateSha256':digest,'reviewHashes':hashes,'scope':'Only reviewed explicit accusative lo/la/los/las positive commands and infinitives, selected inanimate it/them; no dative, reflexive, negative, multiple-clitic or other finite indicative authority.'}
