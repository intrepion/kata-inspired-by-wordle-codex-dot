# German (Germany) lexical data

The offline pack uses English Wiktionary German entries distributed by Kaikki and wordfreq 3.0.2 frequency bins. `src/data/german/source.json` pins exact URLs, byte lengths and SHA-256 digests. Licensing was checked against [Kaikki rights](https://kaikki.org/dictionary/), [Wiktionary copyright](https://en.wiktionary.org/wiki/Wiktionary:Copyrights), and the pinned [wordfreq README](https://github.com/rspeer/wordfreq/blob/372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b/README.md#license). Adapted lexical/frequency data and selections are CC BY-SA 4.0; full notices and source credits ship in `public/third-party/de-DE/`. Game code retains its separate license.

## Spelling and scope

NFC-composed A–Z, Ä, Ö, Ü and ẞ only, 3–11 tiles. Replace ß with ẞ before uppercasing. Umlauts are not folded to vowels or expanded to AE/OE/UE; ẞ is not SS. `Straße` is six tiles, `STRAẞE`. Canonical source headwords retain exact source spelling/case in `canonical-spellings.json`, including capitalized nouns. The first eligible lexical headword is chosen deterministically when capitalization creates a homograph; otherwise the first attested headword is used. Definitions retain their individual source spellings. This deliberately excludes loanwords with other diacritics, hyphenated words and multiword expressions.

Guesses require attestation in a supported lexical part of speech and historical Zipf ≥2.5, retaining labelled inflections, regional and historical entries. No grammatical forms are invented. Proper-name POS is excluded; ordinary capitalized German nouns are retained. Source labels can be incomplete, so guesses do not claim exhaustive Germany-only separation. English source glosses are supplied for every accepted guess, capped at eight entries and eight senses each. They are dictionary meanings, not authored teaching examples.

## Answer review

Candidates require Zipf ≥4.3 and at least one standalone sense without form/alternative relationships, inflection glosses, or excluded usage/region labels. `review.json` explicitly classifies every candidate. The generator refuses missing or stale review entries, unqualified answers and fewer than 40 answers at any supported length. Independent model review is not native-human certification. Frequency is historical mixed-region spelling frequency, not current Germany-specific sense frequency. Accepted guesses are broader than answer choices.

## Reproduce

Download the exact artifacts listed in `source.json`, retaining them outside the repository (the lexical snapshot is approximately 1 GB). The Kaikki artifact is the deprecated postprocessed per-language snapshot, not the current raw multilingual extract. If the mutable upstream URL changes, the importer deliberately refuses it; the retained reduced evidence is sufficient to regenerate shipped files offline. No per-article revision is supplied by Kaikki. Record-level input hashes are retained.

```sh
python3 scripts/import-german.py /path/to/German.jsonl /path/to/small_de.msgpack.gz
node scripts/generate-german.mjs --candidates
# Independently review every candidate into review.json before generation.
node scripts/generate-german.mjs
python3 scripts/import-german.py /path/to/German.jsonl /path/to/small_de.msgpack.gz --check
node scripts/generate-german.mjs --check
node --import tsx --test tests/german-data.test.ts
```

`source.json` pins reduced input hashes. `coverage.json` records review-input and generated-output hashes. The app consumes `vocabulary.json`, `canonical-spellings.json` and lazy length-specific definitions; evidence/review files remain build-time material. No runtime dictionary or frequency service is contacted.

Frequency-only normalization: wordfreq upstream Unicode casefolds ß to ss. Both attested spellings therefore use the same spelling-frequency bin, without merging gameplay tiles or definitions. This can overestimate an individual spelling or sense; editorial review remains required. Primary implementation: https://github.com/rspeer/wordfreq/blob/372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b/wordfreq/preprocess.py
