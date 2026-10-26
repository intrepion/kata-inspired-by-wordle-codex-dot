"""One exact Spanish-form/English-predicate bridge, modified CC BY-SA 4.0 data.
Not a claimed English word entry, generic adapter or global subject exception.
"""
import hashlib,json
from spanish_form_descriptions import normalize
from english_form_rendering import source_features

def load_mian_adapter(data,root,source,subject_rules,agid,qualified,agid_lines,finite,foreign_records):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='mian-foreign-animal-proposal-spec.json';rn='mian-foreign-animal-review-standards.json';digest=sha(name)
 assert digest=='b0b7af4e58b863b89c4e6c940d54f1999906260c60c318bdd9c3e14b03caaea4'and sha(rn)=='d2b307c1b832563a41d43abf902a5f0a063cbc32e4db8b8374590f26433ff48f'
 p=read(name);r=read(rn);assert r['inputSha256']==digest and p['reviewer']!=r['reviewer']and p['sourcePins']==r['sourcePins']
 pins=p['sourcePins'];assert pins['dataLicense']=='CC-BY-SA-4.0'
 for pin,file in [('englishEvidenceSha256','english-translation-evidence.json'),('englishSubjectPolicySha256','english-subject-policy.json'),('prior16ProposalSha256','nonhuman-indicative2-proposals-standards.json'),('prior16ReviewSha256','nonhuman-indicative2-review-spec.json')]:assert sha(file)==pins[pin]
 assert hashlib.sha256((root/'scripts/spanish_form_descriptions.py').read_bytes()).hexdigest()==pins['spanishNormalizerModuleSha256']
 assert read('spanish-form-source.json')['spanishArtifactSha256']==pins['spanishArtifactSha256']and read('english-translation-source.json')['artifactSha256']==pins['englishArtifactSha256']
 assert read('english-translation-source.json')['englishInflections']['dataSha256']==pins['agidDataSha256']
 assert len(p['proposals'])==len(r['approved'])==1 and not r['held'];a=p['proposals'][0];b=r['approved'][0]
 for k in ['word','lemma','frame','english','sourceAdapter','existingProfile','selectedSubject','selectedFeatures','context']:assert a[k]==b[k]
 assert a['word']=='MÍAN'and a['lemma']=='miar'and a['frame']=='meow'and a['english']=='they meow'and a['existingProfile']=='it-only'
 w=a['sourceWord'];animal=a['selectedSpanishAnimalMeaning'];ep=a['englishLemmaProof']
 assert w['recordSha256']==b['spanishFormRecordSha256']and a['sourceWordSenseIndex']==b['spanishFormSenseIndex']and w['senses'][a['sourceWordSenseIndex']]==a['sourceWordSense']
 assert animal['recordSha256']==b['spanishAnimalRecordSha256']and a['selectedSpanishAnimalSenseIndex']==b['spanishAnimalSenseIndex']and animal['senses'][a['selectedSpanishAnimalSenseIndex']]['tags']==['rare']
 assert ep['lemmaRecordSha256']==b['englishLemmaRecordSha256']and ep['lemmaSenseIndex']==b['englishLemmaSenseIndex']
 assert any(v['recordSha256']==ep['lemmaRecordSha256']and v['senses'][ep['lemmaSenseIndex']]==ep['sourceSense']for v in source['lemmas']['miar'])
 assert a['existingSubjectPolicy']['id']==b['existingSubjectPolicyId']and any(v==a['existingSubjectPolicy']for v in subject_rules.values())
 assert normalize('verb',a['sourceWordSense'],'miar')==a['sourceNormalization']
 matches=[v for v in foreign_records['MÍAN']if v['recordSha256']==w['recordSha256']];assert len(matches)==1;row=matches[0];form=row['spanishForm']
 assert row['word']==w['word']and row['pos']=='verb'and form['lemma']=='miar'and form['sense']==a['sourceWordSense']and form['normalized']==a['sourceNormalization']
 assert form['wordTags']==w['wordTags']and form['wordRawTags']==w['wordRawTags']and a['sourceFeatures']in source_features(row,row['senses'][0])
 inf=a['englishInflectionEvidence'];assert ('meow','V')not in qualified and inf['senseQualified']is False and agid['meow','V']==inf['closedParsedSlots']and agid_lines['meow','V']==inf['agidRawLine']and hashlib.sha256(inf['agidRawLine'].encode()).hexdigest()==inf['agidLineSha256']
 assert a['english']in finite('meow','present','third-person','plural','ordinary',set())
 proof={'candidateSha256':digest,'reviewSha256':sha(rn),'sourceAdapter':a['sourceAdapter'],'exactSelection':a,'scope':'Exact Spanish-edition MÍAN form only, existing English meow predicate and literal cats. Original English-only hold retained; no English whole-word attestation or original English archive replay claimed.'}
 frozen_row=json.dumps(row,ensure_ascii=False,sort_keys=True)
 def resolve(actual_row,features,lemma,lemma_row,lemma_sense,frame,profile):
  if actual_row['word'].upper()!='MÍAN':return None
  if json.dumps(actual_row,ensure_ascii=False,sort_keys=True)!=frozen_row or lemma!='miar'or lemma_row['recordSha256']!=ep['lemmaRecordSha256']or lemma_sense!=ep['sourceSense']or frame!='meow':return None
  assert profile=='it-only'
  if features!=a['sourceFeatures']:return None
  return {'english':['they meow'],'context':a['context'],'runtimeTags':['Spanish corroborating source use: rare'],'sourceLinks':a['sourceLinks'],'proof':proof}
 return resolve,proof
