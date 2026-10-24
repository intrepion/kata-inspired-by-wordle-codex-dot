# Current answer-form filtering verification

The local filtered guide contains2,103 answers and the exact unchanged11,193 accepted guesses. AGID2016.01.19 source grammar, qualified mappings and reviewed exceptions remove recognized noun plural/past-tense forms; the source is not an exhaustive classifier. See ADR0019 and WORDS-LICENSE.md.

TDD: /tmp/morph-plurals-red.log→green (BOOKS and irregulars), /tmp/morph-past-red.log→green (regular/irregular pasts), /tmp/morph-reviewed-red.log→green (HIDED review), /tmp/morph-migration-red.log→green (new dataset/known prior preferences). Tests protect GLASS/CLASS/FOCUS/BONUS, BLEED/GREED/NAKED/BIPED, invariant SHEEP, independent FOUND/WOUND/SPOKE, unchanged guess SHA, subset integrity and source/audit reproduction.

Full /tmp/morph-final-check.log:117 tests, TypeScript and production build pass. Updated data-specific fixtures use an independent Counter feedback reference:2103→412→61→28→13→7 on the reported sequence. No scorer/adversary/difficulty/advice-metric or inline-definition logic was changed. Known previous SCOWL rounds/results restart once with validated preferences retained; current progress then persists normally.

# Morrowmark verification

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
