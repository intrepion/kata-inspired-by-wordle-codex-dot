"""Verify/extract the exact official RLA-es2.9 es_MX release without executing upstream code.
Usage: python3 scripts/import-spanish.py /path/es_MX-v2.9.xpi [--check]
"""
from pathlib import Path
import hashlib,json,sys,zipfile
root=Path(__file__).resolve().parent.parent;manifest=json.loads((root/'src/data/spanish/source.json').read_text());archive=Path(sys.argv[1]);sha=lambda raw:hashlib.sha256(raw).hexdigest()
if sha(archive.read_bytes())!=manifest['artifactSha256']:raise SystemExit('RLA-es artifact checksum mismatch')
with zipfile.ZipFile(archive) as z:
 for name,digest in manifest['files'].items():
  raw=z.read('dictionaries/'+name)
  if sha(raw)!=digest:raise SystemExit('RLA-es file checksum mismatch: '+name)
  target=root/'public/third-party/es-MX'/name
  if '--check' in sys.argv:
   if target.read_bytes()!=raw:raise SystemExit('Stored RLA-es source mismatch: '+name)
  else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
print('Official es_MX-v2.9 artifact, dictionary, affixes and complete notices verified.')
