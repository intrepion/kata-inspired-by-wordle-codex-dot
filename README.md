# Morrowmark

A quiet daily word dispatch: five letters, six fieldnotes, one small discovery. Original paper-and-ink design, writing and CSS illustration, inspired by five-letter deduction puzzles.

## Play locally

```sh
npm ci
npm run build
PORT=5298 npm run start:detached
```

Open http://127.0.0.1:5298. The launcher checks the port and refuses to replace an existing server. It runs the built game on loopback in a detached session-only Node process, with PID/log in `.local/`. It has no boot/login autostart. If5298 is occupied, choose another free port; browser saves are scoped to the origin/port. To stop only this server, inspect `.local/server.pid` and verify that PID belongs to `scripts/serve.mjs` before `kill <PID>`. Restart with the command above after a reboot. Development: `npm run dev -- --port <free-port> --strictPort`.

## Rules and records

- Type A–Z or tap keys. Enter / NOTE submits, Backspace / ⌫ erases. Unknown, incomplete and already-submitted guesses spend no turn. Six accepted guesses finish the puzzle; a win finishes immediately.
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

Easy may be enabled midgame on an unfinished puzzle. Hard/Strict upgrades still require no accepted guesses. Enabling either advice option permanently marks the active round **Assisted**, even if later turned off; mode bars and shares retain it after downgrade/reload. New advice cannot retroactively mark a finished round. Daily and Practice keep separate difficulties and the preference for new ordinary puzzles. Existing statistics remain combined across difficulties.

Absurd supports all four difficulties independently. Select **Absurd → Settings → Difficulty**. Easy shows clue-only Optimal advice; Normal is unrestricted; Hard and Strict use the adaptive clues. Its choice never changes Daily/Practice difficulties or their new-puzzle preference. Existing Absurd snapshots without a difficulty resume as Normal. See [Absurd difficulty decisions](docs/adr/0010-evil-difficulties.md).

## Absurd variant

Select **Absurd** next to Daily dispatch and Practice. Choose Easy, Normal, Hard or Strict in Settings. The 11,193-word dictionary remains available subject to the chosen clue restrictions. Your saved Daily/Practice difficulties are preserved.

There is no preselected answer. Each valid guess partitions the surviving 2,103-answer pool by duplicate-aware feedback; the largest group survives. Equal groups avoid all-green when possible, then use a fixed left-to-right pattern order (absent, elsewhere, exact). The visible count shows remaining possibilities. Clues never contradict previous rows. This maximizes immediate survivors; it is not a solver or a claim that winning is mathematically impossible.

You win only on an all-green selected row; six accepted guesses otherwise end the round and reveal **one surviving answer**, clearly identified as an example. Invalid/repeated guesses spend no turn. The separate adaptive round, draft and current result resume after reload and UTC rollover, without affecting daily marks or streaks. **New Absurd round** retains its own difficulty and starts the same deterministic full pool and confirms before replacing unfinished play. Completed results remain shareable until starting a new round; shares identify Absurd/adaptive, the selected difficulty and any permanent Assisted marker. There is no lifetime Absurd result history.

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

Definitions appear automatically below **every submitted guess**, including restored guesses, within **Optimal/Suboptimal suggestions**, and beside **revealed answers**. There are no Define buttons or lookup dialog. A concise primary meaning is immediately readable; **More senses** expands additional parts of speech/senses with native keyboard controls. Hidden unsolved answers, drafts and undisplayed candidate words are never fetched.

The visible disclosure explains automatic requests to English Wiktionary. Each request contains only one displayed five-letter word, a generic application identifier and normal browser network metadata (including IP address). Cookies and referrer are omitted; the provider can see and correlate the displayed words and your IP address. No puzzle identifier, draft, selected hidden answer, saved statistics, account identifier or credentials are sent. This is a free public experimental endpoint with no key/account and incomplete coverage. Missing English definitions do not invalidate guesses.

Selected senses are attributed to **Wiktionary contributors**, with source-entry and **CC BY-SA 4.0** links. Plain text only: formatting is removed, long entries shortened, and media/examples omitted. More senses provides up to eight entry groups and eight senses per group. Definitions never alter scoring, difficulty, accepted words, answer pools, assistance or saved progress.

Automatic lookup uses a 180ms debounce, at most **two simultaneous requests**, per-word deduplication, six-second timeout and cancellation/stale-response guards. Only the current displayed set (at most six guesses, ten advice words and a revealed answer) enters the queue. A 64-entry cache in this tab retains success for 24 hours and missing entries for five minutes; reloads fetch displayed words again. Failures show unavailable/offline/timeout text and are not automatically retried in a loop; reload to retry. Cached words remain readable offline until expiry. No dictionary dump/text is bundled. See [source/terms](docs/adr/0011-word-definitions.md) and [inline UX decision](docs/adr/0016-inline-definitions.md).


