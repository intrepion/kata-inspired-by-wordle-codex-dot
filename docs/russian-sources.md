# Russian (Russia) lexical data

The offline pack adapts English Wiktionary Russian entries distributed by Kaikki and wordfreq 3.0.2 frequency bins. Exact URLs, byte lengths and SHA-256 digests are in `src/data/russian/source.json`. The source licenses were checked against [Kaikki rights](https://kaikki.org/dictionary/), [Wiktionary copyright](https://en.wiktionary.org/wiki/Wiktionary:Copyrights), and the pinned [wordfreq README](https://github.com/rspeer/wordfreq/blob/372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b/README.md#license). Adapted lexical/frequency data and selections are CC BY-SA 4.0. Full license, notices and source credits ship in `public/third-party/ru-RU/`; game code retains its separate license.

The pack contains **1,550 reviewed answers** and **38,843 accepted guesses**, all with bundled English meanings. Answer counts for lengths 3–11 are 105 / 194 / 281 / 291 / 240 / 174 / 125 / 84 / 56. Guess counts are 804 / 2,259 / 4,400 / 5,945 / 6,968 / 6,366 / 5,413 / 3,931 / 2,757.

## Orthography and coverage

Only NFC Russian Cyrillic А–Я and Ё, 3–11 letters, are playable. Uppercase preserves Й and Ё; they are not И and Е. No generic combining-mark stripping, transliteration or Latin lookalikes are allowed. Ь and Ъ each occupy a tile. Hyphenated words, spaces, stress marks, historical letters and other scripts are excluded. Native Cyrillic keyboard input and composed/decomposed NFC-equivalent letters agree.

Guesses require source lexical attestation (excluding proper-name POS) and historical spelling Zipf >=2.5 (including the frequency-only Ё fallback). Labelled inflections, alternatives, regional and historical entries can be guesses. Attested Е spellings can be separate guesses but are never aliases for corresponding Ё spellings; alternative-only senses cannot qualify an answer. English source meanings are bundled for every accepted guess, capped at eight entries and eight senses per entry, retaining usage labels and original-headword source links. These are dictionary glosses, not authored teaching examples.

For attested lexical Ё words, frequency uses the maximum of its exact spelling and the corresponding Е spelling estimate, because ordinary print often omits the dots. This frequency-only fallback does not merge lexical or gameplay identities and may overestimate an individual sense. Missing low-frequency or unattested words remain possible. Source labels and broad-guess region distinctions may be incomplete. This is a conservative starter pack, not exhaustive Russian vocabulary, native-human certification or official Wordle parity.

## Answer review

Candidates require spelling Zipf >=4.3 (including the frequency-only Ё fallback) and a standalone sense without a form/alternative relationship, inflection gloss, or excluded usage/region label. `review.json` explicitly classifies every candidate. The generator rejects incomplete/stale reviews, unqualified answers and fewer than 40 answers at any supported length. Independent model editorial review targets ordinary contemporary standard Russian in Russia. It does not certify every sense or prove current regional frequency. Answer lists are much narrower than guesses.

## Reproduce

The Kaikki artifact is the deprecated postprocessed per-language snapshot, not the current raw multilingual export. The original ~905 MiB JSONL and wordfreq input are retained outside tracked source in `.local/russian-sources/`. Download the exact artifacts in `source.json`; the importer refuses a changed mutable upstream snapshot. Reduced evidence suffices for deterministic offline generation, and per-source-record hashes remain in evidence. Kaikki does not provide exact individual article revisions.

```sh
python3 scripts/import-russian.py /path/Russian.jsonl /path/small_ru.msgpack.gz --check
node scripts/generate-russian.mjs --candidates
# Review all candidates independently into review.json before generation.
node scripts/generate-russian.mjs
node scripts/generate-russian.mjs --check
```

`frequency-alias-evidence.json` records exact, Е-counterpart and selected frequency estimates for every included Ё spelling. The generator verifies the review’s candidate-content hash, not just word-name membership, to reject stale reviews after sense or frequency changes.

`source.json` pins reduced input hashes; `coverage.json` pins editorial review and generated outputs. The app imports vocabulary and lazy per-length definition chunks only, without runtime lexical downloads or translation services.
