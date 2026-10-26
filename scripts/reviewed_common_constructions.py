"""Twelve exact sense-bound constructions / CC BY-SA 4.0 derived source data.
No productive clitic, existential, auxiliary or abbreviation rule is introduced.
"""
import json,hashlib

def load_common_constructions(data,source):
 def read(n):return json.loads((data/n).read_text())
 def sha(n):return hashlib.sha256((data/n).read_bytes()).hexdigest()
 name='priority12-exact-source-proposals-spec.json';rn='priority12-exact-source-review-standards.json';digest=sha(name)
 assert digest=='927d1fb22debb7f7c6b4fb4f4849439037e3f2262a4dc0fdebc07da611aa29ab'and sha(rn)=='54a228358c4e4168cd89214dadf467367b62b6724dd0dca97837c57effa50710'
 p=read(name);r=read(rn);assert r['inputSha256']==digest and p['author']!=r['reviewer']and not r['held']
 assert sha('english-translation-evidence.json')==p['sourcePins']['englishEvidence']['sha256']and read('spanish-derived-source.json')['artifactSha256']==p['sourcePins']['spanishLexicalInventory']['rawArtifactSha256']
 approvals={a['recordIndex']:a for a in r['approved']};assert len(approvals)==len(p['proposals'])==12
 out={};evidence={}
 for a in p['proposals']:
  b=approvals[a['recordIndex']];src=a['source']
  for k in ['word','partOfSpeech','english','kind','selectedGrammar','displayContext','proofContext']:assert a[k]==b[k]
  for kind in ['englishForm','englishLemma']:
   row=src[kind];identity=b['sourceIdentity'][kind]
   for k in ['word','recordSha256','sourceSenseIndex']:assert row[k]==identity[k]
  for row in [src['englishForm'],src['englishLemma']]+src['englishAliasTargets']:
   candidates=source['acceptedRecords'].get(row['word'].upper(),[])if row is src['englishForm']else source['lemmas'].get(row['word'],[])
   assert any(x['recordSha256']==row['recordSha256']and x['pos']==row['partOfSpeech']and x['senses'][row['sourceSenseIndex']]==row['sense']for x in candidates)
  assert set(src['requiredSourceFormTags'])<=set(src['englishForm']['sense'].get('tags',[]))
  assert a['word']not in out and a['english']and all(isinstance(x,str)and x.strip()for x in a['english'])
  grammar=a['selectedGrammar'];tags=['reviewed grammatical reading','meaning context: '+a['displayContext']]
  for k,label in [('mood','mood'),('tense','tense'),('polarity','command polarity'),('subjectPerson','subject person'),('subjectNumber','subject number'),('objectPerson','object person'),('objectNumber','object number'),('spanishPerson','grammatical person'),('spanishNumber','grammatical number'),('spanishGender','grammatical gender')]:
   if k in grammar:tags.append('Spanish '+label+': '+grammar[k])
  links=[]
  for row in [src['englishLemma']]+src['englishAliasTargets']:
   link={'label':'English Wiktionary selected base meaning','url':row['sourceUrl']}
   if link not in links:links.append(link)
  for row in src['spanishSelectedLexicalProof']:
   link={'label':'Spanish Wiktionary selected corroboration','url':row['sourceUrl']}
   if link not in links:links.append(link)
  out[a['word']]={'sourceUrl':src['englishForm']['sourceUrl'],'sourceLinks':links,'senses':[{'partOfSpeech':a['partOfSpeech'],'senseIndex':'1','english':a['english'],'tags':tags}]}
  evidence[a['word']]=[{'kind':'exact-reviewed-common-construction','proposalSha256':digest,'reviewSha256':sha(rn),'selection':a}]
 return out,evidence,{'proposalSha256':digest,'reviewSha256':sha(rn),'words':sorted(out),'scope':'Twelve exact source-bound constructions; no generic clitic, existential, auxiliary or alias rule. Selected senses only; no new examples, native certification or fresh full English archive replay.'}
