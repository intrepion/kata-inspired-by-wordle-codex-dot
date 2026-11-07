# 0043: Russian (Russia)

## Decision

Add `ru-RU` as the Russian family’s Russia variety, displayed as Русский → Россия. Keep the application interface in English and supply source-attributed English dictionary meanings from local, length-specific chunks. Do not imply that the pack is exhaustive, exclusively Russian-region vocabulary, or native-human certified.

Use the 33-letter Russian Cyrillic alphabet for 3–11-tile puzzles. Normalize spelling to NFC and uppercase with the Russian locale. Й is not И and Ё is not Е, including decomposed Unicode equivalents. Ъ and Ь each occupy one tile. Reject Latin lookalikes, transliteration, obsolete/additional Cyrillic letters, spaces, punctuation and unsupported combining marks. Do not reuse the accent-stripping rules of French, Dutch or Portuguese.

The on-screen keyboard follows ЙЦУКЕН rows, with a separate visible Ё key and Enter/Erase controls. Physical Cyrillic keyboard events use the same normalization and validation path. Existing Latin-language keyboard layouts and normalization remain unchanged.

Use an attested guess pool and a smaller reviewed standalone-answer pool. Sourced inflections can be guesses without becoming surprise answers. Both pools and bundled meanings come from pinned, licensed inputs, with reproducible source extraction and generation documented in [Russian sources](../russian-sources.md). No remote lookup is required at play time.

## Identity and compatibility

The language registry is the shared authority for selectors, statistics filters and validation. Every length receives a new Russian answer/adaptive dataset identifier. Existing deterministic daily scheduling includes that identifier and locale. Conquest, Absurd, One possibility, Smashare and Letroso use the selected Russian dictionary, with independent Daily/Practice state and existing difficulty rules.

Russian saves use the existing language-scoped namespace, never an English or other-language notebook. No global storage epoch, existing-language dataset, migration or reset changes. Shared theme and difficulty remain shared. Switching language or length retains the previous notebook.

## Verification

Require language/data/integration regressions for NFC, Й/И, Ё/Е, repeated letters, invalid lookalikes, difficulty and advice, all supported lengths, each ruleset, persistence and language isolation. Test desktop and mobile browser flows on 127.0.0.1 in disposable contexts, including reload, language round trips, modal dismissal, native keys and local meanings. Run the repository aggregate checks and Pages build before proposing publication. Local implementation does not authorize a commit, push or deployment.
