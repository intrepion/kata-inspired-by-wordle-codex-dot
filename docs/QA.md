# Local-first meanings verification (2026-10-26)

256 tests, type checking, root production build, Pages-subpath build and dependency
audit passed (zero vulnerabilities). The fail-first default-client regression
blocked global fetch and failed before the change, then passed with local English,
Spanish, missing entries, language/length isolation, source labels and immutable
results. Data input/output hashes reproduce with the importer `--check`.

Measured default-client coverage across every accepted word: English 17,676/65,843,
Spanish 61,129/76,670; all 3,333 Spanish possible answers retain meanings. Complete
teaching remains 3,410 records. No new Spanish translations were created.

`check-local-definitions.mjs` (also exposed through `check-inline-definitions.mjs`)
passed isolated desktop/mobile Pages-subpath checks for Daily/Practice/Absurd,
both languages and all four lengths, Easy suggestions, reload/drafts, no overflow
or page errors. Every external request was blocked/recorded: zero occurred.
A deliberately failed same-origin dictionary chunk showed a clear unavailable
message without external fallback or gameplay failure, and recovered after reload.
Source links remain explicit user navigation, not automatic lookups. Saves,
reset epoch, dictionaries, answer pools and ranking algorithms were unchanged.

# Current answer-form filtering verification

The local filtered guide contains2,103 answers and the exact unchanged11,193 accepted guesses. AGID2016.01.19 source grammar, qualified mappings and reviewed exceptions remove recognized noun plural/past-tense forms; the source is not an exhaustive classifier. See ADR0019 and WORDS-LICENSE.md.

TDD: /tmp/morph-plurals-red.log→green (BOOKS and irregulars), /tmp/morph-past-red.log→green (regular/irregular pasts), /tmp/morph-reviewed-red.log→green (HIDED review), /tmp/morph-migration-red.log→green (new dataset/known prior preferences). Tests protect GLASS/CLASS/FOCUS/BONUS, BLEED/GREED/NAKED/BIPED, invariant SHEEP, independent FOUND/WOUND/SPOKE, unchanged guess SHA, subset integrity and source/audit reproduction.

Full /tmp/morph-final-check.log:117 tests, TypeScript and production build pass. Updated data-specific fixtures use an independent Counter feedback reference:2103→412→61→28→13→7 on the reported sequence. No scorer/adversary/difficulty/advice-metric or inline-definition logic was changed. Known previous SCOWL rounds/results restart once with validated preferences retained; current progress then persists normally.

# Lexi Conquest verification

## Previously published independent vocabulary replacement (2026-10-24)

SCOWL2020.12.07 revision5ef55f9c42730ebe4394a78b77855468a6f15dd2 replaces both extracted-game lists. Exact archive/source checksums and full retained terms are in WORDS-LICENSE.md. The source importer independently verifies27 original input files and reproduces the small filtered snapshot; offline generator --check verifies both modules. Current counts are3,493 common-tier answers and11,193 accepted guesses. Removed retired raw/generated lists, obsolete migration selection, old notice and superseded source-only decisions. No official NYT parity or legal warranty is claimed.

TDD source regression failed before production changes (/tmp/scowl-vocabulary-red.log,2315vs3493), then passed after replacement (/tmp/scowl-vocabulary-green.log). All108 tests, TypeScript and production build pass (/tmp/scowl-full.log). Existing data-specific fixtures now use independently licensed words. No scorer, largest-bucket algorithm, save validator, difficulty, advice metric/session or automatic-definition implementation change was needed.

Coverage includes every answer accepted, uppercase normalization/invalid/repeat input, duplicate-aware scorer/reference, Hard positive minima, Strict hypothetical-answer equivalence across the entire accepted dictionary, Easy/Suboptimal independent reference ranking, hidden-answer independence, stable ties, singleton solve, worker cancellation/stale/cache, gameover, all adaptive difficulties, clue consistency, forged out-of-pool caches, six-turn persistence/win/loss and daily UTC/statistics. Current dataset identifiers reset populated old notebooks once to defaults; current progress/settings/statistics/assistance survive repeated reloads. Only morrowmark.v1 is changed.

