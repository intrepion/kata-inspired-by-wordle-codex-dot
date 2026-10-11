# Morrowmark

A quiet daily word dispatch: five letters, six fieldnotes, one small discovery. Original paper-and-ink design, writing and CSS illustration, inspired by five-letter deduction puzzles.

## Play locally

```sh
npm ci
npm run build
PORT=5198 npm run start:detached
```

Open http://127.0.0.1:5198. The launcher checks the port and refuses to replace an existing server. It runs the built game on loopback in a detached session-only Node process, with PID/log in `.local/`. It has no boot/login autostart. If 5198 is occupied, choose another free port; browser saves are scoped to the origin/port. To stop only this server, inspect `.local/server.pid` and verify that PID belongs to `scripts/serve.mjs` before `kill <PID>`. Restart with the command above after a reboot. Development: `npm run dev -- --port <free-port> --strictPort`.

## Rules and records

- Type A–Z or tap keys. Enter / NOTE submits, Backspace / ⌫ erases. Unknown, incomplete and already-submitted guesses spend no turn. Six accepted guesses finish the puzzle; a win finishes immediately.
- ✓ means the correct position; ↔ means another position; × means no unmatched copy remains. Exact matches consume copies first; remaining matches allocate left-to-right. APPLE / ALLEY yields ✓ ↔ × ↔ ×. Clues have symbols and accessible names, plus optional high contrast.
- Daily identity is one deterministic puzzle per **UTC date**, changing at **00:00 UTC**. The device clock supplies the date. The frozen v1 answer order and epoch 2026-01-01 ensure stable identity. An unfinished dispatch expires at rollover without counting as a loss. Input, focus and a 15-second timer detect rollover.
- Completed daily results count once by date. Played, wins, win rate, guess distribution, current and best streaks derive from the validated result ledger. A streak requires consecutive UTC dates won. Missing a date or losing breaks it; yesterday's winning streak remains current until today is lost or the next day is missed. Practice never counts.
- Practice is independent, replayable and saved; first practice uses APPLE as a gentle repeated-letter introduction. Fresh practice selects another answer and asks before abandoning unfinished fieldnotes.
- Drafts, guesses, mode, contrast and daily results persist in localStorage. Invalid saves are normalized or discarded. Storage failure is announced. Erasing requires confirmation; cancellation changes nothing. One browser tab is the supported active session; other tabs reload saved state before input, but simultaneous edits are not transactionally locked.
- Share copies spoiler-free symbols locally with a selectable-text fallback; the app never posts externally. No account, telemetry, runtime network requests, external fonts, paid services or public deployment.

## Vocabulary provenance and scope

`src/words.ts` is an **original hand-curated compilation created for Morrowmark**, dedicated under **CC0 1.0**; see [WORDS-LICENSE.md](WORDS-LICENSE.md). It was not imported from Wordle or another game/dictionary. There are **837 unique answer words** and **1,134 allowed guesses**, all five ASCII letters. The allowed list contains 297 additional words, including repeated-letter guesses and less common forms. Answers favor familiar general English words; some inflections and US/UK forms remain. This small guide is not a comprehensive dictionary: valid regional, specialist and inflected English words may be rejected. The daily cycle repeats every 837 days. Answer order is frozen in v1; expansion requires versioning to preserve puzzle identities.

## Engineering and checks

TypeScript and Vite; zero runtime dependencies. Node 24 recommended. `npm run check` runs strict type checking, Node domain tests and a production build. `npm audit --audit-level=moderate` checks the locked development dependencies. GitHub Actions runs both on push/PR with read-only repository permissions.

The delegated design is in [docs/SPEC.md](docs/SPEC.md), terminology in [GLOSSARY.md](GLOSSARY.md), and identity/persistence decisions in `docs/adr/`. Matt Pocock's [Grill with Docs](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) and [Implement](https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md) were used with their local dependencies. The user delegated recommended choices; no interactive interview was performed. Test seams were selected from the requested scoring/session/persistence/statistics/browser contracts. Red-before-green development was used at the domain seams.

Browser evidence and independent review findings are recorded in [docs/QA.md](docs/QA.md). Date rollover and malformed saves are tested with deterministic domain fixtures, not claimed as real-time overnight browser tests. Viewport emulation is not physical mobile hardware testing. Static delivery requires HTTP; direct `file://` launch is not supported.
