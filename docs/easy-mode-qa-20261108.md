# Easy mode audit — 8 November 2026

Baseline: published main `f445fca83bdec2310fae986754eba67b20277d27`. Changes were developed in an isolated Mac worktree without changing other checkouts or publishing.

## Repairs

- Conquest, Absurd and One possibility no longer disable advice for large 8–11-letter dictionaries. Affordable analyses remain exhaustive; large analyses rank a deterministic shortlist, label that limitation, and calculate each displayed score over every surviving answer.
- Smashare no longer abandons the search at 30,000 pairs. Public-clue-only analysis runs in a cancellable worker and searches until five examples or exhaustion. It is explicitly unranked.
- Letroso's large opening shortlist has a smaller comparison budget. Every answer length and survivor remains in its analysis.
- Restoring Easy or previously Easy variant saves preserves known assistance. Variant mode bars and daily share text retain the Assisted label after downgrades. Corrupt Letroso answer/length mismatches are rejected.
- Loading regions have accessible status text; hidden, completed, pending-continuation and changed-mode advice cannot accept stale results.

## Coverage

The selectable space is 1,120 configurations: 136 locale/length pairs × four fixed-length rulesets × two schedules, plus 16 locales × two hidden-length Letroso schedules. Filipino remains five-letter only; other locales support 3–11. The domain matrix exercises these dimensions; this is not a claim of 1,120 separately driven browser journeys.

- `tests/easy-configuration-matrix.test.ts`: all 16 locales, all 136 supported length combinations, both schedules, five rulesets, genuine One possibility clues, legal guesses, Unicode normalization, repeat rejection, public-clue independence, reloads, sticky assistance and sharing.
- Adviser tests independently rebuild scores against all survivors, test duplicate letters and 11-tile/Cyrillic/accent scoring, old Dutch rules, bucket overflow, large shortlist disclosure, and exact small-pool ranking.
- Smashare tests compare suggestions to an exhaustive independent pair oracle for every locale/length and both Dutch rule versions, including a survivor beyond the old cutoff. Session tests cover cancellation, repeated typing, cache isolation, failure and stale replies.
- `node --import tsx scripts/audit-easy-openings.ts` runs all 136 standard and 16 Letroso openings and independently verifies displayed feedback-bucket scores. `--standard-only` skips Letroso.

Final aggregate validation: `npm run check` passed all **1,063 tests**, typecheck and production build. The independent opening audit passed all **152 openings**, including independent feedback-bucket score reconstruction (106 full standard rankings, 30 shortlisted standard rankings, 16 shortlisted Letroso openings).

## Browser verification

Chrome against the built game at `http://127.0.0.1:5398`, with separate test-only browser saves:

- Easy openings in all 16 locales/varieties, sampling 3, 5, 8 and 11 letters, including the formerly disabled large English and Spanish pools.
- Conquest submission and reload; One possibility direct solve; Absurd Daily target and Practice; Smashare suggestion keyboard/click activation, submission, completion, downgrade and reload; Letroso activation, submission, Give up cancellation and difficulty changes.
- Switching rules while ordinary/Suboptimal analysis is loading hides and cancels the old advice. Finished variants hide advice.
- Mobile viewport 390 × 844: readable suggestions, no document horizontal overflow, accessible button names and focus return. Viewport restored afterward. No page error logs observed. Final-build Ukrainian Smashare Daily completed and its spoiler-free share included Easy and Assisted.

## Performance and limits

Algorithm measurements on this Mac, after module imports (not network/worker startup or UI time): large ordinary openings about 160–191 ms; largest Smashare full scan, 72,833 pairs, about 92 ms. English Letroso openings decreased from approximately 5.3 seconds to 1.8–2.0 seconds; other locales approximately 0.04–1.4 seconds. All still score against the complete candidate pool. Concurrent full-suite/audit load produced slower readings (up to 9.37 seconds standard and 5.15 seconds Letroso); these are not universal latency guarantees. A subsequent isolated check measured English five-letter exhaustive rankings at 1.15 seconds, Spanish nine-letter shortlisted ranking at 82 ms, and British Letroso at 1.85 seconds.

This was not a formal screen-reader/axe audit, cross-browser certification, or an exhaustive test of every possible clue history. Existing large dictionary/definition bundle warnings remain; this change adds no runtime dependency, telemetry or external service. No dataset, daily schedule or storage reset is introduced.
