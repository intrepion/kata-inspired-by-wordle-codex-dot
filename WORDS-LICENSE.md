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
- Answer starting set: tiers≤35, SCOWL's small/common tier, yielding3,493 words. The AGID curation below removes recognized plural/past forms and yields **2,103 answers**. This is not a claim of manual editorial review or exhaustive classification of every entry.
- Guesses: tiers≤80, the broader word-game tier, yielding **11,193** words. It deliberately includes uncommon words; these do not become answers. Every curated answer is accepted.
- [src/data/scowl-source.json](src/data/scowl-source.json) pins release/revision/archive checksum, checksums of all27 selected original files, and the filtered snapshot hash. [src/data/scowl-five-letter.json](src/data/scowl-five-letter.json) retains only qualifying source tokens grouped by original filename, avoiding a large archive in the repository.
- Reproduce that snapshot from the exact archive with `python3 scripts/import-scowl.py /path/scowl-2020.12.07.tar.gz --check`. This checks the archive and every input hash without extracting files or executing upstream code.
- `node scripts/generate-vocabulary.mjs` produces uppercase `scowl-answers.ts` and `scowl-guesses.ts`; `--check` verifies them without modifying files. All application builds are offline with bundled membership data.

Dataset identities: `scowl-2020.12.07-answers-v2` and `scowl-2020.12.07-absurd-v2`. The known previous SCOWL guide restarts incompatible rounds/results once while retaining validated per-mode difficulties and preferences; unknown/legacy guides fall back to defaults. New current-guide progress persists normally. The global save schema remains3. Only Morrowmark's storage entry changes.

Retired raw/generated Wordle-derived guesses/answers, the obsolete837-word migration artifact and the old third-party MIT notice have been removed. The independent SCOWL replacement avoids relying on those unresolved upstream grants. It does **not** claim complete/current official NYT acceptance, answers, editorial selection or endorsement. Any redistributed copy must retain the complete notices above.

# AGID answer-form curation

Morphology comes from **AGID2016.01.19**, Kevin Atkinson and contributors, at the same pinned official en-wl/wordlist revision `5ef55f9c42730ebe4394a78b77855468a6f15dd2`:

- [Pinned infl.txt](https://github.com/en-wl/wordlist/blob/5ef55f9c42730ebe4394a78b77855468a6f15dd2/agid/infl.txt), SHA256 `df0c8f6edd4193d823abfad9e4ff6f42b4526211516649e1c73d4533aef749fa`.
- [Pinned format/permission README](https://github.com/en-wl/wordlist/blob/5ef55f9c42730ebe4394a78b77855468a6f15dd2/agid/README), SHA256 `d7e5fee4bd2d370c231581679e9d4f4a099cef0629f44aa64e0b0b46ed8a8167`.
- Source archive SHA256 `933cd8edab9297fc8cb6358d7cb3d05a50371107d1431af61de09eaa875043ac`; exact URLs/hashes, filtered-row/format/notice hashes are in src/data/agid-source.json. Only relevant original rows are retained in src/data/agid-relevant.txt, not the full3.3MB database.
- The unmodified upstream header plus the complete COPYRIGHT AND SOURCE section ship as [AGID-Copyright.txt](public/third-party/AGID-Copyright.txt). Copyright2000-2016/2000-2014 Kevin Atkinson; the grant explicitly permits use, copying, modification, distribution and sale of the database and generated output subject to retained notices. Source-specific WordNet, UKACD and public-domain contributor notices are included. This is not an inferred application-MIT grant or a blanket legal warranty. The format excerpt is docs/sources/agid-2016.01.19-format.txt. Both extracts omit an unrelated third-party usage quotation; permission terms are not altered.

`python3 scripts/import-agid.py /path/wordlist-source.tar.gz --check` verifies raw source and reproducibly derives the filtered metadata/notices without executing upstream code. The existing offline Node generator reads AGID grammar, then regenerates answers and the reason-by-word audit. The accepted-guess module remains byte-for-byte unchanged.

Only recognized noun plurals and verb finite past-tense slots are automatic exclusions, including irregulars. Invariant forms identical to their lemma are retained. Questioned POS, marked uncertain alternatives and variant levels≥2 are not automatic evidence. Reviewed exclusions address HIDED and SADES; reviewed keeps retain common independent senses such as FOUND(establish), WOUND(injury), SPOKE(wheel part), MEANS(singular method), CORPS(singular unit), and GENUS. A rare/derived usage alone does not rescue a routine inflection. Decisions and reasons are in src/data/answer-form-overrides.json; the generated audit records1,390 removed words (1,109 noun-plural mappings,279 past mappings,2 reviewed exclusions), leaving2,103.

This deliberately does not remove all verb/adjective inflections. Present-tense-only forms and participle-only forms such as EATEN/TAKEN may remain; obvious singular S words and non-past ED words remain. AGID is an older automatically generated source with gaps; this policy does not certify every English sense. HIDED/SADES review was crosschecked against Wiktionary [revision86821937](https://en.wiktionary.org/w/index.php?title=hided&oldid=86821937) and [revision79276574](https://en.wiktionary.org/w/index.php?title=sades&oldid=79276574); no definition prose from those entries is imported into generation. Complete attribution for runtime Wiktionary text remains below.

# Automatic inline definition text

Displayed guesses, suggestions and revealed answers request individual English meanings from [Wiktionary's public experimental definition endpoint](https://www.mediawiki.org/wiki/Wikimedia_REST_API). No dictionary text dump is bundled. Each displayed word and ordinary network metadata reach the provider; no puzzle identifier, draft, hidden answer or saved statistics is transmitted. See [Wiktionary copyright information](https://en.wiktionary.org/wiki/Wiktionary:Copyrights) and [Wikimedia Terms of Use](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use#7._Licensing_of_Content).

Selected text is attributed to Wiktionary contributors with fixed entry links and [CC BY-SA4.0](https://creativecommons.org/licenses/by-sa/4.0/) attribution. Formatting is removed and entries may be selected/shortened; media and example quotations are omitted. Dictionary text is not application-MIT licensed. Coverage is incomplete and endpoint availability is not guaranteed. Definitions never affect dictionary acceptance, scoring or saves. Live sample lookups were verified2026-10-24; no coverage claim for all11,193 guesses is made.
