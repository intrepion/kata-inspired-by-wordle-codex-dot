# ADR 0044: Useful Easy advice across supported configurations

Status: Accepted

## Context

Exhaustive guess-by-answer ranking grows expensive for long, large dictionaries. Disabling it left Easy without suggestions in some configurations. Smashare's former fixed scan budget could also report no suggestions while valid pairs remained beyond the budget.

## Decision

Conquest, Absurd and One possibility infer the complete surviving answer pool from public clues in the selected locale, variety, length and Dutch rules. Affordable analyses evaluate every eligible guess. More expensive analyses take a deterministic, bounded shortlist containing both candidate answers and exploratory dictionary words. Every shortlisted guess is scored against **all** survivors. Survivor counts, worst-case groups and expected survivors remain exact; only the search for the best guess is restricted. The result exposes the evaluated guess count and the UI labels shortlisted rankings. Suboptimal still admits only unplayed guesses consistent with every prior clue and reverses the worst-case ordering within the evaluated set.

The scope is every supported configuration of all 16 selectable locales/varieties, lengths 3–11 where offered (Filipino remains five-letter), and the existing rulesets. Advice remains source-neutral: it uses the selected vocabulary and public feedback, never the concealed answer, daily seed, or an unrelated language's dictionary. Letroso keeps its own clue-consistent, cross-length adviser; these algorithms do not conflate its clues with ordinary positional scoring.

Smashare passes only public observations to a dedicated worker. Its unranked search finds up to five distinct, unplayed consistent examples or exhausts the eligible pair pool. There is no arbitrary scan cutoff that can hide a remaining answer. Sessions cache public histories, terminate superseded work and reject stale replies on new clues, notebook changes, disabled advice or completion. Typing does not restart identical analysis. Loading/error states preserve normal play.

Easy assistance remains recorded across difficulty downgrades, reloads and shares. Unconfirmed setup does not expose advice. Completed rounds keep their recorded difficulty.

## Consequences and checks

Shortlisted suggestions are not guaranteed to be the dictionary's one-step optimum or a globally optimal strategy. Smashare examples are neither ranked nor a count of all survivors. Full survivor counts must not be replaced with shortlist sizes.

Regression tests cover exact affordable rankings, complete-pool score histograms for shortlisted results, duplicate and Unicode scoring, hidden-answer independence, all selectable locale/length combinations, supported rulesets, and worker cancellation/stale replies. No answer dataset, vocabulary selection, storage reset or external service is introduced.
