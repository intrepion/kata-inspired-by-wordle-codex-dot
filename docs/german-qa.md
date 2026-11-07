# German (Germany) verification

Tested locally on November 7, 2026. No commit, push or deployment is part of this
verification. Source revision before changes: `4e9b08b`.

## Automated checks

- Test-first language, spelling, keyboard, data and integration regressions were
  observed failing before implementation, then passed against the completed pack.
- `npm run check`: TypeScript, all **599 tests** (including the final German metadata regression), and production build passed.
- `npm run build:pages`: project-prefix production build passed.
- Final release dependency audit: zero vulnerabilities; arcade capture verification passed.
- `node scripts/generate-german.mjs --check`: byte-identical regeneration passed.
- Full pinned source importer `--check`: reproduced retained lexical and frequency
  evidence byte-for-byte. The roughly 1 GB source artifact stays outside the repo.
- `git diff --check`: passed.
- Root and Pages-prefix HTTP entry points, script/style assets, and every German
  notice/license file returned successfully; license bytes matched shipped files.
- Build reports existing large-chunk warnings; no build errors. Dictionaries remain
  bundled, and definitions load by language/length. No runtime dependency added.

German tests cover all nine lengths, five rule sets, daily identities, distinct
save keys, all difficulty levels, restoration, Unicode normalization, duplicate
scoring, advice and eligibility, correct canonical headwords, and German-only
meanings. Existing English/Spanish/French/Dutch/Filipino tests also passed. Two
older registry assertions were updated for the added language; no existing lexical
data or save identifiers were changed.

## Browser gameplay

Production root: `http://127.0.0.1:5321/`.
Pages-prefix preview: `http://127.0.0.1:5322/kata-inspired-by-wordle-codex-dot/`.

Observed through the browser UI:

- Deutsch → Deutschland, all nine length options, QWERTZ keyboard, Ä/Ö/Ü/ẞ as
  distinct single tiles, with draft restoration after reload.
- Invalid ZZZZZ and repeated KÖNIG did not consume another guess. König showed
  the English meaning king and retained the capitalized German source link.
- Give Up Cancel and Escape preserved the round. Confirmed Conquest Daily surrender
  revealed schon, survived reload and counted exactly one German daily loss.
- Switching to English opened its separate state; returning to German restored the
  saved row. New lengths opened independent notebooks.
- Conquest Easy Practice solved ach in four guesses using visible suggestions.
- One possibility Daily Ohr and Practice aus solved from their given clues.
- Smashare Daily Oma + Mai solved in three guesses; Practice was started and played.
- Absurd Daily and Practice accepted RAT and reduced 103 candidates to 35; the
  daily state survived reload.
- Letroso Daily and Practice accepted guesses. Practice STRAẞE showed six tiles and
  street/road definitions linked to Straße#German. Surrender revealed Bildung.
- Four-letter Gift showed poison/toxin/venom, not the English homograph's meaning.
- Help and About explained German spelling, selection and license provenance.
- Observed wins persisted on reload. No gameplay failures found in these flows.

Additional observed checks:

- Repeated Give Up open/cancel/backdrop/confirm actions followed by reload recorded
  one six-letter Practice loss, not duplicate outcomes.
- An eleven-letter German round accepted ARCHITEKTEN, reduced the visible pool to
  one remaining answer, and loaded Easy suggestions.
- At 320, 360 and 390 pixel viewport widths, the final root build had no horizontal
  document overflow. A pre-existing global header issue clipped Settings on narrow
  screens in German and English; adding mobile masthead wrapping fixed it without
  changing the desktop layout. All tools remained visible.
- The Pages-prefix build loaded Deutsch/Deutschland, German Gift meanings, and
  restored an ÄÖÜẞ draft. Its source link used the correct project-prefix path.

## Limits and preview-only observations

The local Vite preview serves .txt as text/plain without a UTF-8 charset, so directly
opening a Unicode notice there can display mojibake. Shipped bytes match the source.
A current live GitHub Pages notice was checked and serves text/plain; charset=utf-8.
This is a local preview MIME limitation, not corrupted German data; check the new
notice's live header during publication verification.

The initial Pages-prefix narrow-viewport recheck stalled, then passed in a fresh
QA tab before publication: 390×844, clientWidth and scrollWidth both 375 pixels,
all header controls visible, and the saved Gift meaning intact. Its viewport reset
was separately confirmed. The final root build was verified at 320/360/390.
Physical lowercase ß keystrokes were not supported by the browser interface: on-screen ẞ was checked in gameplay, while lowercase ß and NFC
input were verified in automated tests. No exhaustive browser difficulty-by-length
matrix, six-miss continuation, physical-device or network-isolation test is claimed.

Browser logs included installed-extension warnings and asynchronous extension
message-channel errors, without an application stack or observed gameplay failure.
The console was therefore not claimed to be clean. Build large-chunk warnings also
remain, as noted above.

This is played-flow coverage, not a claim of exhaustively solving every possible
word in every mode. Lexical review remains independent model review, not
native-human certification; source labels and historical frequencies have limits.
