# Dutch (Netherlands) data

Offline, pinned English Wiktionary Dutch lexical evidence from Kaikki and wordfreq 3.0.2 spelling-frequency bins. Exact source URLs, byte sizes and SHA-256 hashes are in `src/data/dutch/source.json`. Full attribution and licenses are shipped in `public/third-party/nl-NL/`.

The lexical input is the **deprecated postprocessed per-language** English Wiktionary extract, not raw Wiktextract data. The current raw `downloads/nl/nl-extract.jsonl` is the Dutch-language Wiktionary edition, not a replacement for English-gloss Dutch data. The full English-edition multilingual raw source is substantially larger. A future refresh should migrate the extractor rather than quietly treating the deprecated endpoint as current raw data. This snapshot has no exact per-entry article revision; per-line SHA-256 and original headwords are retained.

The reviewed snapshot contains **2,123 answers and 82,165 guesses**, with local English meanings for every accepted guess. Answer counts for lengths 3–11 are 160, 333, 327, 386, 309, 240, 181, 113 and 74.

## Orthography

NFC preserves accents and trema. Case folds to uppercase. Unicode Ĳ/ĳ folds to IJ, occupying **two tiles**. Y stays distinct. Supported letters are A–Z and ÀÁÂÄÇÈÉÊËÍÎÏÓÔÖÙÚÛÜ. Only single orthographic words of 3–11 code points after this normalization enter the pool; spaces, hyphens and other scripts are excluded. The imported source has lowercase Dutch headwords and lexical POS only, not proper-name POS.

The source spellings and answer order are unchanged. New Dutch gameplay rounds use a separate comparison key that removes combining diacritics after normalization. Accented and plain guesses are accepted and scored identically; canonical accents remain in answer reveals and dictionary links. Plain-input meanings can include multiple accent-equivalent source headwords. Legacy saved rounds retain the original accent-sensitive rules. See [ADR 0039](../adr/0039-dutch-accent-equivalence.md).

## Selection and limitations

Broad guesses include attested lowercase headwords, including labelled regional, historical and inflected forms. Answers are separate. Candidate answers require historical wordfreq Zipf ≥4.3 and a standalone sense without excluded usage labels or form/alternative relationships. Every candidate is classified by an independent model linguistic review in `review.json`; exclusions have reasons. This is not native-human certification, and source labels and model review can miss errors. Frequency measures spellings in mixed historical corpora, not current Netherlands-specific senses. The review intentionally excludes uncertain/commonness-ambiguous spellings, foreign-only uses, non-Netherlands-only uses, vulgar/offensive entries and abbreviations.

Definitions preserve source labels and original spelling, with at most eight source entries and eight senses per entry. They are English glosses, not authored teaching sentences or exhaustive usage lessons. Definitions are split by length for lazy runtime loading. No runtime download or external dictionary request is needed.

## Reproduction

Download the two exact artifacts listed in `source.json`, then:

```sh
python3 scripts/import-dutch.py /path/to/dutch.jsonl /path/to/small_nl.msgpack.gz
node scripts/generate-dutch.mjs --candidates
node scripts/generate-dutch.mjs
python3 scripts/import-dutch.py /path/to/dutch.jsonl /path/to/small_nl.msgpack.gz --check
node scripts/generate-dutch.mjs --check
```

The importer refuses input hashes different from the pinned snapshot. The generator checks evidence hashes and exact full candidate-review coverage. Importing a changed source requires a newly documented review, not automatic eligibility. Runtime files are `vocabulary.json` and `definitions-3.json` through `definitions-11.json`; audit, evidence and selection files remain source-only. Adapted lexical data, frequency data and selections are CC BY-SA 4.0. Game code retains its separate license.
