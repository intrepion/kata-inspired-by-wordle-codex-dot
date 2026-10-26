"""Additional exact, dual-reviewed lexical WordNet/MCR mappings only.
MCR CC BY 3.0 + WordNet included license; supplemental Wiktionary proofs
CC BY-SA 4.0. No generated morphology, reflexive decomposition or examples.
"""
import json,hashlib,copy
from urllib.parse import quote
from translation_usage_scope import scoped_source_usage

def reviewed_wordnet_additions(data,allowed,noun_rows):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 base=read('wordnet-translation-source.json');spanish=read('spanish-derived-source.json')['artifactSha256'];output={};proof={};summaries=[]
 def pair(a):return(a['spanish'],a['synset'])
 def validate_pins(p):
  for field in ['mcrRevision','mcrSha256','englishArchiveSha256','spanishLicense','englishLicense']:assert p['sourcePins'][field]==base[field]
  assert p['sourcePins']['supplementalSpanishArtifactSha256']==spanish and p['sourcePins']['supplementalSpanishLicense']=='CC-BY-SA-4.0'
 def add(a,b,source,part,hashes,kind):
  assert all(a[k]==b[k]for k in ['spanish','word','synset','english','context','selectedSpanishSenseIndex'])
  s=a['supplementalSpanishEvidence'];assert a['word']==a['spanish'].upper()==s['word'].upper()and a['word']in allowed and a['selectedSpanishSenseIndex']==s['senseIndex']and s['partOfSpeech']==part
  assert b['spanishRecordSha256']==s['recordSha256']and b['wordnetRecordSha256']==source['recordSha256']and b['mcrRecordSha256']==source['spanishRecordSha256']
  assert s['sourceUrl']=='https://es.wiktionary.org/wiki/'+quote(s['word'])
  english=a['english'];assert english and all(isinstance(v,str)and v.strip()==v and v and not v.lower().startswith(('todo','tbd','form of ','inflection of '))for v in english)
  inventory=s['wordTags']+s['wordRawTags']+s['tags']+s['rawTags'];usage=[v for v in inventory if v not in {'masculine','feminine','singular','plural','countable','uncountable'}and 'género'not in v.lower()]
  tags=['model-reviewed aligned lexical meaning','selected dictionary meaning for this word; not an example sentence','meaning context: '+a['context']]+['source use: '+v for v in scoped_source_usage(usage,part)]
  output.setdefault(a['word'],[]).append({'partOfSpeech':part,'senseIndex':a['synset'],'english':english,'tags':sorted(set(tags)),'sourceLinks':[{'label':'Spanish word · Wiktionary CC BY-SA 4.0','url':s['sourceUrl']}]})
  proof.setdefault(a['word'],[]).append({'kind':kind,'source':source,'spanishCorroboration':s,'selectedEnglish':english,'context':a['context'],'independentReview':b,'reviewHashes':hashes,'priorDecision':a.get('previousDecision'),'sourceUsageInventory':inventory})
 name='mcr-recovery-proposals-standards.json';p=read(name);rn='mcr-recovery-review-spec.json';r=read(rn);validate_pins(p);assert r['inputSha256']==sha(name)and p['reviewer']!=r['reviewer'];hashes={name:sha(name),rn:sha(rn)}
 yes={pair(v):v for v in r['approved']};no={pair(v)for v in r['held']};assert len(yes)==len(r['approved'])and not set(yes)&no and set(yes)|no=={pair(v)for v in p['proposals']}
 original_yes=[{pair(v)for v in read(n)['approvedPairs']}for n in ['wordnet-review-spec.json','wordnet-review-standards.json']]
 for a in p['proposals']:
  k=pair(a)
  if k not in yes:continue
  assert k in noun_rows and not all(k in v for v in original_yes),'Cannot silently replace an existing dual-approved meaning'
  e=a['wordnetEvidence'];assert all(e[f]==noun_rows[k][f]for f in ['synonyms','recordSha256','spanishRecordSha256'])
  assert e['definition']in {noun_rows[k]['definition'],noun_rows[k]['definition'].split('; \"',1)[0]},'Only exact definition or removal of quoted WordNet examples is allowed'
  add(a,yes[k],e,'noun',hashes,'source-corroborated reassessment; original holds remain archival')
 summaries.append({'kind':'noun-recovery','pairs':len(yes),'reviewHashes':hashes})
 name='expanded-wordnet-proposals-v2-standards.json';p=read(name);old_name='expanded-wordnet-proposals-standards.json';old=read(old_name);rn='expanded-wordnet-review-spec.json';r=read(rn);dn='expanded-wordnet-v2-delta-review-spec.json';delta=read(dn);mn='expanded-wordnet-proposals-v2-metadata-proof-standards.json';validate_pins(p)
 assert delta['approved']is True and delta['inputSha256']==sha(name)and delta['originalCandidateSha256']==sha(old_name)and delta['existingSemanticReviewSha256']==sha(rn)and delta['metadataProofSha256']==sha(mn)and delta['changedJSONPointers']==['/sourcePins/modifications']
 revised=copy.deepcopy(old);revised['sourcePins']['modifications']=p['sourcePins']['modifications'];assert revised==p and p['proposals']==old['proposals']and p['deferred']==old['deferred']
 assert r['inputSha256']==sha(old_name)and r['reviewer']!=p['reviewer']and delta['reviewer']==r['reviewer']and p['inputSha256']==sha('expanded-wordnet-candidates-standards.json')
 hashes={n:sha(n)for n in [name,old_name,rn,dn,mn,'expanded-wordnet-candidates-standards.json']};yes={pair(v):v for v in r['approved']};no={pair(v)for v in r['held']};assert len(yes)==len(r['approved'])and not set(yes)&no and set(yes)|no=={pair(v)for v in p['proposals']}
 base_candidates=read('expanded-wordnet-candidates-standards.json')['candidates']
 for a in p['proposals']:
  k=pair(a)
  if k not in yes:continue
  original=base_candidates[a['candidateIndex']];assert all(a[f]==original[f]for f in ['spanish','word','synset'])and all(a['sourceEvidence'][f]==original[f]for f in ['sourceFile','synonyms','definition','recordSha256','spanishRecordSha256'])and a['actualWordNetPOS']==original['actualSynsetPOS']
  b=yes[k];assert all(a[f]==b[f]for f in ['candidateIndex','partOfSpeech','actualWordNetPOS'])
  part=a['partOfSpeech'];actual=a['actualWordNetPOS'];assert (part=='verb'and actual=='v'and a['synset'].endswith('-v'))or(part=='adj'and actual in {'a','s'}and a['synset'].endswith('-a'))
  e=a['sourceEvidence'];assert e['sourceFile']==('data.verb'if part=='verb'else'data.adj')and e['sourceFile']in p['sourcePins']['englishExpandedFileHashes']
  add(a,b,e,part,hashes,'reviewed lexical verb/adjective; no form generation')
 summaries.append({'kind':'expanded-lexical','pairs':len(yes),'reviewHashes':hashes,'sourcePins':p['sourcePins'],'deferredNotAdjudicated':len(p['deferred'])})
 name='expanded-wordnet-gap-subset2-standards.json';p=read(name);rn='expanded-wordnet-gap-subset2-review-spec.json';r=read(rn);validate_pins(p)
 assert r['inputSha256']==sha(name)and r['reviewer']!=p['reviewer']and p['inputHashes']['originalCandidateSha256']==sha('expanded-wordnet-candidates-standards.json')and p['inputHashes']['preservedPriorProposalSha256']==sha('expanded-wordnet-proposals-v2-standards.json')
 hashes={n:sha(n)for n in [name,rn,'expanded-wordnet-candidates-standards.json']};yes={pair(v):v for v in r['approved']};no={pair(v)for v in r['held']};assert len(yes)==len(r['approved'])and not set(yes)&no and set(yes)|no=={pair(v)for v in p['proposals']}
 for a in p['proposals']:
  k=pair(a)
  if k not in yes:continue
  b=yes[k];e=a['sourceEvidence'];original=base_candidates[a['originalCandidateIndex']]
  assert all(a[f]==original[f]for f in ['spanish','word','synset'])and all(e[f]==original[f]for f in ['sourceFile','actualSynsetPOS','synonyms','definition','recordSha256','spanishRecordSha256'])
  assert a['partOfSpeech']=='verb'and e['actualSynsetPOS']=='v'and e['sourceFile']=='data.verb'and a['synset'].endswith('-v')and a['lexicalWholeWordOnly']is True and a['inflectionAuthority']is False
  assert b['originalCandidateIndex']==a['originalCandidateIndex']and b['partOfSpeech']==a['partOfSpeech']and b['wholeWordSpanishSenseIndex']==a['wholeWordSpanishSenseIndex']
  supporting=a['supportingSpanishEvidence'];assert [{'word':v['word'],'recordSha256':v['recordSha256'],'senseIndex':v['senseIndex']}for v in supporting]==b['supportingSpanishProofs']
  normalized={**a,'selectedSpanishSenseIndex':a['wholeWordSpanishSenseIndex'],'supplementalSpanishEvidence':a['wholeWordSpanishEvidence']}
  normalized_review={**b,'selectedSpanishSenseIndex':b['wholeWordSpanishSenseIndex'],'spanishRecordSha256':b['wholeWordSpanishRecordSha256']}
  add(normalized,normalized_review,e,'verb',hashes,'exact reviewed whole-word lexical construction; no generated forms')
  proof[a['word']][-1]['independentReview']=b;proof[a['word']][-1]['supportingSpanishEvidence']=supporting
  for support in supporting:
   assert support['sourceUrl']=='https://es.wiktionary.org/wiki/'+quote(support['word'])
   links=output[a['word']][-1]['sourceLinks'];url=support['sourceUrl']
   if not any(v['url']==url for v in links):links.append({'label':'Spanish meaning source · '+support['word'],'url':url})
   inventory=support['wordTags']+support['wordRawTags']+support['tags']+support['rawTags']
   use=[t for t in inventory if t not in {'masculine','feminine','singular','plural','transitive','intransitive','pronominal','reflexive','countable','uncountable'}and 'género'not in t.lower()]
   output[a['word']][-1]['tags'].extend('supporting Spanish sense use: '+t for t in use)
 summaries.append({'kind':'gap-prioritized lexical constructions','pairs':len(yes),'reviewHashes':hashes,'deferredNotAdjudicated':len(p['otherDeferredCandidateIndices'])})
 return output,proof,{'words':len(output),'senses':sum(map(len,output.values())),'batches':summaries,'dataLicenses':'Additional adapted selections and Spanish proofs: CC-BY-SA-4.0; preserve underlying MCR CC-BY-3.0 and Princeton WordNet notices. Own compiler code licensing is separate.','limitations':'Exact selected lexical mappings only. No inferred finite forms, reflexive composition, examples, native/Mexican certification or claim to adjudicate the deferred candidates. Prior holds and v1 metadata remain archival.'}
