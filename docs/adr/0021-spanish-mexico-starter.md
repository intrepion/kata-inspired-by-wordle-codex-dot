# English-default language selector and es-MX learning starter

Status: local implementation; no publication authorized for this update.

## Scope and teaching quality

The interface stays English. Language selects puzzle words and teaching material. English remains default and retains all existing4–7-letter vocabulary, datasets, daily schedules, saves, settings and statistics. Spanish (Mexico), `es-MX`, is the first alternative, explicitly labelled **starter**.

Spanish has **100 curated answers per length**,400 total, selected as reviewed common singular/invariant-singular nouns, base adjectives and infinitives. There are **439 complete teaching entries**: all400 answers plus39 exploratory words, including old and recalculated Easy openers. Other exploratory words remain valid guesses but most have no reviewed English translation/example. The UI states this directly, omits empty teaching fields, and can still fetch an English Wiktionary Spanish-entry definition for a visible word. It never invents missing content.

Display order is English translation, Spanish example for learners in Mexico, English sentence rendering, then sourced definition. Short glosses, Spanish sentences and their English renderings are original **AI-authored** material with **independent model review**. This is not human/native-speaker certification, not source quotations and not a claim that shared Spanish wording is uniquely Mexican. All439 authored entries and their primary definition senses were independently reviewed. Regional contexts include LIMÓN/lime, PLUMA/pen, CAMIÓN/bus and CELULAR/cellphone. SALA's sourced definition is broadly room; its living-room gloss is separately authored/reviewed. Structured API regional-label spans are incomplete, so they are not cited as proof of Mexican usage.

FreeDict0.3.1 was evaluated and rejected: sample glosses omitted important Mexican meanings and sometimes offered archaic/misaligned English. No FreeDict data is bundled.

## Explicitly permitted lexical source

RLA-es2.9 official es_MX release:

- Project/revision: https://github.com/sbosio/rla-es/tree/ea82c1214ead57740798acf66a1e18e5ac874c41
- Release: https://github.com/sbosio/rla-es/releases/tag/v2.9
- Artifact: https://github.com/sbosio/rla-es/releases/download/v2.9/es_MX.xpi
- SHA256: `c77ea2f40358d2a30f2acf72f78f8f0628c2e47ad2cb5f41bb4601fefccbe22e`
- README/LICENSE explicitly offer GPL3+, LGPL3+ or MPL1.1+. This modified spelling-data selection chooses **MPL1.1**. Complete original notices and source `.dic`/`.aff` files remain byte-identical in `public/third-party/es-MX/` and ship with builds. Individual source hashes are in `src/data/spanish/source.json`.

Pinned **nspell2.1.5 (MIT)** expands the pair during offline generation, then lowercase NFC Spanish-letter surface forms of length4–7 that pass that parser are retained. It is a dev dependency only, never a runtime package. This is a reproducible selection according to that parser, not a claim of full Hunspell-engine parity, exhaustive Spanish coverage, frequency or uniquely Mexican vocabulary.

| Letters | Starter answers | Accepted guesses |
|---|---:|---:|
|4|100|2,924|
|5|100|9,736|
|6|100|21,791|
|7|100|42,219|

The broader spelling guide includes inflections, rare and shared Spanish forms. Curated selection is **positive reviewed morphology metadata**, not English AGID, a suffix heuristic or an assumption that every Hunspell root is a singular lemma. Plural/past-only extras cannot enter the answer list. VINO retains its independently reviewed wine noun sense despite its past-tense homograph; VIERNES is a singular weekday despite finalS. Other finite verb forms, plurals, proper names and guessed lemmas are not automatically curated. Each mode and advice candidate count uses only its language/length answer pool.

## Definitions, attribution and generation

Original entry definitions are selected from English Wiktionary's **Spanish** entries, under its stated **CC BY-SA4.0** terms. The pinned raw API responses are pinned by SHA256/ETag/revision metadata in `wiktionary-snapshot.json`; explicit selected sense indices are in `definition-selection.json`. Most definitions are selected source text; some entries use explicitly reviewed translations/adaptations of Spanish base meanings and inflections. Authored gloss/example fields have separate provenance and are released alongside them under CC BY-SA4.0. The selected/modified data attributes Wiktionary contributors, links each pinned revision's Spanish section and the license, and indicates transformations (sense selection, plain-text rendering). No images/audio/corpus quotations are copied. See WORDS-LICENSE.md and public notices.

