"""Reproduce relevant AGID rows/notices from the pinned official repository archive, without executing upstream code.
Usage: python3 scripts/import-agid.py /path/wordlist-source.tar.gz [--check]
"""
from pathlib import Path
import hashlib,json,re,sys,tarfile
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'src/data/agid-source.json').read_text());sha=lambda raw:hashlib.sha256(raw).hexdigest();archive=Path(sys.argv[1])
if sha(archive.read_bytes())!=manifest['archiveSha256']:raise SystemExit('AGID archive checksum mismatch')
with tarfile.open(archive) as tar:
 prefix=f"wordlist-{manifest['revision']}/agid/";raw=tar.extractfile(prefix+'infl.txt').read();readme=tar.extractfile(prefix+'README').read()
if sha(raw)!=manifest['dataSha256'] or sha(readme)!=manifest['readmeSha256']:raise SystemExit('AGID input checksum mismatch')
sources=json.loads((root/'src/data/scowl-five-letter.json').read_text());words={w.encode() for name,entries in sources.items() if int(name.split('.')[-1])<=35 for w in entries}
snapshot=b''.join(line for line in raw.splitlines(keepends=True) if set(re.findall(rb"[A-Za-z']+",line))&words)
notice=readme[:readme.index(b'The file')]+readme[readme.index(b'COPYRIGHT AND SOURCE:'):];format=readme[:readme.index(b'This verson')]
for rel,output,key in [('src/data/agid-relevant.txt',snapshot,'snapshotSha256'),('public/third-party/AGID-Copyright.txt',notice,'licenseSha256'),('docs/sources/agid-2016.01.19-format.txt',format,'formatSha256')]:
 if sha(output)!=manifest[key]:raise SystemExit(f'AGID derived checksum mismatch: {rel}')
 target=root/rel
 if '--check' in sys.argv:
  if target.read_bytes()!=output:raise SystemExit(f'AGID stored snapshot mismatch: {rel}')
 else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(output)
print('AGID raw data, format, relevant records and complete source notices verified.')
