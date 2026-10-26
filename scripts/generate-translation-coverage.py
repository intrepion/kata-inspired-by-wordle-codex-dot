"""Audit actual accepted-word coverage in the same source priority as the UI."""
import json,hashlib,argparse
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');p.add_argument('--audit-only',action='store_true');args=p.parse_args();root=Path(__file__).resolve().parent.parent;D=root/'src/data/spanish'
def exported(name):return json.loads((D/name).read_text().split(' = ',1)[1].strip().removesuffix(';'))
vocab=exported('vocabulary.ts');allowed={w for v in vocab.values() for w in v['guesses']};reviewed={**exported('learning.ts'),**exported('additional-teaching.ts')};assert set(reviewed)<=allowed
providers=[('english-wiktionary','english-translations'),('sourced-equivalents','translations'),('reviewed-spanish','spanish-derived-translations'),('derived-forms','morph-translations'),('reviewed-wordnet','wordnet-translations')];covered={w:'reviewed-teaching' for w in reviewed};counts={'reviewedTeaching':len(reviewed)};hashes={};bylength={}
for name,folder in providers:
 rows={}
 for n in [4,5,6,7]:
  path=D/f'{folder}/{n}.json';raw=path.read_bytes();hashes[f'{folder}/{n}.json']=hashlib.sha256(raw).hexdigest();part=json.loads(raw);assert set(part)<=set(vocab[str(n)]['guesses']);rows.update(part)
 fresh=set(rows)-set(covered);counts[name]=len(fresh)
 for w in fresh:covered[w]=name
for n in [4,5,6,7]:
 words=set(vocab[str(n)]['guesses']);bylength[str(n)]={'accepted':len(words),'withEnglishMeaning':len(words&set(covered)),'missing':len(words-set(covered))}
missing=sorted(allowed-set(covered));coverage={'accepted':len(allowed),'reviewedTeaching':len(reviewed),'completeExamples':len(reviewed),'englishSourceWords':counts['english-wiktionary'],'dictionaryEquivalents':counts['sourced-equivalents'],'spanishReviewedWords':counts['reviewed-spanish'],'apertiumFormWords':counts['derived-forms'],'wordnetWords':counts['reviewed-wordnet'],'translated':len(covered),'missing':len(missing),'byLength':bylength,'definition':'At least one sourced English meaning or reviewed grammatical reading; not every meaning, usage or possible grammatical interpretation. No morphology-only fallback, untranslated lemma or placeholder counts.'}
outputs={'translation-coverage.json':coverage,'translation-coverage-audit.json':{'coverage':coverage,'compiledInputHashes':hashes,'providerByWord':{w:covered[w] for w in sorted(covered)},'uncoveredWords':missing}}
for filename,value in outputs.items():
 text=json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n';path=D/filename
 if args.check or (args.audit_only and not path.name.endswith('-audit.json')):assert path.read_text()==text,'Coverage audit differs: '+filename
 else:path.write_text(text)
print(json.dumps(coverage))
