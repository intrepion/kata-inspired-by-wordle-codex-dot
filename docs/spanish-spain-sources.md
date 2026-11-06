# Spain Spanish pack

`src/data/spanish-spain/vocabulary.json` exports a length-indexed object with
`answers` and `guesses` arrays for lengths 3–11. It is independent of `es-MX`.
`spanishSpainDefinition` in `src/spanish-spain-definitions.ts` loads only local,
length-specific meanings. Route `es-ES` to it; do not route it through Mexican
teaching examples. Meanings are in Spanish, explicitly labelled as such.

## Sources and licensing

- The official [RLA-es 2.9 Spain dictionary](https://github.com/sbosio/rla-es/releases/download/v2.9/es_ES.xpi)
  supplies spelling validity. The exact unmodified `.aff` and `.dic` and all
  upstream license/readme files are retained under `public/third-party/es-ES`.
  MPL 1.1 is the chosen upstream license. nspell 2.1.5 is a build-only MIT tool.
- Existing pinned Spanish Wiktionary/Wiktextract and wordfreq 3.0.2 extracts
  supply lexical evidence, native-Spanish meanings, and general-Spanish spelling
  frequency. Their original source metadata and retained notices remain in
  `src/data/spanish` and `public/third-party/spanish-selection`. Derived meanings
  and answer selection use CC BY-SA 4.0, with attribution and license in the
  [Spain notice](../public/third-party/es-ES/NOTICE.txt).
- `source.json` pins the exact source files and reused inputs by SHA-256.
  `coverage.json` records output digests and answer/guess/definition counts.

## Selection

Require es-ES spelling validity, Zipf >= 3.5, and an independent nonplural
base-word sense. Spain-labelled senses qualify even if they also name other
regions. Foreign-only and subregional-only senses, obsolete, rare, vulgar,
inflected, plural-only, and other unsuitable senses are excluded. Inherited
Spanish morphology/commonness judgments remain conservative defaults. An
explicit Spain review restores neutral **coger**, and prefers meanings such
as **coche** (car), **piso** (apartment), **móvil** (mobile phone), **ordenador**
(computer), and **patata** (edible tuber). No per-length answer cap is applied.

The spelling source is genuinely es-ES. The frequency source is **not** a
Spain-specific corpus, and evidence coverage originally followed es-MX
accepted forms. Missing evidence never fabricates an answer or definition.
All answers have a retained dictionary meaning. Guess-only meanings have
incomplete coverage and retain their source usage labels. This is model/source
review, not human/native certification.

## Reproduction and integration

Run `node scripts/generate-spanish-spain.mjs --check` for offline byte-for-byte
validation, or omit `--check` to regenerate. No download or Python environment
is needed. Run the dedicated test with
`node --import tsx --test tests/spanish-spain.test.ts`.

Integration must use a fresh `es-ES` dataset/save identity and preserve existing
`es-MX` schedules and notebooks. Apply the same distinct-accent Spanish input
rules to es-ES, including Ñ and Ü. This change deliberately does not modify
shared language, word routing, dropdown, persistence, or Mexico files.
