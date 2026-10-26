#!/usr/bin/env python3
"""Check the frozen 16 animal readings, retained English and raw Spanish evidence.
No original English archive is read or claimed replayed. No app files are written.
Usage: python3 -B THIS.py --root CHECKOUT --spanish-source es-extract.jsonl.gz
"""
import argparse,copy,gzip,hashlib,json,sys
from pathlib import Path
sys.dont_write_bytecode=True
p=argparse.ArgumentParser();p.add_argument('--root',required=True,type=Path);p.add_argument('--spanish-source',required=True,type=Path);p.add_argument('--out',type=Path);args=p.parse_args();R=args.root.resolve();D=R/'src/data/spanish'
def digest(path):
 h=hashlib.sha256()
 with path.open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def read(name):return json.loads((D/name).read_text())
def need(ok,label):
 if not ok:raise AssertionError(label)
proposal='nonhuman-indicative2-proposals-standards.json';reviewname='nonhuman-indicative2-review-spec.json';a=read(proposal);review=read(reviewname);pins=a['sourcePins'];need(digest(D/proposal)=='23fc84357a949b0eaa4809b8b073c310c1d368a0228acf7a9bc03a21d4db9bb7','proposal hash');need(digest(D/reviewname)=='e12b4642544d6ab0b5422c6f9bb9dc75bb7adbbd666418f1c193a498c1847515','review hash');need(review['inputSha256']==digest(D/proposal)and review['reviewer']!=a['reviewer'],'independent review')
for pin,name in [('englishEvidenceSha256','english-translation-evidence.json'),('englishTablesSha256','english-form-tables.json'),('englishSourceManifestSha256','english-translation-source.json'),('existingSubjectPolicySha256','english-subject-policy.json'),('existing14PluralProposalSha256','nonhuman-plural-proposals-standards.json'),('existing14PluralReviewSha256','nonhuman-plural-review-spec.json')]:need(digest(D/name)==pins[pin],name)
need(digest(args.spanish_source)==pins['spanishArtifactSha256'],'original Spanish compressed artifact hash')
source=read('english-translation-evidence.json');tables=read('english-form-tables.json');need(tables['artifactSha256']==pins['englishArtifactSha256'],'retained English artifact identity');need(read('english-translation-source.json')['artifactSha256']==pins['englishArtifactSha256'],'English manifest identity');need(digest(D/'english-singular-proof-seed.json')=='c40d8e64200d3dd061973c351f7ea9a556867942a0d18141395157ee9ef69056','frozen inherited proof seed hash');audit=read('english-singular-proof-seed.json');policy=read('english-subject-policy.json');rules={r['id']:r for r in policy['entries']}
needed={r['recordSha256']for row in a['proposals']for family in ['lemmaRows','wordRows']for r in row['spanishRawCorroboration'][family]};raw={}
with gzip.open(args.spanish_source,'rb')as f:
 for line in f:
  h=hashlib.sha256(line).hexdigest()
  if h in needed:raw[h]=json.loads(line)
