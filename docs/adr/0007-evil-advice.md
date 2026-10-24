# Rename adaptive play to Evil and show least-informative clue-consistent guesses

Scope update: [ADR 0008](0008-optional-advice-and-easy.md) makes Suboptimal optional/off by default across all modes and adds Easy. The original ranking/cancellation principles below remain the basis.

## Compatibility

All player-facing names use Evil. The existing `impossible` mode, state field, variant marker and internal module/API names remain stable storage aliases so old rounds continue without reset. Decoder also accepts an `evil` mode/state alias, maps it to the same internal round and replays its guesses normally. Shares now say Evil. The six-guess adaptive bucket policy, tie-breaking, Normal-only guess validation, separate saved round/results and ordinary game preferences are unchanged.

## Metric and candidate universe

For every unplayed word in the full 11,193-word accepted dictionary, require its hypothetical-answer score for every previous guess to equal the complete observed feedback row. This includes green/yellow positions, gray exclusions and duplicate minimum/maximum information. Do not restrict advice words to the 3,493 curated answers.

For each qualifying guess, partition the *current surviving curated answers* by exact duplicate-aware feedback. Its score is the size of the largest feedback bucket: the maximum answers that could remain after the guess, or equivalently the fewest eliminations guaranteed (`N - largest`). Show the five largest scores first; ties are alphabetical. This is a worst-case/minimax information guarantee, not Shannon entropy, expected information, a winning-strategy proof, or a restriction on guesses. No secondary entropy metric is used.

Each row states “Leaves X of N possible answers in the worst case” and the guaranteed elimination count. Only five words are displayed, with no full surviving answer list. On singleton pools or completed games, replace the list with an explanation because information ranking is no longer meaningful.

## Background analysis and invalidation

A same-origin module Web Worker owns full-dictionary analysis. It reconstructs the round from its versioned guesses-only snapshot. A fast, allocation-free feedback encoder follows the same exact-first/left-to-right duplicate rule and is checked against the original scorer across all accepted guesses and five duplicate-heavy targets. Independent reference tests rank using the original scorer and histograms.

The UI shows loading without blocking typing. Keys contain the frozen policy version and accepted guess history; candidates/feedback are deterministic functions of that history. Draft edits, invalid guesses and repeats do not invalidate analysis. Accepted guesses terminate old work and start the new history; leaving Evil terminates work and clears output. Generation/key guards reject delayed responses even after cancellation. A bounded 12-entry history-result cache speeds revisits/restarts; stale results are never shown under another history. Completed/singleton states cancel work and clear advice. Worker failure leaves play available, with an explanatory analysis error; it never falls back to blocking main-thread ranking.

The advice section appears below Evil’s keyboard. Ordinary modes hide it. Advice contains no interactive controls that overwrite a draft. Loading/status announcements are polite; responses only update the advice region, preserving typing focus and the rest of the board.

Answer-guide v2 supersedes the original pool size; see ADR 0009.
