"""Compile source-bound model translations of Spanish Wiktionary senses.
Modified dictionary data: Wiktionary contributors / CC BY-SA 4.0. No invented
English dictionary attribution, examples, human/native certification or fallback.
"""
from pathlib import Path
import json,hashlib,argparse,re,unicodedata
from urllib.parse import quote
from spanish_form_descriptions import normalize
from translation_subject_policy import selected_grammar_tags
from english_form_rendering import load_agid,make_finite,source_features
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');p.add_argument('--audit-only',action='store_true');args=p.parse_args();R=Path(__file__).resolve().parent.parent;D=R/'src/data/spanish'
def read(n):return json.loads((D/n).read_text())
def sha(n):return hashlib.sha256((D/n).read_bytes()).hexdigest()
def exported(n):return json.loads((D/n).read_text().split(' = ',1)[1].strip().removesuffix(';'))
allowed={w for row in exported('vocabulary.ts').values() for w in row['guesses']};reviewed={**exported('learning.ts'),**exported('additional-teaching.ts')}
from spanish_derived_batches import load_reviewed_spanish_batch
profiles,source_forms,first_batch=load_reviewed_spanish_batch(D,R);batch_proofs=[first_batch];review_hashes=dict(first_batch['reviewHashes'])
if (D/'spanish-derived-2-candidates.json').exists():
 next_profiles,next_forms,next_proof=load_reviewed_spanish_batch(D,R,2)
 assert not set(profiles)&set(next_profiles),'Spanish review batches overlap'
 profiles.update(next_profiles);source_forms.extend(next_forms);batch_proofs.append(next_proof);review_hashes.update(next_proof['reviewHashes'])
from spanish_derived_cross_review import cross_reviewed_spanish_profiles
cross_proofs=[]
for cross_batch in [1,2]:
 if not (D/f'spanish-derived-cross-{cross_batch}-candidates.json').exists():continue
 extra_profiles,extra_proof=cross_reviewed_spanish_profiles(D,cross_batch)
 assert not set(profiles)&set(extra_profiles),'Spanish cross-review would overwrite an admitted profile'
 profiles.update(extra_profiles);cross_proofs.append(extra_proof);review_hashes.update(extra_proof['reviewHashes'])