need(set(raw)==needed,'all Spanish raw lines');lex=lambda s:{k:v for k,v in s.items()if k!='examples'}
sys.path.insert(0,str(R/'scripts'));from english_form_rendering import load_agid,make_finite,source_features
from translation_subject_policy import load_subject_policy
from reviewed_nonhuman_indicatives import load_nonhuman_indicatives
agidpath=R/'public/third-party/apertium-translations/agid-infl.txt';need(digest(agidpath)==pins['agidDataSha256'],'AGID artifact');agid,q,lines=load_agid(agidpath.read_bytes());finite=make_finite(agid,q);word_entries=table_cells=0
for row in a['proposals']:
 e=row['sourceEvidence'];f=row['features'];w=row['word'];lr=[r for r in source['lemmas'][row['lemma']]if r['recordSha256']==e['lemmaRecordSha256']];need(len(lr)==1 and lr[0]==e['lemmaRow']and lr[0]['senses'][e['lemmaSenseIndex']]==e['sourceSense'],w+' retained English lemma')
 if e['tableForm']is None:
  wr=[r for r in source['acceptedRecords'][w]if r['recordSha256']==e['wordRecordSha256']];need(len(wr)==1 and wr[0]['word'].upper()==w and e['sourceForm']in wr[0]['senses'],w+' retained English word sense');word_entries+=1
 else:
  tr=[r for r in tables['records']if r['recordSha256']==e['wordRecordSha256']and r['word']==row['lemma']];need(len(tr)==1 and e['tableForm']in tr[0]['forms']and e['tableForm']['form'].upper()==w,w+' exact retained table cell');need(e['sourceForm']=={'tags':e['tableForm']['tags']+['form-of'],'glosses':['Explicit source inflection table'],'form_of':[{'word':row['lemma']}]},w+' table adapter')
  pseudo={'word':e['tableForm']['form'],'pos':'verb','recordSha256':e['wordRecordSha256'],'sourceArticle':row['lemma'],'tableForm':e['tableForm'],'senses':[e['sourceForm']]};source['acceptedRecords'].setdefault(w,[]).append(pseudo);table_cells+=1
 need(f['kind']=='finite'and f['mood']=='indicative'and f['person']=='third-person'and f['number']=='plural'and f['tense']in {'imperfect','preterite','future'},w+' approved feature scope')
 for family in ['lemmaRows','wordRows']:
  for rr in row['spanishRawCorroboration'][family]:
   r=raw[rr['recordSha256']];need(r['word']==rr['word']and r['pos']==rr['pos']and r.get('tags',[])==rr['wordTags']and r.get('raw_tags',[])==rr['wordRawTags']and [lex(s)for s in r['senses']]==rr['senses'],w+' Spanish raw fields')
 old=row['existingSelectedSingularEvidence'];need(old['proof']in audit['evidence'][old['word']],w+' inherited singular proof');sp=old['proof'];rule=rules[sp['subjectPolicy']['id']];need(rule['action']=='it-only'and rule['spanish']==row['lemma']and rule['recordSha256']==e['lemmaRecordSha256']and rule['frame']==row['frame'],w+' unchanged subject policy')
 inf=row['englishInflectionEvidence'];head=row['frame'].split(' ',1)[0];need((head,'V')not in q and inf['senseQualified']is False and agid[head,'V']==inf['closedParsedSlots']and lines[head,'V']==inf['agidRawLine']and hashlib.sha256(inf['agidRawLine'].encode()).hexdigest()==inf['agidLineSha256'],w+' AGID slots');need(row['english']in finite(row['frame'],f['tense'],'third-person','plural','ordinary',{'progressive'}),w+' exact English literal')
subject_rules,_=load_subject_policy(D,'english');resolve,proof=load_nonhuman_indicatives(D,source,agid,q,lines,finite,subject_rules);negative_count=0
for row in a['proposals']:
 e=row['sourceEvidence'];f=row['features'];features=next(z for z in source_features({'word':row['word'].lower(),'pos':'verb'},e['sourceForm'])if all(z.get(k)==f[k]for k in ['kind','tense','person','number']))
 need(not set(features['tags'])&{'usted-address','ustedes-address','imperative','subjunctive','reflexive','combined-form'},row['word']+' actual English feature tags')
 def call(ed='English',word=None,features_=None,hash_=None):return resolve(ed,word or row['word'],row['lemma'],e['lemmaRecordSha256'],e['sourceSense'],row['frame'],hash_ or e['wordRecordSha256'],e['sourceForm'],features_ or features,'it-only')
 selected=call();need(selected and selected['english']==[row['english']],row['word']+' actual helper output')
 for person in ['first-person','second-person']:
  bad=copy.deepcopy(features);bad['person']=person;need(call(features_=bad)is None,'no personal reading');negative_count+=1
 for badtense in ['imperative','subjunctive-present']:
  bad=copy.deepcopy(features);bad['tense']=badtense;need(call(features_=bad)is None,'no unsupported mood');negative_count+=1
 need(call(ed='Spanish')is None and call(word='MÍAN')is None and call(hash_='0'*64)is None,'no foreign/new word/raw hash');negative_count+=3
 if row['lemma']=='miar':need(selected['runtimeTags']==['Spanish corroborating source use: rare']and selected['sourceLinks']==[{'label':'Spanish selected animal meaning','url':'https://es.wiktionary.org/wiki/miar'}],'scoped MIAR rare/source link')
result={'status':'passed','reviewedWords':len(a['proposals']),'retainedEnglishWordSenses':word_entries,'retainedEnglishTableCells':table_cells,'freshSpanishRawRecords':len(raw),'helperNegativeCases':negative_count,'disclosure':'Retained pinned English extraction/tables and inherited proofs checked. Original 3GB English archive was not replayed. Spanish original compressed artifact checksum and selected raw lines freshly replayed.','sourceCheckerSha256':digest(Path(__file__)),'helperSha256':digest(R/'scripts/reviewed_nonhuman_indicatives.py'),'frozenSingularProofSeedSha256':digest(D/'english-singular-proof-seed.json'),'archivedSingularAuditScope':'Original archival digest remains in frozen proposal; frozen inherited singular proof seed values checked by membership, not falsely asserted as unchanged whole-audit digest.'}
if args.out:args.out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
