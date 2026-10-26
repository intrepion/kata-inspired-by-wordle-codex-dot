"""Reproduce English semantic meanings from pinned raw Wiktionary evidence.
Data/modified meanings: Wiktionary contributors / CC-BY-SA-4.0.
No generic form-of gloss, quotation example or unknown lemma is translation coverage.
"""
from pathlib import Path
import json,hashlib,re,argparse
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');p.add_argument('--audit-only',action='store_true');args=p.parse_args();root=Path(__file__).resolve().parent.parent;data=root/'src/data/spanish'
manifest=json.loads((data/'english-translation-source.json').read_text());raw=(data/'english-translation-evidence.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==manifest['evidenceSha256'],'Evidence differs from pinned extract';source=json.loads(raw)
def exported(name):return json.loads((data/name).read_text().split(' = ',1)[1].strip().removesuffix(';'))
reviewed={**exported('learning.ts'),**exported('additional-teaching.ts')};vocab=exported('vocabulary.ts');allowed={w for v in vocab.values() for w in v['guesses']};output={};evidence={}
def meaning(s):
 if s.get('form_of') or s.get('alt_of') or set(s.get('tags',[]))&{'form-of','alt-of','inflection-of','no-gloss'}:return None
 glosses=s.get('glosses',[])
 if not glosses or any(not isinstance(g,str) or not g.strip() for g in glosses):return None
 text='; '.join(glosses)
 if re.match(r'(?i)^(?:alternative|obsolete|archaic|rare|dialectal|nonstandard|misspelling|synonym|diminutive|augmentative|apocopic|feminine|masculine|plural|singular|inflection|participle|gerund|first-person|second-person|third-person)\b.*\bof\b',text):return None
 if text in {'no definition','TODO','TBD'}:return None
 return text
for word,records in source['acceptedRecords'].items():
 if word not in allowed or word in reviewed:continue
 for row in records:
  for s in row['senses']:
   text=meaning(s)
   if not text:continue
   runtime={'partOfSpeech':row['pos'] or 'unknown','senseIndex':str(len(output.get(word,{}).get('senses',[]))+1),'english':[text],'tags':sorted(set(s.get('tags',[])+s.get('raw_tags',[])+['dictionary gloss']))}
   target=output.setdefault(word,{'sourceUrl':'https://en.wiktionary.org/wiki/'+__import__('urllib.parse',fromlist=['quote']).quote(row['word'])+'#Spanish','senses':[]});target['senses'].append(runtime)
   evidence.setdefault(word,[]).append({'kind':'source-gloss','word':row['word'],'partOfSpeech':row['pos'],'english':text,'tags':s.get('tags',[]),'rawRecordSha256':row['recordSha256']})

from english_synonym_meanings import selected_synonym_meanings
synonym_output,synonym_evidence,synonym_review=selected_synonym_meanings(data,source,allowed,reviewed)
for word,entry in synonym_output.items():
 target=output.setdefault(word,{'sourceUrl':entry['sourceUrl'],'senses':[]})
 for sense in entry['senses']:
  sense['senseIndex']=str(len(target['senses'])+1);target['senses'].append(sense)
 for link in entry.get('sourceLinks',[]):
  if link not in target.setdefault('sourceLinks',[]):target['sourceLinks'].append(link)
 evidence.setdefault(word,[]).extend(synonym_evidence[word])

# Resolve explicit spelling equivalence only; a grammatical form reference is
# not a spelling alias. Extra gloss qualifiers require separate sense review.
def alias_meanings(sense,pos,path):
 if len(path)>4:return []
 results=[]
 for link in sense.get('alt_of',[]):
  target=link['word']
  if link.get('extra') or target in path:continue
  rows=source['lemmas'].get(target,[])+source['acceptedRecords'].get(target.upper(),[]);seen=set()
  for row in rows:
   if row['word']!=target or row['pos']!=pos or row['recordSha256'] in seen:continue
   seen.add(row['recordSha256'])
   for target_sense in row['senses']:
    text=meaning(target_sense)
    if text:results.append({'english':text,'tags':target_sense.get('tags',[])+target_sense.get('raw_tags',[]),'sourceRow':row,'sourceSense':target_sense,'raw_tags':target_sense.get('raw_tags',[]),'chain':[{'word':target,'recordSha256':row['recordSha256'],'glosses':target_sense.get('glosses',[]),'tags':target_sense.get('tags',[]),'raw_tags':target_sense.get('raw_tags',[])}]})
    elif target_sense.get('alt_of'):
     for result in alias_meanings(target_sense,pos,path+[target]):results.append({'english':result['english'],'tags':target_sense.get('tags',[])+target_sense.get('raw_tags',[])+result['tags'],'sourceRow':result['sourceRow'],'sourceSense':result['sourceSense'],'raw_tags':target_sense.get('raw_tags',[])+result.get('raw_tags',[]),'chain':[{'word':target,'recordSha256':row['recordSha256'],'glosses':target_sense.get('glosses',[]),'tags':target_sense.get('tags',[]),'raw_tags':target_sense.get('raw_tags',[])}]+result['chain']})
 return results
for word,records in source['acceptedRecords'].items():
 if word not in allowed or word in reviewed:continue
 for row in records:
  for sense in row['senses']:
   if not sense.get('alt_of'):continue
   for result in alias_meanings(sense,row['pos'],[row['word']]):
    tags=sorted(set(['source-linked spelling equivalent']+sense.get('tags',[])+sense.get('raw_tags',[])+result['tags'])-{'alt-of'})
    target=output.setdefault(word,{'sourceUrl':'https://en.wiktionary.org/wiki/'+__import__('urllib.parse',fromlist=['quote']).quote(row['word'])+'#Spanish','senses':[]})
    if any(x['english']==[result['english']] and x['tags']==tags for x in target['senses']):continue
    target['senses'].append({'partOfSpeech':row['pos'],'senseIndex':str(len(target['senses'])+1),'english':[result['english']],'tags':tags})
    evidence.setdefault(word,[]).append({'kind':'source-alias','word':row['word'],'partOfSpeech':row['pos'],'english':result['english'],'rawRecordSha256':row['recordSha256'],'sourceGlosses':sense.get('glosses',[]),'canonicalSourceWord':result['sourceRow']['word'],'canonicalSourceRecordSha256':result['sourceRow']['recordSha256'],'sourceChain':result['chain']})

from english_additional_verbs import additional_verb_frames,sense_key
additional_frames,additional_review=additional_verb_frames(data,source)
for batch in [2,3,4]:
 if not (data/f'english-additional-verb-{batch}-candidates.json').exists():continue
 next_frames,next_review=additional_verb_frames(data,source,batch)
 assert not set(additional_frames)&set(next_frames),'Overlapping reviewed semantic frames'
 additional_frames.update(next_frames);additional_review={'batches':[additional_review,next_review],'reviewHashes':additional_review['reviewHashes']|next_review['reviewHashes'],'approvedExactSenseFrames':len(additional_frames)}

from english_verb_cross_review import cross_reviewed_frames
for cross_batch in [1,2,3,4]:
 cross_prefix='english-verb-cross'+(f'-{cross_batch}'if cross_batch!=1 else '')
 if not (data/(cross_prefix+'-candidates.json')).exists():continue
 cross_frames,cross_review=cross_reviewed_frames(data,source,cross_batch)
 assert not set(additional_frames)&set(cross_frames),'Cross-review would overwrite a previously selected frame'
 additional_frames.update(cross_frames);additional_review={'batches':[additional_review,cross_review],'reviewHashes':additional_review['reviewHashes']|cross_review['reviewHashes'],'approvedExactSenseFrames':len(additional_frames)}

# A spelling variant's explicitly attested inflection may reuse the canonical
# lexical reading. Its subject/aspect policy remains the canonical reviewed one.
# This never treats grammatical form-of links as spelling equivalence.
for alias,rows in list(source['lemmas'].items()):
 additions=[]
 for row in rows[:]:
  for sense in row['senses']:
   for result in alias_meanings(sense,row['pos'],[alias]):
    target_row=result['sourceRow'];semantic=dict(result['sourceSense']);semantic['originalSenseKey']=sense_key(result['sourceSense']);semantic['raw_tags']=sorted(set(semantic.get('raw_tags',[])+sense.get('raw_tags',[])+result.get('raw_tags',[])));semantic['tags']=sorted((set(semantic.get('tags',[])+sense.get('tags',[])+result['tags'])-{'alt-of','form-of'})|{'source-linked spelling equivalent'})
    if sense.get('raw_tags'):semantic['tags'].append('source spelling context: '+', '.join(t for t in sense.get('tags',[]) if t not in {'alt-of','form-of'})+': '+', '.join(sense['raw_tags']))
    additions.append({'word':target_row['word'],'pos':row['pos'],'recordSha256':target_row['recordSha256'],'canonicalLemma':target_row['word'],'spellingAliasChain':[{'word':alias,'recordSha256':row['recordSha256'],'glosses':sense.get('glosses',[]),'tags':sense.get('tags',[]),'raw_tags':sense.get('raw_tags',[])}]+result['chain'],'senses':[semantic]})
 source['lemmas'][alias].extend(additions)

# Morphology uses only the CC-BY-SA English-source catalogue and permissively
# licensed AGID inflections. It never reads the GPL bilingual data/reviews.
candidate_raw=(data/'english-verb-candidates.json').read_bytes();candidate_sha=hashlib.sha256(candidate_raw).hexdigest();candidates=json.loads(candidate_raw);pairs={(sp,r['english']) for sp,rows in candidates.items() for r in rows};approvals=[];review_hashes={}
for filename in ['english-verb-review-spec.json','english-verb-review-standards.json']:
 raw_review=(data/filename).read_bytes();review=json.loads(raw_review);assert review['inputSha256']==candidate_sha
 approved={(r['spanish'],r['english']):r['profile'] for r in review['approvedPairs']};rejected={(r['spanish'],r['english']) for r in review['rejectedPairs']}
 assert len(approved)==len(review['approvedPairs']) and len(rejected)==len(review['rejectedPairs']) and not set(approved)&rejected and set(approved)|rejected==pairs,'Incomplete or contradictory review'
 assert all(p in {'ordinary','it-only'} for p in approved.values());approvals.append(approved);review_hashes[filename]=hashlib.sha256(raw_review).hexdigest()
assert json.loads((data/'english-verb-review-spec.json').read_text())['reviewer']!=json.loads((data/'english-verb-review-standards.json').read_text())['reviewer']
profiles={pair:'it-only' if any(a[pair]=='it-only' for a in approvals) else 'ordinary' for pair in set(approvals[0])&set(approvals[1])}
phrase_raw=(data/'english-phrase-candidates.json').read_bytes();phrase_sha=hashlib.sha256(phrase_raw).hexdigest();phrase_candidates=json.loads(phrase_raw);phrase_pairs={(sp,r['frame']) for sp,rows in phrase_candidates.items() for r in rows};phrase_approvals=[]
for filename in ['english-phrase-review-spec.json','english-phrase-review-standards.json']:
 review_raw=(data/filename).read_bytes();review=json.loads(review_raw);assert review['inputSha256']==phrase_sha
 approved={(r['spanish'],r['english']):r['profile'] for r in review['approvedPairs']};rejected={(r['spanish'],r['english']) for r in review['rejectedPairs']}
 assert len(approved)==len(review['approvedPairs']) and len(rejected)==len(review['rejectedPairs']) and not set(approved)&rejected and set(approved)|rejected==phrase_pairs
 assert all(p in {'ordinary','it-only'} for p in approved.values());phrase_approvals.append(approved);review_hashes[filename]=hashlib.sha256(review_raw).hexdigest()
phrase_profiles={pair:'it-only' if any(a[pair]=='it-only' for a in phrase_approvals) else 'ordinary' for pair in set(phrase_approvals[0])&set(phrase_approvals[1])}
# Both independent reviews must approve the same predicate and aspect reading.
aspect_raw=(data/'english-aspect-candidates.json').read_bytes();aspect_sha=hashlib.sha256(aspect_raw).hexdigest();aspect_candidates=json.loads(aspect_raw);aspect_pairs={(r['spanish'],r['frame']) for r in aspect_candidates};aspect_reviews=[]
for filename in ['english-aspect-review-spec.json','english-aspect-review-standards.json']:
 review_raw=(data/filename).read_bytes();review=json.loads(review_raw);assert review['inputSha256']==aspect_sha
 approved={(r['spanish'],r['frame']):set(r['modes']) for r in review['approved']};rejected={(r['spanish'],r['frame']) for r in review['rejected']}
 assert len(approved)==len(review['approved']) and not set(approved)&rejected and set(approved)|rejected==aspect_pairs
 assert all(m and m<={'state-past','progressive'} for m in approved.values());aspect_reviews.append(approved);review_hashes[filename]=hashlib.sha256(review_raw).hexdigest()
aspects={pair:aspect_reviews[0][pair]&aspect_reviews[1][pair] for pair in set(aspect_reviews[0])&set(aspect_reviews[1])}
assert len({json.loads((data/n).read_text())['reviewer'] for n in ['english-phrase-review-spec.json','english-phrase-review-standards.json']})==2
assert len({json.loads((data/n).read_text())['reviewer'] for n in ['english-aspect-review-spec.json','english-aspect-review-standards.json']})==2
agid_path=root/'public/third-party/apertium-translations/agid-infl.txt';agid_raw=agid_path.read_bytes();assert hashlib.sha256(agid_raw).hexdigest()==manifest['englishInflections']['dataSha256'];
from english_form_rendering import load_agid,make_finite,source_features
agid,qualified,agid_lines=load_agid(agid_raw)
finite=make_finite(agid,qualified)
from qualified_english_slots import load_qualified_slots
qualified_for,qualified_review=load_qualified_slots(data,root,source,agid,qualified)
from reviewed_nonhuman_plurals import load_nonhuman_plurals
nonhuman_for,nonhuman_review=load_nonhuman_plurals(data)

table_raw=(data/'english-form-tables.json').read_bytes();assert hashlib.sha256(table_raw).hexdigest()==manifest['formTablesSha256'];tables=json.loads(table_raw);assert tables['artifactSha256']==manifest['artifactSha256']
for lemma_row in tables['records']:
 lemma=lemma_row['word']
 if lemma!=lemma.lower() or lemma_row['pos'] not in {'noun','adj','verb'}:continue
 if not any(r['recordSha256']==lemma_row['recordSha256'] for r in source['lemmas'].get(lemma,[])):source['lemmas'].setdefault(lemma,[]).append(lemma_row)
 for form in lemma_row['forms']:
  if set(form.get('tableTags',[]))-{'regular','irregular'}:continue
  tags=form.get('tags',[])
  if set(tags)&{'combined-form','reflexive','negative'} or any(t.startswith('object-') for t in tags):continue
  word=form['form'].upper()
  if word not in allowed or word in reviewed:continue
  pseudo={'word':form['form'],'pos':lemma_row['pos'],'recordSha256':lemma_row['recordSha256'],'sourceArticle':lemma,'tableForm':form,'senses':[{'tags':tags+['form-of'],'glosses':['Explicit source inflection table'],'form_of':[{'word':lemma}]}]}
  source['acceptedRecords'].setdefault(word,[]).append(pseudo)

from translation_subject_policy import load_subject_policy,selected_grammar_tags
from translation_usage_scope import scoped_source_usage
subject_rules,subject_policy_sha=load_subject_policy(data,'english')
from reviewed_nonhuman_indicatives import load_nonhuman_indicatives
indicative_for,indicative_review=load_nonhuman_indicatives(data,source,agid,qualified,agid_lines,finite,subject_rules)
from reviewed_nonhuman_indicatives3 import load_nonhuman_indicatives3
indicative3_for,indicative3_review=load_nonhuman_indicatives3(data,source,agid,qualified,agid_lines,finite,subject_rules)

def render_form_records(record_map,foreign=False):
 for word,records in record_map.items():
  if word not in allowed or word in reviewed:continue
  for row in records:
   for sense in row['senses']:
    if not sense.get('form_of'):continue
    for features in source_features(row,sense):
     for link in sense['form_of']:
      lemma=link['word']
      for lemma_row in source['lemmas'].get(lemma,[]):
       if lemma_row['pos']!=row['pos']:continue
       for lemma_sense in lemma_row['senses']:
        lemma_meaning=meaning(lemma_sense)
        if not lemma_meaning:continue
        profile_lemma=lemma_row.get('canonicalLemma',lemma)
        # Usage restrictions are constraints, not decorative labels. Withhold
        # senses requiring unsupported negative/compound/construction contexts.
        usage=' '.join(lemma_sense.get('raw_tags',[])).lower()
        if any(x in usage for x in ['negative','not in the','+ haber','existential','only in','dative','indirect object']):continue
        restricted=next((t for t in ['preterite','future','conditional','imperative'] if ('in the '+t) in usage or ('in '+t) in usage),None)
        if restricted and features.get('tense')!=restricted:continue
        values=[]
        if row['pos']=='verb':
         frames=[]
         for gloss in lemma_sense.get('glosses',[]):
          m=re.fullmatch('to ([a-z]+)',gloss)
          if m and (profile_lemma,m[1]) in profiles:frames.append((m[1],profiles[profile_lemma,m[1]],'',aspects.get((profile_lemma,m[1]),set()),None))
          for candidate in phrase_candidates.get(profile_lemma,[]):
           if candidate['gloss']==gloss and candidate['recordSha256']==lemma_row['recordSha256'] and (profile_lemma,candidate['frame']) in phrase_profiles:frames.append((candidate['frame'],phrase_profiles[profile_lemma,candidate['frame']],candidate.get('context',''),aspects.get((profile_lemma,candidate['frame']),set()),None))
         extra=additional_frames.get((profile_lemma,lemma_row['recordSha256'],lemma_sense.get('originalSenseKey',sense_key(lemma_sense))))
         if extra:frames.append((extra['frame'],extra['profile'],extra['context'],extra['aspectModes'],extra))
         for frame,profile,context,modes,review_meta in frames:
          restriction=subject_rules.get((profile_lemma,lemma_row['recordSha256'],lemma_sense.get('originalSenseKey',sense_key(lemma_sense)),frame))
          if restriction and restriction['action']=='withhold':continue
          effective_profile='it-only' if restriction and restriction['action']=='it-only' else profile
          en=frame.split(' ',1)[0];tail=' '+frame.split(' ',1)[1] if ' ' in frame else '';f=agid.get((en,'V'),[])
          if en=='die' and profile_lemma!='morir':continue
          selected_slots=qualified_for('english-wiktionary',profile_lemma,lemma_row['recordSha256'],lemma_sense,frame,effective_profile)
          chosen_finite=selected_slots['finite'] if selected_slots else finite
          if selected_slots:f=selected_slots['slots']
          if features['kind']=='finite':texts=chosen_finite(frame,features['tense'],features['person'],features['number'],effective_profile,modes)
          elif features['kind']=='gerund':texts=['being'+tail] if en=='be' else [v+tail for v in f[2]] if len(f)==4 else None
          elif features['kind']=='participle':texts=['been'+tail] if en=='be' else [v+tail for v in f[1]] if len(f)==4 and ((en,'V') not in qualified or selected_slots) else None
          else:texts=None
          plural_selection=nonhuman_for('English',word,profile_lemma,lemma_row['recordSha256'],lemma_sense,frame,row['recordSha256'],sense,features,effective_profile) or indicative_for('English',word,profile_lemma,lemma_row['recordSha256'],lemma_sense,frame,row['recordSha256'],sense,features,effective_profile) or indicative3_for('English',word,profile_lemma,lemma_row['recordSha256'],lemma_sense,frame,row['recordSha256'],sense,features,effective_profile)
          if not plural_selection and foreign:plural_selection=mian_for(row,features,profile_lemma,lemma_row,lemma_sense,frame,effective_profile)
          if plural_selection:texts=plural_selection['english'];context=plural_selection['context']
          if texts:values.append((texts,frame,context,review_meta,effective_profile,restriction,selected_slots,plural_selection))
        elif row['pos']=='adj':values.append(([lemma_meaning],None,'',None,None,None,None,None))
        elif row['pos']=='noun' and 'plural' in features['tags']:
         for gloss in lemma_sense.get('glosses',[]):
          # No guessed head-noun extraction from descriptive phrases.
          m=re.fullmatch(r'([a-z]+)(?: \([^()]+\))?',gloss)
          if not m or (m[1],'N') in qualified:continue
          f=agid.get((m[1],'N'),[])
          if f and f[0]:values.append((f[0],m[1],'',None,None,None,None,None))
        for texts,en,selected_context,review_meta,effective_profile,restriction,selected_slots,plural_selection in values:
         clause_labels={'subjunctive-present':'selected formal desired/required that-clause reading','subjunctive-imperfect':'selected hypothetical if-clause reading; not a past-time assertion','subjunctive-future':'selected formal/legal/literary contingent if-clause reading; should is not obligation'}
         runtime={'partOfSpeech':row['pos'],'senseIndex':str(len(output.get(word,{}).get('senses',[]))+1),'english':texts,'tags':sorted(set(['automatically rendered']+([clause_labels[features['tense']]] if features.get('tense') in clause_labels else [])+(['selected background-state or ongoing-event reading'] if features.get('tense')=='imperfect' else [])+selected_grammar_tags(features,effective_profile)+(plural_selection.get('runtimeTags',[])if plural_selection else [])+(['subject scope: '+plural_selection.get('scopeLabel','reviewed plural animal/plant agents')+'; '+plural_selection['context']] if plural_selection else ['subject scope: '+restriction['reason']] if restriction else [])+(['source meaning: '+lemma_meaning] if row['pos']=='noun' else [])+scoped_source_usage([t for t in lemma_sense.get('tags',[]) if not (foreign and row['pos']=='adj' and t in {'masculine','feminine','singular','plural'})]+lemma_sense.get('raw_tags',[]),row['pos'])+row.get('foreignUsageTags',[])+([plural_selection.get('scopeNote','Exact reviewed plural animal/plant subject; other subject and tense uses remain distinct')] if plural_selection else ['model-reviewed selected verb reading']+review_meta['notes'] if review_meta else [])+(['meaning context: '+selected_context] if selected_context else [])))}
         target=output.setdefault(word,{'sourceUrl':'https://en.wiktionary.org/wiki/'+__import__('urllib.parse',fromlist=['quote']).quote(row.get('sourceArticle',row['word']))+'#Spanish','senses':[]})
         if any(x['partOfSpeech']==runtime['partOfSpeech'] and x['english']==texts and x['tags']==runtime['tags'] for x in target['senses']):continue
         if foreign:
          from urllib.parse import quote
          links=target.setdefault('sourceLinks',[])
          for label,url in [('Spanish form evidence','https://es.wiktionary.org/wiki/'+quote(row['word'])),('English lemma/form source','https://en.wiktionary.org/wiki/'+quote(row.get('sourceArticle',row['word']))+'#Spanish'),('English lemma meaning','https://en.wiktionary.org/wiki/'+quote(lemma_row['word'])+'#Spanish')]:
           if url!=target['sourceUrl'] and not any(x['url']==url for x in links):links.append({'label':label,'url':url})
         if plural_selection and plural_selection.get('sourceLinks'):
          links=target.setdefault('sourceLinks',[])
          for link in plural_selection['sourceLinks']:
           if link['url']!=target['sourceUrl']and not any(v['url']==link['url']for v in links):links.append(link)
         target['senses'].append(runtime);evidence.setdefault(word,[]).append({'kind':'rendered-form','word':row['word'],'features':features,'spanishLemma':lemma,'canonicalLemma':profile_lemma,'spellingAliasChain':lemma_row.get('spellingAliasChain'),'englishLemma':en,'english':texts,'additionalVerbReview':({'meaningIndex':review_meta['meaningIndex'],'reviewHashesRef':'#/additionalVerbReview/reviewHashes'} if review_meta else None),'subjectPolicy':({'id':restriction['id'],'action':restriction['action'],'effectiveProfile':effective_profile} if restriction else None),'wordRecordSha256':row['recordSha256'],'wordEvidenceKind':'Spanish-edition form description' if foreign else 'explicit source table' if row.get('tableForm') else 'source word entry','spanishForm':row.get('spanishForm'),'tableForm':row.get('tableForm'),'sourceArticle':row.get('sourceArticle',row['word']),'lemmaRecordSha256':lemma_row['recordSha256'],'lemmaGloss':lemma_meaning,'lemmaUsageInventory':lemma_sense.get('tags',[])+lemma_sense.get('raw_tags',[]),'agidLine':agid_lines.get((en.split(' ',1)[0] if en else None,'N' if row['pos']=='noun' else 'V')),'nonhumanPluralReview':plural_selection['proof'] if plural_selection else None,'qualifiedSlotReview':selected_slots['proof'] if selected_slots else None,'englishRule':'Exact reviewed Spanish sense-bound AGID slot selection' if selected_slots else 'AGID dying {expire}, explicitly bound to morir' if en=='die' and profile_lemma=='morir' else 'closed be paradigm' if en and en.split(' ',1)[0]=='be' else 'AGID unqualified inflection / fixed adjective meaning'})

render_form_records(source['acceptedRecords'])
from english_noun_forms import reviewed_noun_forms
noun_words,noun_evidence,noun_review=reviewed_noun_forms(data,source,allowed,reviewed)
for word,senses in noun_words.items():
 target=output.setdefault(word,{'sourceUrl':'https://en.wiktionary.org/wiki/'+__import__('urllib.parse',fromlist=['quote']).quote(word.lower())+'#Spanish','senses':[]})
 for sense in senses:
  sense['senseIndex']=str(len(target['senses'])+1);target['senses'].append(sense)
 evidence.setdefault(word,[]).extend(noun_evidence[word])
from english_clitic_forms import reviewed_clitic_forms
clitic_words,clitic_evidence,clitic_review=reviewed_clitic_forms(data,source,allowed,reviewed,source_features,finite,agid,qualified,profiles,phrase_profiles,aspects)
for word,senses in clitic_words.items():
 target=output.setdefault(word,{'sourceUrl':'https://en.wiktionary.org/wiki/'+__import__('urllib.parse',fromlist=['quote']).quote(word.lower())+'#Spanish','senses':[]})
 for sense in senses:
  sense['senseIndex']=str(len(target['senses'])+1);target['senses'].append(sense)
 evidence.setdefault(word,[]).extend(clitic_evidence[word])
from additional_clitic_forms import additional_clitic_forms
extra_clitics,extra_clitic_evidence,extra_clitic_review=additional_clitic_forms(data,source,allowed,reviewed,source_features,finite)
for word,entry in extra_clitics.items():
 target=output.setdefault(word,{'sourceUrl':entry['sourceUrl'],'senses':[]})
 for sense in entry['senses']:
  sense['senseIndex']=str(len(target['senses'])+1);target['senses'].append(sense)
 for link in entry['sourceLinks']:
  if link not in target.setdefault('sourceLinks',[]):target['sourceLinks'].append(link)
 evidence.setdefault(word,[]).extend(extra_clitic_evidence[word])
from additional_accusative_batch import additional_accusative_forms
accusative_words,accusative_evidence,accusative_review=additional_accusative_forms(data,source,allowed,reviewed,source_features,finite)
for word,entry in accusative_words.items():
 target=output.setdefault(word,{'sourceUrl':entry['sourceUrl'],'senses':[]})
 for sense in entry['senses']:
  sense['senseIndex']=str(len(target['senses'])+1);target['senses'].append(sense)
 for link in entry['sourceLinks']:
  if link not in target.setdefault('sourceLinks',[]):target['sourceLinks'].append(link)
 evidence.setdefault(word,[]).extend(accusative_evidence[word])
from deferred_accusative_forms import deferred_accusative_forms
deferred_words,deferred_evidence,deferred_review=deferred_accusative_forms(data,source,allowed,reviewed,source_features,finite)
for word,entry in deferred_words.items():
 target=output.setdefault(word,{'sourceUrl':entry['sourceUrl'],'senses':[]})
 for sense in entry['senses']:
  sense['senseIndex']=str(len(target['senses'])+1);target['senses'].append(sense)
 for link in entry['sourceLinks']:
  if link not in target.setdefault('sourceLinks',[]):target['sourceLinks'].append(link)
 evidence.setdefault(word,[]).extend(deferred_evidence[word])
from spanish_form_evidence import spanish_form_records
foreign_records,foreign_review=spanish_form_records(data,source,allowed)
from reviewed_mian_adapter import load_mian_adapter
mian_for,mian_review=load_mian_adapter(data,root,source,subject_rules,agid,qualified,agid_lines,finite,foreign_records)
render_form_records(foreign_records,foreign=True)
from reviewed_function_words import load_function_words
function_rows,function_evidence,function_review=load_function_words(data,source)
for word,entry in function_rows.items():
 assert word in allowed and word not in reviewed and word not in output
 output[word]=entry;evidence[word]=function_evidence[word]
from reviewed_common_constructions import load_common_constructions
common_rows,common_evidence,common_review=load_common_constructions(data,source)
for word,entry in common_rows.items():
 assert word in allowed and word not in reviewed and word not in output
 output[word]=entry;evidence[word]=common_evidence[word]


from english_noun_number_policy import apply_reviewed_noun_number
noun_number_review=apply_reviewed_noun_number(data,source,output,evidence)
files={f'src/data/spanish/english-translations/{n}.json':{w:output[w] for w in sorted(output) if len(w)==n} for n in [4,5,6,7]}
files['src/data/spanish/english-translation-audit.json']={'schemaVersion':2,'referenceFormat':'Local JSON Pointer: each additionalVerbReview.reviewHashesRef resolves to the exact shared top-level reviewHashes table; no source proof is omitted.','sourceManifestSha256':hashlib.sha256((data/'english-translation-source.json').read_bytes()).hexdigest(),'meaningOrFormWords':len(output),'subjectPolicySha256':subject_policy_sha,'verbReviewHashes':review_hashes,'nounReview':noun_review,'nounNumberReview':noun_number_review,'qualifiedEnglishSlots':qualified_review,'nonhumanPluralReview':nonhuman_review,'additionalNonhumanIndicativeReview':indicative_review,'nonhumanIndicative3Review':indicative3_review,'mianSpanishAdapterReview':mian_review,'functionWordReview':function_review,'commonConstructionReview':common_review,'cliticReview':clitic_review,'additionalCliticReview':extra_clitic_review,'additionalAccusativeReview':accusative_review,'deferredAccusativeReview':deferred_review,'spanishFormReview':foreign_review,'additionalVerbReview':additional_review,'synonymReview':synonym_review,'approvedVerbPairs':len(profiles),'limitations':'Selected English dictionary glosses, not necessarily one-word equivalents or all meanings. Form-only references without supported rendering and unresolved/qualified alternative references are not counted. Explicit spelling aliases retain source usage warnings and resolved target evidence. No example sentence or native/Mexico certification is invented. Source errors remain possible.','evidence':{w:evidence[w] for w in sorted(evidence)}}
for name,value in files.items():
 path=root/name;text=json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n'
 if args.check or (args.audit_only and not path.name.endswith('-audit.json')):assert path.read_text()==text,'Generated output differs: '+name
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
print('English semantic meaning/form words',len(output))
