# Morrowmark specification

## Delegated decisions
The user authorized recommended decisions and asked for no design questions. Grill with Docs was adapted into documented design-tree decisions, not an interactive interview. Its dependencies (grilling/domain modeling) and Implement dependencies (TDD/code review) were inspected locally and official source URLs checked. No interactive interview occurred.

- Identity: Morrowmark, a quiet paper fieldnote for a daily five-letter discovery. Original writing, CSS art, system fonts; no commercial assets.
- Loop: six accepted guesses; exact copies consumed first, then remaining copies assigned left-to-right. Reject incomplete, unknown and duplicate guesses without using a turn. Winning guess closes the puzzle; sixth wrong guess reveals the answer.
- Modes: one UTC dispatch per date, independent random practice; choose a different answer for the next practice. Active input and submitted guesses survive reload and mode changes.
- Daily identity: independently sourced SCOWL common35 guide filtered with AGID plural/past mappings (2,103 answers,11,193 accepted guesses; ADR0017), epoch 2026-01-01 UTC, modular deterministic date index. Rollover checked on input, focus and periodic timer. Old unfinished dispatch remains unrecorded; terminal results saved immediately. No retrospective loss.
- Statistics: recompute from valid terminal daily records, unique by date. Wins, played, win percentage, guess histogram, current/best streak. Loss or missed date breaks streak; yesterday's streak remains current until today's result. Practice never counts. Local browser only; no account or cross-device sync.
- Save boundary: versioned schema; validate dates, answer membership, guesses, no turns after win, draft, settings and terminal records before using them. Derive terminal status from guesses. Corrupt parts ignored, app still usable. Storage failure surfaced; do not promise persistence.
- Accessibility: native buttons/dialogs, named board rows and cells, polite status, non-color clue symbols, keyboard and pointer input, visible focus, reduced motion. Settings provide alternate high-contrast clues. Never intercept modified keys or typing within settings/dialog controls.
- Tutorial: rules and worked repeated-letter example APPLE / ALLEY. Local-only spoiler-free share; clipboard failure gives selectable text. Reset requires explicit cancel/erase choice and clears only Morrowmark data.
- Delivery: TypeScript + Vite, no runtime dependencies, domain tests through public scoring/session/persistence/stats APIs; UI exercise through isolated headless browser controls. UTC/date/save fixtures explicitly distinguished from browser play. Private repo, CI, detached loopback server; no paid service/public deployment.

## Test seams
The user's requested domain and browser tests authorize these seams: scorer, submit/daily rollover, keyboard clues, save decoder, result ledger/stats, reset UI, visible board/modes/dialogs. Use worked literals for scoring; injected clock for rollover; no production backdoor answers.

## Acceptance
All requested domain edge cases pass; typecheck/build/audit pass; independent Standards and Spec reviews resolved; isolated desktop/mobile gameplay/screenshots inspected; commit/push requires explicit authorization; hosted deployment remains separate. Record honest limits in QA.


The current guide replaces retired Wordle-derived data with the pinned SCOWL release and complete permission notices. A changed dataset identifier resets incompatible Morrowmark notebooks once; current-guide progress persists and unrelated origin storage is untouched. Absurd uses only curated answers for selection/count/reveal, with all four difficulties. Automatic inline definitions fetch only displayed words with bounded requests; no hidden-answer or game-state payload. See ADR0014–0017 for current behavior.


Answer curation follows ADR0019: all11,193 guesses stay unchanged; only answer eligibility changes. Known previous SCOWL notebooks discard old rounds/results before reading their clues, while retaining validated preferences; unknown legacy data still resets to defaults.
