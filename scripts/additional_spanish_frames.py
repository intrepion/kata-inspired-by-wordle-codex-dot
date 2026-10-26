"""Additional exact dual-reviewed Spanish lexical frames and explicit forms.
Modified Wiktionary data / CC-BY-SA-4.0; no suffix generation or examples.
"""
import json,hashlib,re
from spanish_form_descriptions import normalize
from english_form_rendering import load_agid

def load_additional_spanish_frames(data,root):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='new-spanish-verb-frames2-standards.json';p=read(name);digest=sha(name);rn='new-spanish-verb-frames2-review-spec.json';r=read(rn);assert p['reviewer']!=r['reviewer']and r['inputSha256']==digest
 assert digest=='f108a6c092078572a094f3e079df89f085970dd2f8762dec6db6eb469472a73c' and sha(rn)=='e1cfcb38f04d332eec988f64c4c906fa05269a3e65dd2844a0d33cf4c4773508'
 dossier='new-spanish-verb-frames2-hold-dossier-standards.json';delta='new-spanish-verb-frames2-hold-dossier-review-spec.json'
 assert sha(dossier)=='4cffd43f3efb5d97216e930be333eb5a96450356f9a299cd6b936b8ddd7b8321' and sha(delta)=='99b6f7c50926c4e67949bc53c14c56c891f01c4aabc2ea9e315b9c793e089239'
 grammar=read('spanish-form-source.json');assert grammar['spanishArtifactSha256']==p['sourcePins']['spanishArtifactSha256']and hashlib.sha256((root/'scripts/spanish_form_descriptions.py').read_bytes()).hexdigest()==grammar['normalizerModuleSha256']
 raw=(root/'public/third-party/apertium-translations/agid-infl.txt').read_bytes();assert hashlib.sha256(raw).hexdigest()==p['sourcePins']['agidDataSha256'];agid,qualified,lines=load_agid(raw)
 def key(a):return(a['spanish'],a['partOfSpeech'])
 yes={key(a):a for a in r['approved']};no={key(a)for a in r['rejected']};allkeys={key(a)for a in p['approved']};assert len(yes)==len(r['approved'])and not set(yes)&no and set(yes)|no==allkeys
 profiles={};forms=[];hashes={name:digest,rn:sha(rn),dossier:sha(dossier),delta:sha(delta)}
 for a in p['approved']:
  k=key(a)
  if k not in yes:continue
  b=yes[k];assert all(a[field]==b[field]for field in ['spanish','partOfSpeech','recordSha256','senseIndex','frame','profile','aspectModes','context'])
  row=a['sourceRow'];sense=a['sourceSense'];assert k[1]=='verb'and not k[0].endswith('se')and row['word']==k[0]and row['pos']=='verb'and row['recordSha256']==a['recordSha256']and row['senses'][a['senseIndex']]==sense and sense.get('glosses')and not sense.get('form_of')and not sense.get('alt_of')
  assert a['profile']in{'ordinary','it-only'}and set(a['aspectModes'])<={'progressive','state-past'}and re.fullmatch(r"[a-z]+(?:[-'][a-z]+)*",a['frame'].split(' ',1)[0])and not a['frame'].startswith('to ')
  e=a['englishInflectionEvidence'];head=a['frame'].split(' ',1)[0];assert e['head']==head and (head,'V')not in qualified and e['senseQualified']is False and lines[head,'V']==e['agidRawLine']and hashlib.sha256(e['agidRawLine'].encode()).hexdigest()==e['agidLineSha256']and agid[head,'V']==e['closedParsedSlots']and len(agid[head,'V'])==4 and all(agid[head,'V'])
  resolution=a.get('synonymEvidence')
  if resolution:
   bindings={'ijadear':('jadear','verb',0,['Jadear.']),'aruñar':('arañar','verb',0,['Variante de arañar.']),'harrear':('arrear','verb',1,['Grafía alternativa de arrear.']),'ovillar':('ovillo','noun',0,['Hacer ovillos.'])}
   assert k[0] in bindings
   targetword,targetpos,targetindex,glosses=bindings[k[0]];target=resolution['selectedTarget']
   assert sense['glosses']==glosses and target['word']==targetword and target['pos']==targetpos and resolution['targetSenseIndex']==targetindex
   assert target['senses'][targetindex].get('glosses') and target['recordSha256']
  else:assert k[0]not in {'ijadear','aruñar','harrear','ovillar'}
  profile={**{field:a[field]for field in ['spanish','partOfSpeech','recordSha256','senseIndex','frame','profile','aspectModes','context']},'sourceRow':row,'sourceSense':sense,'reviewBatch':'new-frames-2','reviewEvidence':[{'reviewer':p['reviewer'],'notes':a['notes']},{'reviewer':r['reviewer'],'notes':b['notes']}],'newFrameReview':{'candidateSha256':digest,'reviewHashes':hashes,'sourceInflections':e,'meaningResolution':resolution}}
  assert k not in profiles;profiles[k]=profile
  for f in a['sourceFormEvidence']:
   assert f['spanishLemma']==k[0]and f['partOfSpeech']=='verb'and f['word']==f['sourceWord'].upper()and normalize('verb',f['sourceSense'],k[0])==f['normalized'];forms.append(f)
 return profiles,forms,{'candidateSha256':digest,'reviewHashes':hashes,'approvedLexicalReadings':len(profiles),'scope':'Exact dual-reviewed lexical frames and source-explicit forms only; existing grammar/usage/subject/English-slot guards remain. Original rejected senses and holds retained; four exact two-record resolutions only.'}
