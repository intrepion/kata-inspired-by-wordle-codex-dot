"""Reproduce the filtered input snapshot from the exact official SCOWL archive; no network or extraction to disk.
Usage: python3 scripts/import-scowl.py /path/scowl-2020.12.07.tar.gz [--check]
The archive URL/hash and every selected source-file hash are in src/data/scowl-source.json.
"""
from pathlib import Path
import hashlib,json,re,sys,tarfile
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'src/data/scowl-source.json').read_text())
archive=Path(sys.argv[1]);sha=lambda raw:hashlib.sha256(raw).hexdigest()
if sha(archive.read_bytes())!=manifest['archiveSha256']:raise SystemExit('Archive checksum mismatch')
inputs={}
with tarfile.open(archive) as tar:
 for name,digest in sorted(manifest['files'].items()):
  raw=tar.extractfile(f"scowl-{manifest['release']}/final/{name}").read()
  if sha(raw)!=digest:raise SystemExit(f'Input checksum mismatch: {name}')
  inputs[name]=[word for word in raw.decode('latin1').splitlines() if re.fullmatch('[a-z]{5}',word)]
 for source,target in [('Copyright','public/third-party/SCOWL-Copyright.txt'),('README','docs/sources/scowl-2020.12.07-README.txt')]:
  if tar.extractfile(f"scowl-{manifest['release']}/{source}").read()!=(root/target).read_bytes():raise SystemExit(f'Upstream notice/document mismatch: {source}')
output=json.dumps(inputs,indent=2,ensure_ascii=True)+'\n'
if sha(output.encode())!=manifest['snapshotSha256']:raise SystemExit('Filtered snapshot mismatch')
target=root/'src/data/scowl-five-letter.json'
if '--check' in sys.argv:
 if target.read_text()!=output:raise SystemExit('Stored snapshot mismatch')
else:target.write_text(output)
print('SCOWL archive, 27 source files and five-letter snapshot verified.')
