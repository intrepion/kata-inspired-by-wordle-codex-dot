# Confirmed give-up without invented guesses

The user requested a Give Up dialog with confirmation, every easier difficulty,
and Cancel, extending the uncommitted statistics/start-screen work. Give Up is
available only after Start and while the current puzzle is unfinished.

The dialog initially focuses Cancel. Cancel, Escape, its close button and clicking
the backdrop leave the puzzle unchanged and restore focus. Easier choices follow
Strict → Hard → Normal → Easy: all actually easier levels are offered, nearest
first. Easy states explicitly that no easier level exists. Choosing one updates
the global setting and easiest-used attribution while retaining the same answer,
accepted guesses, feedback, candidates and draft. It records no completion.

Confirm Give Up adds an optional gaveUp flag and clears only the draft. No accepted
guesses or feedback rows are fabricated. Ordinary and adaptive status become lost;
submit/rule changes cannot reopen the completed round. Absurd keeps its entire
consistent pool and reveals its stable sorted representative, with wording that
it is one surviving answer, not a word selected in advance. Reload reconstructs
the identical pool/feedback and preserves the terminal flag. Existing save/snapshot
versions stay compatible through optional fields; old data without the flag keeps
its behavior. No dataset or reset epoch changes.

The completion ledger distinguishes give-ups and permits their actual 0–5 guesses.
They count once as losses under mode/language/length/easiest-used difficulty,
including assistance and honest Legacy handling. Give-ups do not enter the
wins-only guess histogram. Daily stores an authoritative terminal history flag
alongside its actual guess array (possibly empty), so a stale unfinished snapshot
cannot reopen that date. Daily resumes with a fresh setup on the next UTC date.
Completed records remain immutable on repeated confirmation, reload or revisits.

Confirmation binds to notebook key, mode, round identity, UTC notebook date and
accepted-guess signature, answer identity and draft. If another tab/date update changed the puzzle, the stale
confirmation is cancelled for review, without recording a give-up. The destructive
button disables immediately; the same terminal identity cannot count twice.

Validation: fail-first zero-guess loss/reload regression, 6 new public behavior tests,
all mode/language/length/difficulty combinations, Daily authoritative restoration,
adaptive survivor/feedback preservation, completed-run guards, easier choices and
old saves. Isolated headless desktop/mobile tests cover every mode, Cancel/Escape/
backdrop/focus, same-clue/draft downgrades, Easy, repeated confirmation, zero guesses,
stale updates, Legacy history and zero automatic external dictionary requests.
