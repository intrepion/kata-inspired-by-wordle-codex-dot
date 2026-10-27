# Six-guess challenge with optional unlimited continuation

A new sixth unsuccessful accepted guess now sets a persisted pending choice,
not a terminal loss. The solution remains unrevealed and no completion is counted.
A sixth-guess solution still wins normally. The accessible popup offers Keep
guessing or Give up; Give up opens the existing explicit confirmation dialog.
Escape, its close button and backdrop dismissal leave the game pending. A visible
choice action remains, input stays paused and reload reopens the saved choice.

Keep guessing opts this same round into unlimited additional unique valid guesses.
There is no additional attempt cap; existing dictionary, repeat and difficulty
rules still apply. Round identity, guesses, clues, candidate pool, easiest-used
history and assistance survive reload/mode/language/length navigation. Repeated
Keep actions are idempotent. Choosing easier rules from Give Up also continues an
already-six-guess round in extended play, as the dialog explicitly explains.

The board grows beyond six rows, including a new active row only while playable.
All submitted words retain their inline local meanings; the old 17-word queue cap
was removed. Pending-choice advice is paused; continued Easy/Suboptimal advice
uses all public clue rows. No automatic third-party dictionary calls are added.
Shares include Extended play, use an infinity denominator and retain every row.

Completion records optionally mark extended play. Total wins/win rate include
both kinds, explicitly labelled in statistics. Separate within-six and extended
win counts are displayed. The standard six-bin guess histogram includes only wins
within six; extended wins never overflow or inflate it. Give-ups retain the actual
number of guesses, including six or more, and count exactly once as losses. Only
wins/give-ups complete a new continued round. Streaks retain their existing
puzzle-date/recorded-result definitions and filter segmentation.

Historical six-guess losses without continuation metadata stay closed. Old
completion ledgers remain immutable. Optional fields extend existing save/snapshot
versions; there is no dataset, storage namespace, epoch or blanket reset. Old
six-guess result arrays remain interpreted as terminal legacy losses.

Daily pending/continued rounds additionally retain their original puzzle date
across UTC midnight, independently of the notebook's current UTC date. They count
on that original date. Once finished, the next visit/action opens today's fresh
Daily setup. Ordinary unfinished Daily rounds below six guesses still expire at
midnight as before. Practice/Absurd continue independently across dates.

Validation: fail-first sixth-miss and save/statistics regressions; long 8–11-guess
wins, invalid/repeated input, all languages/lengths, adaptive reconstruction and
candidate consistency, sixth-guess win, legacy preservation, assistance/easiest
history, Daily midnight retention and separate histograms. Isolated desktop/mobile
subpath checks cover pending dismissal, interruption/navigation, repeated Keep,
7+ rendering/shares, confirmed Give Up/easier choice, completed-result idempotence,
historical losses, next-day Daily setup and zero automatic external requests.
