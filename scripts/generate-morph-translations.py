"""Generate bounded, source-derived English forms. Outputs are GPL-2.0 derived data.
Original Apertium dictionaries, authors/notices and AGID sources are bundled separately.
Usage: python3 scripts/generate-morph-translations.py [--check]
Unsupported/ambiguous structures are withheld, never counted as translations.
"""
import argparse,hashlib,unicodedata
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--audit-only',action='store_true');args=parser.parse_args()
ROOT=__import__('pathlib').Path(__file__).resolve().parent.parent
import xml.etree.ElementTree as E,json,re,functools,collections
from pathlib import Path
base=ROOT/'public/third-party/apertium-translations';data=ROOT/'src/data/spanish';manifest=json.loads((data/'morph-translation-source.json').read_text())
for source in manifest['files']:
 assert hashlib.sha256((base/source['file']).read_bytes()).hexdigest()==source['sha256'],'Pinned source changed: '+source['file']
vocab=json.loads((data/'vocabulary.ts').read_text().split(' = ',1)[1].strip().removesuffix(';'));allowed={w for v in vocab.values() for w in v['guesses']}
root=E.parse(base/'apertium-spa.spa.metadix').getroot();pars={p.get('n'):p for p in root.findall('pardefs/pardef')}
def atom(x):
 out=x.text or ''
 for n in x:
  if n.tag=='s':out+='<'+n.get('n')+'>'
  elif n.tag=='b':out+=' '
  elif n.tag=='j':out+='+'
  else:return None
  out+=n.tail or ''
 return out
@functools.lru_cache(None)
def par(name):
 return tuple(pair for e in pars[name] for pair in entry(e))
def entry(e):
 if e.get('r')=='RL' or e.get('i')=='yes' or e.get('alt'):return []
 rows=[('','')]
 for x in e:
  if x.tag=='i':a=atom(x);part=[] if a is None else [(a,a)]
  elif x.tag=='p':
   a=atom(x.find('l'));b=atom(x.find('r'));part=[] if a is None or b is None else [(a,b)]
  elif x.tag=='par':part=par(x.get('n'))
  else:return []
  rows=[(a+c,b+d) for a,b in rows for c,d in part if len(a+c)<=7]
 return rows
analyses={};analysis_hashes=collections.defaultdict(set)
for section in root.findall('section'):
 for e in section:
  for surface,analysis in entry(e):
   if surface==surface.lower() and surface.upper() in allowed and '+' not in analysis and not ('<adv>' in analysis and analysis.split('<')[0]!=surface):
    analyses.setdefault(surface.upper(),set()).add(analysis);analysis_hashes[surface.upper(),analysis].add(hashlib.sha256(E.tostring(e)).hexdigest())
b=E.parse(base/'apertium-eng-spa.eng-spa.dix').getroot();pairs=collections.defaultdict(set);pair_hashes=collections.defaultdict(set)
for e in b.findall('section/e'):
 if e.get('r')=='LR' or e.get('i')=='yes' or e.get('alt'):continue
 p=e.find('p')
 if p is None:continue
 en=atom(p.find('l'));es=atom(p.find('r'))
 if en and es and re.fullmatch('[a-z]+<(?:n|adj|vblex|adv)>',en):
  pairs[es].add(en);pair_hashes[es,en].add(hashlib.sha256(E.tostring(e)).hexdigest())
agid={};agid_lines={};qualified=set()
for line in (base/'agid-infl.txt').read_text().splitlines():
 m=re.fullmatch(r'([a-z]+) ([NV]): (.+)',line)
 if not m:continue
 if '{' in m[3] or '}' in m[3]:qualified.add((m[1],m[2]))
 forms=[[v.strip() for v in slot.split(',') if re.fullmatch('[a-z]+',v.strip())] for slot in m[3].split('|')]
 if m[2]=='V' and len(forms)==3:forms=[forms[0],forms[0],forms[1],forms[2]]
 agid[m[1],m[2]]=forms;agid_lines[m[1],m[2]]=line