## What Absurd’s count means

Absurd displays **curated answers remaining**, using the2,103-word answer pool. Accepted guesses come from the broader11,193-word dictionary and can fit all revealed clues without belonging to that pool. The counter does not count every clue-consistent accepted guess. Easy’s direct solve and advice candidate counts use the same curated pool.

With the SCOWL replacement, the reported AUDIO→ENTRY→BEACH→VALVE→GAFFE sequence yields **2,103→412→61→28→13→7**. Those are curated survivors, independently checked against the new data; feedback differs from the retired guide where the largest bucket differs. The two former ending words are absent from the new accepted dictionary and spend no turn. Tests cover current sixth-turn outcomes, reconstruction and advice counts.


## Absurd pool and save compatibility

Absurd’s selection, remaining count, reveal and advice use exactly the current2,103 curated answers. All11,193 accepted words remain guesses subject to difficulty. Exploratory guesses do not become answers. The new dataset identifier rejects old snapshots rather than replaying their clues against a different pool. Current-guide progress resumes normally.

## First-use reset for this update

At the user’s request, save schema 3 discards previous Morrowmark rounds, results, history, streaks, difficulties, assistance and preferences together. Unknown legacy notebooks start on Normal with Suboptimal/high contrast off. Known previous SCOWL notebooks retain their validated settings; an expired Daily uses the new-puzzle difficulty preference. Only the game-owned `morrowmark.v1` localStorage entry is replaced; unrelated origin keys are untouched. This happens once when an older notebook is opened. New schema-3 rounds, statistics and explicit settings persist normally across reloads. No legacy round preservation or migration notice is needed. See [reset decision](docs/adr/0015-first-use-reset.md).

## Answer-form curation

The current guide excludes 1,390 entries from the original common-tier answer selection: 1,109 mapped noun plurals,279 mapped past-tense forms and two reviewed uncertain forms. All11,193 accepted guesses remain byte-identical. AGID2016.01.19 is pinned at the same official repository revision as SCOWL, with reproducible extraction and complete [AGID permission/source notices](public/third-party/AGID-Copyright.txt). The generated audit is src/data/answer-curation.json and reviewed decisions are src/data/answer-form-overrides.json. See [policy and limits](docs/adr/0019-answer-form-curation.md) and WORDS-LICENSE.md. The user subsequently authorized publishing this filtering update and a GitHub Pages pilot.

## GitHub Pages pilot

`npm run build:pages` builds `dist-pages/` with base `/kata-inspired-by-wordle-codex-dot/`. The Pages workflow checks the project before uploading this artifact; only its deploy job receives Pages write and OIDC permissions. Local `npm run build` and preview5298 continue to use root `dist/`.

The home link and module worker resolve within the project path. Public project saves use `morrowmark.kata-inspired-by-wordle-codex-dot.v1`, independent of local root notebooks and other github.io projects; erase only removes the selected notebook. Saves are browser/origin local and do not transfer from localhost. Wiktionary definitions require its public cross-origin endpoint; unavailable definitions do not block play. The complete SCOWL/AGID notices ship in `third-party/`. Morrowmark is an original independent game, not affiliated with or endorsed by The New York Times or Wordle.

Public pilot: https://intrepion.github.io/kata-inspired-by-wordle-codex-dot/. The user authorized removing the account-site custom-domain setting and its source CNAME so project sites use their default github.io URLs. No Cloudflare, DNS or registrar settings were changed. The project notebook remains scoped to this repository path.

## Choose a word length

Use **Word length**, above the board, to select4,5,6 or7 letters. Five remains the default. Daily, Practice and Absurd all use the selected length, with six attempts and all four difficulties. Switching opens/resumes a separate notebook: guesses, drafts, settings and daily statistics stay with their own length. Existing five-letter progress is preserved. Shares show the length. Erase saved notebook clears only the selected length.

| Letters | Curated answers | Valid guesses |
|---|---:|---:|
|4|1,480|4,964|
|5|2,103|11,193|
|6|3,166|19,816|
|7|4,138|29,870|

All pools use the same pinned, licensed SCOWL/AGID curation policy. Exact reproducible sources, reviewed homographs and notebook behavior are documented in [the word-length decision](docs/adr/0020-selectable-word-length.md). Every answer is an accepted guess of the same length. Easy and optional Suboptimal search only the selected length; seven-letter opening analysis can take around ten seconds on this development machine, longer on slower devices. It runs in a cancellable worker with loading text so play can continue. Inline meanings cover displayed4–7-letter words when Wiktionary has an entry. The Pages build includes selectable lengths.
