"""Reviewed noun-form renderings from CC-BY-SA Wiktionary sense evidence.
No suffix guessing or fabricated gender counterpart. Review fields are bound to
source records, and differing proposals require exact wording cross-approval.
"""
import json,hashlib
FIELDS=['meaningIndex','recordSha256','singular','plural','femaleSingular','femalePlural']
def reviewed_noun_forms(data,source,allowed,reviewed):
 def read(name):return json.loads((data/name).read_text())
 def sha(name):return hashlib.sha256((data/name).read_bytes()).hexdigest()
 candidates=read('english-noun-candidates.json');candidate_sha=sha('english-noun-candidates.json');catalogue={r['spanish']:r for r in candidates};assert len(catalogue)==len(candidates);approvals=[];reviews=[];hashes={}
 for name in ['english-noun-review-spec.json','english-noun-review-standards.json']:
  review=read(name);assert review['inputSha256']==candidate_sha
  positive={r['spanish']:r for r in review['approved']};negative={r['spanish'] for r in review['rejected']}
  assert len(positive)==len(review['approved']) and len(negative)==len(review['rejected']) and not set(positive)&negative and set(positive)|negative==set(catalogue)
  for lemma,row in positive.items():
   sense=catalogue[lemma]['meanings'][row['meaningIndex']];assert row['recordSha256']==sense['recordSha256']
   assert all(isinstance(row.get(f),str) and row[f].strip() for f in ['singular','plural','notes'])
   assert all(not row.get(f) or isinstance(row[f],str) and row[f].strip() for f in ['femaleSingular','femalePlural'])
  approvals.append(positive);reviews.append(review);hashes[name]=sha(name)
 assert reviews[0]['reviewer']!=reviews[1]['reviewer']
 cross_rows=read('english-noun-cross-review.json');cross=read('english-noun-cross-approval.json');assert cross['inputSha256']==sha('english-noun-cross-review.json') and cross['reviewer']==reviews[1]['reviewer'];cross_input={r['source']['spanish']:r for r in cross_rows};cross_ok={r['spanish'] for r in cross['approved']};cross_no={r['spanish'] for r in cross['rejected']};assert len(cross_input)==len(cross_rows) and len(cross_ok)==len(cross['approved']) and len(cross_no)==len(cross['rejected']) and not cross_ok&cross_no and cross_ok|cross_no==set(cross_input);hashes['english-noun-cross-approval.json']=sha('english-noun-cross-approval.json')
 profiles={}
 for lemma in set(approvals[0])&set(approvals[1]):
  first,second=approvals[0][lemma],approvals[1][lemma]
  if any(first.get(f)!=second.get(f) for f in FIELDS):
   if lemma not in cross_ok:continue
   assert cross_input[lemma]['source']==catalogue[lemma] and cross_input[lemma]['proposed']==first and cross_input[lemma]['otherReview']==second
  sense=catalogue[lemma]['meanings'][first['meaningIndex']]
  assert any(r['recordSha256']==first['recordSha256'] and any(s.get('glosses')==sense['glosses'] and not s.get('form_of') and not s.get('alt_of') for s in r['senses']) for r in source['lemmas'].get(lemma,[]) if r['pos']=='noun')
  profiles[lemma]={**first,'sourceMeaning':sense,'reviewedRoot':lemma,'path':[]}
 def rows_for(word):
  seen=set();out=[]
  for row in source['lemmas'].get(word,[])+source['acceptedRecords'].get(word.upper(),[]):
   if row['word']==word and row['pos']=='noun' and row['recordSha256'] not in seen:seen.add(row['recordSha256']);out.append(row)
  return out
 def female_profile(lemma,row,sense,parent):
  if not parent or not parent.get('femaleSingular') or not parent.get('femalePlural'):return None
  root=catalogue[parent['reviewedRoot']]
  if not any(c['word']==lemma.upper() and c['kind']=='female-equivalent' and c['recordSha256']==row['recordSha256'] for c in root['children']):return None
  return {**parent,'singular':parent['femaleSingular'],'plural':parent['femalePlural'],'femaleResolved':True,'pathLabels':parent.get('pathLabels',[])+[t for t in sense.get('tags',[])+sense.get('raw_tags',[]) if t not in {'form-of','alt-of'}],'path':[{'word':lemma,'recordSha256':row['recordSha256'],'glosses':sense.get('glosses',[]),'tags':sense.get('tags',[]),'raw_tags':sense.get('raw_tags',[])}]+parent['path']}
 def resolve(lemma,path=()):
  if lemma in path or len(path)>4:return None
  if lemma in profiles:return profiles[lemma]
  for row in rows_for(lemma):
   for sense in row['senses']:
    female=any('female equivalent of' in g for g in sense.get('glosses',[]))
    links=sense.get('form_of',[]) if female else sense.get('alt_of',[])
    for link in links:
     if not female and link.get('extra'):continue
     parent=resolve(link['word'],path+(lemma,))
     if not parent:continue
     if female:
      result=female_profile(lemma,row,sense,parent)
      if result:return result
      continue
     return {**parent,'pathLabels':parent.get('pathLabels',[])+[t for t in sense.get('tags',[])+sense.get('raw_tags',[]) if t not in {'form-of','alt-of'}],'path':[{'word':lemma,'recordSha256':row['recordSha256'],'glosses':sense.get('glosses',[]),'tags':sense.get('tags',[]),'raw_tags':sense.get('raw_tags',[])}]+parent['path']}
  return None
 output={};evidence={}
 for word,records in source['acceptedRecords'].items():
  if word not in allowed or word in reviewed:continue
  for row in records:
   if row['pos']!='noun':continue
   for sense in row['senses']:
    female=any('female equivalent of' in g for g in sense.get('glosses',[]));plural='plural' in sense.get('tags',[])
    if not female and not plural:continue
    for link in sense.get('form_of',[]):
     profile=female_profile(row['word'],row,sense,resolve(link['word'])) if female else resolve(link['word'])
     if not profile:continue
     tags=set(sense.get('tags',[]));root_tags=set(profile['sourceMeaning'].get('tags',[]))
     if plural and 'feminine' in tags and 'masculine' in root_tags and 'feminine' not in root_tags and not profile.get('femaleResolved'):continue
     english=profile['singular'] if female else profile['plural'];notes=[profile['notes']];other_review=approvals[1][profile['reviewedRoot']];other=other_review['notes'] if other_review['meaningIndex']==profile['meaningIndex'] and other_review['recordSha256']==profile['recordSha256'] else ''
     # Remove only this exact generic certification boilerplate; contextual
     # warnings stay intact and the global disclosure describes authorship.
     other=other.replace('Selected source sense; original model-reviewed rendering. ','').replace(' Not a source quotation or native-Mexican certification.','')
     if other and other not in notes:notes.append(other)
     labels=sorted((tags-{'form-of'})|(set(profile['sourceMeaning'].get('tags',[]))-{'masculine','feminine','singular','plural'})|set(profile['sourceMeaning'].get('raw_tags',[]))|set(profile.get('pathLabels',[]))|{'model-reviewed noun-form reading'})+notes
     target=output.setdefault(word,[])
     if any(s['english']==[english] and s['tags']==labels for s in target):continue
     target.append({'partOfSpeech':'noun','senseIndex':str(len(target)+1),'english':[english],'tags':labels})
     evidence.setdefault(word,[]).append({'kind':'reviewed-noun-form','word':row['word'],'wordRecordSha256':row['recordSha256'],'features':sense,'reviewedRoot':profile['reviewedRoot'],'meaningIndex':profile['meaningIndex'],'meaningRecordSha256':profile['recordSha256'],'sourceMeaning':profile['sourceMeaning'],'english':english,'sourcePath':profile['path'],'reviewHashes':hashes})
 return output,evidence,{'profiles':len(profiles),'candidateSha256':candidate_sha,'reviewHashes':hashes}