candidate_raw=(data/'verb-translation-candidates.json').read_bytes();candidate_hash=hashlib.sha256(candidate_raw).hexdigest();candidates=json.loads(candidate_raw);candidate_pairs={(sp,en) for sp,words in candidates.items() for en in words};approved_sets=[];review_hashes={}
for filename in ['verb-translation-review-spec.json','verb-translation-review-standards.json']:
 raw=(data/filename).read_bytes();review=json.loads(raw);assert review['inputSha256']==candidate_hash,'Review targets another input'
 approved={tuple(p) for p in review['approvedPairs']};rejected={(p['spanish'],p['english']) for p in review['rejectedPairs']}
 assert not approved&rejected and approved|rejected==candidate_pairs,'Incomplete or contradictory review'
 assert len(approved)==len(review['approvedPairs']) and len(rejected)==len(review['rejectedPairs']),'Duplicate decisions'
 approved_sets.append(approved);review_hashes[filename]=hashlib.sha256(raw).hexdigest()
assert json.loads((data/'verb-translation-review-spec.json').read_text())['reviewer']!=json.loads((data/'verb-translation-review-standards.json').read_text())['reviewer'],'Independent reviewers required'
approved_verbs=set.intersection(*approved_sets)
pronouns={('p1','sg'):['I'],('p2','sg'):['you'],('p3','sg'):['he/she/it','you (formal)'],('p1','pl'):['we'],('p2','pl'):['you (plural, Spain)'],('p3','pl'):['they','you (plural)']}
from translation_subject_policy import load_subject_policy
subject_rules,subject_policy_sha=load_subject_policy(data,'morph')
def render(analysis,prefix,english):
 restriction=subject_rules.get((prefix,english))
 if restriction and restriction['action']=='withhold':return None
 word=english.split('<')[0];pos=re.findall('<([^>]+)>',english)[0];tags=re.findall('<([^>]+)>',analysis[len(prefix):]);forms=agid.get((word,'N' if pos=='n' else 'V'),[])
 if '+' in analysis or (word,'N' if pos=='n' else 'V') in qualified:return None
 if pos=='vblex' and (prefix.split('<')[0],word) not in approved_verbs:return None
 if pos in {'n','adj'} and not set(tags)<={'m','f','mf','sg','pl','sp'}:return None
 if pos=='n':
  if 'pl' in tags:
   if not forms or not forms[0]:return None
   return forms[0],'noun; Spanish plural'
  if 'sg' in tags:return [word],'noun; Spanish singular'
  return None
 if pos=='adj':return [word],'adjective; Spanish '+', '.join({'f':'feminine','m':'masculine','sg':'singular','pl':'plural','mf':'common gender','sp':'same singular/plural form'}.get(t,t) for t in tags)
 if pos=='adv':return [word],'adverb'
 if pos!='vblex':return None
 if tags==['inf']:return ['to '+word],'infinitive'
 if tags==['ger'] and len(forms)==4 and forms[2]:return forms[2],'gerund'
 if tags and tags[0]=='pp' and set(tags[1:])<={'m','f','sg','pl'} and len(forms)==4 and forms[1]:return forms[1],'past participle; Spanish '+', '.join({'f':'feminine','m':'masculine','sg':'singular','pl':'plural'}[t] for t in tags[1:])
 if len(tags)!=3 or (tags[1],tags[2]) not in pronouns:return None
 tense,person,number=tags;subjects=pronouns[person,number];out=[]
 if restriction and restriction['action']=='it-only':
  if (person,number)!=('p3','sg') or tense=='imp':return None
  subjects=['it']
 if tense=='imp':
  labels={('p1','pl'):None,('p2','sg'):'informal singular',('p3','sg'):'formal singular',('p2','pl'):'plural, Spain',('p3','pl'):'plural'}
  if (person,number) not in labels:return None
  return (["let's "+word] if (person,number)==('p1','pl') else [word+'! ('+labels[person,number]+')']),'imperative'
 if tense=='pri':
  for subject in subjects:
   verbs=[word]
   if subject in {'he/she/it','it'}:
    if len(forms)!=4 or not forms[3]:return None
    verbs=forms[3]
   out.extend(subject+' '+v for v in verbs)
  return out,'present indicative'
 if tense=='ifi' and len(forms)==4 and forms[0]:return [s+' '+v for s in subjects for v in forms[0]],'preterite indicative'
 if tense in ['fti','cni']:return [s+(' will ' if tense=='fti' else ' would ')+word for s in subjects],('future indicative' if tense=='fti' else 'conditional')
 # Mood, imperfect, clitic and other analyses remain unavailable until their rendering is reviewed.
 return None

