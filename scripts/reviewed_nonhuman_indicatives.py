"""Sixteen exact selected animal plural readings / modified CC BY-SA 4.0 data.
No global subject-profile change, foreign adapter or new inflection authority.
English evidence is retained, not a new full-English-archive replay.
"""
import json,hashlib
from urllib.parse import quote

def load_nonhuman_indicatives(data,source,agid,qualified,agid_lines,finite,subject_rules):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='nonhuman-indicative2-proposals-standards.json';rn='nonhuman-indicative2-review-spec.json'
 digest=sha(name);assert digest=='23fc84357a949b0eaa4809b8b073c310c1d368a0228acf7a9bc03a21d4db9bb7'
 assert sha(rn)=='e12b4642544d6ab0b5422c6f9bb9dc75bb7adbbd666418f1c193a498c1847515'
 p=read(name);review=read(rn);assert review['inputSha256']==digest and p['reviewer']!=review['reviewer']
 pins=p['sourcePins'];assert pins['dataLicense']=='CC-BY-SA-4.0'
 for pin,file in [('englishEvidenceSha256','english-translation-evidence.json'),('englishTablesSha256','english-form-tables.json'),('englishSourceManifestSha256','english-translation-source.json'),('existingSubjectPolicySha256','english-subject-policy.json'),('existing14PluralProposalSha256','nonhuman-plural-proposals-standards.json'),('existing14PluralReviewSha256','nonhuman-plural-review-spec.json')]:assert sha(file)==pins[pin]
 assert read('english-translation-source.json')['artifactSha256']==pins['englishArtifactSha256']and read('spanish-derived-source.json')['artifactSha256']==pins['spanishArtifactSha256']
 assert read('english-translation-source.json')['englishInflections']['dataSha256']==pins['agidDataSha256']
 approvals={a['word']:a for a in review['approved']};assert len(approvals)==len(p['proposals'])==16
 rules={r['id']:r for r in subject_rules.values()};rows={}
 for a in p['proposals']:
  b=approvals[a['word']];e=a['sourceEvidence'];f=a['features'];single=a['existingSelectedSingularEvidence']['proof']
  for field in ['word','lemma','frame','english','selectedSubject','features','context']:assert a[field]==b[field]
  for field in ['lemmaRecordSha256','lemmaSenseIndex','wordRecordSha256','sourceForm','tableForm']:assert e[field]==b[field]
  assert a['englishInflectionEvidence']['agidLineSha256']==b['agidLineSha256']and single['subjectPolicy']['id']==b['existingSubjectPolicyId']
  assert a['existingProfile']=='it-only'and e['sourceEdition']=='English'and a['english'].startswith('they ')
  assert f=={'kind':'finite','tense':f['tense'],'mood':'indicative','person':'third-person','number':'plural'}and f['tense']in {'imperfect','preterite','future'}
  # The archived singular proves this lexical subject/frame, not every new
  # tense. Each new tense is separately bound to its exact attested form below.
  assert single['features']['kind']=='finite'and single['features']['person']=='third-person'and single['features']['number']=='singular'
  assert single['lemmaRecordSha256']==e['lemmaRecordSha256']and single['englishLemma']==a['frame']
  rule=rules[single['subjectPolicy']['id']];assert rule['action']=='it-only'and rule['spanish']==a['lemma']and rule['recordSha256']==e['lemmaRecordSha256']and rule['frame']==a['frame']and rule['senseKey']==json.dumps(e['sourceSense'],ensure_ascii=False,sort_keys=True)
  assert any(r['recordSha256']==e['lemmaRecordSha256']and r['senses'][e['lemmaSenseIndex']]==e['sourceSense']for r in source['lemmas'][a['lemma']])
  matches=[r for r in source['acceptedRecords'][a['word']]if r['recordSha256']==e['wordRecordSha256']and e['sourceForm']in r['senses']and r.get('tableForm')==e['tableForm']];assert len(matches)==1
  head=a['frame'].split(' ',1)[0];inf=a['englishInflectionEvidence'];assert (head,'V')not in qualified and inf['senseQualified']is False and agid[head,'V']==inf['closedParsedSlots']and agid_lines[head,'V']==inf['agidRawLine']and hashlib.sha256(inf['agidRawLine'].encode()).hexdigest()==inf['agidLineSha256']
  # Verify a frozen literal only; this local rendering never authorizes an
  # ordinary profile in the game/compiler's general subject policy.
  assert a['english']in finite(a['frame'],f['tense'],'third-person','plural','ordinary',{'progressive'})
  usage=[];links=[]
  if a['lemma']=='miar':
   selected=next(r for r in a['spanishRawCorroboration']['lemmaRows']if r['recordSha256']=='01662fc31a0c5eaa3b0a07fad7068e2cd756be574a053f8e84fb447fc305cbd7')
   assert selected['senses'][0]['glosses']==['Emitir su voz el gato, similar a la onomatopeya miau.']and selected['senses'][0]['tags']==['rare']
   usage=['Spanish corroborating source use: rare'];links=[{'label':'Spanish selected animal meaning','url':'https://es.wiktionary.org/wiki/'+quote(a['lemma'])}]
  assert a['word']not in rows;rows[a['word']]=(a,usage,links)
 proof={'candidateSha256':digest,'reviewSha256':sha(rn),'words':sorted(rows),'scope':'Exact they-only indicative animal readings; old singular restrictions remain. English word/table evidence retained and pinned; Spanish corroboration separately replayed. No fresh full English archive replay or example sentences.'}
 def resolve(edition,word,lemma,lemma_hash,lemma_sense,frame,word_hash,word_sense,features,profile):
  value=rows.get(word)
  if not value or edition!='English':return None
  a,usage,links=value;e=a['sourceEvidence']
  if lemma!=a['lemma']or frame!=a['frame']or lemma_hash!=e['lemmaRecordSha256']or lemma_sense!=e['sourceSense']or word_hash!=e['wordRecordSha256']or word_sense!=e['sourceForm']:return None
  assert profile=='it-only'
  if any(features.get(k)!=v for k,v in a['features'].items()if k!='mood')or 'indicative'not in features.get('tags',[]):return None
  return {'english':[a['english']],'context':a['context'],'runtimeTags':usage,'sourceLinks':links,'proof':{'candidateSha256':digest,'reviewSha256':proof['reviewSha256'],'exactSelection':a}}
 return resolve,proof
