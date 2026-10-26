#!/usr/bin/env python3
import json,hashlib,gzip,sys,argparse
sys.dont_write_bytecode=True
from pathlib import Path
ap=argparse.ArgumentParser(description='Read-only replay for 40 exact nonhuman indicative readings; no original English archive replay.')
ap.add_argument('--root',type=Path,required=True);ap.add_argument('--proposal',type=Path,required=True);ap.add_argument('--review',type=Path,required=True);ap.add_argument('--spanish-source',type=Path,required=True);ap.add_argument('--out',type=Path);args=ap.parse_args()
p=args.proposal;blob=p.read_bytes();x=json.loads(blob);digest=hashlib.sha256(blob).hexdigest();assert digest=='0255a2a25fdbaa54c15a00f25ad857c595edf5a80d9787d8a90b372faa6bef22'
R=args.root.resolve();D=R/'src/data/spanish'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
read=lambda n:json.loads((D/n).read_text());pins=x['sourcePins']
assert sha(args.review)=='6ed960c3232334579d9a805276171af02881a7cc124b97d236b41921ccf6a6db'
review=json.loads(args.review.read_bytes());assert review['inputSha256']==digest and review['reviewer']!=x['reviewer']
assert sha(args.spanish_source)==pins['spanishArtifactSha256']

for pin,name in [('englishEvidenceSha256','english-translation-evidence.json'),('englishTablesSha256','english-form-tables.json'),('englishSourceManifestSha256','english-translation-source.json'),('existingSubjectPolicySha256','english-subject-policy.json')]:assert sha(D/name)==pins[pin],name
source=read('english-translation-evidence.json');tables=read('english-form-tables.json');assert sha(D/'english-singular-proof-seed.json')=='c40d8e64200d3dd061973c351f7ea9a556867942a0d18141395157ee9ef69056';audit=read('english-singular-proof-seed.json');policy={r['id']:r for r in read('english-subject-policy.json')['entries']};coverage_now=read('translation-coverage-audit.json');missing=set(coverage_now['uncoveredWords']);assert tables['artifactSha256']==pins['englishArtifactSha256']
wanted={r['recordSha256']for a in x['proposals']for r in a['spanishRawFormCorroboration']+a['sourceSubjectEvidence']['spanishCorroboratingRawLemmaInventory']};raw={}
with gzip.open(args.spanish_source,'rb')as f:
 for line in f:
  h=hashlib.sha256(line).hexdigest()
  if h in wanted:raw[h]=json.loads(line)
assert set(raw)==wanted;lex=lambda s:{k:v for k,v in s.items()if k!='examples'}
sys.path.insert(0,str(R/'scripts'));from english_form_rendering import load_agid,make_finite,source_features
from spanish_form_descriptions import normalize
agidpath=R/'public/third-party/apertium-translations/agid-infl.txt';assert sha(agidpath)==pins['agidDataSha256'];agid,q,lines=load_agid(agidpath.read_bytes());finite=make_finite(agid,q)
# Validate actual preexisting model authority for the three no-correction-ID cases.
modelproof={}
for lemma,batch,frame in [('ratonar',3,'gnaw')]:
 files=[f'english-additional-verb-{batch}-review-{role}.json'for role in ['spec','standards']];rs=[next(v for v in read(n)['approved']if v['spanish']==lemma)for n in files];assert all(v['frame']==frame and v['profile']=='it-only'for v in rs);merged=read(f'english-additional-verb-{batch}-dual-approval.json');assert any(v['spanish']==lemma and v['frame']==frame and v['profile']=='it-only'for v in merged['approved']);modelproof[lemma]={'origin':'Exact two-author additional-verb model and merged registry; no corrective ID.','files':{n:sha(D/n)for n in files+[f'english-additional-verb-{batch}-dual-approval.json']}}
