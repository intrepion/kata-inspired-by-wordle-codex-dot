# One optional letter reveal, tracked separately

The user approved one letter and its position per round in Conquest, One
possibility and Smashare, without using a guess, plus a separate Letter hints
statistics filter. Absurd and Letroso are deliberately excluded: the former has
an adaptive answer pool, and the latter hides answer length and gives order clues.

A started, active round at any difficulty can reveal the first position that has
not already received an exact clue. The reveal preserves the draft, guess count,
answer, selected difficulty and easiest difficulty used. It cannot win the round.
The given One possibility clue is ordinary baseline information, not a used hint.
Smashare uses positions in its combined word; shared positions count once.

The hint is displayed separately from guess rows and marks its letter on the
keyboard. Using it permanently marks the round Assisted. No reveal is available
before Start, while a continuation decision is pending, during a difficulty
conflict, after completion, or after this round has used its reveal. If every
position has already been green, there is nothing left to reveal.

Reveals retain their position and the number of guesses present when used. Hard
and Strict enforce the revealed position on later guesses, but do not reject
older guesses retroactively. A change to Hard or Strict validates the prior
history with this chronology. Starting the same exposed puzzle over preserves
the hint and resets its chronology to the retained initial rows. New Practice
rounds and new Daily identities receive a fresh allowance. Turning advice or
Easy off cannot remove assistance or hint history.

Remaining-answer counts and both advice systems receive the public revealed
position and letter. Advice workers never receive the hidden answer through the
hint field. Hint observations participate in analysis cache keys and cancellation,
so earlier worker responses cannot replace analysis for the new clues. Easy can
still offer exploratory guesses under its existing rules.

Completion records add `letterHints`: zero, one, or unknown. Letter hints filters
actual use independently of the existing Assistance filter: Easy without a reveal
is Assisted but Without letter hints. Existing completion identities, totals,
easiest difficulty, outcome, turns and filtered streak semantics remain unchanged.
Shares identify one letter hint without including its letter or position.

This is an additive migration: no answer dataset, daily schedule, reset epoch or
notebook key changes. Existing saves with missing hint metadata predate this
feature and are read as zero reveals. Invalid hint metadata is quarantined rather
than inventing a clue or granting a second reveal; it remains Assisted with
unrecorded hint history. Old completed results are not reopened or duplicated.
As with other additive save changes, writing a new save through an older cached
client is not a supported downgrade path: close older tabs and refresh before
playing. One active tab remains the supported session model.

Validation must cover current and legacy saves, terminal restoration, hint-aware
advice, difficulty chronology, normalization and repeated letters, One's given
clue, Smashare overlap, one-use enforcement, old statistics and filter composition,
then desktop and narrow-screen UI checks using disposable browser data.
