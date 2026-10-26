# Explicit starts and segmented completion statistics

The user requested Daily, Practice and Absurd statistics by language, word length
and difficulty, then clarified that difficulty must be the easiest ever used,
even before a guess. The user subsequently requested an explicit Start screen so
unconfirmed default/remembered settings cannot accidentally establish exposure.

Each new puzzle now shows its mode, language, length, a difficulty selector and
Start puzzle. No board, remaining-answer count, learning lookup or advice worker
starts before confirmation. Setup choices do not establish exposure. Start
persists the baseline before rendering assistance. After Start the order is
Easy < Normal < Hard < Strict and exposure can only become easier. Navigation,
reloads and zero-guess resumes retain it. Distinct new Practice/Absurd rounds
return to setup. Restarting an already revealed puzzle requires confirmation but
retains the existing exposure and Assisted flag. Daily can count once per UTC day.

A version-1 notebookStats field is additive to the existing version-3 save. Each
language/length notebook retains its own completion ledger and active round IDs;
there are no new reset epochs, changed dataset IDs, new storage namespaces or
round/scoring changes. The initial terminal entry for an identity is immutable.
Practice/Absurd IDs distinguish repeated identical answers/guesses. Unfinished
rounds, invalid guesses, reloads and revisits do not add results. Interrupted
terminal saves settle once when restored. The global difficulty preference stays
global; new setup choices update it only on Start. Shares additionally identify
the statistics difficulty, separately from the current validation mode/Assisted.

Legacy Daily totals/history are retained under difficulty/assistance unrecorded.
Only the saved last completed Practice/Absurd round is recoverable; earlier games
were never retained. Old unfinished games resume directly with unknown exposure,
not a fabricated Normal/Hard classification. Observing Easy establishes the exact
minimum even for an old game because Easy is the absolute easiest level. Other
upgrades cannot turn unknown history into a known harder difficulty.

Statistics opens from the top Statistics icon or the side summary. Filters choose
mode, language, length, difficulty (including All and Legacy) and assistance without
changing the active game. Totals show played, wins, losses, win percentage and a
wins-only guess histogram. Assistance remains separately filterable; old unknown
assistance never becomes unassisted. Easy completions are always Assisted.

Daily streaks require consecutive winning UTC dates within the filters. Yesterday
can remain current while today's dispatch is unfinished. A completed dispatch
outside the filters cannot fill today's date and ends that filtered current
streak. Practice/Absurd streaks are consecutive recorded wins within the selected
filters, unaffected by calendar gaps; matching losses break them. Other filters
and abandoned rounds do not count. Historical omissions are explicitly disclosed.

Tests cover public save/statistics/start boundaries, migration, identity/reload
idempotence, monotone exposure including pre-guess changes, all languages/lengths,
all modes/difficulties, streak semantics, assistance, malformed input, terminal
immutability and Daily rollover. Isolated headless desktop/mobile checks exercise
actual UI setup, filters, language/length navigation, Easy-to-Strict before/after
Start, replayable rounds, shares, legacy saves and zero external dictionary calls.
