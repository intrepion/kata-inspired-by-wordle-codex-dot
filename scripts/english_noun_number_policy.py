"""Narrow source-bound semantic-number correction after automatic rendering.
Wiktionary evidence / CC-BY-SA-4.0. Different senses retain their own paradigms.
"""
import json,hashlib
from urllib.parse import quote

def apply_reviewed_noun_number(data,source,output,evidence):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 policy=read('english-noun-number-policy.json');assert policy['englishArtifactSha256']==read('english-translation-source.json')['artifactSha256']
 names=['english-noun-number-review-spec.json','english-noun-number-review-standards.json'];reviews=[read(n)for n in names];assert reviews[0]['reviewer']!=reviews[1]['reviewer'];assert policy['reviewHashes']=={n:sha(n)for n in names}
 context=read('english-noun-number-spanish-context.json');assert sha('english-noun-number-spanish-context.json')==policy['spanishContextSha256'];assert context['artifactSha256']==policy['spanishArtifactSha256']==read('spanish-form-source.json')['spanishArtifactSha256']
 changed=[]
 for rule in policy['rules']:
  a,b=reviews;word=rule['word'];lemma=rule['lemma'];assert a['spanishLemma']==lemma and a['spanishForm']==word and a['numberMode']==rule['numberMode'];assert a['lemmaRecordSha256']==b['englishLemmaRecordSha256']==rule['lemmaRecordSha256'];assert a['lemmaSenseIndex']==b['englishLemmaSenseIndex']==rule['lemmaSenseIndex'];assert a['lemmaGloss']==rule['lemmaGloss']==[b['englishLemmaGloss']];assert a['formRecordSha256']==b['spanishFormRecordSha256']==rule['formRecordSha256'];assert a['formSenseIndex']==b['spanishFormSenseIndex']==rule['formSenseIndex'];assert a['approvedEnglish']==rule['english']==[b['selectedEnglish']]
  row=next(r for r in source['lemmas'][lemma]if r['recordSha256']==rule['lemmaRecordSha256']);assert row['word']==lemma and row['pos']=='noun';sense=row['senses'][rule['lemmaSenseIndex']];assert sense['glosses']==rule['lemmaGloss']
  form=next(r for r in source['acceptedRecords'][word]if r['recordSha256']==rule['formRecordSha256']);assert form['word'].upper()==word and form['pos']=='noun';fs=form['senses'][rule['formSenseIndex']];assert fs['form_of']==[{'word':lemma}]and set(fs['tags'])==set(a['formTags'])and fs['glosses']==[b['spanishFormGloss']]
  sr=next(r for r in context['records']if r['recordSha256']==rule['spanishContextRecordSha256']);assert sr['word']==lemma and sr['pos']=='noun';assert sr['senses'][rule['spanishContextSenseIndex']]['glosses']==rule['spanishContextGloss']==a['supplementalSpanishGloss']==[b['spanishSemanticEvidence']['gloss']];assert a['supplementalSpanishRecordSha256']==sr['recordSha256']and b['spanishSemanticEvidence']['senseIndex']==rule['spanishContextSenseIndex']
  entry=output[word];proofs=evidence[word];assert entry['senses']and proofs
  # This frozen correction fails closed if unrelated senses enter this exact word.
  # It must never become a global English-head replacement or erase new meanings.
  for proof in proofs:
   assert proof['kind']=='rendered-form'and proof['spanishLemma']==lemma and proof['lemmaRecordSha256']==row['recordSha256']and proof['lemmaGloss']=='people'and proof['english']in [['peoples'],['people']]
   assert 'plural'in proof['features']['tags']
   if proof['wordEvidenceKind']=='explicit source table':assert proof['wordRecordSha256']==row['recordSha256']and proof['tableForm']['form'].upper()==word and 'plural'in proof['tableForm']['tags']
   else:assert proof['wordEvidenceKind']=='source word entry'and proof['wordRecordSha256']==form['recordSha256']
  for value in entry['senses']:
   assert value['partOfSpeech']=='noun'and value['english']in [['peoples'],['people']]and 'plural'in value['tags']and 'feminine'in value['tags'];value['english']=rule['english'][:];value['tags']=sorted(set(value['tags']+['English already plural in this selected human-collective reading','meaning context: '+rule['context']]))
  links=entry.setdefault('sourceLinks',[])
  for label,url in [('English human-collective meaning','https://en.wiktionary.org/wiki/'+quote(lemma)+'#Spanish'),('Spanish human-collective context','https://es.wiktionary.org/wiki/'+quote(lemma))]:
   if url!=entry['sourceUrl']and not any(x['url']==url for x in links):links.append({'label':label,'url':url})
  for proof in proofs:
   proof['priorAutomaticEnglish']=proof['english'];proof['priorAutomaticAgidLine']=proof.pop('agidLine',None);proof['english']=rule['english'][:];proof['englishRule']='Exact independently reviewed semantic-number mapping; English human-collective target already plural';proof['numberPolicy']={'policySha256':sha('english-noun-number-policy.json'),'numberMode':rule['numberMode'],'lemmaSenseIndex':rule['lemmaSenseIndex'],'spanishContextRecordSha256':sr['recordSha256'],'spanishContextSenseIndex':rule['spanishContextSenseIndex'],'reviewHashes':policy['reviewHashes']}
  changed.append(word)
 return {'words':changed,'policySha256':sha('english-noun-number-policy.json'),'reviewHashes':policy['reviewHashes'],'limitations':policy['limitations']}
