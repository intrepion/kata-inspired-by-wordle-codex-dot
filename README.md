# Morrowmark

[**Play Online**](https://intrepion.github.io/kata-inspired-by-wordle-codex-dot/)

A quiet daily word dispatch: five letters, six fieldnotes, one small discovery. Original paper-and-ink design, writing and CSS illustration, inspired by five-letter deduction puzzles.

## Play locally

```sh
npm ci
npm run build
PORT=5298 npm run start:detached
```

Open http://127.0.0.1:5298. The launcher checks the port and refuses to replace an existing server. It runs the built game on loopback in a detached session-only Node process, with PID/log in `.local/`. It has no boot/login autostart. If5298 is occupied, choose another free port; browser saves are scoped to the origin/port. To stop only this server, inspect `.local/server.pid` and verify that PID belongs to `scripts/serve.mjs` before `kill <PID>`. Restart with the command above after a reboot. Development: `npm run dev -- --port <free-port> --strictPort`.

## Rules and records

- Type A–Z or tap keys. Enter submits, Backspace / ⌫ erases. Unknown, incomplete and already-submitted guesses spend no turn. Six accepted guesses finish the puzzle; a win finishes immediately.
- ✓ means the correct position; ↔ means another position; × means no unmatched copy remains. Exact matches consume copies first; remaining matches allocate left-to-right. APPLE / ALLEY yields ✓ ↔ × ↔ ×. Clues have symbols and accessible names, plus optional high contrast.
- Daily identity is one deterministic puzzle per **UTC date**, changing at **00:00 UTC**. The device clock supplies the date. The versioned SCOWL common-word guide and epoch 2026-01-01 determine identity. The independent SCOWL guide replaces the old sequence. An unfinished dispatch expires at rollover without counting as a loss. Input, focus and a 15-second timer detect rollover.
- Completed daily results count once by date. Played, wins, win rate, guess distribution, current and best streaks derive from the validated result ledger. A streak requires consecutive UTC dates won. Missing a date or losing breaks it; yesterday's winning streak remains current until today is lost or the next day is missed. Practice never counts.
- Practice is independent, replayable and saved; first practice uses APPLE as a gentle repeated-letter introduction. Fresh practice selects another answer and asks before abandoning unfinished fieldnotes.
- Drafts, guesses, mode, contrast and daily results persist in localStorage. Invalid saves are normalized or discarded. Storage failure is announced. Erasing requires confirmation; cancellation changes nothing. One browser tab is the supported active session; other tabs reload saved state before input, but simultaneous edits are not transactionally locked.
- Share copies spoiler-free symbols locally with a selectable-text fallback; the app never posts externally. No account, telemetry, external fonts or paid services. The static game is published through GitHub Pages. The public definition lookup is the only runtime API integration.

## Difficulty and advice

In Daily, Practice or Absurd, open **Settings (⚙) → Difficulty**: **Easy**, Normal, Hard, or Strict.

- **Easy:** unrestricted guesses plus **Optimal guesses** below the keyboard. These are the five strongest one-step worst-case guesses based only on revealed clues, with exploratory guesses allowed. Candidate answers start from all 2,103 curated words and are filtered by observed feedback; the hidden selected word is never used to choose advice. Before any guess, Easy automatically shows loading and then five Optimal opening guesses below the keyboard. A visible hint above the board points there. Fresh rounds, reloads and mode switches keep this behavior; no first guess is required. A singleton is offered as a direct solve.
- **Normal:** any accepted dictionary word.
- **Hard:** fixed greens and reuse revealed green/yellow copies; gray letters and previous yellow positions remain allowed.
- **Strict:** fit all earlier clues, including yellow exclusions and duplicate minimum/maximum counts.

**Settings → Show Suboptimal guesses** is optional and **off by default**, in every variant. It works in Daily, Practice and Absurd. Its five words fit all prior clues but leave the most answers in the worst case; the accepted-word universe is all 11,193 words, excluding prior guesses.

Optimal reverses that worst-case ranking. Ties use fewer expected survivors under a uniform candidate assumption, then prefer remaining answer candidates, then alphabetical order. Suboptimal ties are alphabetical. Neither ranking claims a globally optimal strategy. The worker shows loading, caches public clue histories, and cancels stale work; when neither option is requested, no ranking worker runs.

Easy may be enabled midgame on an unfinished puzzle. Hard/Strict upgrades validate every earlier guess; incompatible rounds pause intact until you change difficulty or explicitly start that round over (marked Assisted). Enabling either advice option permanently marks the active round **Assisted**, even if later turned off; mode bars and shares retain it after downgrade/reload. New advice cannot retroactively mark a finished round. Difficulty is a single persisted preference shared across Daily, Practice, Absurd, languages and lengths. Completed results retain their recorded difficulty. Existing statistics remain combined across difficulties.

Absurd supports the same four global difficulties. Select **Absurd → Settings → Difficulty**. Easy shows clue-only Optimal advice; Normal is unrestricted; Hard and Strict use the adaptive clues. Its selection also applies to Daily and Practice and every language/length. Existing notebooks adopt the global choice when opened; incompatible ongoing histories pause rather than being discarded. See [Absurd difficulty decisions](docs/adr/0010-evil-difficulties.md).

## Absurd variant

Select **Absurd** next to Daily dispatch and Practice. Choose Easy, Normal, Hard or Strict in Settings. The 11,193-word dictionary remains available subject to the chosen clue restrictions. Your global difficulty follows you into Absurd.

There is no preselected answer. Each valid guess partitions the surviving 2,103-answer pool by duplicate-aware feedback; the largest group survives. Equal groups avoid all-green when possible, then use a fixed left-to-right pattern order (absent, elsewhere, exact). The visible count shows remaining possibilities. Clues never contradict previous rows. This maximizes immediate survivors; it is not a solver or a claim that winning is mathematically impossible.

You win only on an all-green selected row; six accepted guesses otherwise end the round and reveal **one surviving answer**, clearly identified as an example. Invalid/repeated guesses spend no turn. The separate adaptive round, draft and current result resume after reload and UTC rollover, without affecting daily marks or streaks. **New Absurd round** uses the global difficulty and starts the same deterministic full pool and confirms before replacing unfinished play. Completed results remain shareable until starting a new round; shares identify Absurd/adaptive, the selected difficulty and any permanent Assisted marker. There is no lifetime Absurd result history.

When enabled in Settings, **Suboptimal** appears below the keyboard in any mode. “Leaves 1,307 of 2,103” means at least 796 eliminations are guaranteed. Words remain playable. No information list appears for a finished round; Suboptimal explains when a singleton has no meaningful ranking. Missing advice settings default off.

See [adaptive rules, tie-breaking and persistence](docs/adr/0006-impossible-variant.md).

## Vocabulary provenance and scope

Both lists are independently sourced, modified selections from **SCOWL 2020.12.07**, release revision `5ef55f9c42730ebe4394a78b77855468a6f15dd2`. The **2,103-answer pool** starts from the 3,493 words in SCOWL’s small/common tier (≤35), then applies pinned AGID plural/past-tense filtering and reviewed exceptions; the **11,193 accepted guesses** use its broader word-game tier (≤80). Only lowercase five-letter ASCII entries from general, American and British word categories are included. Names, abbreviations, contractions, extra variant categories and accented forms are excluded; recognized regular/irregular plural nouns and past-tense verbs are removed from answers, while they remain valid guesses. Clear common independent senses (FOUND, WOUND, SPOKE), invariant base forms (SHEEP), and non-past S/ED words remain. Present-tense-only forms and past-participle-only forms are not generally excluded. This is a documented policy with source gaps, not exhaustive grammatical classification. This is a common-tier selection, not a claim of manual editorial review or official Wordle/NYT parity. Every answer is accepted.

See [WORDS-LICENSE.md](WORDS-LICENSE.md) for archive/input checksums, exact selection and source-specific terms. The full upstream [Copyright/permission notices](public/third-party/SCOWL-Copyright.txt) ship with the site and are linked in About the words. They explicitly permit redistribution under the retained terms; no code MIT license is substituted for data permissions. Both retired Wordle-extracted snapshots, generated modules, old notice and obsolete migration list are removed. The previous source-specific permission uncertainty is no longer relied upon; this is not a legal warranty.

Regenerate offline with `node scripts/generate-vocabulary.mjs`, or verify with `--check`. To reproduce the filtered input snapshot from the pinned official archive, run `python3 scripts/import-scowl.py /path/scowl-2020.12.07.tar.gz --check`. Builds do not download dictionaries. See [the replacement decision](docs/adr/0017-independent-scowl-vocabulary.md). The new dataset identifier restarts incompatible rounds/results once; valid difficulty, contrast and explicit advice preferences from the previous SCOWL guide are retained. New-guide progress persists normally. Repository publication and the GitHub Pages pilot were explicitly authorized.

## Engineering and checks

TypeScript and Vite; zero runtime dependencies. Node 24 recommended. `npm run check` runs strict type checking, Node domain tests and a production build. `npm audit --audit-level=moderate` checks the locked development dependencies. GitHub Actions runs both on push/PR with read-only repository permissions.

The delegated design is in [docs/SPEC.md](docs/SPEC.md), terminology in [GLOSSARY.md](GLOSSARY.md), and identity/persistence decisions in `docs/adr/`. Matt Pocock's [Grill with Docs](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) and [Implement](https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md) were used with their local dependencies. The user delegated recommended choices; no interactive interview was performed. Test seams were selected from the requested scoring/session/persistence/statistics/browser contracts. Red-before-green development was used at the domain seams.

Browser evidence and independent review findings are recorded in [docs/QA.md](docs/QA.md). Date rollover and malformed saves are tested with deterministic domain fixtures, not claimed as real-time overnight browser tests. Viewport emulation is not physical mobile hardware testing. Static delivery requires HTTP; direct `file://` launch is not supported.


## Word definitions

Definitions appear automatically below **every submitted guess**, including restored guesses, within **Optimal/Suboptimal suggestions**, and beside **revealed answers**. There are no Define buttons or lookup dialog. A concise primary meaning is immediately readable; **More meanings** expands additional parts of speech/senses with native keyboard controls. Hidden unsolved answers, drafts and undisplayed candidate words are never fetched.

The visible disclosure explains automatic requests to English Wiktionary. Each request contains only one displayed word, a generic application identifier and normal browser network metadata (including IP address). Cookies and referrer are omitted; the provider can see and correlate the displayed words and your IP address. No puzzle identifier, draft, selected hidden answer, saved statistics, account identifier or credentials are sent. This is a free public experimental endpoint with no key/account and incomplete coverage. Missing English definitions do not invalidate guesses.

Selected senses are attributed to **Wiktionary contributors**, with source-entry and **CC BY-SA 4.0** links. Plain text only: formatting is removed, long entries shortened, and media/examples omitted. More meanings provides up to eight entry groups and eight senses per group. Definitions never alter scoring, difficulty, accepted words, answer pools, assistance or saved progress.

Automatic lookup uses a 180ms debounce, at most **two simultaneous requests**, per-word deduplication, six-second timeout and cancellation/stale-response guards. Only the current displayed set (at most six guesses, ten advice words and a revealed answer) enters the queue. A 64-entry cache in this tab retains success for 24 hours and missing entries for five minutes; reloads fetch displayed words again. Failures show unavailable/offline/timeout text and are not automatically retried in a loop; reload to retry. Cached words remain readable offline until expiry. English meanings are looked up on demand; the Spanish teaching selection described below is bundled. See [source/terms](docs/adr/0011-word-definitions.md) and [inline UX decision](docs/adr/0016-inline-definitions.md).


## What Absurd’s count means

Absurd displays **curated answers remaining**, using the2,103-word answer pool. Accepted guesses come from the broader11,193-word dictionary and can fit all revealed clues without belonging to that pool. The counter does not count every clue-consistent accepted guess. Easy’s direct solve and advice candidate counts use the same curated pool.

With the SCOWL replacement, the reported AUDIO→ENTRY→BEACH→VALVE→GAFFE sequence yields **2,103→412→61→28→13→7**. Those are curated survivors, independently checked against the new data; feedback differs from the retired guide where the largest bucket differs. The two former ending words are absent from the new accepted dictionary and spend no turn. Tests cover current sixth-turn outcomes, reconstruction and advice counts.


## Absurd pool and save compatibility

Absurd’s selection, remaining count, reveal and advice use exactly the current2,103 curated answers. All11,193 accepted words remain guesses subject to difficulty. Exploratory guesses do not become answers. The new dataset identifier rejects old snapshots rather than replaying their clues against a different pool. Current-guide progress resumes normally.

## First-use reset for this update

At the user's request, this update performs a one-time versioned reset of this deployment's Morrowmark-owned storage: all English/Spanish lengths, variants, rounds, history, statistics, assistance and settings. Defaults are English, five letters, Normal, Suboptimal/high contrast off. Unrelated origin keys and another deployment's namespace remain untouched. The reset runs before saved language/length selection, then writes its epoch marker; subsequent progress and preferences persist normally. There is no recurring reload reset. See [current policy/reset decision](docs/adr/0023-spanish-verb-policy-fresh-start.md).

## Answer-form curation

The current guide excludes 1,390 entries from the original common-tier answer selection: 1,109 mapped noun plurals,279 mapped past-tense forms and two reviewed uncertain forms. All11,193 accepted guesses remain byte-identical. AGID2016.01.19 is pinned at the same official repository revision as SCOWL, with reproducible extraction and complete [AGID permission/source notices](public/third-party/AGID-Copyright.txt). The generated audit is src/data/answer-curation.json and reviewed decisions are src/data/answer-form-overrides.json. See [policy and limits](docs/adr/0019-answer-form-curation.md) and WORDS-LICENSE.md. The user subsequently authorized publishing this filtering update and a GitHub Pages pilot.

## GitHub Pages pilot

`npm run build:pages` builds `dist-pages/` with base `/kata-inspired-by-wordle-codex-dot/`. The Pages workflow checks the project before uploading this artifact; only its deploy job receives Pages write and OIDC permissions. Local `npm run build` and preview5298 continue to use root `dist/`.

The home link and module worker resolve within the project path. Public project saves use `morrowmark.kata-inspired-by-wordle-codex-dot.v1`, independent of local root notebooks and other github.io projects; erase only removes the selected notebook. Saves are browser/origin local and do not transfer from localhost. Wiktionary definitions require its public cross-origin endpoint; unavailable definitions do not block play. The complete SCOWL/AGID notices ship in `third-party/`. Morrowmark is an original independent game, not affiliated with or endorsed by The New York Times or Wordle.

Public pilot: use the **Play Online** link above. The user authorized removing the account-site custom-domain setting and its source CNAME so project sites use their default github.io URLs. No Cloudflare, DNS or registrar settings were changed. The project notebook remains scoped to this repository path.

## Choose a word length

Use **Word length**, above the board, to select4,5,6 or7 letters. Five remains the default. Daily, Practice and Absurd all use the selected length, with six attempts and all four difficulties. Switching opens/resumes a separate notebook: guesses, drafts, local settings and daily statistics stay with their own length; difficulty is global. New progress persists independently after the one-time fresh start. Shares show the length. Erase saved notebook clears only the selected length.

| Letters | Curated answers | Valid guesses |
|---|---:|---:|
|4|1,480|4,964|
|5|2,103|11,193|
|6|3,166|19,816|
|7|4,138|29,870|

All pools use the same pinned, licensed SCOWL/AGID curation policy. Exact reproducible sources, reviewed homographs and notebook behavior are documented in [the word-length decision](docs/adr/0020-selectable-word-length.md). Every answer is an accepted guess of the same length. Easy and optional Suboptimal search only the selected length; seven-letter opening analysis can take around ten seconds on this development machine, longer on slower devices. It runs in a cancellable worker with loading text so play can continue. Inline meanings cover displayed4–7-letter words when Wiktionary has an entry. The Pages build includes selectable lengths.

## Language, Spanish possible answers and teaching

Use **Language** above Word length. English remains the default. **Español (México)** supports4–7 letters in every mode/difficulty. Its possible-answer counts are468/857/949/1,059 (3,333 total), selected by **Zipf≥3.5 general-Spanish frequency**, documented independent base-word senses and reviewed usage/commonness decisions. There is no per-length cap or translation requirement. The RLA-es broad guess dictionaries stay2,924/9,736/21,791/42,219 words.

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
