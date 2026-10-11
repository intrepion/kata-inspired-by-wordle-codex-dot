# Delivery verification

## Actual Mac Chrome play

Executed through the user's Chrome browser using normal visible buttons and physical key events, against the built game at http://127.0.0.1:5198 on 2026-10-11 UTC. No hidden browser state was injected, no date override was installed, and no production answer backdoor exists. The deterministic current answer was calculated from the source solely for a controlled daily win; this is a QA solution, not evidence of unaided solving.

- Opened tutorial and verified its APPLE / ALLEY worked example. Chrome's accessibility tree exposes each position, letter and clue, including the two different L clues.
- Practice APPLE: incomplete AL rejected at 0 turns; reload restored AL draft; ALLEY submitted with ✓ ↔ × ↔ ×. Duplicate ALLEY and unknown ZZZZZ rejected at one turn. Backspace editing worked. Pointer keys entered APPLE and NOTE won in two guesses. Keyboard L upgraded from elsewhere to exact.
- Switched to Daily, typed CRA, reloaded, restored CRA, finished CRANE and submitted. Switched to completed Practice and back; both histories remained distinct.
- Daily loss: six accepted wrong guesses revealed the word and disabled input. Statistics showed one played, zero wins, zero streak. Reload and additional Enter did not add a result.
- Sharing: clicked local spoiler-free share, inspected selectable result text and read the copied clipboard. Text contained only date, X/6, symbol rows and legend, without answer or guessed words. Named dialog announced copy success. Clipboard-denial fallback is implemented but not induced with browser permission changes.
- Settings: high-contrast checkbox changed clue tones. Opened erase confirmation and chose Keep my notebook; daily loss, statistics and settings remained. Explicit erase was exercised only on this task's disposable QA notebook. Existing unrelated browser data was untouched.
- Daily win after resetting disposable QA data: typed the known deterministic answer, submitted, pressed Enter again and reloaded. Statistics showed exactly one played, one win, 100%, current/best streak 1 and one histogram entry.
- Practice loss after that win: six wrong guesses lost independently; daily statistics remained one played/one win. Fresh practice started another puzzle. Entered QQ; Fresh practice then Keep exploring retained QQ.
- Focus regression retest: pointer-clicked Q then pressed Space; focused accessible key remained Q, draft changed Q to QQ. Key nodes now remain stable. Typed physical letters after selecting a mode, then Enter; submission worked without accidentally activating the mode. Native button activation remained available.
- Responsive inspection: default viewport 1200×698, overrides 390×844, 320×740 and 768×1024. Narrow pointer keys worked; dialogs remained scrollable. A 5px navigation overflow at 320 was found, fixed, rebuilt and retested: clientWidth/scrollWidth both 305 (scrollbar excluded). At 390 and 768 they also matched. Overrides were reset.
- Screenshots inspected: desktop fresh, desktop repeated letters, mobile/narrow practice and daily stats. Screenshots are actual Chrome renders; mobile images are viewport emulation, not physical devices.
- Final runtime build reloaded and exercised after the storage fallback fix; Q/Space focus, incomplete guess, practice ALLEY and reset worked again. No application console errors. Warnings from an installed Chrome wallet extension were observed and are unrelated to the game.
- Erased only this task's disposable QA notebook and left a fresh Daily dispatch open for the user.

## Automated evidence

18 public-domain/seam tests pass under Node 24: repeated-letter copy accounting; incomplete/invalid/duplicate rejection; terminal wins/losses; keyboard best-clue priority; UTC midnight date and stable epoch identity; practice random boundaries; spoofed/corrupt/unknown-version save validation; duplicate/overlong/post-win/future records; interrupted save restoration; ledger recovery/idempotence; streak continuation/missed date/loss/best streak; practice isolation; spoiler-free text; storage read failure during midnight rollover; external notebook clearing.

Strict TypeScript checking, production Vite build, `git diff --check`, and dependency audit pass (zero reported vulnerabilities). GitHub Actions checks strict types, domain tests, build and audit on every push/PR. Final commit/run evidence is provided with the delivery response; no CI pass is assumed from local tests.

Date rollover, malformed saves and storage failure use deterministic clock/storage **fixtures at the domain/adapter seam**. They are not actual overnight browser tests or manually modified browser storage. No physical touch hardware, screen reader, Safari/Firefox, multi-tab concurrent race stress, or clipboard-permission-denial flow was tested. Single active tab is the supported editing model; storage is local and can be cleared/edited.

## Independent reviews

Review baseline: documentation commit `188c9d7`; originating spec `docs/SPEC.md`; standards `CODING_STANDARDS.md` plus Matt Pocock's Fowler smell baseline. Two independent sub-agents reviewed Standards and Spec separately.

**Standards:** Two findings: unnamed dialogs and keyboard buttons rebuilt/blurred on input. Fixed in `e65c5ed`; re-review confirmed both resolved, no new actionable findings. Browser evidence verified accessible dialog title and retained focused key.

**Spec:** No initial functional defects at `1ecf4b9`. Follow-up identified one storage-failure-at-midnight regression in `e65c5ed`. Fixed by `synchronize()` in `2fd80d5` and covered with red-before-green boundary tests. Independent re-review confirmed resolved and found no additional regression. Pending delivery evidence at review time was subsequently completed as recorded here and in the final response.

## Local service

Port 5198 was probed free; existing servers on 5173–5197 were preserved. A detached, session-only Node server was launched using `scripts/detach.mjs`; PID and log are in ignored `.local/`. HTTP 200 and actual Chrome load were verified after the launcher exited. No boot/login autostart, security-setting change or public deployment occurred. Use the README restart command after stopping or rebooting. The static HTTP server is loopback-only; direct file launch is not supported.
