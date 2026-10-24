"""Reproduce 4/6/7-letter input snapshots from the already pinned SCOWL/AGID archives.
Usage: python3 scripts/import-lengths.py SCOWL_ARCHIVE WORDLIST_ARCHIVE [--check]
No upstream code is executed. Five-letter source and generated outputs remain unchanged.
"""
from pathlib import Path
import hashlib,json,re,sys,tarfile
root=Path(__file__).resolve().parent.parent;data=root/'src/data';sha=lambda b:hashlib.sha256(b).hexdigest()
scowl=json.loads((data/'scowl-source.json').read_text());agid=json.loads((data/'agid-source.json').read_text())
archives=[Path(x).read_bytes() for x in sys.argv[1:3]]
if [sha(b) for b in archives]!=[scowl['archiveSha256'],agid['archiveSha256']]:raise SystemExit('Archive checksum mismatch')
inputs={}
with tarfile.open(sys.argv[1]) as tar:
 for name,digest in sorted(scowl['files'].items()):
  raw=tar.extractfile(f"scowl-{scowl['release']}/final/{name}").read()
  if sha(raw)!=digest:raise SystemExit(f'SCOWL file mismatch: {name}')
  inputs[name]=[w for w in raw.decode('latin1').splitlines() if re.fullmatch('[a-z]{4}|[a-z]{6,7}',w)]
with tarfile.open(sys.argv[2]) as tar:raw=tar.extractfile(f"wordlist-{agid['revision']}/agid/infl.txt").read()
if sha(raw)!=agid['dataSha256']:raise SystemExit('AGID input mismatch')
words={w.encode() for name,entries in inputs.items() if int(name.split('.')[-1])<=35 for w in entries}
forms=b''.join(line for line in raw.splitlines(keepends=True) if set(re.findall(rb"[A-Za-z']+",line))&words)
snapshot=(json.dumps(inputs,indent=2)+'\n').encode();manifest={'lengths':[4,6,7],'scowlSnapshotSha256':sha(snapshot),'agidSnapshotSha256':sha(forms),'provenance':'Same archives, exact source revisions, input hashes and permission notices as scowl-source.json and agid-source.json. SCOWL general/American/British size80 guesses, size35 answer base; lowercase ASCII only.'}
for name,output in [('scowl-other-lengths.json',snapshot),('agid-other-lengths.txt',forms),('word-length-source.json',(json.dumps(manifest,indent=2)+'\n').encode())]:
 p=data/name
 if '--check' in sys.argv:
  if p.read_bytes()!=output:raise SystemExit(f'Snapshot mismatch: {name}')
 else:p.write_bytes(output)
print('4/6/7-letter snapshots verified from pinned licensed sources')