files=['english-verb-review-spec.json','english-verb-review-standards.json'];rs=[next(v for v in read(n)['approvedPairs']if v['spanish']=='caducar'and v['english']=='expire')for n in files];assert rs[0]['profile']=='ordinary'and rs[1]['profile']=='it-only';modelproof['caducar']={'origin':'Original dual-review conservative profile intersection: ordinary plus it-only yields it-only; no corrective ID.','files':{n:sha(D/n)for n in files}}
files=['english-additional-verb-4-review-spec.json','english-verb-cross-4-candidates.json','english-verb-cross-4-review.json'];sp=next(v for v in read(files[0])['approved']if v['spanish']=='desovar');cross=next(v for v in read(files[1])['roots']if v['source']['spanish']=='desovar');approval=next(v for v in read(files[2])['approved']if v['spanish']=='desovar');assert sp==cross['proposed']and sp['frame']=='spawn'and sp['profile']=='it-only'and set(approval['aspectModes'])<=set(sp['aspectModes']);modelproof['desovar']={'origin':'Spec exact spawn/it-only proposal independently confirmed by Standards cross-review; old lay-eggs proposal remains archival, no corrective ID.','files':{n:sha(D/n)for n in files}}
notes={
'aovar':'Literal egg-laying animals, not human ovulation; Spanish lemma is no-gloss, so English retained sense/model supplies semantic authority.',
'melar':'Bees fill honeycombs; not a human beekeeper filling a container. Spanish lemma is no-gloss, not an independent semantic proof.',
'cocear':'Animals kick with feet/hooves; unselected human/figurative uses do not broaden this exception.',
'desovar':'Female fish/amphibians release eggs; model already it-only and no correction ID invented.',
'gorjear':'Bird calls only; infant speech, throat ornament and old mockery senses remain unselected.',
'graznar':'Literal harsh bird cries, not human complaining.',
'arruar':'Wild boars grunt; preserve explicit boar/hunting context, not human vocal imitation.',
'grillar':'Cricket chirping only; preserve selected Spanish outdated label and exclude culinary grilling labels.',
'amblar':'Quadruped lateral gait, not humans strolling or obsolete bodily sense.',
'zurear':'Pigeons/turtledoves coo; no human or infant use.',
'cornear':'Horned animals gore an unspecified patient. English retained horns definition/model is authority; Spanish variant pointer is not silently expanded.',
'ratonar':'Mice gnaw a contextual object; model already it-only, not human nibbling and no correction ID.',
'frezar':'Selected fish spawning English frame, not every other Spanish frezar operation.',
'pastear':'Animals eat pasture, not a farmer causing grazing.',
'parpar':'Literal duck quacking, not human imitation.',
'clocar':'Hens cluck, especially brooding; exact CLUECAN source spelling, no stem rule.',
'miañar':'Cats meow; Ñ preserved, not a spelling alias inferred from miar.',
'grajear':'Corvid birds caw; no human voice metaphor.',
'roznar':'Donkeys bray; English retained sense/model is authority where Spanish inventory has no gloss.',
'chozpar':'Lambs/goats and similar animals frolic with hops; happily is source-supported, not invented human emotion.',
'apeonar':'Birds run on the ground; English explicit bird sense/model is authority where Spanish lemma is no-gloss.',
'crujir':'Materials/objects or body parts emit creaks/cracks; not an unrestricted whole-person agent.',
'embeber':'Porous solids absorb liquid, retaining absorber/patient roles rather than human imbibing or reversed impregnation.',
'lindar':'Adjacent land/buildings/territories abut; no personal metaphor or invented specific boundary.',
 'titilar':'Light sources vary in intensity; not people trembling or emotional twinkling.',
'fluir':'Literal liquids flow, not personal conversational or abstract fluency.',
'relucir':'Nonhuman surfaces reflect light, not human figurative distinction.',
'resalir':'Architectural/physical parts jut out, not recurrence or limitless action.',
'verdear':'Things become green; no transitive harvesting meaning or Córdoba/Seville labels transferred.',
'caducar':'Legal instruments lose validity; model already it-only, no human death/senility or invented correction ID.',
'rielar':'Literal tremulous/reflected light; preserve English poetic and selected Spanish literary register.'}
approved=[];word_count=table_count=0;semantic_gaps=set()
for i,a in enumerate(x['proposals']):
 e=a['sourceEvidence'];f=a['features'];w=a['word'];assert a['existingProfile']=='it-only'and f['kind']=='finite'and f['mood']=='indicative'and f['person']=='third-person'and f['number']=='plural'and f['tense']in {'present','imperfect','preterite','future'}
 assert set(a['aspectModes'])==({'progressive'}if f['tense']=='imperfect'else set())
 lr=[r for r in source['lemmas'][a['lemma']]if r['recordSha256']==e['lemmaRecordSha256']];assert len(lr)==1 and lr[0]==e['lemmaRow']and lr[0]['senses'][e['lemmaSenseIndex']]==e['sourceSense']
 if e['tableForm']is None:
  wr=[r for r in source['acceptedRecords'][w]if r['recordSha256']==e['wordRecordSha256']];assert len(wr)==1 and wr[0]['word'].upper()==w and e['sourceForm']in wr[0]['senses'];word_count+=1
 else:
  tr=[r for r in tables['records']if r['recordSha256']==e['wordRecordSha256']and r['word']==a['lemma']];assert len(tr)==1 and e['tableForm']in tr[0]['forms']and e['tableForm']['form'].upper()==w;table_count+=1
 assert any(all(z.get(k)==f[k]for k in ['kind','tense','person','number'])for z in source_features({'word':w.lower(),'pos':'verb'},e['sourceForm']))
 for rr in a['spanishRawFormCorroboration']+a['sourceSubjectEvidence']['spanishCorroboratingRawLemmaInventory']:
  r=raw[rr['recordSha256']];assert r['word']==rr['word']and r['pos']==rr['pos']and r.get('tags',[])==rr['wordTags']and r.get('raw_tags',[])==rr['wordRawTags']and [lex(s)for s in r['senses']]==rr['senses']
 for match in a['spanishRawIndicativeMatches']:
  ss=raw[match['recordSha256']]['senses'][match['senseIndex']];assert lex(ss)==match['sourceSense']and normalize('verb',ss,a['lemma'])==match['normalized'];tags=set(match['normalized']['tags']);assert {'third-person','plural','indicative',f['tense'] if f['tense']!='preterite'else'preterite'}<=tags
 if not any(s.get('glosses')for rr in a['sourceSubjectEvidence']['spanishCorroboratingRawLemmaInventory']for s in rr['senses']):semantic_gaps.add(a['lemma'])
 single=a['existingSelectedSingularEvidence'];sp=single['proof'];assert sp in audit['evidence'][single['word']]and sp['lemmaRecordSha256']==e['lemmaRecordSha256']and sp['englishLemma']==a['frame']and sp['features']['kind']=='finite'and sp['features']['person']=='third-person'and sp['features']['number']=='singular'
 subject=a['sourceSubjectEvidence']['existingLiteralSubjectPolicy'];pid=(sp.get('subjectPolicy')or{}).get('id')
 if pid:assert subject==policy[pid]and subject['action']=='it-only'and subject['spanish']==a['lemma']and subject['recordSha256']==e['lemmaRecordSha256']and subject['frame']==a['frame']
 else:assert a['lemma']in modelproof and subject['effectiveProfile']=='it-only'and subject['pinnedSingularAuditProof']==single
 inf=a['englishInflectionEvidence'];head=a['frame'].split(' ',1)[0];assert (head,'V')not in q and inf['senseQualified']is False and lines[head,'V']==inf['agidRawLine']and hashlib.sha256(inf['agidRawLine'].encode()).hexdigest()==inf['agidLineSha256']and agid[head,'V']==inf['closedParsedSlots'];assert a['english']in finite(a['frame'],f['tense'],'third-person','plural','ordinary',set(a['aspectModes']))and a['english'].startswith('they ')
 approved.append({**{k:a[k]for k in ['word','lemma','frame','english','selectedSubject','features','aspectModes','context']},'proposalIndex':i,**{k:e[k]for k in ['lemmaRecordSha256','lemmaSenseIndex','wordRecordSha256','sourceForm','tableForm']},'agidLineSha256':inf['agidLineSha256'],'existingSubjectPolicyId':pid,'modelProfileAuthority':modelproof.get(a['lemma']),'notes':notes[a['lemma']]})
