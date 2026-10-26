"""Exact reviewed further accusative readings; no suffix or animate-role inference.
Modified Wiktionary lexical/form data / CC-BY-SA-4.0.
"""
import json,hashlib,re
from urllib.parse import quote
DIRECT={'lo':'it','la':'it','los':'them','las':'them'}
def deferred_accusative_forms(data,source,allowed,teaching,features_for,finite):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='deferred-accusative-proposals-standards.json';p=read(name);digest=sha(name);rn='deferred-accusative-review-spec.json';r=read(rn)
 assert r['inputSha256']==digest and p['reviewer']!=r['reviewer']
 assert p['sourcePins']['englishArtifactSha256']==read('english-translation-source.json')['artifactSha256'] and p['sourcePins']['spanishArtifactSha256']==read('spanish-derived-source.json')['artifactSha256'] and p['inputHashes']['englishEvidenceSha256']==sha('english-translation-evidence.json')
 assert p['inputHashes']['original100ProposalSha256']==sha('additional-accusative-proposals.json')
 def key(a):return(a['lemma'],a['word'],a['recordSha256'],a['senseIndex'])
 def indexed(rows,field):
  out={a[field]:a for a in rows};assert len(out)==len(rows);return out
 templates=indexed(r['approvedTemplates'],'lemma');no_templates=indexed(r['rejectedTemplates'],'lemma');yes=indexed(r['approved'],'recordIndex');no=indexed(r['rejected'],'recordIndex')
 assert not set(templates)&set(no_templates)and set(templates)|set(no_templates)=={a['lemma']for a in p['decisions']} and not set(yes)&set(no)
 py={key(a)for a in p['approvedWordKeys']};pn={key(a)for a in p['heldWordKeys']};assert len(py)==len(p['approvedWordKeys'])and len(pn)==len(p['heldWordKeys'])and not py&pn
 output={};proof={};i=0;allkeys=set();hashes={name:digest,rn:sha(rn)}
 paradigm=r['additionalParadigmCheck'];assert paradigm['sourceTableSha256']==sha('english-form-tables.json')
 table=read('english-form-tables.json');table_rows=[v for v in table['records']if v['recordSha256']==paradigm['lemmaRecordSha256']];assert len(table_rows)==1 and paradigm['bareImperativeCell']in table_rows[0]['forms']
 for di,d in enumerate(p['decisions']):
  lemma=d['lemma'];active=lemma in templates
  if active:
   t=templates[lemma];assert d['status']=='proposed'and all(t[k]==d[dk]for k,dk in [('template','template'),('recordSha256','lemmaRecordSha256'),('senseIndex','lemmaSenseIndex'),('context','context')])
   lr=d['sourceLemmaRow'];ls=d['selectedSourceSense'];assert lr in source['lemmas'][lemma]and lr['recordSha256']==d['lemmaRecordSha256']and lr['senses'][d['lemmaSenseIndex']]==ls and lr['pos']=='verb'
   assert d['template'].count('{direct}')==1 and ls.get('glosses')and not ls.get('form_of')and not ls.get('alt_of')
   if lemma=='follar':assert d['lemmaRecordSha256']==paradigm['lemmaRecordSha256']and d['lemmaSenseIndex']==paradigm['selectedSenseIndex']and table_rows[0]['senses'][d['lemmaSenseIndex']]==ls
  else:assert d['status']=='held'
  for a in d['applications']:
   k=key(a);assert k not in allkeys;allkeys.add(k);row=a['sourceWordRow'];sense=a['sourceFormSense'];assert row in source['acceptedRecords'][a['word']]and row['recordSha256']==a['recordSha256']and row['senses'][a['senseIndex']]==sense
   if i not in yes:assert k in pn and i in no;i+=1;continue
   b=yes[i];assert active and k in py and key(b)==k and b['decisionIndex']==di and b['english']==a['english']and b['context']==a['context']==d['context']
   word=a['word'];assert word in allowed and word not in teaching
   links=sense.get('form_of',[]);assert len(links)==1 and links[0]['word'].split(' combined with ')[0]==lemma
   gloss=' '.join(sense.get('glosses',[]));assert gloss.count('combined with')==1;body,suffix=gloss.split('combined with');body=body.strip();suffix=suffix.strip().rstrip('.')
   assert suffix in DIRECT and a['directClitic']==suffix and a['directObjectEnglish']==DIRECT[suffix]and re.search(r'\bof '+re.escape(lemma)+r'\s*$',body)
   if ' combined with 'in links[0]['word']:assert links[0]['word'].split(' combined with ')[1]==suffix
   raw=sense.get('tags',[]);assert 'accusative'in raw and not set(raw)&{'negative','reflexive','pronominal','passive'}
   tags=[t for t in raw if not t.startswith('object-')and t!='combined-form']
   for m in re.finditer(r'((?:first|second|third)(?:/(?:first|second|third))*)-person',body):tags.extend(x+'-person'for x in m[1].split('/'))
   tags.extend(t for t in ['singular','plural','imperative','infinitive','voseo']if re.search(r'\b'+t+r'\b',body));tags=sorted(set(tags));f=a['features']
   if f['kind']=='infinitive':
    assert 'infinitive'in tags and 'imperative'not in tags and f.get('subject')=='unspecified';texts=['to '+d['template']]
   else:
    assert f['kind']=='finite'and f['tense']=='imperative'and 'imperative'in tags and 'infinitive'not in tags
    fs=features_for(row,{'glosses':[body],'tags':tags});assert any(all(v.get(k)==f[k]for k in ['kind','tense','person','number'])for v in fs)
    texts=finite(d['template'],'imperative',f['person'],f['number'],'ordinary',set());assert texts
   texts=[text.replace('{direct}',DIRECT[suffix])for text in texts];assert a['english']in texts
   labels=set(tags+ls.get('tags',[])+ls.get('raw_tags',[])+a['labels']+d['labels'])-{'intransitive','reflexive','pronominal','ambitransitive'}
   labels.update(['source-bound selected accusative-clitic reading; not an example sentence','meaning context: '+d['context']])
   if f.get('person')=='third-person':labels.add('command addressed to usted/ustedes; grammatical third-person')
   entry=output.setdefault(word,{'sourceUrl':'https://en.wiktionary.org/wiki/'+quote(row['word'])+'#Spanish','sourceLinks':[],'senses':[]})
   links=[{'label':'English verb meaning','url':'https://en.wiktionary.org/wiki/'+quote(lemma)+'#Spanish'}]+[{'label':'Spanish selected meaning context','url':'https://es.wiktionary.org/wiki/'+quote(s['lemma'])}for s in d['supplementalSpanishEvidence']]
   for link in links:
    if link not in entry['sourceLinks']:entry['sourceLinks'].append(link)
   entry['senses'].append({'partOfSpeech':'verb','senseIndex':str(len(entry['senses'])+1),'english':[a['english']],'tags':sorted(labels)})
   proof.setdefault(word,[]).append({'kind':'further-reviewed-accusative','candidateSha256':digest,'reviewHashes':hashes,'word':word,'lemma':lemma,'wordRecordSha256':row['recordSha256'],'wordSenseIndex':a['senseIndex'],'sourceFormSense':sense,'lemmaRecordSha256':lr['recordSha256'],'lemmaSenseIndex':d['lemmaSenseIndex'],'sourceLemmaSense':ls,'supplementalSpanishEvidence':d['supplementalSpanishEvidence'],'features':f,'english':a['english'],'context':d['context'],'sourceParadigmReview':paradigm if lemma=='follar'else None});i+=1
 assert set(yes)|set(no)==set(range(i))and py|pn==allkeys
 return output,proof,{'words':len(output),'candidateSha256':digest,'reviewHashes':hashes,'scope':'Exact independently reviewed whole-word positive imperative/infinitive accusative readings only; no global role, inflection or construction authority.'}
