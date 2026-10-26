"""Forty exact nonhuman plural readings / modified CC BY-SA 4.0 source data.
No general change to subject, mood, tense, clitic or foreign-form permissions.
Retained English word/table evidence is not a fresh full-archive replay.
"""
import json,hashlib
from urllib.parse import quote

def load_nonhuman_indicatives3(data,source,agid,qualified,agid_lines,finite,subject_rules):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='nonhuman-indicative3-proposals-standards.json';rn='nonhuman-indicative3-review-spec.json'
 digest=sha(name);assert digest=='0255a2a25fdbaa54c15a00f25ad857c595edf5a80d9787d8a90b372faa6bef22'
 assert sha(rn)=='6ed960c3232334579d9a805276171af02881a7cc124b97d236b41921ccf6a6db'
 p=read(name);review=read(rn);assert review['inputSha256']==digest and p['reviewer']!=review['reviewer']
 pins=p['sourcePins'];assert pins['dataLicense']=='CC-BY-SA-4.0'and review['sourcePins']==pins
 for pin,file in [('englishEvidenceSha256','english-translation-evidence.json'),('englishTablesSha256','english-form-tables.json'),('englishSourceManifestSha256','english-translation-source.json'),('existingSubjectPolicySha256','english-subject-policy.json'),('prior16ProposalSha256','nonhuman-indicative2-proposals-standards.json')]:assert sha(file)==pins[pin]
 assert read('english-translation-source.json')['artifactSha256']==pins['englishArtifactSha256']and read('spanish-derived-source.json')['artifactSha256']==pins['spanishArtifactSha256']
 assert read('english-translation-source.json')['englishInflections']['dataSha256']==pins['agidDataSha256']
 approvals={a['word']:a for a in review['approved']};assert len(approvals)==len(p['proposals'])==40
 display_file='rielan-display-context-review-standards.json';display_hash=sha(display_file);assert display_hash=='e5f61d58bcedb29a673ccf48ed5ac7cee98b6853dfbd2a99786a446aad821362'
 display=read(display_file);assert display['approved']and display['baseProposalSha256']==digest and display['baseReviewSha256']==sha(rn)
 rules={r['id']:r for r in subject_rules.values()};rows={}
 # The archived full audit hash describes the research baseline. Match the
 # exact frozen singular seed proof, independently reproducible from the pinned
 # proposals, rather than bootstrapping from a generated full audit.
 assert sha('english-singular-proof-seed.json')=='c40d8e64200d3dd061973c351f7ea9a556867942a0d18141395157ee9ef69056'
 inherited=read('english-singular-proof-seed.json')['evidence']
 for a in p['proposals']:
  b=approvals[a['word']];e=a['sourceEvidence'];f=a['features'];singular=a['existingSelectedSingularEvidence'];single=singular['proof']
  for field in ['word','lemma','frame','english','selectedSubject','features','aspectModes','context']:assert a[field]==b[field]
  for field in ['lemmaRecordSha256','lemmaSenseIndex','wordRecordSha256','sourceForm','tableForm']:assert e[field]==b[field]
  assert single in inherited[singular['word']]
  assert a['englishInflectionEvidence']['agidLineSha256']==b['agidLineSha256']
  assert a['existingProfile']=='it-only'and e['sourceEdition']=='English'and a['english'].startswith('they ')
  assert f=={'kind':'finite','tense':f['tense'],'mood':'indicative','person':'third-person','number':'plural'}and f['tense']in {'present','imperfect','preterite','future'}
  assert a['aspectModes']==(['progressive']if f['tense']=='imperfect'else [])
  assert single['features']['kind']=='finite'and single['features']['person']=='third-person'and single['features']['number']=='singular'
  assert single['lemmaRecordSha256']==e['lemmaRecordSha256']and single['englishLemma']==a['frame']
  if b['existingSubjectPolicyId']:
   assert single['subjectPolicy']['id']==b['existingSubjectPolicyId']and b['modelProfileAuthority']is None
   rule=rules[b['existingSubjectPolicyId']];assert rule['action']=='it-only'and rule['spanish']==a['lemma']and rule['recordSha256']==e['lemmaRecordSha256']and rule['frame']==a['frame']and rule['senseKey']==json.dumps(e['sourceSense'],ensure_ascii=False,sort_keys=True)
  else:
   assert a['lemma']in {'desovar','ratonar','caducar'}and single['subjectPolicy']is None
   authority=b['modelProfileAuthority'];assert authority and authority['files']
   for n,h in authority['files'].items():assert sha(n)==h
   model=a['sourceSubjectEvidence']['existingLiteralSubjectPolicy'];assert model['effectiveProfile']=='it-only'and model['pinnedSingularAuditProof']==singular
  assert any(r['recordSha256']==e['lemmaRecordSha256']and r['senses'][e['lemmaSenseIndex']]==e['sourceSense']for r in source['lemmas'][a['lemma']])
  matches=[r for r in source['acceptedRecords'][a['word']]if r['recordSha256']==e['wordRecordSha256']and e['sourceForm']in r['senses']and r.get('tableForm')==e['tableForm']];assert len(matches)==1
  head=a['frame'].split(' ',1)[0];inf=a['englishInflectionEvidence'];assert (head,'V')not in qualified and inf['senseQualified']is False and agid[head,'V']==inf['closedParsedSlots']and agid_lines[head,'V']==inf['agidRawLine']and hashlib.sha256(inf['agidRawLine'].encode()).hexdigest()==inf['agidLineSha256']
  assert a['english']in finite(a['frame'],f['tense'],'third-person','plural','ordinary',set(a['aspectModes']))
  usage=[];links=[]
  if a['lemma']=='grillar':
   selected=next(r for r in a['sourceSubjectEvidence']['spanishCorroboratingRawLemmaInventory']if r['recordSha256']=='7f937ab765d04714cf2862bbdd6f9f8b7fb90a46ae22f835efddf641b2f3a5b8')
   assert selected['senses'][0]['glosses']==['Emitir su sonido el grillo.']and selected['senses'][0]['tags']==['outdated']
   usage=['Spanish corroborating source use: outdated'];links=[{'label':'Spanish selected cricket meaning','url':'https://es.wiktionary.org/wiki/'+quote(a['lemma'])}]
  context=a['context']
  if a['word']=='RIELAN':
   assert a['context']==display['originalReviewedContext']and a['english']==display['english']and e['lemmaRecordSha256']==display['sourceIdentity']['englishLemmaRecordSha256']and e['wordRecordSha256']==display['sourceIdentity']['englishWordRecordSha256']
   context=display['approvedDisplayContext'];usage.append('Spanish corroborating source use: literary');links.append({'label':'Spanish selected literary meaning','url':'https://es.wiktionary.org/wiki/rielar'})
  assert a['word']not in rows;rows[a['word']]=(a,usage,links,context)
 proof={'candidateSha256':digest,'reviewSha256':sha(rn),'displayReviewSha256':display_hash,'words':sorted(rows),'scope':'Forty exact they-only nonhuman indicative readings; original singular and held forms remain unchanged. English word/table evidence retained and pinned; Spanish corroboration separately replayed. No fresh full English archive replay or example sentences.'}
 def resolve(edition,word,lemma,lemma_hash,lemma_sense,frame,word_hash,word_sense,features,profile):
  value=rows.get(word)
  if not value or edition!='English':return None
  a,usage,links,context=value;e=a['sourceEvidence']
  if lemma!=a['lemma']or frame!=a['frame']or lemma_hash!=e['lemmaRecordSha256']or lemma_sense!=e['sourceSense']or word_hash!=e['wordRecordSha256']or word_sense!=e['sourceForm']:return None
  assert profile=='it-only'
  if any(features.get(k)!=v for k,v in a['features'].items()if k!='mood')or 'indicative'not in features.get('tags',[]):return None
  return {'english':[a['english']],'context':context,'runtimeTags':usage,'sourceLinks':links,'scopeLabel':'reviewed plural nonhuman subjects','scopeNote':'Exact reviewed plural nonhuman subject; other subject and tense uses remain distinct','proof':{'candidateSha256':digest,'reviewSha256':proof['reviewSha256'],'exactSelection':a,**({'displayReviewSha256':display_hash,'runtimeContext':context}if context!=a['context']else {})}}
 return resolve,proof