Independent Python Counter scoring over the pinned snapshot confirms the reported trajectory3493→670→106→36→15→5 for AUDIO/ENTRY/BEACH/VALVE/GAFFE. Clues and sixth-turn outcomes are updated to the new pool. The two retired ending words are no longer dictionary members and cannot spend a turn. Candidate counts/advice/reveals refer to curated answers, never all matching accepted guesses.

Independent Spec/Standards review reproduced the source snapshot and full notices, confirmed core mechanisms unchanged and focused tests passed. Stale SPEC and durable browser regression expectations were identified and updated for SCOWL.

## Durable isolated browser checks

Use optional PLAYWRIGHT_MODULE (module entry), BROWSER_EXECUTABLE, BASE_URL (default5298) and SCREENSHOT_DIR. These are separate QA tools, not runtime dependencies.

- `node scripts/check-evil-replay.mjs`: desktop1280/mobile390, current curated initial/remaining counts, exact reported trajectory, each row feedback after reload, both rejected retired endings, current sixth-turn outcomes/shares, Easy/Suboptimal counts, full-pool deterministic win/reload. Inspect actual tile feedback, not an empty selector.
- `node --import tsx scripts/check-inline-definitions.mjs`: synthetic external dictionary fixtures, not production definitions. Desktop/mobile every submitted/restored guess, all six rows, current advice lists in every mode, revealed answer dedupe, hidden-word exclusion, safe text, missing/offline/timeout, bounded requests/cache/cancellation, native expansion/focus/keyboard and unchanged game saves. Live one-word WiktionaryHTTP200 was separately verified; coverage remains incomplete.
- Working-copy .local/qa-first-use.mjs: old-schema and current-schema/retired-dataset resets, unrelated origin storage preservation, allNormal/Suboptimaloff defaults, and newly saved game/results/preferences persisting after multiple reloads.
- Working-copy .local/qa-absurd-difficulties.mjs: all four adaptive difficulties, independent ordinary preferences, actual-clue restrictions, Easy advice, assistance/shares, switching/reload and cancellation.

No user Chrome control; all disposable profiles close in finally. Viewport emulation is not physical device testing. Date/clock fixtures are not an actual overnight test. Built HTTP assets match the original checkout and local preview after transfer. The59 previously stopped other game servers must remain stopped; unrelated services remain untouched. Repository commit/push was subsequently authorized; no hosted deployment is included.

## Existing definition TDD evidence

Automatic-fetch and cached-publication red/green logs: /tmp/inline-auto-{red,green}.log and /tmp/inline-cache-{red,green}.log. Focus replacement was independently found, reproduced red and fixed with word/occurrence/control restoration; /tmp/inline-focus-{red,green}.log covers refresh/typing on summaries and source links. Fixed-source plain-text senses, license attribution and the two-request queue remain unchanged during vocabulary replacement.


## Final replacement results

Final fullcheck /tmp/scowl-final-full.log:108 tests pass, zero failures, TypeScript and production build pass. Source archive importer and generator --check pass. Both independent rechecks report no remaining findings. Desktop/mobile headless logs: /tmp/scowl-browser-replay.log (all10cases), /tmp/scowl-browser-reset.log (oldschema/current-schemaoldguide across bothviewports), /tmp/scowl-browser-definitions.log (allinlinecases), /tmp/scowl-browser-difficulties.log (all4levels/bothviewports, reload/preferences/shares/cancel). All profiles close and no pageerrors/overflow were observed.

Full3493×11193 mobile analysis sample: Optimal2201ms, Suboptimal2147ms, typing5ms;31 animation frames over500ms with maxgap16.8ms (/tmp/scowl-browser-performance.log). Defaultoff createdzero workers; both workers terminated, toggling off/mode switching hid stale results. These are local samples, not hardware-independent timing guarantees. Screenshot .local/scowl-mobile.png visually inspected. About displays SCOWL/UKACD attribution and serves the complete notice. No other game server was started.


## Easy opening guesses and authorized publication

