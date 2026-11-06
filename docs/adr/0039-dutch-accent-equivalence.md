# 0039: Accent-equivalent Dutch gameplay with versioned saved rounds

Date: 2026-11-06

Status: Accepted. Supersedes the accent-sensitive gameplay rule in ADR 0038 for new Dutch rounds only.

## Decision

New Dutch puzzles use the rule “Accents don’t count. IJ uses two tiles.” Normalize spelling separately from gameplay comparison: preserve NFC dictionary spelling, expand Ĳ/ĳ to IJ, and uppercase; for Dutch rules 2 only, remove combining diacritics from the comparison key. IJ stays distinct from EI and Y. AA, OE and UI remain separate letters. Other languages retain their existing rules.

Keep the vocabulary, curated answer order, source files and dataset identifiers unchanged. Runs retain canonical answer spelling for reveals. Validation, duplicate detection, scoring, constraints, keyboard clues, continuation, candidate filtering, advice and sharing use the run’s comparison rule. Advice deduplicates equivalent spellings and includes the rule version in cache identity. Dutch dictionary lookup preserves exact accented spelling, with alias-aware fallback for plain input and all original source links.

## Saved-round compatibility

Do not silently reinterpret a saved round. Previously different guesses can become duplicates, an earlier guess can become a win, and adaptive partitions or uniquely identifying clues can change. Unmarked Dutch saved rounds therefore restore as `dutchRules: 1`; newly created rounds use `dutchRules: 2`. Persist this per round and per historical daily result, including Absurd, One possibility, Smashare and Letroso. Preserve legacy drafts, guesses, targets, outcomes, difficulties, assistance and statistics. Existing rounds show a concise old-rules notice and retain accented keys. Fresh practice/new daily rounds use rules 2. Restarting the same puzzle for a difficulty change keeps its original rules.

Daily Conquest, Smashare and Letroso answers remain scheduled from canonical source lists. Daily Absurd targets and One clues are derived with the saved round’s rule version; version 1 keeps its original generation seed. Each of the five daily One rounds can independently resume its saved version.

No storage reset, source-data regeneration, save deletion or change to other languages is required. Existing browser notebooks are not modified by tests. Publication requires separate approval.

## Verification

Regression tests cover accent/plain/decomposed spelling, all seven accented curated answers, all difficulties and variants, advice and definitions, legacy fixtures and history, and new-rule round trips. See `docs/QA.md` for executed checks and browser verification.
