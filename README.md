# Lexi Conquest

[**Play Online**](https://intrepion.github.io/kata-inspired-by-wordle-codex-dot/)

A quiet daily word dispatch: three to eleven letters in English, Spanish, French, German (Germany), Portuguese (Brazil and Portugal), Dutch (Netherlands), Russian (Russia), Italian (Italy) and Swedish (Sweden), five in Filipino, six fieldnotes, one small discovery. Original paper-and-ink design, writing and CSS illustration, inspired by five-letter deduction puzzles.

Formerly Morrowmark. Language and variety are selected separately. Each variety has its own word lists, progress and statistics. Old mixed-English games are not imported into the new English notebooks; other language saves and shared preferences stay unchanged.

## Language and variety

Choose **Language → Variety** before playing. The game remembers your last variety for each language and your word length for each variety. Statistics have independent language/variety filters.

- English: **United States**, **United Kingdom**, **Australia**. Separate SCOWL regional answer and accepted-guess lists, 3–11 letters. Five-letter answer counts: **2,074 US**, **2,067 British**, **2,087 Australian**. COLOR/COLOUR and CENTER/CENTRE follow the selected spelling category, not a mixed list.
- Español: **México** and **España**, 3–11 letters. Spain uses its own dictionary and region-compatible answer selection. Spain's bundled meanings are **Spanish definitions, not English translations**. Mexican teaching remains in Mexico's notebook only. Accents, Ü and Ñ stay distinct.
- Français: **France** and **Canada**, 3–11 letters. Conservative region-specific answer and guess selections share ordinary French words. Accents and ç do not affect play. Œ/OE and Æ/AE use two tiles; reveals retain the correct original spelling. English meanings are bundled. Regional coverage is a starter selection, not an exhaustive or native-human-reviewed dictionary.
- Português: **Brasil** and **Portugal**, 3–11 letters in Conquest, Absurd, One possibility, Smashare and Letroso. Separate regional dictionaries, answer pools, UTC daily puzzles, saved progress and statistics. Accents and ç do not affect validation, clues or wins; original spellings remain in reveals. CH, LH and NH each use two tiles. English meanings are bundled locally. Accent-colliding spellings share one gameplay identity and cannot compete as separate answers. [Sources, selection and coverage limits](docs/portuguese-sources.md).
- Deutsch: **Deutschland**, 3–11 letters. Ä, Ö, Ü and ß are distinct one-tile letters; ß displays as capital ẞ on tiles. Use the German QWERTZ on-screen keyboard or type the original spelling. AE/OE/UE and SS are not aliases. Reveals retain dictionary spelling and noun capitalization. Sourced English meanings are bundled locally. [Sources and selection](docs/german-sources.md).
- Русский: **Россия**, 3–11 letters in all five modes. A native Cyrillic keyboard and NFC normalization preserve Й/И and Ё/Е as distinct letters; Ъ and Ь each take one tile. Latin lookalikes and transliterations are not aliases. Curated answers and broader guesses have locally bundled English meanings. Russian daily puzzles, progress and statistics are separate. [Sources and selection](docs/russian-sources.md).
- Italiano: **Italia**, 3–11 letters in all five modes. Italian vowel accents do not affect play; correct spellings remain in reveals and English meanings. Accent-colliding spellings share a gameplay identity. Separate notebooks and statistics.
- Svenska: **Sverige**, 3–11 letters in all five modes. Å, Ä and Ö stay distinct with dedicated keyboard keys and Unicode NFC. Sourced English meanings and independent saves. This starter excludes accented loanwords outside the 29-letter alphabet rather than respelling them. [Both languages: sources and coverage](docs/italian-swedish-sources.md).
- Nederlands: **Nederland**, unchanged, 3–11 letters.
- Filipino: **Philippines**, unchanged, five letters.

There is no playable mixed-English option. An old English preference opens a fresh American English notebook. Original mixed-English storage is left untouched for recovery, but its rounds and statistics are not copied into regional games. Shared theme/difficulty and existing Spanish, Dutch and Filipino saves are preserved. [Decision and compatibility details](docs/adr/0040-language-varieties.md).

English lists reproduce offline with `node scripts/generate-english-varieties.mjs --check`. Regional sources and licenses are documented in [WORDS-LICENSE.md](WORDS-LICENSE.md), [Spain sources](docs/spanish-spain-sources.md), and the bundled notices. Older sections below describe historical datasets where explicitly marked; old fixed English counts do not describe the new varieties.

## Play locally

```sh
npm ci
npm run build
PORT=5298 npm run start:detached
```

Open http://127.0.0.1:5298. The launcher checks the port and refuses to replace an existing server. It runs the built game on loopback in a detached session-only Node process, with PID/log in `.local/`. It has no boot/login autostart. If5298 is occupied, choose another free port; browser saves are scoped to the origin/port. To stop only this server, inspect `.local/server.pid` and verify that PID belongs to `scripts/serve.mjs` before `kill <PID>`. Restart with the command above after a reboot. Development: `npm run dev -- --port <free-port> --strictPort`.

## Rules and records

- Type letters for the selected language or tap its on-screen keys. Enter submits, Backspace / ⌫ erases. Unknown, incomplete and already-submitted guesses spend no turn. Six accepted guesses finish the puzzle; a win finishes immediately.
- ✓ means the correct position; ↔ means another position; × means no unmatched copy remains. Exact matches consume copies first; remaining matches allocate left-to-right. APPLE / ALLEY yields ✓ ↔ × ↔ ×. Clues have symbols and accessible names, plus optional high contrast.
- Daily identity is one deterministic puzzle per **UTC date**, changing at **00:00 UTC**. The device clock supplies the date. On **November 1, 2026 at 00:00 UTC**, each language/length switches to a shared seeded shuffle: every possible answer appears once per cycle, then the same shuffled cycle repeats. Earlier dates keep their original alphabetical schedule. Saved old-client rounds keep their original answer and are labelled **Legacy daily schedule** when needed; new dates use the shuffle. Ordinary unfinished rounds expire at rollover without a loss; pending/unlimited continuations keep their original puzzle date. Input, focus and a 15-second timer detect rollover. [Algorithm, migration and publication-boundary requirements](docs/adr/0034-shared-shuffled-daily-schedule.md).
- Completed daily results count once by date. Played, wins, win rate, guess distribution, current and best streaks derive from the validated result ledger. A streak requires consecutive UTC dates won. Missing a date or losing breaks it; yesterday's winning streak remains current until today is lost or the next day is missed. Practice never counts.
- Practice is independent, replayable and saved; first practice uses APPLE as a gentle repeated-letter introduction. Fresh practice selects another answer and asks before abandoning unfinished fieldnotes.
- Drafts, guesses, mode, contrast and daily results persist in localStorage. Invalid saves are normalized or discarded. Storage failure is announced. Erasing requires confirmation; cancellation changes nothing. One browser tab is the supported active session; other tabs reload saved state before input, but simultaneous edits are not transactionally locked.
- After a completed daily, Copy spoiler-free result copies the date, result and colored clue grid without words or meanings; a selectable-text fallback is available when clipboard access fails. The app never posts externally. No account, telemetry, external fonts or paid services; meanings are bundled. The static game is published through GitHub Pages.

## Difficulty and advice

In Daily, Practice or Absurd, open **Settings (⚙) → Difficulty**: **Easy**, Normal, Hard, or Strict.

- **Easy:** unrestricted guesses plus **Optimal guesses** below the keyboard. These are the five strongest one-step worst-case guesses based only on revealed clues, with exploratory guesses allowed. Candidate answers start from the selected variety and length's curated words and are filtered by observed feedback; the hidden selected word is never used to choose advice. Before any guess, Easy automatically shows loading and then five Optimal opening guesses below the keyboard. A visible hint above the board points there. Fresh rounds, reloads and mode switches keep this behavior; no first guess is required. A singleton is offered as a direct solve.
- **Normal:** any accepted dictionary word.
- **Hard:** fixed greens and reuse revealed green/yellow copies; gray letters and previous yellow positions remain allowed.
- **Strict:** fit all earlier clues, including yellow exclusions and duplicate minimum/maximum counts.

**Settings → Show Suboptimal guesses** is optional and **off by default**, in every variant. It works in Daily, Practice and Absurd. Its five words fit all prior clues but leave the most answers in the worst case; the accepted-word universe is the selected variety and length's guess list, excluding prior guesses.

Optimal reverses that worst-case ranking. Ties use fewer expected survivors under a uniform candidate assumption, then prefer remaining answer candidates, then alphabetical order. Suboptimal ties are alphabetical. Neither ranking claims a globally optimal strategy. The worker shows loading, caches public clue histories, and cancels stale work; when neither option is requested, no ranking worker runs.

Easy may be enabled midgame on an unfinished puzzle. Hard/Strict upgrades validate every earlier guess; incompatible rounds pause intact until you change difficulty or explicitly start that round over (marked Assisted). Enabling either advice option permanently marks the active round **Assisted**, even if later turned off; mode bars and shares retain it after downgrade/reload. New advice cannot retroactively mark a finished round. Difficulty is a single persisted preference shared across Daily, Practice, Absurd, One possibility, languages and lengths. Completed results retain their recorded difficulty. Existing statistics remain combined across difficulties.

Absurd supports the same four global difficulties. Select **Absurd → Settings → Difficulty**. Easy shows clue-only Optimal advice; Normal is unrestricted; Hard and Strict use the adaptive clues. Its selection also applies to Daily and Practice and every language/length. Existing notebooks adopt the global choice when opened; incompatible ongoing histories pause rather than being discarded. See [Absurd difficulty decisions](docs/adr/0010-evil-difficulties.md).

## Absurd variant

Select **Absurd** next to Daily dispatch and Practice. Choose Easy, Normal, Hard or Strict in Settings. The selected regional dictionary remains available subject to the chosen clue restrictions. Your global difficulty follows you into Absurd.

There is no preselected answer. Each valid guess partitions the selected possible-answer pool by duplicate-aware feedback; the largest group survives. Equal groups avoid all-green when possible, then use a fixed left-to-right pattern order (absent, elsewhere, exact). The visible count shows remaining possibilities. Clues never contradict previous rows. This maximizes immediate survivors; it is not a solver or a claim that winning is mathematically impossible.

You win only on an all-green selected row; six accepted guesses otherwise end the round and reveal **one surviving answer**, clearly identified as an example. Invalid/repeated guesses spend no turn. The separate adaptive round, draft and current result resume after reload and UTC rollover, without affecting daily marks or streaks. **New Absurd round** uses the global difficulty and starts the same deterministic full pool and confirms before replacing unfinished play. Completed results remain shareable until starting a new round; shares identify Absurd/adaptive, the selected difficulty and any permanent Assisted marker. There is no lifetime Absurd result history.

When enabled in Settings, **Suboptimal** appears below the keyboard in any mode. A suggestion’s “leaves” count is the largest possible remaining group. Subtract it from the current candidate count to find the minimum number of eliminations. Words remain playable. No information list appears for a finished round; Suboptimal explains when a singleton has no meaningful ranking. Missing advice settings default off.

See [adaptive rules, tie-breaking and persistence](docs/adr/0006-impossible-variant.md).

## Historical mixed-English vocabulary provenance and scope

Both lists are independently sourced, modified selections from **SCOWL 2020.12.07**, release revision `5ef55f9c42730ebe4394a78b77855468a6f15dd2`. The **2,094-answer pool** starts from the 3,493 words in SCOWL’s small/common tier (≤35), then applies pinned AGID plural/past-tense filtering and reviewed exceptions; the **11,193 accepted guesses** use its broader word-game tier (≤80). Only lowercase five-letter ASCII entries from general, American and British word categories are included. Names, abbreviations, contractions, extra variant categories and accented forms are excluded; recognized regular/irregular plural nouns and past-tense verbs are removed from answers, while they remain valid guesses. Clear common independent senses (FOUND, WOUND, SPOKE), invariant base forms (SHEEP), and non-past S/ED words remain. Present-tense-only forms and past-participle-only forms are not generally excluded. This is a documented policy with source gaps, not exhaustive grammatical classification. This is a common-tier selection, not a claim of manual editorial review or official Wordle/NYT parity. Every answer is accepted.

See [WORDS-LICENSE.md](WORDS-LICENSE.md) for archive/input checksums, exact selection and source-specific terms. The full upstream [Copyright/permission notices](public/third-party/SCOWL-Copyright.txt) ship with the site and are linked in About the words. They explicitly permit redistribution under the retained terms; no code MIT license is substituted for data permissions. Both retired Wordle-extracted snapshots, generated modules, old notice and obsolete migration list are removed. The previous source-specific permission uncertainty is no longer relied upon; this is not a legal warranty.

Regenerate offline with `node scripts/generate-vocabulary.mjs`, or verify with `--check`. To reproduce the filtered input snapshot from the pinned official archive, run `python3 scripts/import-scowl.py /path/scowl-2020.12.07.tar.gz --check`. Builds do not download dictionaries. See [the replacement decision](docs/adr/0017-independent-scowl-vocabulary.md). The current answer-guide migration keeps original English data separately, preserves validated results and compatible progress, and starts only incompatible rounds afresh. Preferences remain unchanged. See the preservation decision below. Repository publication and the GitHub Pages pilot were explicitly authorized.

## Engineering and checks

TypeScript and Vite; zero runtime dependencies. Node 24 recommended. `npm run check` runs strict type checking, Node domain tests and a production build. `npm audit --audit-level=moderate` checks the locked development dependencies. GitHub Actions runs both on push/PR with read-only repository permissions.

The delegated design is in [docs/SPEC.md](docs/SPEC.md), terminology in [GLOSSARY.md](GLOSSARY.md), and identity/persistence decisions in `docs/adr/`. Matt Pocock's [Grill with Docs](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) and [Implement](https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md) were used with their local dependencies. The user delegated recommended choices; no interactive interview was performed. Test seams were selected from the requested scoring/session/persistence/statistics/browser contracts. Red-before-green development was used at the domain seams.

Browser evidence and independent review findings are recorded in [docs/QA.md](docs/QA.md). Date rollover and malformed saves are tested with deterministic domain fixtures, not claimed as real-time overnight browser tests. Viewport emulation is not physical mobile hardware testing. Static delivery requires HTTP; direct `file://` launch is not supported.


## Word definitions

Definitions appear automatically below **every submitted guess**, including restored guesses, within **Optimal/Suboptimal suggestions**, and beside **revealed answers**. There are no Define buttons or lookup dialog. A concise primary meaning is immediately readable; **More meanings** expands additional parts of speech/senses with native keyboard controls. Hidden unsolved answers, drafts and undisplayed candidate words are never fetched.

Meanings load from bundled, same-origin files. The app does not automatically send displayed words, guesses or puzzle state to an external dictionary or translation service. Source links open only when selected. Definitions have partial sense coverage; a missing meaning never invalidates an accepted guess.

Sourced senses retain the appropriate Wiktionary attribution and CC BY-SA 4.0 links. Spanish teaching-derived meanings are separately identified and use their own source notices. Filipino uses selected English Wiktionary Tagalog senses, with original headword links. Plain text only: formatting is removed, long entries shortened, and media/examples omitted from the dictionary sections. More meanings provides bounded additional entries and senses. Definitions never alter scoring, difficulty, accepted words, answer pools, assistance or saved progress.

Lookups are deduplicated and cancelled when context changes; stale replies cannot replace another language’s meanings. Only visible words are requested from the bundled modules, and unavailable meanings stay unavailable rather than receiving invented text. Historical remote-lookup decisions are retained in the ADRs; the current source and local delivery are documented in WORDS-LICENSE.md.


## What Absurd’s count means

Absurd displays **curated answers remaining**, using the2,094-word answer pool. Accepted guesses come from the broader11,193-word dictionary and can fit all revealed clues without belonging to that pool. The counter does not count every clue-consistent accepted guess. Easy’s direct solve and advice candidate counts use the same curated pool.

With the SCOWL replacement, the reported AUDIO→ENTRY→BEACH→VALVE→GAFFE sequence yields **2,094→410→60→27→12→6**. Those are curated survivors, independently checked against the new data; feedback differs from the retired guide where the largest bucket differs. The two former ending words are absent from the new accepted dictionary and spend no turn. Tests cover current sixth-turn outcomes, reconstruction and advice counts.


## Historical mixed-English Absurd pool and save compatibility

Absurd’s selection, remaining count, reveal and advice use exactly the current2,094 curated answers. All11,193 accepted words remain guesses subject to difficulty. Exploratory guesses do not become answers. The new dataset identifier rejects old snapshots rather than replaying their clues against a different pool. Current-guide progress resumes normally.

## Historical English answer-update compatibility

The November 6 update does not perform a global fresh start. The old automatic reset described in ADR0023 is retired. Affected English notebooks use a separate active namespace while every original stored value remains untouched. Three-letter English, Spanish, Filipino and shared preferences retain their existing keys. **Settings → Download original English notebooks** exports the original data without uploading it.

Validated historical results and statistics carry forward. Compatible fixed-answer rounds keep their exact answers, guesses and drafts. Active Absurd rounds and unfinished rounds whose answers were removed restart with the corrected pool and require Start; original data remains available. Completed fixed-answer rounds can retain a removed answer because they allow no new guesses. Smashare and Letroso retain compatible saved answers and their statistics; incompatible boards remain in the original export. Prior-list daily boards and shares are labelled **Previous English answer list**. Existing completed daily outcomes stay authoritative, so a replacement cannot count twice.

Close older tabs and refresh when updating. An old tab can still write its original namespace after the one-time import, but it cannot overwrite new progress. See [the full preservation and variant behavior](docs/adr/0037-english-answer-progress-preservation.md).

## Answer-form curation

The current five-letter guide excludes 1,399 entries from the original 3,493-word common-tier selection, leaving 2,094 answers. The November 6 review adds nine five-letter exclusions and 184 total exclusions across 3–11 letters, without changing any accepted-guess list. It individually checks forms missed because AGID marks a part of speech or variant as uncertain, plus plural-only nouns and lexical homographs. This is not blanket suffix stripping. AGID2016.01.19 is pinned at the same official repository revision as SCOWL, with reproducible extraction and complete [AGID permission/source notices](public/third-party/AGID-Copyright.txt). The generated audit is src/data/answer-curation.json. Earlier decisions remain in src/data/answer-form-overrides.json; the supplemental review and evidence are in src/data/english-answer-review.json. Common independent base senses and lexical adjectives remain eligible, while inflection-only plural/past readings do not. Present-only and participle-only forms remain outside this exclusion policy. See [the supplemental audit](docs/adr/0036-english-supplemental-form-audit.md), [earlier policy and limits](docs/adr/0019-answer-form-curation.md), and WORDS-LICENSE.md. The user subsequently authorized publishing this filtering update and a GitHub Pages pilot.

## GitHub Pages pilot

`npm run build:pages` builds `dist-pages/` with base `/kata-inspired-by-wordle-codex-dot/`. The Pages workflow checks the project before uploading this artifact; only its deploy job receives Pages write and OIDC permissions. Local `npm run build` and preview5298 continue to use root `dist/`.

The home link and module worker resolve within the project path. Public project saves use `morrowmark.kata-inspired-by-wordle-codex-dot.v1`, independent of local root notebooks and other github.io projects; erase only removes the selected notebook. Saves are browser/origin local and do not transfer from localhost. Meanings load from local bundled files; no automatic external dictionary requests occur. Missing meanings do not block play. The complete SCOWL/AGID notices ship in `third-party/`. Lexi Conquest is an original independent game, not affiliated with or endorsed by The New York Times or Wordle.

Public pilot: use the **Play Online** link above. The user authorized removing the account-site custom-domain setting and its source CNAME so project sites use their default github.io URLs. No Cloudflare, DNS or registrar settings were changed. The project notebook remains scoped to this repository path.

## Choose a word length

Use **Word length** above the board to select 3–11 letters in English or Spanish. Five remains the default. Daily, Practice and Absurd all use the selected length, with six attempts and all four difficulties. Switching opens/resumes a separate notebook: guesses, drafts, local settings and daily statistics stay with their own length; difficulty is global. New progress persists independently, with original English data retained during the answer-guide migration. Shares show the length. Erase saved notebook clears only the selected length.

| Letters | Curated answers | Valid guesses |
|---|---:|---:|
|3|447|1,151|
|4|1,479|4,964|
|5|2,094|11,193|
|6|3,148|19,816|
|7|4,121|29,870|
|8|4,208|37,175|
|9|3,700|36,799|
|10|2,788|32,523|
|11|1,747|25,693|

The English pools use the pinned, licensed SCOWL/AGID sources. The earlier 4–7 pools retain reviewed homograph overrides; the November 6 supplemental review checks missed forms and ambiguous independent senses across all lengths. Existing sources and notebook behavior are documented in [the word-length decision](docs/adr/0020-selectable-word-length.md) and the extended section below. Every answer is an accepted guess of the same length. Easy and optional Suboptimal search only the selected length; seven-letter opening analysis can take around ten seconds on this development machine, longer on slower devices. It runs in a cancellable worker with loading text so play can continue. Inline meanings have incomplete bundled coverage at every length. The Pages build includes selectable lengths.

## Language, Spanish possible answers and teaching

Use **Language** above Word length. English remains the default. **Español (México)** supports 3–11 letters in every mode/difficulty. The previously reviewed 4–7 possible-answer counts are468/857/949/1,059 (3,333 total), selected by **Zipf≥3.5 general-Spanish frequency**, documented independent base-word senses and reviewed usage/commonness decisions. There is no per-length cap or translation requirement. The RLA-es broad guess dictionaries stay2,924/9,736/21,791/42,219 words.

Plural-only and conjugated-only forms do not qualify, while independent ordinary noun/adjective homographs, infinitives and documented noninflecting base words can. VINO/wine, TRAJE/suit, ANTES and LUEGO remain valid possible answers. Source-labelled rare/archaic/offensive or regionally unsuitable senses and reviewed ambiguous homographs are excluded. General-Spanish word frequency does not certify individual-sense frequency or Mexican usage; source gaps and model-review judgment remain. This is not all Spanish words or an official Wordle list.

**All 439 reviewed records stay unchanged.** Another 2,971 original teaching entries complete translations/examples for all 3,333 possible answers, giving 3,410 records including 77 existing exploratory words. Other accepted guesses and advice words outside the answer list may still lack teaching. Empty fields stay hidden, and dictionary definitions remain a separate on-demand source. Available content appears as English translation, Mexican Spanish learner example, English sentence translation, **Possible answer: Yes/No**, then definition/source. Examples/glosses/renderings are AI-authored and independently model-reviewed, not native-human-certified or source quotations. Partial teaching keeps available fields. More meanings/Fewer meanings expands/collapses other definitions.

Per-word eligibility means actual language/length answer-list membership, not whether it still fits the current clues. No explanations use verified grammar or documented frequency/usage/review criteria where available, without inferring from suffixes. Daily, Practice and Absurd always display the possible-answer count matching all revealed duplicate-aware clues. The lightweight count starts no ranking worker and adds no Assisted label.

Difficulty is global across modes, languages and lengths. Hard/Strict upgrades validate every prior row; incompatible rounds pause intact until you change difficulty or explicitly restart (marked Assisted). Finished results keep their recorded difficulty and assistance. Other notebook settings/statistics remain isolated. Accents are required and distinct; Ñ is never N, CH/LL count twice, and mobile offers accented keys.

The expanded Spanish dataset IDs restart obsolete Spanish rounds/results once when opened. Global difficulty, local preferences and English notebooks are preserved; new Spanish progress persists normally. The existing all-game first-use reset epoch is unchanged.

Sources: RLA-es2.9 es_MX spelling under the offered MPL1.1 option; pinned wordfreq v3.0.2 and raw Spanish Wiktionary metadata under CC BY-SA4.0, with complete notices, raw-record hashes, deterministic generation and independent model review. See [WORDS-LICENSE.md](WORDS-LICENSE.md) and [the uncapped-selection decision](docs/adr/0026-uncapped-spanish-selection.md). This update remains local/uncommitted and has not changed the live site.

Complete Spanish teaching is original AI-authored educational text with independent model cross-review, not dictionary-provided translations or human/native certification. Batches and reviewed hashes are recorded in `src/data/spanish/complete-teaching-review.json`; regenerate with `node scripts/generate-complete-teaching.mjs --check`. No new pool, save or reset version is introduced. See [the teaching decision](docs/adr/0027-complete-spanish-teaching.md).

Spanish accepted-word English-meaning coverage is **61,129 / 76,670**: 3,410 preserved complete lessons, 51,975 English-Wiktionary dictionary/derived-form records, 83 additional Spanish-Wiktionary equivalents, 4,774 model-translated Spanish-dictionary records, 687 Apertium/AGID form records, and 200 reviewed MCR/WordNet lexical records after overlap. **15,541 still lack a supported bundled translation.** Examples and translated sentences remain limited to **3,410**; this does not complete full-dictionary teaching coverage. Local length-specific lazy chunks preserve gameplay, with two concise meanings initially and More English meanings for alternatives. No translation service is called. The audit `src/data/spanish/translation-coverage-audit.json` enumerates provider and gap per word. See ADR0028 and WORDS-LICENSE.md for pinned source/license details, grammatical limits and reproducibility.

Further local batches retain 82 exact independently agreed Spanish-source lexical readings from the remaining 135-root selection. `import-spanish-derived-evidence.py ARCHIVE --batch 2 --check` replays their exact source records; the shared loader keeps each batch’s source/sense/context and review proof separate. Existing batch-one runtime chunks were byte-identical after the loader extraction before adding new data. Source recognition and selected lexical readings are not themselves word coverage.

A separate frozen synonym selection adds 49 reviewed cases (48 words) after independent original reviews and an explicit selected-sense cross-review. Target gender, number and countability stay audit-only; source-word grammar and selected target usage labels remain distinct. COPINO retains a locality-dependent capacity qualification. `import-english-synonym-evidence.py ENGLISH_ARCHIVE --spanish-archive SPANISH_ARCHIVE --check` supports exact raw replay. The executed check used `--cache` with the pinned retained original broad English-source scan, plus the exact raw Spanish COPINO record/sense; this is explicitly not a new full English raw-archive replay. Unresolved synonym identities remain withheld.

An additional reviewed clitic batch covers 86 explicit accusative infinitive/affirmative-command records for eleven source-bound verb templates. Selected English it/them denotes an inanimate object; the source’s clitic gender and number remain morphology, not invented referent identities. Formal grammatical third-person commands render as usted/ustedes address. Personal/dative/reflexive, multiple-clitic, negative and other finite indicative constructions remain outside this batch. Literary and other relevant source restrictions are retained; no example sentences were invented.

English audit schema 2 replaces thousands of repeated identical review-hash maps with local JSON Pointer `#/additionalVerbReview/reviewHashes`. Per-word source hashes, selected meaning indices, grammar and rendered text remain auditable. This changes no runtime translation content. All new source-derived data here remains under the applicable Wiktionary CC BY-SA 4.0 terms with existing attribution; the independently permissive AGID inflection file does not acquire the license of its containing Apertium folder. No new GPL bilingual data was used for these layers. The project’s own code license remains as stated in LICENSE; this records source boundaries, not a legal certification of every distribution scenario.

Subsequent source-bound cross-reviews confirm 105, 121 and 73 unchanged English-source proposals and 238 + 39 unchanged Spanish-source proposals. Each confirms the selected original source record/sense/frame/profile/context with a second author; earlier different senses/notes remain archival, and agreement is not inferred from text similarity. Known subject and argument-safety exclusions are not reopened. The Spanish adapter records each active cross-review hash and rejects overwriting admitted profiles. Raw grammar, subject and qualified English-inflection guards remain unchanged. Current compiled model-translated Spanish records number 3,519 before provider overlap; the coverage manifest records the effective provider count.

Broader Spanish construction labels are scoped as source usage rather than contradictory standalone labels on a selected English rendering. ADHERÍ’s selected causative “I attached” retains the full intransitive/reflexive/transitive inventory in source proof and a clearly scoped usage note; it does not claim all those constructions apply to the displayed English reading. All 51,879 English-source word meaning sets were unchanged by this presentation-only correction. No new teaching examples, answer eligibility or saved-state resets were introduced.

Homograph merging retains supplementary Spanish form readings even when the English pipeline already supplies a different reading of the written word. AFOGARE keeps the cooking present/command readings of AFOGARAR and the qualified future-subjunctive drowning reading of AFOGAR, with separate tense/person proof and English/Spanish source links. Existing lexical/grammar/subject/inflection gates still run; identical runtime readings remain deduplicated.

An exact independently reviewed noun-number correction retains English “people” for GENTES’s ordinary human-collective source sense. Generic people→peoples pluralization would instead select a national/ethnic-community reading. This rule binds the precise English GENTE sense and GENTES form records plus Spanish “Conjunto de personas” context; Spanish plural/feminine metadata remains. It is not a global people rule or a denial of other national meanings. The audit records the superseded automatic form/AGID line separately from the current semantic mapping. `check-noun-number-context.py SPANISH_ARCHIVE` replays the exact contextual record.

The next exact-source batch adds 34 independently reviewed verb frames and an exact MERAR life-ending-sense AGID binding. Usage labels (including Chilean, colloquial and outdated senses) remain visible. Four two-record meaning resolutions retain citations to both records; unrelated previously rejected senses remain held. MERAR is restricted to the frozen attested form set, using dying (expire), never dieing (shape). These additions are model translations of selected Spanish dictionary senses, not native-human certification or new example sentences.

A further exact-source batch adds eight selected personal/causative verb senses and 66 lexical meanings. Previously restricted animal/weather senses remain restricted. PIAR visibly distinguishes its selected transitive slang wine-drinking sense from the broad intransitive header, whose original inventory stays in the audit. DROSERA's plant-in-genus wording is a separately reviewed one-field correction; the original held wording is retained as evidence. These are partial lexical/grammatical readings, not new example sentences.

A subsequent tranche adds 27 individually reviewed proper-name meanings across 26 new spellings, preserving ESCOCIA's architectural noun while adding Scotland with its capitalized source citation. Sixteen exact animal-plural indicative readings use only “they”; global singular subject restrictions remain. MIAR's rare cat-meowing sense is labeled from its selected Spanish corroboration, not its unrelated urinary sense. Retained English word/table evidence and fresh Spanish raw replay are distinguished; no fresh full English archive replay is claimed. None of these readings supplies new example sentences or changes answer eligibility.

Generated translation audits are local outputs, prepared automatically before tests with `npm run prepare:translation-audits` (Python3 required). The audit-only generators verify committed runtime chunks byte-for-byte and never replace mismatching game data. Primary selected source evidence, frozen reviews, notices and the compact inherited-proof seed remain versioned. To check the seed independently, run `python3 scripts/extract-english-singular-proof-seed.py --root . --out /tmp/morrowmark-proof-seed.json` and compare its SHA256 to the committed seed.

## Local-first meanings

Visible words use bundled English/Spanish meanings. No word is automatically sent to an external dictionary or translation service; source links open only when selected. For the original 4–7-letter lists, English has 61,910 of 65,843 accepted words with selected bundled definitions: the original 17,676 Simple English Wiktionary entries plus 44,208 English Wiktionary gap entries. Definitions load by length, totalling 10.08 MB of JSON (about 2.34 MB gzip); 3,933 words remain unavailable. Usage labels and grammatical form references are retained; not every sense is included. Spanish reuses the existing 61,129 supported meanings/learning translations, with original attribution and honest gaps. This update adds no new Spanish translations. [Data, licenses, reproduction and limits](WORDS-LICENSE.md#local-inline-meanings).

## Starting puzzles and viewing statistics

New Daily, Practice and Absurd puzzles ask for a difficulty and **Start puzzle** before showing clues or advice. Unconfirmed setup choices do not count. After Start, statistics retain the easiest level used (Easy → Normal → Hard → Strict), including changes before the first guess. Reloads/navigation cannot reset that history; a distinct new Practice/Absurd round starts fresh. Resumed old games keep their progress.

Use the **Statistics** icon to filter completed results by rules, schedule, language, available word length, difficulty and assistance without changing the game. Old Daily totals are retained as **Legacy — difficulty unrecorded**; only the last saved completed Practice/Absurd round is recoverable. Earlier replayable history and unknown exposure are not invented. Daily streaks use consecutive UTC dates; Practice/Absurd streaks use consecutive recorded wins within the selected filters. See [statistics/start policy](docs/adr/0030-segmented-statistics-start-gate.md).

**Give Up** is available on a started, unfinished puzzle. Its dialog offers every easier difficulty, or **Confirm Give Up** to end the puzzle as one loss and reveal the answer (one consistent surviving answer in Absurd). Choosing easier rules preserves the same puzzle and guesses; Cancel/Escape leave it unchanged. Give-ups retain the actual guess count, including zero, and never add fake rows or entries to the wins-only guess histogram. [Give-up policy](docs/adr/0031-give-up-confirmation.md).

## Optional extended play

After six unsuccessful guesses, choose **Keep guessing** for unlimited additional attempts on the same puzzle, or **Give up** to open the existing confirmation. Escape/backdrop dismissal leaves the choice pending; it never forfeits or reveals the answer. Pending/continued games survive reload and navigation. A Daily continuation also retains its original puzzle date across midnight until finished.

Sixth-guess wins still count normally. Extended wins are labelled separately in statistics and shares; they never enter the six-bin win histogram. Total wins/win rate explicitly include both kinds. No old six-guess losses are reopened or rewritten. [Extended-play semantics and preservation](docs/adr/0032-optional-extended-play.md).

## Arcade metadata

See [docs/arcade-metadata.md](docs/arcade-metadata.md) for the game-owned manifest and screenshot provenance.


### One possibility

The first fieldnote is a generated, prefilled clue with exactly one matching answer in the selected language and length’s answer list. Other accepted words can also match. English and Mexican Spanish at 3–11 letters are supported; normal dictionary validation, color feedback, difficulty, definitions, translations, saved notebooks and optional continuation apply. Five guesses follow the given clue in the six-fieldnote challenge. If the bounded clue search finds no unique candidate, the mode reports that and does not start. This is an independent game inspired by [NYT Wordle in 1](https://thenewyorktimeshelpcenter.helpjuice.com/bonus-puzzles), not the NYT’s puzzles or dictionary.

### Rules and schedule

Choose **Conquest**, **Absurd**, **One possibility**, or **Smashare** independently from **Daily** or **Practice**. Existing Daily and Practice notebooks retain their storage and progress; the former Absurd and One possibility notebooks become their Practice rounds. New daily variants have separate UTC-date, language and word-length notebooks.

- **Conquest Daily** is the existing shared UTC word; **Conquest Practice** remains replayable.
- **Absurd Practice** is the existing adaptive game. **Absurd Daily** shows a target word. It uses the same largest-bucket and tie rules; if the target leaves the surviving pool, the daily round is lost. Each target is constructed by replaying legal surviving-candidate guesses until a singleton is reached, proving it can be forced. A witness may take more than six guesses, so the existing optional unlimited continuation can be necessary. The target is shared for the date, language, length and answer dataset, and changes at midnight UTC.
- **One possibility Practice** remains a replayable unique-clue round. **One possibility Daily** is a deterministic mix of five distinct answers per UTC date, language, length and answer dataset. Round buttons resume each independently saved puzzle without exposing the other answers. A given clue uniquely identifies one word in that selected answer list; other accepted words may fit. In the six-fieldnote challenge the given clue occupies the first row; optional continuation remains available.

Daily variant statistics combine completed dated notebooks across UTC dates and all five One possibility rounds. Each dated round is counted once. History is limited to notebooks still present in this browser; erased or never-recorded results cannot be recovered. If a future dictionary has insufficient verified clues or a target cannot be proven reachable, the daily variant reports unavailability rather than offering an invalid puzzle. Daily data is deterministic for a given bundled dictionary version, not synchronized between devices.

### Smashare

Smashare joins two distinct words of the selected length. The **first two letters of word 1 equal the last two letters of word 2**. The grid displays word 2 first and word 1 second, with the shared letters written once: FRESH + SHEEP = FRESHEEP. Both component words of each guess must be accepted by the selected dictionary; answers use that language and length's possible-answer list. The merged string receives standard duplicate-aware feedback, counting the shared letters once. Daily pairs are deterministic by UTC date; Practice pairs and progress are separate. Six guesses may be extended or ended by giving up. Easy offers up to five clue-consistent eligible pairs using a bounded, unranked search; Hard and Strict apply their usual clue restrictions to the merged string. Difficulty can change mid-round if the previous guesses satisfy the requested rules; Easy marks the round assisted. Meanings and translations appear separately for the component words when available. Smashare rounds and completion statistics have separate browser storage for Daily and Practice.

### Additional English word lengths

English supports 3–11 letters in all five rulesets and both schedules. The 3 and 8–11 pools come from the pinned SCOWL/AGID sources. The November 6 review adds explicit word-by-word corrections to the original automatic filtering, without claiming exhaustive sense classification; see WORDS-LICENSE.md. The Spanish 3 and 8–11 lists use the pinned RLA-es spelling source and a newer Spanish Wiktionary extract with the same frequency and source-label filters; unlike the earlier 4–7 lists, the new answer selections and source-provided English equivalents have not been individually reviewed. Frequency and sense labels are incomplete and do not guarantee Mexican usage. Definitions for the new English lengths have partial Simple English Wiktionary coverage. For the large new 8–11-letter pools, full optimal/suboptimal ranking is unavailable when a word pool would require more than 25 million comparisons; Easy remains playable and the screen explains this limitation. Long Smashare boards scroll horizontally.

For the new English lengths, answer / accepted-guess counts are: 3: **447 / 1,151**; 8: **4,208 / 37,175**; 9: **3,700 / 36,799**; 10: **2,788 / 32,523**; 11: **1,747 / 25,693**. Simple English meanings cover 396, 3,271, 2,818, 2,099 and 1,298 of those answer words respectively; accepted-guess coverage is lower, and a missing meaning does not affect word validation.

Spanish 3 and 8–11 counts (possible answers / accepted guesses / answers with a sourced English equivalent): **3: 147 / 529 / 98; 8: 1,016 / 64,730 / 677; 9: 742 / 82,132 / 530; 10: 575 / 90,422 / 394; 11: 386 / 82,029 / 255**. The spelling lists include broad inflections; answer selection requires a frequency-qualified, source-labeled base sense. The equivalents are incomplete and unreviewed. See `public/third-party/spanish-extended/NOTICE.txt` and `WORDS-LICENSE.md`.

### Letroso

Letroso is an independent adaptation inspired by the [official Letroso instructions](https://letroso.com/en/daily?open=instructions). The selected language chooses an answer with a hidden length from 3–11. Daily selects the same answer per UTC date and language; Practice chooses a fresh random length and answer. Existing saved rounds resume using their original length. Guesses may be any accepted dictionary word of 3–11 letters and are unlimited. Green marks a chosen in-order subsequence, not fixed positions; joined greens are consecutive in the answer and rounded edges mark the true beginning/end. Amber means a remaining copy is present out of order; gray means no unmatched copy. Repeated letters are counted. Among equally long order matches this implementation favors longer consecutive runs and confirmed boundaries, with deterministic ties. Dutch new rounds ignore accents; Filipino normalizes optional stress marks while keeping Ñ distinct. Spanish accents and Ñ remain distinct. Existing Dutch rounds keep their original accent-sensitive clues until completed.

Daily and Practice have isolated saves and statistics. The former selected-length saves remain stored; the previously selected round is migrated when available. Easy and Normal permit any dictionary guess; Easy marks the round assisted and offers a bounded list of clue-consistent possible answers. Hard retains revealed ordered blocks and boundaries; Strict requires a new guess to reproduce earlier feedback. These difficulty restrictions are Lexi Conquest adaptations. Give Up is optional, and Daily results can be shared without letters or answers. Meanings and translations have the same incomplete coverage as other modes.

The **Theme** control in the header offers System (the default), Light and Dark. The choice is saved in this browser independently of game progress, and System follows changes to the device preference. Clue symbols and invalid-word underlines remain available in either theme.

New Smashare and Letroso rounds ask for difficulty before play, just like the other rulesets. Existing saved rounds resume as before, and choosing a difficulty only becomes global when Start puzzle is pressed.


## Filipino (Philippines), five letters

Select **Language → Filipino (Philippines)**. The interface and meanings stay in English. The Tagalog-based starter has **259 common possible answers** and **3,354 source-backed accepted guesses**, with at least one bundled sourced meaning for every accepted spelling. This is selected dictionary coverage, not every Filipino word or inflection, and does not represent all Philippine languages. No native-human certification is claimed.

All five rulesets support Daily and Practice with Easy, Normal, Hard and Strict. Filipino is five-letter only. Letroso therefore uses a five-letter answer and five-letter guesses, rather than pretending the selection supports every 3–11-letter length. Smashare uses two five-letter component words. Existing English/Spanish length choices, vocabulary and notebooks are unchanged.

Optional vowel stress/glottal marks (acute, grave and circumflex) normalize away for play; Ñ remains distinct from N, and NG occupies two tiles. Punctuation is not stripped to manufacture words: hyphenated, apostrophized and multiword forms are outside this starter. Source spellings and meaning labels remain available for attribution. Folding marks can combine meanings.

Guesses are attested lowercase lexical headwords from the pinned English Wiktionary Tagalog extract. Possible answers require a qualifying standalone sense and wordfreq Filipino spelling frequency of at least Zipf 4.5, then explicit editorial exclusions. The frequency is historical and not sense-specific. A full independent model review of the 266 provisional candidates produced seven answer exclusions and one omitted erroneous gloss; that is not native-speaker validation. Plural/verb-form-only senses, archaic/rare/offensive labels, alternative-only spellings and known clippings do not automatically become answers. Definitions do not determine guess acceptance. No live dictionary or translation requests occur.

Each Filipino notebook, variant and statistic uses its own `.fil-PH` namespace. Adding Filipino does not change the storage reset epoch or clear English/Spanish progress. Sources and terms are in [WORDS-LICENSE.md](WORDS-LICENSE.md) and the bundled [Filipino notice](public/third-party/fil-PH/NOTICE.txt). Reproduce generated data offline with `node scripts/generate-filipino.mjs --check`; full source extraction commands and hashes are in the license document.

## Dutch (Netherlands)

Select **Nederlands (Nederland)** for Dutch puzzles, with an English interface and sourced English meanings. Dutch supports lengths 3–11 across the existing rules and difficulties. The common answer pool is separate from the broader attested guess list. Inflections and less common words can be accepted guesses without becoming answers. Source labels are used to exclude marked non-Netherlands senses from answers, but the source is general Dutch, not an exhaustive Netherlands dictionary. Independent model review is not native-human certification.

**Accents don’t count. IJ uses two tiles.** Accented and plain input are equivalent for validation, clues, difficulty restrictions and winning: CAFÉ/CAFE and REËEL/REEEL each share one gameplay spelling. Revealed answers retain their correct dictionary spelling, including accents and trema. IJS has three letters and IJZER has five; Unicode Ĳ/ĳ normalizes to IJ, never Y. AA, OE and UI use separate letters, and IJ remains distinct from EI. No punctuation is silently stripped.

Saved Dutch rounds opened before this change retain their original accent-sensitive rules, guesses, drafts, clues and recorded results. A visible notice and the original accented keyboard identify those rounds. Fresh practice rounds and new daily puzzles use the new rule; no notebook or statistics reset is needed. See [the migration decision](docs/adr/0039-dutch-accent-equivalence.md).

Definitions are bundled locally and retain Wiktionary attribution, sense labels and CC BY-SA 4.0 terms. Wordfreq supplies historical spelling frequency, not proof that every meaning is common. [Source details](WORDS-LICENSE.md) and [Dutch notices](public/third-party/nl-NL/NOTICE.txt).

Dutch adds its own `.nl-NL` save namespace. Existing English, Spanish and Filipino datasets, notebooks, statistics and preferences are unchanged. No storage reset or publication is part of this addition.

## Portuguese regional puzzles

Choose **Language → Português**, then **Brasil** or **Portugal**. The interface remains in English. Both varieties support 3–11 letters, all five rule sets, Daily and Practice schedules, and Easy, Normal, Hard and Strict difficulty. Regional spelling sources validate separate guess lists; curated possible answers are a smaller selection. Ordinary shared Portuguese words can appear in both varieties. This is a regional starter selection, not an exhaustive dictionary or native-human certification.

Type **ACAO** for **AÇÃO** or **CORACAO** for **CORAÇÃO**: accents, tilde and cedilla fold for scoring and duplicate checks. Reveals keep the original spelling. Accent collisions such as **AVÓ/AVÔ** have only one selected answer per variety, so a single guess cannot leave two indistinguishable answers. Plain-input meanings can display both headwords with their individual source links; an accented reveal keeps its exact headword. Punctuation is not silently removed.

Portuguese Smashare compares shared two-letter seams after folding and requires two different gameplay words. Both component spellings survive in the reveal. The new Portuguese behavior does not alter existing languages’ pair schedules or rewrite old notebooks. Portugal and Brazil keep independent language/length/mode keys; shared difficulty remains global. Switching varieties resumes that variety’s saved game.

The bundled data, provenance, source licenses, reproducible generation instructions and current counts are described in [Portuguese sources](docs/portuguese-sources.md). Missing meanings never invalidate a guess. No live dictionary or translation service is called during play.