previous=json.loads((data/'guess-translation-audit.json').read_text());missing=set(previous['uncoveredWords']);output={};evidence={}
for word,rows in analyses.items():
 if word not in missing:continue
 for analysis in sorted(rows):
  for match in re.finditer('>',analysis):
   prefix=analysis[:match.end()]
   for en in sorted(pairs.get(prefix,[])):
    result=render(analysis,prefix,en)
    if not result:continue
    english,grammar=result
    if not english or any(not text.strip() or '<' in text or '>' in text for text in english):continue
    pos=re.findall('<([^>]+)>',en)[0];runtime={'partOfSpeech':{'vblex':'verb','n':'noun','adj':'adjective','adv':'adverb'}[pos],'senseIndex':str(len(output.get(word,[]))+1),'english':english,'tags':[grammar]+(['subject scope: '+subject_rules[prefix,en]['reason']] if (prefix,en) in subject_rules else [])}
    # Each row is a separate supported analysis; do not imply context disambiguation.
    output.setdefault(word,[]).append(runtime)
    evidence.setdefault(word,[]).append({'subjectPolicy':subject_rules.get((prefix,en)),'analysis':analysis,'spanishPrefix':prefix,'englishLemma':en,'english':english,'grammar':grammar,'spanishEntrySha256':sorted(analysis_hashes[word,analysis]),'bilingualEntrySha256':sorted(pair_hashes[prefix,en]),'agidLine':agid_lines.get((en.split('<')[0],'N' if pos=='n' else 'V'))})
all_missing=sorted(missing-set(output));coverage={'accepted':previous['accepted'],'reviewedTeaching':previous['reviewedTeaching'],'dictionaryEquivalents':previous['newDictionaryEquivalents'],'derivedFormWords':len(output),'translated':previous['translated']+len(output),'missing':len(all_missing),'completeExamples':previous['reviewedTeaching']}
files={f'src/data/spanish/morph-translations/{n}.json':{w:output[w] for w in sorted(output) if len(w)==n} for n in [4,5,6,7]}
files['src/data/spanish/morph-translation-audit.json']={'policy':'bounded-source-morphology-v1','subjectPolicySha256':subject_policy_sha,'sourceManifestSha256':hashlib.sha256((data/'morph-translation-source.json').read_bytes()).hexdigest(),'verbReviewHashes':review_hashes,'verbCandidateSha256':candidate_hash,'approvedVerbPairs':len(approved_verbs),'priorCoverageSha256':hashlib.sha256((data/'guess-translation-audit.json').read_bytes()).hexdigest(),'coverage':coverage,'limitations':'Selected context-free English forms, not complete senses, all analyses, reviewed Mexican examples or certified translations. No subject inversion, qualified English homograph inflections, subjunctive/imperfect or clitic rendering. Disabled/alternative/regex/unsupported XML entries and context-shortened adverbs withheld. Unknown structures are gaps.','evidence':{w:evidence[w] for w in sorted(evidence)},'uncoveredWords':all_missing}
files['src/data/spanish/morph-translation-coverage.json']=coverage
for name,obj in files.items():
 path=ROOT/name;text=json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n'
 if args.check or (args.audit_only and not path.name.endswith('-audit.json')):assert path.read_text()==text,'Generated output differs: '+name
 else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
print(json.dumps(coverage))