from new_spanish_frames import load_new_spanish_frames
new_profiles,new_forms,new_frames_proof=load_new_spanish_frames(D,R)
assert not set(profiles)&set(new_profiles),'New reviewed profile would overwrite an admitted reading'
profiles.update(new_profiles);source_forms.extend(new_forms);review_hashes.update(new_frames_proof['reviewHashes'])
from additional_spanish_frames import load_additional_spanish_frames
extra_profiles,extra_forms,extra_frames_proof=load_additional_spanish_frames(D,R)
assert not set(profiles)&set(extra_profiles),'Additional frames would overwrite an admitted profile'
profiles.update(extra_profiles);source_forms.extend(extra_forms);review_hashes.update(extra_frames_proof['reviewHashes'])
from personal_spanish_frames import load_personal_spanish_frames
personal_profiles,personal_forms,personal_frames_proof=load_personal_spanish_frames(D,R)
assert not set(profiles)&set(personal_profiles),'Personal frames would overwrite an admitted profile'
profiles.update(personal_profiles);source_forms.extend(personal_forms);review_hashes.update(personal_frames_proof['reviewHashes'])
agid_raw=(R/'public/third-party/apertium-translations/agid-infl.txt').read_bytes();english_manifest=read('english-translation-source.json');assert hashlib.sha256(agid_raw).hexdigest()==english_manifest['englishInflections']['dataSha256'];agid,qualified,agid_lines=load_agid(agid_raw);finite=make_finite(agid,qualified);output={};proof={}
from qualified_english_slots import load_qualified_slots
qualified_for,qualified_review=load_qualified_slots(D,R,read('english-translation-evidence.json'),agid,qualified)
from merar_qualified_slots import load_merar_slots
merar_for,merar_review=load_merar_slots(D,R,profiles,agid,qualified)
from reviewed_nonhuman_plurals import load_nonhuman_plurals
nonhuman_for,nonhuman_review=load_nonhuman_plurals(D)
clause_labels={'subjunctive-present':'selected formal desired/required that-clause reading','subjunctive-imperfect':'selected hypothetical if-clause reading; not a past-time assertion','subjunctive-future':'selected formal/legal/literary contingent if-clause reading; should is not obligation'}
def append(word,profile,texts,features,source_form=None,qualified_selection=None,plural_selection=None):
 if word not in allowed or word in reviewed or not texts:return
 row=profile['sourceRow'];sense=profile['sourceSense'];notes=(['Exact reviewed plural animal/plant subject; other subject and tense uses remain distinct'] if plural_selection else list(dict.fromkeys(x['notes'] for x in profile['reviewEvidence'] if x.get('notes'))));usage=list(dict.fromkeys(row['wordTags']+row['wordRawTags']+sense.get('tags',[])+sense.get('raw_tags',[])))
 if profile.get('sourceMetadataConflict'):usage=[t for t in usage if t not in {'intransitive'}]+[profile['sourceMetadataConflict']]
 tags=['model-translated Spanish meaning; not copied English dictionary text','selected grammatical reading, not an example sentence']+selected_grammar_tags(features,profile['profile'])+['meaning context: '+(plural_selection['context'] if plural_selection else profile['context'])]+['source use: '+t for t in usage]+notes
 if features.get('tense') in clause_labels:tags.append(clause_labels[features['tense']])
 if features.get('tense')=='imperfect':tags.append('selected background-state or ongoing-event reading')
 if source_form:tags+=['form source use: '+t for t in source_form['wordTags']+source_form['wordRawTags'] if t not in features.get('tags',[])]
 tags=sorted(set(tags));target=output.setdefault(word,{'sourceUrl':'https://es.wiktionary.org/wiki/'+quote(profile['spanish']),'sourceLinks':[],'senses':[]});value={'partOfSpeech':profile['partOfSpeech'],'senseIndex':str(len(target['senses'])+1),'english':texts,'tags':tags}
 if any(s['partOfSpeech']==value['partOfSpeech'] and s['english']==texts and s['tags']==tags for s in target['senses']):return
 for label,url in ([('Spanish resolved meaning','https://es.wiktionary.org/wiki/'+quote(profile['newFrameReview']['meaningResolution']['selectedTarget']['word']))] if profile.get('newFrameReview',{}).get('meaningResolution') else [])+[('Spanish lemma meaning','https://es.wiktionary.org/wiki/'+quote(profile['spanish']))]+([('Spanish form evidence','https://es.wiktionary.org/wiki/'+quote(source_form['sourceWord']))] if source_form else []):
  if url!=target['sourceUrl'] and not any(x['url']==url for x in target['sourceLinks']):target['sourceLinks'].append({'label':label,'url':url})
 target['senses'].append(value);proof.setdefault(word,[]).append({'spanishLemma':profile['spanish'],'partOfSpeech':profile['partOfSpeech'],'reviewBatch':profile['reviewBatch'],'crossReviewSha256':profile.get('crossReviewSha256'),'selectedRecordSha256':profile['recordSha256'],'senseIndex':profile['senseIndex'],'sourceSense':sense,'modelEnglishFrame':profile['frame'],'profile':profile['profile'],'aspectModes':profile['aspectModes'],'features':features,'wordSource':source_form,'english':texts,'priorSingularProfileReviewEvidence':profile['reviewEvidence'] if plural_selection else None,'nonhumanPluralReview':plural_selection['proof'] if plural_selection else None,'qualifiedSlotReview':qualified_selection['proof'] if qualified_selection else None,'agidLine':agid_lines.get((profile['frame'].split(' ',1)[0],'V')),**({'newFrameReview':profile['newFrameReview'],'sourceRowUsageInventory':row['wordTags']+row['wordRawTags']}if profile.get('newFrameReview')else{})})
