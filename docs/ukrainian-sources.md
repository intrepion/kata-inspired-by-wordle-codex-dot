# Ukrainian (Ukraine) lexical data

The offline pack adapts English Wiktionary Ukrainian entries distributed by Kaikki and wordfreq 3.0.2 frequency bins under **CC BY-SA 4.0**. Exact URLs, byte lengths and SHA-256 digests are in `src/data/ukrainian/source.json`. Source rights were checked against [Kaikki](https://kaikki.org/dictionary/), [Wiktionary copyright](https://en.wiktionary.org/wiki/Wiktionary:Copyrights) and the pinned [wordfreq README](https://github.com/rspeer/wordfreq/blob/372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b/README.md#license). Full license, notices and source credits ship in `public/third-party/uk-UA/`. Game code retains its separate license. **No VESUM data is used.**

The initial pack contains **1,562 independently model-reviewed answers** and **17,151 accepted guesses**, all with bundled English meanings. Answer counts for lengths 3–11 are 100 / 199 / 281 / 270 / 214 / 189 / 158 / 98 / 53. Guess counts are 465 / 1,183 / 2,141 / 2,676 / 2,770 / 2,655 / 2,309 / 1,724 / 1,228. Native-human review has not been performed.

## Orthography

Only the 33 Ukrainian letters А Б В Г Ґ Д Е Є Ж З И І Ї Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ь Ю Я are playable, at lengths 3–11. Unicode NFC composes equivalent input before uppercase. **Й/И, Ї/І, Є/Е and Ґ/Г remain distinct. Ь occupies one tile.** No generic combining-mark stripping, Russian-only Ё/Ъ/Ы/Э, Latin lookalikes or transliterations are accepted. Keyboard layout uses Ukrainian Cyrillic with a separate Ґ key.

**Apostrophized words are excluded for this first version.** Required apostrophes in words such as м’ясо and п’ять are never silently removed to manufacture misspellings. Straight, curly and modifier apostrophes are all rejected. Stress marks, hyphens, spaces and other scripts are excluded. This is an intentionally incomplete letter-only starter pack, not a claim that Ukrainian words never contain apostrophes.

## Selection and English meanings

Accepted guesses require source lexical attestation, non-proper-name POS and historical spelling Zipf >=2.5. They may include source-labelled inflections, alternatives, historical, regional or uncommon entries. English source meanings retain usage labels and original-headword links, capped at eight entries and eight senses per entry. These are dictionary glosses, not authored teaching examples.

Answer candidates require an eligible standalone sense, no excluded usage/region tags or form/alternative relationship, and **Zipf >=4.3 plus one explicitly reviewed exception**: ҐРУНТ (soil/ground, figuratively basis/foundation), at exact spelling Zipf 3.82. This ordinary lemma gives Ґ representation without merging Ґ with Г or relaxing the general threshold. Its historical allotment-land sense does not qualify it. The exception is recorded in candidate, selection and coverage data. No other below-threshold spellings become answers.

`review.json` explicitly classifies every candidate; generation rejects stale/incomplete review and fewer than 40 answers at any length. Independent model editorial review targets ordinary contemporary standard Ukrainian. It does not certify every source gloss or prove current Ukraine-specific frequency. Spelling frequency is historical mixed-corpus evidence, not a measurement of each sense. The review excludes dubious entries including УРЯД (ordinary government sense is incorrectly labelled rare in this snapshot, leaving an unsuitable adverb sense) and СПРАВЖНЄ (questionable gloss). Missing and uncommon words remain possible. Native Ukrainian review remains desirable before describing the pack as linguistically certified.

## Reproduce

The pinned Kaikki artifact is the **deprecated postprocessed per-language snapshot**, not the current raw multilingual export. Only lexical fields are retained; examples, quotations, media, translations, etymology, categories and enrichment are omitted. Original headwords and per-record hashes remain in reduced evidence. Exact individual article revisions are not supplied by Kaikki.

The original snapshots are retained locally in the untracked `.local/ukrainian-sources/` folder. Download the exact artifacts in `source.json` there when reproducing on another computer. The importer refuses changed upstream snapshots. Reduced evidence is sufficient for deterministic offline generation:

```sh
python3 scripts/import-ukrainian.py /path/Ukrainian.jsonl /path/small_uk.msgpack.gz --check
node scripts/generate-ukrainian.mjs --candidates
# Independently review every candidate into review.json when the inputs change.
node scripts/generate-ukrainian.mjs
node scripts/generate-ukrainian.mjs --check
```

`source.json` pins reduced input hashes. `coverage.json` pins review and generated outputs. The candidate-content hash protects sense changes as well as word names. The application imports static vocabulary and lazy per-length definitions; builds and gameplay require no lexical downloads or external translation requests. Ukrainian has independent datasets, daily cycles and saved notebooks across all five modes. Adding it does not change other languages' answer datasets or stored progress.