The user requested that Easy show Optimal suggestions on a brand-new round before any guess. The empty-history worker calculation already worked: the added public-seam regression passed before production UI changes (/tmp/openers-existing-contract.log). No absent first-turn engine behavior is claimed. The list was below the keyboard without explicit start guidance. A browser regression failed for missing zero-history guidance (/tmp/openers-ui-red.log); Easy now has a visible board hint and explicit opening loading/ready wording.

Fullcheck /tmp/openers-full-check.log passes109 tests, TypeScript and build. Independent Standards/Spec reviews have no findings. Durable `node --import tsx scripts/check-easy-openers.mjs` passes1280/390 (/tmp/openers-ui-green.log): all3variants zero accepted guesses/drafts, all3493candidates/11193guess analysis, five opener words/inline definitions, Assisted marker, reload/cache/mode switches, fresh Practice/Absurd rounds, and hiding in Normal/Hard/Strict. Algorithm, save schema/dataset, difficulty selection, ranking/cancellation and defaultoff Suboptimal are unchanged.

The current user explicitly authorized committing/pushing the completed features. Upstream main’s platform ignore-template commit is retained by fast-forward, with no force workflow. The candidate tree is scanned for credential patterns, local QA/build/dependency artifacts and retired extracted datasets. Full locked-dependency audit reports zero vulnerabilities. A targeted .gitattributes exception retains the exact upstream SCOWLREADME bytes (including its whitespace); license/source checks stay byte-identical. Hosted deployment and PR merge are outside this authorization.


## Final local answer-form verification

117 tests/typecheck/build pass; both independent rechecks have no remaining findings. A same-date guard fixes the review-found Daily rollover issue, with red/green evidence in /tmp/morph-rollover-{red,green}.log. Browser logs /tmp/morph-browser-{replay,openers,saves-final,definitions,difficulties}.log pass desktop/mobile: exact revised trajectory and loss/win/reload, zero-history five Optimal openers/inline meanings, qualified old-save migration and unrelated storage, valid removed guesses, new drafts/results/preferences, expired Daily preference, all difficulties, safe definitions/network failures and cancellation. Durable migration regression: `node --import tsx scripts/check-answer-forms.mjs`, with the same optional Playwright/browser/baseURL/screenshot environment as other checks.

Filtered2103×11193 full-pool sample: Optimal1313ms, Suboptimal1363ms, typing5ms,31frames/500ms with maxgap16.8ms (/tmp/morph-browser-performance.log). Both workers terminated, no ranking at defaultoff, no stale lists. Both source notices serve successfully. These are local samples, not hardware-independent guarantees. All browser profiles close in finally; no user Chrome control or other game server startup. The user subsequently gave separate authorization to commit/push this filtering update; no authority was inferred from the prior publication. Hosted deployment is excluded.

## Pages pilot checks

`npm run build:pages` then `node --import tsx scripts/check-pages.mjs` serves the artifact only beneath `/kata-inspired-by-wordle-codex-dot/` on an ephemeral loopback port. Set `BASE_URL` to the deployed project URL to exercise the actual public site instead. Optional `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` select an installed isolated headless runtime. No existing browser session is attached. The checks use live Wiktionary responses, so its availability is a prerequisite for the definition assertions.

Desktop1280 and mobile390 verify initial play, guess meanings, draft/reload/home navigation, Absurd2103→412, five Easy openers and subpath module worker, notices, layout, no asset failures, repository notebook isolation and scoped erase. Foreign root/sibling keys are seeded only in disposable profiles. Unit regression covers root versus project save keys.

## Selectable lengths

`node --import tsx scripts/check-word-lengths.mjs` checks disposable desktop/mobile profiles on local5298. Run `CHECK_WORD_LENGTHS=1 node --import tsx scripts/check-pages.mjs` to exercise all lengths against the Pages artifact through its ephemeral subpath server. Optional `BASE_URL` chooses another test server; optional `PLAYWRIGHT_MODULE`/`BROWSER_EXECUTABLE` selects an installed headless runtime. Dictionary responses default to explicit synthetic fixtures. Set `LIVE_DEFINITIONS=1` to use real Wiktionary responses and require a readable meaning for each representative submitted word. Screenshots go to `/tmp/morrowmark-lengths` by default; no browser session is attached.