All439 teaching definitions work offline from this fixed snapshot. Other visible words use the existing no-key public endpoint with Spanish language-group selection. Unavailable/malformed/offline responses remain informational and never affect guessing. Only displayed words are requested individually; never a hidden answer, candidate list, puzzle ID or saved history. The provider can see requested words and IP address. Browser lookups retain debounce, two-request bound, timeout, cancellation and cache limits. Clients are fixed to a language and kept separately, avoiding English/Spanish homograph cache leaks. Language switches close obsolete display sessions; delayed replies cannot overwrite the new view.

Normal builds do not download word lists or teaching content. Reproduce offline:

```
python3 scripts/import-spanish.py /path/es_MX-v2.9.xpi --check
node scripts/generate-spanish.mjs --check
node scripts/generate-spanish-learning.mjs --check
```

The generated files are checked against hashed source snapshots and reviewed metadata. A source update requires explicit snapshot/sense review, not a silent live rewrite. During research the default Python User-Agent was rejected; the successful source downloader followed Wikimedia's documented descriptive-User-Agent policy, with two bounded workers and immediate stop on access/rate-limit rejection. No credentials, paid service or runtime AI is used.

## Orthography and state

NFC plus locale-aware uppercase preserves Spanish accents and Ñ. Á/É/Í/Ó/Ú/Ü are distinct from unaccented vowels, and Ñ is always distinct from N. Each normalized character counts once; CH and LL count twice. Accents are required to match the dictionary. On-screen Ñ and accented-vowel keys support mobile entry; native selects retain keyboard behavior. The board has Spanish language markup, English teaching/definition prose uses `lang=en`, and Spanish examples use `lang=es-MX`.

Language and length are public advice inputs; the selected hidden answer never crosses that boundary. Dataset/cache keys distinguish language even on empty histories. Feedback, duplicate caps, Hard/Strict, six attempts and largest-bucket Absurd use only the matching pools. Spanish Easy/Suboptimal still search the broad dictionary; unfamiliar/rare advice can lack teaching fields, and minimax does not imply frequency or an optimal overall strategy.

English save keys and schema3 datasets are unchanged. Spanish notebooks suffix the project/root namespace with `.es-MX`, then the existing length suffix as appropriate. Language choice has its own namespaced preference; length preferences are separate per language. Switching opens/resumes the selected notebook while preserving the current variant. Settings, daily histories/results and adaptive rounds remain separate. Each language/length uses its own sorted answer cycle with the existing UTC epoch. Spanish's100-answer cycle repeats after100 days. Guide v2 restarts known previous Spanish v1 rounds/results once, retaining valid difficulty/contrast/advice preferences. Subsequent progress persists normally; English data/keys/progress remain unchanged. Wrong-language/dataset snapshots fail closed within that notebook. There is no blanket reset. Erase affects only the current language/length notebook and never unrelated origin data. Shares identify Spanish, length, difficulty and assistance without revealing guesses.

Opener follow-up: all20 current Easy opening suggestions are covered. The original18 opener additions use the `exploratory` category, never answer eligibility. Source records, translations of abinar/abromar base entries and inflection tables are pinned and hashed. Rare/obsolete forms keep usage labels; old-style example sentences are explicitly invented, not claimed historical quotations.

Expanded guide: 304 new curated entries (76 per length) received independent linguistic and source-index review. All118 original records are preserved byte-for-byte at the generated-record boundary. Seventeen recalculated Easy suggestions have teaching-only records; all20 initial recommendations are covered. Singular/invariant nouns, base adjectives and infinitives are positively selected; independent nouns OÍDO, BEBIDA, CARGA, ASIENTO, CAPTURA and DERECHO retain their noun senses. Plurals/past forms and uncommon/derogatory exploratory entries are excluded from answers. This is a reviewed learner selection, not a validated frequency corpus or exhaustive morphology classifier.

Source additions are pinned under CC BY-SA4.0. Spanish raw-source extracts and supporting conjugations establish the translated BUÑUELO, CONREA and RALEO meanings. CINTERO uses the French trade entry rubanier with an explicit Spanish translation mapping, whose current license is verified in captured official rights metadata. Snapshot/extract transformations and upstream hashes are explicit; unrelated language groups and example quotations are omitted from the new English API extracts. RALEO's unselected third-party literary quotation is omitted. Offline generation verifies input hashes, selected senses, adaptation evidence, source revisions and counts. No runtime AI, paid API or new credentials are required.
