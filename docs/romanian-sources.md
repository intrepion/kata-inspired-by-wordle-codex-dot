# Romanian (Romania) lexical data

The offline `ro-RO` pack adapts English Wiktionary Romanian entries distributed by Kaikki and wordfreq 3.0.2 frequency bins under **CC BY-SA 4.0**. Exact URLs, byte lengths and SHA-256 digests are in `src/data/romanian/source.json`. Rights were checked against [Kaikki](https://kaikki.org/dictionary/), [Wiktionary copyright](https://en.wiktionary.org/wiki/Wiktionary:Copyrights), and the pinned [wordfreq README](https://github.com/rspeer/wordfreq/blob/372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b/README.md#license). Full license, notices and source credits ship in `public/third-party/ro-RO/`. Game code retains its separate license.

The starter pack has **1,770 independently model-reviewed answers** and **14,684 accepted guesses**, all with at least one bundled English source meaning. Counts for lengths 3–11:

- Answers: **129 / 247 / 338 / 321 / 285 / 219 / 127 / 75 / 29**.
- Guesses: **519 / 1,255 / 2,114 / 2,544 / 2,671 / 2,227 / 1,629 / 1,115 / 610**.

Eleven-letter coverage is intentionally small: its daily cycle repeats after 29 answers. It is not padded with obscure words to meet an arbitrary count. All five modes are feasible at every offered length; Letroso hides its answer length and searches the combined 3–11-letter pool. **No native-human review or certification has been performed.**

## Orthography

All 31 letters of the Romanian alphabet are available. **Ă, Â, Î, Ș and Ț are separate, single-tile letters**, with dedicated on-screen keys. NFC composes equivalent Unicode input. Legacy cedilla Ş/ş and Ţ/ţ map to modern comma-below Ș/ș and Ț/ț, including decomposed cedilla input. These aliases never map to plain S/T. Â and Î are never merged; A is not Ă/Â and I is not Î.

Foreign letters are not transliterated or expanded (for example ß is not SS and ﬀ is not FF). Hyphens, apostrophes, spaces and other punctuation are excluded, **never deleted to manufacture joined spellings**. This is an intentionally incomplete letter-only pack, not a statement that Romanian never uses punctuation. Original source headwords are retained for attribution; gameplay tiles use modern uppercase Romanian.

## Selection and English meanings

Accepted guesses require lexical attestation, non-proper-name POS, historical spelling Zipf >=2.5, and at least one retained source gloss. They may include inflections, alternative spellings, loanwords and labelled historical, regional, uncommon or sensitive senses. They are not a complete Romanian dictionary or a fully proofread learner glossary.

Candidates require Zipf >=4.3 and an eligible independent sense after usage/form filtering. `review.json` explicitly classifies all 1,812 candidates: 1,770 approved and 42 excluded. Review rejects leaked inflections, acronyms, obscure homographs with frequency inflated by names or common forms, obsolete/regional readings and unreliable gloss evidence. Ordinary independently attested adjectival participles, action nouns, infinitives and function words may qualify. Frequency measures spellings in historical mixed corpora, not individual meanings or exclusively contemporary usage in Romania.

The sense pass also records **29 exact rejected source senses**, including incorrect DIN “on, on top of”, BRAD “pine tree”, and the misleading bare EVIDENȚĂ “evidence”. These are omitted from both answer evidence and bundled meanings, not replaced with invented translations. Generation fails if an exact rejection no longer matches the source. Eight source spellings lose their only usable entries and therefore do not enter the accepted-guess pool. Every answer retains at least one eligible, unrejected sense.

The independent model review covers candidate evidence and identified sense defects. It does **not** certify every gloss of every accepted guess. Source and review errors may remain; native Romanian review is still desirable. Up to eight source entries and eight senses per entry are bundled, with supplied usage labels and original-headword source links. These are dictionary glosses, not authored teaching examples or a translated UI.

## Reproduce

The pinned Kaikki artifact is the **deprecated postprocessed per-language snapshot**, not the current raw multilingual export. Only lexical fields are retained; examples, quotations, media, translations, etymology, categories and enrichment are omitted. Original headwords and per-record hashes remain in reduced evidence. Exact individual article revisions are not supplied by Kaikki.

Original snapshots are retained locally in the untracked `.local/romanian-sources/` folder. On another computer, download the artifacts named in `source.json`; the importer refuses changed upstream snapshots. Reduced evidence supports deterministic offline generation without those large original files:

```sh
python3 scripts/import-romanian.py /path/Romanian.jsonl /path/small_ro.msgpack.gz --check
node scripts/generate-romanian.mjs --candidates
# Independently review every new candidate and source-sense rejection when inputs change.
node scripts/generate-romanian.mjs
node scripts/generate-romanian.mjs --check
```

`source.json` pins reduced inputs; `review.json` pins full candidate content, not just word names; `coverage.json` pins review and outputs. Hashing detects changed inputs, not linguistic correctness. The application imports static vocabulary and lazy per-length English meanings, with no dictionary or translation requests. `ro-RO` has independent datasets, daily cycles, statistics and saves. Existing language datasets and the all-game reset epoch stay unchanged.
