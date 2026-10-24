# Add Wordle-compatible positive-hint hard mode

## Rules and primary-source verification

Inspected the public official [Wordle page](https://www.nytimes.com/games/wordle/index.html) and its linked NYT client scripts on 2026-10-24. No daily puzzle API or future-answer schedule was requested. The web reader could not access NYT pages, but direct HTTPS retrieval of the public page/scripts succeeded.

- [Validation client](https://www.nytimes.com/games-assets/v2/4964.2cfb9d94f868261e2578.js), module 95280, export q4. SHA-256 `623e4076438be69eb27ca43be754af0711704949c46d82c9e7820a75b60ccaba`. The call site supplies the previous accepted guess and its evaluation.
- [Settings client](https://www.nytimes.com/games-assets/v2/9424.997b87183f08749028e6.js): enabling is disabled when hard mode is off and the row index is nonzero. Disabling remains available.

Observed official validation checks green positions first, then counts every green/yellow copy of each letter in the preceding accepted row. It requires at least those counts in the new guess. It does not inspect gray exclusions, upper bounds on copies, or former yellow positions. Thus gray letters, extra copies, and yellow letters in the same formerly yellow position remain legal. For a legal hard-mode history, positive counts/green positions carry forward from row to row; counts are not summed across rows. This is not a filter requiring every guess to be a remaining possible answer. The implementation follows those checks with original code and helpful Morrowmark messages.

## Difficulty and saves

A puzzle can enable hard mode only before its first accepted guess (drafts/rejections do not lock it). It can disable it at any time; after an accepted guess it cannot re-enable. Completed puzzles cannot newly enable it. Daily and practice runs persist separate optional `hardMode` metadata. Settings also retain a boolean preference used by future daily puzzles and fresh practice. Changing one puzzle does not retrofit the other saved puzzle. The UI names the selected puzzle and explains this scope.

The v1 save key/schema remain readable. Missing/malformed metadata defaults to normal mode. Hard-marked histories are replayed through validation; if inconsistent, keep the guesses/draft and remove only the hard flag. A matching terminal daily ledger preserves hard metadata; a mismatching stale run cannot confer a hard flag on ledger guesses. Statistics remain the existing combined daily statistics, with practice excluded. No separate hard-mode badge/statistics or share claim is introduced.

Answer sequence, daily epoch, dictionary and ordinary rejection/scoring rules remain unchanged. The existing Morrowmark duplicate-guess rejection remains, even though this task's compatibility claim concerns hard-mode constraints rather than every detail of NYT gameplay. The verified NYT client can change; the dated scripts support these rules at inspection time, not a perpetual parity guarantee.