for (lemma,pos),profile in profiles.items():append(lemma.upper(),profile,[('to ' if pos=='verb' else '')+profile['frame']],{'kind':'lexical','tags':['selected dictionary lemma meaning']})
for form in source_forms:
 key=(form['spanishLemma'],form['partOfSpeech']);profile=profiles.get(key)
 if not profile:continue
 norm=normalize(key[1],form['sourceSense'],key[0]);assert norm==form['normalized'];usage=set(form['wordTags']+form['wordRawTags']+form['sourceSense'].get('tags',[])+form['sourceSense'].get('raw_tags',[]))
 if usage&{'reflexive','pronominal','combined-form','negative','passive','compound'}:continue
 pseudo={'word':form['sourceWord'],'pos':key[1]};sense={'glosses':form['sourceSense'].get('glosses',[]),'tags':norm['tags']+['form-of']};frame=profile['frame'];en=frame.split(' ',1)[0];tail=' '+frame.split(' ',1)[1] if ' ' in frame else '';f=agid.get((en,'V'),[])
 selected_slots=qualified_for('reviewed-spanish',profile['spanish'],profile['recordSha256'],profile['sourceSense'],frame,profile['profile']) or merar_for(profile,form);chosen_finite=selected_slots['finite'] if selected_slots else finite
 if selected_slots:f=selected_slots['slots']
 for features in source_features(pseudo,sense):
  texts=None
  if key[1]=='adj' and features['kind']=='agreement':texts=[frame]
  elif en=='die' and not selected_slots:continue # No unreviewed sense-qualified dying/dieing choice.
  elif features['kind']=='finite':texts=chosen_finite(frame,features['tense'],features['person'],features['number'],profile['profile'],set(profile['aspectModes']))
  elif features['kind']=='gerund':texts=['being'+tail] if en=='be' else [x+tail for x in f[2]] if len(f)==4 else None
  elif features['kind']=='participle':texts=['been'+tail] if en=='be' else [x+tail for x in f[1]] if len(f)==4 and ((en,'V') not in qualified or selected_slots) else None
  plural_selection=nonhuman_for('Spanish',form['word'],profile['spanish'],profile['recordSha256'],profile['sourceSense'],frame,form['wordRecordSha256'],form['sourceSense'],features,profile['profile'])
  if plural_selection:texts=plural_selection['english']
  append(form['word'],profile,texts,features,form,selected_slots,plural_selection)
from direct_spanish_meanings import direct_spanish_meanings
direct_words,direct_evidence,direct_review=direct_spanish_meanings(D,allowed,reviewed)
for word,entry in direct_words.items():
 previous=output.get(word);previous_proof=proof.get(word,[])
 if previous:
  # Keep the established direct lexical meaning first and add independently
  # supported homograph forms without losing either source citation.
  for old_sense in previous['senses']:
   old_sense={**old_sense,'senseIndex':str(len(entry['senses'])+1)}
   if not any(v['partOfSpeech']==old_sense['partOfSpeech']and v['english']==old_sense['english']and v['tags']==old_sense['tags']for v in entry['senses']):entry['senses'].append(old_sense)
  for link in [{'label':'Spanish verb meaning','url':previous['sourceUrl']}]+previous.get('sourceLinks',[]):
   if link['url']!=entry['sourceUrl']and not any(v['url']==link['url']for v in entry['sourceLinks']):entry['sourceLinks'].append(link)
 output[word]=entry;proof[word]=direct_evidence[word]+previous_proof
files={f'src/data/spanish/spanish-derived-translations/{n}.json':{w:output[w] for w in sorted(output) if len(w)==n} for n in [4,5,6,7]};files['src/data/spanish/spanish-derived-translation-audit.json']={'sourceManifestSha256':sha('spanish-derived-source.json'),'candidateSha256':sha('spanish-derived-candidates.json'),'reviewHashes':review_hashes,'dualApprovalSha256':sha('spanish-derived-dual-approval.json'),'batches':batch_proofs,'crossReviews':cross_proofs,'qualifiedEnglishSlots':qualified_review,'nonhumanPluralReview':nonhuman_review,'merarQualifiedSlots':merar_review,'directLexicalReview':direct_review,'newFrameReview':new_frames_proof,'additionalFrameReview':extra_frames_proof,'personalFrameReview':personal_frames_proof,'approvedLexicalReadings':len(profiles),'meaningOrFormWords':len(output),'limitations':'Original model English translations of selected Spanish Wiktionary senses plus guarded source-explicit morphology. General Spanish, partial selected readings, not English dictionary quotations, example sentences or human/native-Mexican certification. Unsupported predicates, subject constructions and English inflections remain unavailable.','evidence':dict(sorted(proof.items()))}
for name,obj in files.items():
 path=R/name;text=json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n'
 if args.check or (args.audit_only and not path.name.endswith('-audit.json')):assert path.read_text()==text,'Regenerate '+name
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
print('Approved lexical readings',len(profiles),'supported Spanish-derived meaning/form words',len(output))
