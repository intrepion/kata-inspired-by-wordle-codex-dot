# Independently sourced vocabulary

Morrowmark's answer and accepted-guess lists are **modified selections from SCOWL (Spell Checking Oriented Word Lists) 2020.12.07**, compiled by Kevin Atkinson and contributors. No Wordle-extracted word list is used by the current application. Application code/design remain under the project's MIT license; the vocabulary retains the upstream terms, not an inferred MIT/CC0 grant.

## Exact source and permissions

- Official project: [SCOWL / English Speller Database](https://wordlist.aspell.net/other/).
- Release: **2020.12.07**, before Wordle. The release README identifies revision [`5ef55f9c42730ebe4394a78b77855468a6f15dd2`](https://github.com/en-wl/wordlist/tree/5ef55f9c42730ebe4394a78b77855468a6f15dd2/scowl).
- Exact archive: [scowl-2020.12.07.tar.gz](https://downloads.sourceforge.net/wordlist/scowl-2020.12.07.tar.gz), retrieved2026-10-24. SHA-256: `5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc`.
- [Pinned complete upstream Copyright](https://github.com/en-wl/wordlist/blob/5ef55f9c42730ebe4394a78b77855468a6f15dd2/scowl/Copyright), verified byte-identical between the release and Git source, is included verbatim at [public/third-party/SCOWL-Copyright.txt](public/third-party/SCOWL-Copyright.txt) and copied to the built site's `third-party/` directory. The release README is retained at [docs/sources/scowl-2020.12.07-README.txt](docs/sources/scowl-2020.12.07-README.txt).

The collective work is Copyright2000–2018 Kevin Atkinson. Its notice explicitly permits use, copying, modification, distribution and sale of the word lists and generated output, subject to retaining the copyright/permission notices. The complete file also preserves source-specific notices and disclaimers, including WordNet, VarCon/Ispell and the UK Advanced Cryptics Dictionary (UKACD). UKACD Copyright(c) J Ross Beresford1993–1999, All Rights Reserved, requires prominent display of its notice and inclusion of its full terms; About the words displays the notice and links the full shipped file. Public-domain source credits, including Alan Beale/12Dicts and ENABLE, are retained. No contributor endorsement is claimed. This is explicit source evidence of permission under those notices, not a legal warranty about all possible rights.

## Reproducible modified selection

- Take only `english-words`, `american-words`, and `british-words` files, with tiers10,20,35,40,50,55,60,70,80. Exclude names, uppercase, abbreviation, contraction, special and additional variant categories.
- Decode the source ISO-8859-1 bytes, retain **exactly five lowercase ASCII letters**, union/deduplicate and sort. Do not strip accents into different words and do not union with retired game lists.
- Answers: tiers≤35, SCOWL's recommended small/common tier, yielding **3,493** words. Common plurals/inflections remain; this is an objective common-tier selection rather than a claim of manual editorial review of every entry.
- Guesses: tiers≤80, the broader word-game tier, yielding **11,193** words. It deliberately includes uncommon words; these do not become answers. Every curated answer is accepted.
- [src/data/scowl-source.json](src/data/scowl-source.json) pins release/revision/archive checksum, checksums of all27 selected original files, and the filtered snapshot hash. [src/data/scowl-five-letter.json](src/data/scowl-five-letter.json) retains only qualifying source tokens grouped by original filename, avoiding a large archive in the repository.
- Reproduce that snapshot from the exact archive with `python3 scripts/import-scowl.py /path/scowl-2020.12.07.tar.gz --check`. This checks the archive and every input hash without extracting files or executing upstream code.
- `node scripts/generate-vocabulary.mjs` produces uppercase `scowl-answers.ts` and `scowl-guesses.ts`; `--check` verifies them without modifying files. All application builds are offline with bundled membership data.

Dataset identities: `scowl-2020.12.07-common35-v1` and `scowl-2020.12.07-absurd35-v1`. A different guide resets incompatible saved notebooks once to defaults, as authorized; newly saved current-guide progress persists normally. The global save schema remains3. Only Morrowmark's storage entry changes.

Retired raw/generated Wordle-derived guesses/answers, the obsolete837-word migration artifact and the old third-party MIT notice have been removed. The independent SCOWL replacement avoids relying on those unresolved upstream grants. It does **not** claim complete/current official NYT acceptance, answers, editorial selection or endorsement. Any redistributed copy must retain the complete notices above.

# Automatic inline definition text

Displayed guesses, suggestions and revealed answers request individual English meanings from [Wiktionary's public experimental definition endpoint](https://www.mediawiki.org/wiki/Wikimedia_REST_API). No dictionary text dump is bundled. Each displayed word and ordinary network metadata reach the provider; no puzzle identifier, draft, hidden answer or saved statistics is transmitted. See [Wiktionary copyright information](https://en.wiktionary.org/wiki/Wiktionary:Copyrights) and [Wikimedia Terms of Use](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use#7._Licensing_of_Content).

Selected text is attributed to Wiktionary contributors with fixed entry links and [CC BY-SA4.0](https://creativecommons.org/licenses/by-sa/4.0/) attribution. Formatting is removed and entries may be selected/shortened; media and example quotations are omitted. Dictionary text is not application-MIT licensed. Coverage is incomplete and endpoint availability is not guaranteed. Definitions never affect dictionary acceptance, scoring or saves. Live sample lookups were verified2026-10-24; no coverage claim for all11,193 guesses is made.