assert len(approved)==40 and len({r['word']for r in approved})==40 and word_count==35 and table_count==5

assert len(raw)==79 and len(modelproof)==3
assert modelproof==review['modelOnlyAuthority']
for a,b in zip(approved,review['approved']):assert a==b,'exact independently reviewed selection changed'
assert read('english-translation-source.json')['artifactSha256']==pins['englishArtifactSha256']
result={'status':'passed','proposalSha256':digest,'reviewSha256':sha(args.review),'sourceCheckerSha256':sha(Path(__file__)),'exactApprovedWords':40,'distinctRoots':31,'retainedEnglishWordSenses':word_count,'retainedEnglishTableCells':table_count,'freshSpanishRawRecords':len(raw),'freshSpanishFormSpellings':40,'matchedFrozenInheritedSingularProofs':40,'existingModelOnlyAuthorities':modelproof,'AGIDArtifactSha256':sha(agidpath),'originalEnglishArchiveFreshlyReplayed':False,'englishEvidenceScope':'Exact retained English word/lemma/table extraction and pinned source manifest checked; no multi-gigabyte original English replay.','spanishEvidenceScope':'Original compressed archive checksum and all 79 frozen raw line hashes freshly replayed; raw lexical sense and existing normalization equality verified.','archivedAuditAndCurrentProofSeed':{'archivedSingularAuditSha256':pins['existingSingularAuditSha256'],'frozenSingularProofSeedSha256':sha(D/'english-singular-proof-seed.json'),'singularProofMembershipUnchanged':True,'wholeSingularAuditEqualityRequired':False,'archivedCoverageAuditSha256':pins['baselineCoverageAuditSha256'],'currentCoverageAuditSha256':sha(D/'translation-coverage-audit.json'),'currentStillMissingApprovedSpellings':sum(a['word']in missing for a in x['proposals']),'coverageSnapshotEqualityRequired':False},'guards':'All 40 exact literal they-only third-plural indicative readings bound; global it-only, old holds and DESOVAR/RATONAR/CADUCAR model authorities remain unchanged. This verifies frozen sources, not production integration or new coverage.'}
if args.out:
 target=args.out.resolve()
 assert target!=Path(__file__).resolve() and target!=args.proposal.resolve() and target!=args.review.resolve() and not target.is_relative_to(R),'report output must not overwrite source/app'
 target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
