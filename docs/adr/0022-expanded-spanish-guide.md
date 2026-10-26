# ADR0022: Expanded Spanish learner guide

The local es-MX guide now has100 curated answers at each supported length4–7 (400 total). This adds76 per length to the original24. Existing English data and all Spanish accepted guesses are unchanged.

|Length|Curated answers|Accepted guesses|
|---|---:|---:|
|4|100|2,924|
|5|100|9,736|
|6|100|21,791|
|7|100|42,219|

There are439 complete teaching records: the previous118 unchanged,304 new curated entries and17 new exploratory Easy openers. Every answer and every current top-five Easy opener has a gloss, Spanish example, English sentence rendering and sourced meaning. Most remaining accepted words have no reviewed teaching record; empty fields stay hidden and visible words may request a definition on demand.

## Curation and review

The hand-selected learner vocabulary favors everyday, natural usage for learners in Mexico, not an arbitrary filter of all spelling words. Every new answer is an accepted singular/invariant noun, base adjective or infinitive. All304 authored rows and their selected definition senses received independent model review (76 at each length), with wording corrections for source alignment. Independent noun senses such as OÍDO, BEBIDA, CARGA, ASIENTO, CAPTURA and DERECHO are retained. Plurals, finite past forms, archaic and derogatory exploratory entries are excluded from answers. This is not an exhaustive morphology classifier, frequency-certified corpus or native-human certification.

All17 recalculated Easy opener records were separately reviewed. The minimax objective and full accepted-guess search remain unchanged. Consequently, advice can include uncommon, technical or derogatory words even though those are not curated answers. Teaching glosses identify such usage. No fabricated claim of contemporary conversational Mexican usage or historical quotations is made for those records.

## Source permissions and reproduction

Spelling remains pinned RLA-es2.9 es_MX, under the offered MPL1.1 option with complete upstream sources/notices. New meanings use attributed Wiktionary data under the sources' stated CC BY-SA4.0 terms. Source indices, revisions, checksums and review metadata are in `definition-selection.json`, `wiktionary-snapshot.json`, `learning-manifest.json` and `expanded-support.json`.

New English API extracts retain Spanish definition groups, omitting other languages and example quotations. Metadata distinguishes each extract hash from its original upstream response hash. Selected Spanish definitions/conjugation evidence support BUÑUELO, CONREA and RALEO; the RALEO extract omits an unselected third-party literary quotation. CINTERO is translated from French Wiktionary's rubanier trade entry, which explicitly links the Spanish equivalent; its revision37466020, mapping text and official CC BY-SA4.0 rights metadata are pinned. These are attributed translations/adaptations, not fictitious Spanish standalone entries. Glosses and examples remain original AI-authored/model-reviewed educational text under CC BY-SA4.0.

Offline regeneration:

```
node scripts/generate-spanish.mjs --check
node scripts/generate-spanish-learning.mjs --check
```

The source-release verifier remains `scripts/import-spanish.py <pinned-es_MX.xpi> --check`. No runtime AI, paid API, account or new credentials are required. See WORDS-LICENSE.md for complete notices and limitations.

## Save compatibility

Spanish answer IDs change from `es-MX-rla2.9-starter-N-v1` to `es-MX-rla2.9-common-N-v2`; adaptive IDs change to `es-MX-rla2.9-absurd-N-v2`. The known prior Spanish guide restarts rounds and results once, retaining validated per-round/global difficulty, contrast, optional-advice preference and selected variant. New progress persists normally. Different language/length notebooks, unrelated origin storage and all English schedules/progress remain isolated. There is no blanket reset of English or other games.

## Verification

148 tests, typecheck, root and Pages builds, dependency audit and independent code/data reviews pass. Dedicated headless desktop/mobile checks cover all initial openers and restored guesses offline, new-answer meanings, adaptive counts, old-guide migration, preferences, English preservation, mobile accents, missing/partial teaching, stale requests and worker responsiveness. The production UI and its source data remain local and uncommitted pending separate publication authorization.
