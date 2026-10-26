"""Additional exact dual-reviewed Spanish lexical frames and explicit forms.
Modified Wiktionary data / CC-BY-SA-4.0; no suffix generation or examples.
"""
import json,hashlib,re
from spanish_form_descriptions import normalize
from english_form_rendering import load_agid

def load_new_spanish_frames(data,root):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='new-spanish-verb-frames-standards.json';p=read(name);digest=sha(name);rn='new-spanish-verb-frames-review-spec.json';r=read(rn);assert p['reviewer']!=r['reviewer']and r['inputSha256']==digest
 grammar=read('spanish-form-source.json');assert grammar['spanishArtifactSha256']==p['sourcePins']['spanishArtifactSha256']and hashlib.sha256((root/'scripts/spanish_form_descriptions.py').read_bytes()).hexdigest()==grammar['normalizerModuleSha256']
 raw=(root/'public/third-party/apertium-translations/agid-infl.txt').read_bytes();assert hashlib.sha256(raw).hexdigest()==p['sourcePins']['agidDataSha256'];agid,qualified,lines=load_agid(raw)
 def key(a):return(a['spanish'],a['partOfSpeech'])
 yes={key(a):a for a in r['approved']};no={key(a)for a in r['rejected']};allkeys={key(a)for a in p['approved']};assert len(yes)==len(r['approved'])and not set(yes)&no and set(yes)|no==allkeys
 profiles={};forms=[];hashes={name:digest,rn:sha(rn)}
 for a in p['approved']:
  k=key(a)
  if k not in yes:continue
  b=yes[k];assert all(a[field]==b[field]for field in ['spanish','partOfSpeech','recordSha256','senseIndex','frame','profile','aspectModes','context'])
  row=a['sourceRow'];sense=a['sourceSense'];assert k[1]=='verb'and not k[0].endswith('se')and row['word']==k[0]and row['pos']=='verb'and row['recordSha256']==a['recordSha256']and row['senses'][a['senseIndex']]==sense and sense.get('glosses')and not sense.get('form_of')and not sense.get('alt_of')
  assert a['profile']in{'ordinary','it-only'}and set(a['aspectModes'])<={'progressive','state-past'}and re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*",a['frame'].split(' ',1)[0])and not a['frame'].startswith('to ')
  e=a['englishInflectionEvidence'];head=a['frame'].split(' ',1)[0];assert e['head']==head and (head,'V')not in qualified and e['senseQualified']is False and lines[head,'V']==e['agidRawLine']and hashlib.sha256(e['agidRawLine'].encode()).hexdigest()==e['agidLineSha256']and agid[head,'V']==e['closedParsedSlots']and len(agid[head,'V'])==4 and all(agid[head,'V'])
  resolution=a.get('synonymEvidence')
  if resolution:
   assert k[0]=='edrar'and resolution['explicitSourceReference']=='Binar₁₋₂.'and sense['glosses']==['Binar₁₋₂.']
   target=resolution['selectedTarget'];assert target['word']=='binar'and target['pos']=='verb'and target['senseIndex']==0 and target['sourceSense']['sense_index']=='1'and 'transitive'in target['wordTags']
   assert any(v['word']=='edrar'and v['sense_index']=='1'and v['sense']==' '.join(target['sourceSense']['glosses'])for v in target['synonymLinks'])
  else:assert k[0]!='edrar'
  profile={**{field:a[field]for field in ['spanish','partOfSpeech','recordSha256','senseIndex','frame','profile','aspectModes','context']},'sourceRow':row,'sourceSense':sense,'reviewBatch':'new-frames-1','reviewEvidence':[{'reviewer':p['reviewer'],'notes':a['notes']},{'reviewer':r['reviewer'],'notes':b['notes']}],'newFrameReview':{'candidateSha256':digest,'reviewHashes':hashes,'sourceInflections':e,'meaningResolution':resolution}}
  if k[0]=='irisar':
   assert 'intransitive'in row['wordTags']and sense['glosses'][0].startswith('Descomponer la luz')
   profile['sourceMetadataConflict']='Source header says intransitive; the selected explicit gloss is causative (source metadata conflict).'
  assert k not in profiles;profiles[k]=profile
  for f in a['sourceFormEvidence']:
   assert f['spanishLemma']==k[0]and f['partOfSpeech']=='verb'and f['word']==f['sourceWord'].upper()and normalize('verb',f['sourceSense'],k[0])==f['normalized'];forms.append(f)
 return profiles,forms,{'candidateSha256':digest,'reviewHashes':hashes,'approvedLexicalReadings':len(profiles),'scope':'Exact dual-reviewed lexical frames and source-explicit forms only; existing grammar/usage/subject/English-slot guards remain. CONSTAR rejected and original holds retained.'}
