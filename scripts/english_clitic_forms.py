"""Selected DAR/DECIR clitic readings, grounded in explicit source descriptions.
Grammar/wording approved independently; no suffix decomposition, invented subject
or generic lemma placeholder. Other lexemes/constructions require further review.
"""
import json,hashlib,re
DIRECT={'lo':'it','la':'it','los':'them','las':'them'}
RECIPIENT={'me':'me','te':'you','nos':'us','os':'you (plural, Spain)','le':'him/her','les':'them','le/les':'him/her/them'}
def reviewed_clitic_forms(data,source,allowed,reviewed,features_for,finite,agid,qualified,profiles,phrase_profiles,aspects):
 policy_raw=(data/'english-clitic-policy.json').read_bytes();policy_sha=hashlib.sha256(policy_raw).hexdigest();templates=json.loads(policy_raw)['templates']
 raw=(data/'english-clitic-evidence.json').read_bytes();sha=hashlib.sha256(raw).hexdigest();input=json.loads(raw);reviews=[];hashes={};withheld=set()
 for name in ['english-clitic-review-spec.json','english-clitic-review-standards.json']:
  raw_review=(data/name).read_bytes();review=json.loads(raw_review);assert review['inputSha256']==sha and review['policySha256']==policy_sha and review['approvedPolicy'];reviews.append(review);hashes[name]=hashlib.sha256(raw_review).hexdigest()
 assert reviews[0]['reviewer']!=reviews[1]['reviewer']
 # Single-se lexical/reflexive readings are intentionally outside this batch.
 output={};evidence={}
 for item in input['wordRows']:
  word=item['word'];row=item['source'];sense=item['sense']
  if word not in allowed or word in reviewed:continue
  assert any(r['recordSha256']==row['recordSha256'] and r['word']==row['word'] and sense in r['senses'] for r in source['acceptedRecords'].get(word,[]))
  links=sense.get('form_of',[])
  if len(links)!=1:continue
  target_match=re.fullmatch(r'(dar|decir)(?: combined with (.+))?',links[0]['word'])
  if not target_match:continue
  lemma=target_match[1];declared_clitic=target_match[2];gloss=' '.join(sense.get('glosses',[]))
  if gloss.count('combined with')!=1:continue
  body,suffix=gloss.split('combined with',1);suffix=suffix.split(';',1)[0].strip().rstrip('.')
  if declared_clitic and (declared_clitic!=suffix or not re.search(r'\bof '+lemma+r'\b',body)):continue
  direct=recipient=None
  if suffix in DIRECT:direct=suffix
  elif suffix in RECIPIENT:recipient=suffix
  else:
   match=re.fullmatch(r'indirect object (le/les|me|te|nos|os|le|les) and direct object (lo|la|los|las)',suffix)
   if match:recipient,direct=match.groups()
   else:withheld.add(word);continue
  if any(t in sense.get('tags',[]) for t in ['accusative','direct-object']) and recipient:continue
  tags=[t for t in sense.get('tags',[]) if not t.startswith('object-') and t!='combined-form']
  # Morphology is read only from the same English source sense, never spelling.
  for match in re.finditer(r'((?:first|second|third)(?:/(?:first|second|third))*)-person',body):tags.extend(p+'-person' for p in match[1].split('/'))
  tags.extend(t for t in ['singular','plural','indicative','present','preterite','imperfect','future','conditional','imperative','gerund','participle','past','infinitive','subjunctive','voseo'] if re.search(r'\b'+t+r'\b',body))
  tags=sorted(set(tags));clean={'glosses':[body],'tags':tags}
  nonfinite=[t for t in ['infinitive','gerund','participle'] if t in tags]
  if len(nonfinite)>1:continue
  if nonfinite==['infinitive']:features=[{'kind':'infinitive','tags':[t for t in tags if t!='form-of']}]
  else:features=features_for(row,clean)
  role='both' if direct and recipient else 'direct' if direct else 'recipient';frame=templates[lemma][role];head=frame.split(' ',1)[0]
  profile=profiles.get((lemma,head),phrase_profiles.get((lemma,head)))
  if profile!='ordinary':
   # The dedicated clitic reviews add recipient TELL to the old catalogue,
   # whose multi-synonym extractor reviewed only the first SAY frame.
   if not (lemma=='decir' and head=='tell' and role=='recipient' and any(re.search(r'(?:^to |, to )tell(?:,|$)',g) for r in input['lemmas'][lemma] if r['pos']=='verb' for s in r['senses'] for g in s.get('glosses',[]))):continue
   profile='ordinary'
  # The lexical reference in the approved evidence must remain this same source.
  assert input['lemmas'][lemma] and all(any(r['recordSha256']==e['recordSha256'] for r in source['lemmas'][lemma]) for e in input['lemmas'][lemma])
  for feature in features:
   person,number=feature.get('person'),feature.get('number');selected_reflexive=False
   recipient_text=RECIPIENT.get(recipient,'')
   if feature['kind']=='finite':
    reflexive={('me','first-person','singular'):'myself',('te','second-person','singular'):'yourself',('nos','first-person','plural'):'ourselves',('os','second-person','plural'):'yourselves'}
    replacement=reflexive.get((recipient,person,number))
    if replacement:recipient_text=replacement;selected_reflexive=True
    if feature['tense']=='imperative' and recipient in {'te','os'} and not replacement:continue
    texts=finite(frame,feature['tense'],person,number,profile,aspects.get((lemma,head),set()))
   elif feature['kind']=='infinitive':texts=['to '+frame]
   elif feature['kind']=='gerund':
    forms=agid.get((head,'V'),[]);texts=[f+' '+frame.split(' ',1)[1] for f in forms[2]] if len(forms)==4 else None
   elif feature['kind']=='participle':
    forms=agid.get((head,'V'),[]);texts=[f+' '+frame.split(' ',1)[1] for f in forms[1]] if len(forms)==4 and (head,'V') not in qualified else None
   else:texts=None
   if not texts:continue
   if recipient in {'te','os'} and person=='third-person':texts=[t for t in texts if not t.startswith('you (')]
   texts=[t.replace('{direct}',DIRECT.get(direct,'')).replace('{recipient}',recipient_text) for t in texts]
   if not texts:continue
   labels=set(feature['tags'])|{'model-reviewed selected clitic reading'}
   if direct:labels.add('selected inanimate direct object'+('; speech/content object' if lemma=='decir' else ''))
   if recipient:labels.add('selected recipient reading; other contextual readings may differ')
   if recipient in {'le','les','le/les'}:labels.add('selected third-person recipient; formal-you readings not shown')
   if role=='recipient':labels.add('elliptical recipient fragment; direct object unexpressed')
   if feature['kind'] in {'infinitive','gerund','participle'}:labels.add('subject unspecified; reflexive interpretation depends on context')
   if selected_reflexive:labels.add('selected reflexive reading; reciprocal readings may differ')
   if feature.get('tense')=='imperfect':labels.add('selected background/ongoing reading')
   if feature.get('tense','').startswith('subjunctive-'):labels.add('selected contextual subjunctive clause; not a universal standalone tense')
   senses=output.setdefault(word,[])
   if any(s['english']==texts and s['tags']==sorted(labels) for s in senses):continue
   senses.append({'partOfSpeech':'verb','senseIndex':str(len(senses)+1),'english':texts,'tags':sorted(labels)})
   evidence.setdefault(word,[]).append({'kind':'reviewed-clitic-form','word':row['word'],'wordRecordSha256':row['recordSha256'],'sourceSense':sense,'lemma':lemma,'template':frame,'role':role,'direct':direct,'recipient':recipient,'features':feature,'english':texts,'reviewHashes':hashes,'evidenceSha256':sha,'policySha256':policy_sha})
 return output,evidence,{'words':len(output),'inputSha256':sha,'policySha256':policy_sha,'reviewHashes':hashes,'withheldSingleOrUnsupportedCases':sorted(withheld)}