Checks include legacy five-letter draft/guesses, all three variants at4/6/7, inline meanings, initial Easy worker advice while typing, native selector keyboard handling, reset wording, current variant across switches, rapid changes/cancellation, candidate counts, reload and mobile width. Unit seams separately cover each length/difficulty, duplicate constraints, six turns, adaptive reconstruction/reveal, disjoint notebooks, source reproduction, exact advice bucket counts, hidden-answer independence and late worker replies. Existing five-letter Pages/live-definition checks remain applicable.

## English / Spanish (Mexico) starter

`node --import tsx scripts/check-language.mjs` runs isolated desktop1280/mobile390 on local5298. Optional `BASE_URL` points at a test subpath build, and `PLAYWRIGHT_MODULE`/`BROWSER_EXECUTABLE` select an installed headless runtime. Remote responses are explicit synthetic fixtures, including a delayed/cancelled word and missing Spanish entry; starter teaching data is the real bundled snapshot. Screenshots default to `/tmp/morrowmark-spanish`.

It verifies English default and saved draft preservation, Spanish4–7 Daily/Practice/Absurd, all difficulty selections, accents/Ñ keyboard, translation→Spanish example→English rendering→definition order, correct #Spanish source links and language markup, reload/home, candidate counts, five advice slots, rapid language switching/worker isolation, delayed/missing/offline states, visible-word-only requests and terminal reveal/share labels. Source/learning offline reproduction, exact Unicode duplicate feedback, independent bucket counts, context-separated statistics and old English compatibility are covered at public unit seams. Existing English five-letter and selectable-length browser checks remain required. No existing Chrome session is used.

Run `CHECK_LANGUAGE=1 CHECK_WORD_LENGTHS=1 node --import tsx scripts/check-pages.mjs` to exercise both language and legacy English length suites against an ephemeral local Pages-subpath server. `LIVE_DEFINITIONS=1` uses real Wiktionary for the unchanged English suite; the language suite explicitly mocks remote missing/slow responses while checking real bundled starter data. No live deployment is involved.

Teaching UX follow-up: 143 tests pass. Desktop/mobile browser regressions verify empty Spanish teaching sections are omitted, covered words retain translation/example/English rendering, source definitions survive, and English has no Spanish teaching section. The submit key says ENTER with Enter: submit guess accessibility text; More meanings/Fewer meanings disclosure remains keyboard-operable and preserves gameplay state. Teaching-field tests additionally cover whitespace-only and partial data.

Spanish opener batch: 144 tests pass. The new regression failed first on missing CALA teaching, then passed after exactly18 records were added. All20 current Easy openers across4–7 letters have complete learning fields, definitions and revision attribution. Dedicated isolated desktop/mobile QA on5298 verifies every initial list, all20 submitted/restored opener words, Enter submission, source links, responsive layout and offline bundled meanings. Original100 teaching records and all vocabulary bytes remain unchanged. Independent linguistic and standards reviews passed; rare/obsolete forms are labelled and old-style examples explicitly invented.

Expanded Spanish guide:148 tests pass, including a red-to-green100-answer coverage regression and old-guide-reset regression. All400 answers and20 current Easy openers have complete439-record teaching coverage; old118 records and all guess-list hashes remain unchanged. Independent linguistic/source review covered all321 new records. Desktop/mobile QA on5298 covers offline opening/submitted/restored meanings, source links, effective optional-off preference, strict/Hard/contrast retention,100-candidate starts and adaptive reconstruction, English preservation,4–7 layouts and accented input. Root/Pages builds and audit pass. See ADR0022 for source extraction/translation details and dataset versioning.

