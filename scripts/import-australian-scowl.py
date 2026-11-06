"""Reproduce Australian SCOWL 2020.12.07 words, 3–11 lowercase ASCII letters.

Usage: python3 scripts/import-australian-scowl.py /path/scowl-2020.12.07.tar.gz [--check]
Checks the exact official archive, all nine selected files, retained upstream
notices, and snapshot digest. Reads tar members without extracting or executing
upstream files. Builds and tests use the committed snapshot without networking.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import tarfile

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'src/data'
TIERS = (10, 20, 35, 40, 50, 55, 60, 70, 80)
sha = lambda raw: hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((DATA / 'australian-scowl-source.json').read_text())
    original = json.loads((DATA / 'scowl-source.json').read_text())
    for key in ('release', 'revision', 'archiveUrl', 'archiveSha256'):
        if manifest[key] != original[key]:
            raise SystemExit(f'Australian source differs from pinned SCOWL release: {key}')
    expected_names = [f'australian-words.{tier}' for tier in TIERS]
    if list(manifest['files']) != expected_names:
        raise SystemExit('Unexpected Australian source categories or tiers')
    if sha(args.archive.read_bytes()) != manifest['archiveSha256']:
        raise SystemExit('Archive checksum mismatch')
    inputs = {}
    with tarfile.open(args.archive) as archive:
        def member_bytes(name):
            member = archive.getmember(f"scowl-{manifest['release']}/{name}")
            if not member.isfile():
                raise SystemExit(f'Expected regular source member: {name}')
            return archive.extractfile(member).read()

        for name, digest in manifest['files'].items():
            raw = member_bytes(f'final/{name}')
            if sha(raw) != digest:
                raise SystemExit(f'Input checksum mismatch: {name}')
            inputs[name] = [word for word in raw.decode('latin1').splitlines()
                            if re.fullmatch('[a-z]{3,11}', word)]
        for name, notice in manifest['notices'].items():
            raw = member_bytes(name)
            if sha(raw) != notice['sha256'] or raw != (ROOT / notice['path']).read_bytes():
                raise SystemExit(f'Upstream notice/document mismatch: {name}')
    output = json.dumps(inputs, indent=2, ensure_ascii=True) + '\n'
    if sha(output.encode()) != manifest['snapshotSha256']:
        raise SystemExit('Filtered snapshot mismatch')
    words = {word for values in inputs.values() for word in values}
    counts = {'tokens': sum(map(len, inputs.values())), 'uniqueWords': len(words),
              'byLength': {str(n): sum(len(word) == n for word in words) for n in range(3, 12)}}
    if counts != manifest['counts']:
        raise SystemExit('Filtered snapshot counts mismatch')
    target = DATA / 'australian-scowl.json'
    if args.check:
        if target.read_text() != output:
            raise SystemExit('Stored snapshot mismatch')
    else:
        target.write_text(output)
    print(f'SCOWL archive, 9 Australian source files, notices and {len(words):,} words verified.')


if __name__ == '__main__':
    main()
