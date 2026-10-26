# Local bundled meanings

The user approved removing automatic third-party dictionary calls. Definitions
for visible words now use same-origin static files. No bulk API harvesting and
no further Spanish translation-completeness work is part of this change.

English uses the small SHA-pinned Simple English Wiktionary raw extract hosted
by Kaikki (4,726,754 compressed bytes), not the multi-gigabyte full dump. Only
accepted lowercase 4–7-letter headwords and bounded senses are retained. There
are 17,676 defined words out of 65,843 accepted guesses, in 2,852,448 bytes of
JSON, loaded by length. This includes 8,869 of 10,887 possible English answers.
Missing words stay explicitly unavailable. No inferred inflection definitions,
examples, media or quotations are imported. Sense/usage labels are retained.

Spanish first preserves 439 dictionary-backed archive records, then reuses
existing teaching translations or the already bundled source-derived meanings.
The teaching-derived result is labelled AI-authored/model-reviewed, not falsely
attributed to a dictionary. Source-derived forms keep their usage/grammar labels
and existing source/license boundaries. Measured coverage is unchanged: 61,129
of 76,670 accepted words, including all 3,333 possible answers. Complete lesson
coverage remains 3,410; no new translations or lessons were authored.

Static module imports deduplicate within the browser; clients bound visible work,
cache results and ignore/cancel stale updates. Reloads may request static files
again according to browser caching, but never an external definition endpoint.
Loading a length file does not identify the requested word to a third-party
provider. Source links open only upon explicit user selection. Same-origin
chunk failures show unavailable/reload states without external fallback.

The DefinitionClient transport argument remains an explicit adapter-test seam
for legacy response/cancellation regressions; production creates it without a
transport and there is no default fetch. Definitions do not change vocabulary,
answer eligibility, scoring, ranking, datasets, saves or reset epochs.

Data notices and CC BY-SA 4.0 apply to the modified Wiktionary selection,
separately from application code. Existing GPL-derived and WordNet material keeps
its separate notices and preferred source evidence. See WORDS-LICENSE.md and
src/data/definitions/source.json for pinned input/output hashes and reproduction.

Validation: fail-first public client regression, full test/typecheck/build,
reproducible import, coverage measured through actual default client for every
accepted word, and isolated desktop/mobile subpath gameplay with all external
requests blocked and counted. Existing notebooks and preferences are unchanged.