Spanish verb-policy/fresh-start update:153 tests pass. Independent per-word review of all400 answers found0 removals (322 nouns,20 base adjectives,58 infinitives). Pool, broad guesses,439 teaching records and all current Easy openers remain unchanged. TDD covers finite forms in every tense/mood, gerund/participle-only rejection, lexical homographs, namespace-scoped clearing and reset-once persistence. Raw-context desktop/mobile QA seeds every English/Spanish length with current-schema rounds/stats/assistance/preferences, verifies English5/Normal/advice-off defaults and unrelated-storage preservation, then proves new progress/preferences persist. This authorized all-notebook reset supersedes the previous preservation checks at startup; ordinary post-reset fixture regressions still verify ongoing isolation and reload behavior. See ADR0023.

Global difficulty update: 161 unit tests pass with typecheck and both root/Pages production builds. Read-only npm audit reports zero vulnerabilities. Policy tests cover all four difficulties across English/Spanish4–7, preserved ordinary/adaptive history and candidates, history-compatible upgrades, incompatible pauses, completed-result immutability, and assistance retention. Isolated desktop/mobile browser cases cover global selection/reload across all variants/languages/lengths, Easy→Absurd openers/cancellation, old conflicting notebooks, keyboard-only restart/focus, and completed Strict share labels while global Easy applies elsewhere. Existing Pages-path language/length/teaching/reset/eligibility checks remain applicable; no dictionary, teaching or reset epoch changes.

Remaining-answer count update: 164 tests pass with typecheck and root/Pages builds. Tests cover full pools, all languages/lengths, independent duplicate-aware reference filtering, ordinary/adaptive histories, invalid input, singleton/zero observations, six-turn losses, reload and cache isolation. Isolated desktop/mobile checks derive expected counts from visible board feedback; Daily/Practice/Absurd counts remain visible through reload, paused global upgrades, wins and losses. Count-only play creates no ranking worker and no Assisted flag. Global-difficulty and eligibility browser regressions also run under the project subpath. Answer/guess/teaching data and the reset epoch remain byte-identical.

Uncapped Spanish selection: 168 tests pass with typecheck and root/Pages production builds; npm audit reports zero vulnerabilities. Exact counts are 468/857/949/1,059 (3,333). Both generators reproduce the pinned evidence, the raw import reproduces 38,724 frequency estimates and 6,841 retained lexical word records from verified upstream artifacts, and all Spanish accepted-guess arrays/439 teaching records remain unchanged. Independent reviewers scanned every one of the 3,512 provisional candidates and verified the final source-evidence fixes.

Isolated desktop/mobile Pages-path checks pass for all Spanish lengths, variants/difficulties, duplicate clues/counts/reveals/shares, eligibility reasons, English isolation, definitions with partial/missing/offline teaching, reload, rapid switching, cancellation and no hidden-answer transport. New opening analysis remained responsive: seven-letter page plus worker opener about3.8seconds on this machine, typing under2seconds. Missing opener teaching is omitted honestly; no complete-coverage claim remains. Separate root-preview old-dataset browser cases verify each Spanish4–7 notebook resets obsolete rounds/results once, new guesses survive reload, global Hard/local preferences and English guesses/draft remain, and unrelated storage is untouched. No reset-epoch change or publication.

Complete Spanish teaching: coverage grows from 362/3,333 to 3,333/3,333 possible answers. Added 2,971 original four-field records in 20 batches, retaining the 439 reviewed archive records byte-for-byte (3,410 total including77 exploratory words). Other-author reviewers inspected every new entry and made44 final corrections; approved final hashes are enforced by generation. Six new focused tests cover the lookup, dictionary/source separation, full coverage, normalization, immutable archive preference and validation/regeneration, bringing the full passing suite to174. Typecheck and root/Pages builds pass.

Isolated desktop/mobile root and Pages-path checks pass for new words at each4–7 length, submitted/restored guesses, advice and final-answer teaching, exact field order, offline dictionary errors without lost teaching, no new assistance/reset, English progress and responsive layout. Existing language/length/difficulty/Absurd/count/reload/worker privacy checks remain green. Dictionary definitions are not invented from authored teaching. Pools, original learning data, persistence/domain/reset code remain unchanged; no deployment or commit.
