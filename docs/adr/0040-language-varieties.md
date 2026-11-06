# ADR 0040: Separate language and regional variety

## Decision

The game chooses a language family and then a backed regional variety. The initial selection is American English. A last-used variety is remembered for each language, independently of its saved word length. Statistics use the same two selectors without changing the live puzzle. Interface language remains English; this does not claim a translated interface.

Each playable locale has a distinct dataset, deterministic daily schedule seed, saved notebook and statistics namespace. Existing `es-MX`, `fil-PH` and `nl-NL` data, keys and normalization rules stay unchanged. Shared theme and difficulty keys stay unchanged. New `en-US`, `en-GB`, `en-AU`, `es-ES`, `fr-FR` and `fr-CA` namespaces never import one another's rounds.

The user rejected a mixed English choice and accepted starting those games over. Bare `en` is therefore not offered in either selector. Historical `en` data and APIs remain solely for validation and recovery; the application does not migrate or replay mixed-English boards into a regional notebook, and does not delete old values or unrelated storage. There is no global reset.

## English source policy

The pinned SCOWL 2020.12.07 `english-words` category is combined separately with exactly one of `american-words`, `british-words` or `australian-words`. Answer tier is ≤35 and guess tier ≤80, at lengths 3–11. The original audited morphology exclusions remain. This is a source-defined standard spelling selection, not an exhaustive list of every spelling accepted in every region. Shared ordinary words naturally appear in several varieties, but the regional category is never unioned with another regional category.

Australian source files were newly imported from the exact previously pinned archive and independently checksummed. Of 272 new Australian common-tier entries absent from the previous common-tier union, 65 documented standalone bases are approved and 207 are explicitly deferred as guess-only. Generation verifies source snapshots, definition evidence and the complete approval/deferred partition. New words lacking a bundled meaning do not borrow an English homograph or receive an invented meaning.

## Spain and French

Spain has its own RLA-es Spain spelling dictionary and Spain-compatible sense selection. Meanings are explicitly Spanish-language dictionary definitions, not English translations and not Mexico-context teaching lessons. Source frequency remains general Spanish; regional coverage is incomplete.

French has separate Canada and France selections with a shared neutral core and documented regional evidence. Accent marks and ç are ignored for comparisons. Canonical accents remain in answer reveals; Œ/OE and Æ/AE are two tiles, with the original ligature restored in reveal text. Broad accepted guesses and curated possible answers are separate. Source coverage is a conservative starter selection, not native-human certification or exhaustive regional coverage.

## Verification

Tests precede the new registry/normalization integration and verify source reproduction, locale-specific answer and guess membership, all supported lengths, daily/adaptive/One/Smashare/Letroso behavior, definitions, independent saves and historical data preservation. Browser checks use a local HTTP server and isolated profiles, not file URLs or the user's saved browser profile. Publication is a separate approved step.
