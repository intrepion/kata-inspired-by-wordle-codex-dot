# ADR 0042: Portuguese Brazil and Portugal

Date: 2026-11-07
Status: Accepted for local implementation; publication requires separate approval.

## Decision

Offer Português → Brasil (`pt-BR`) and Portugal (`pt-PT`) as distinct language varieties. Both use the existing 3–11-letter game rules and all five modes. Preserve the English interface and bundle sourced English meanings locally. Use separately validated regional lists, with curated possible answers smaller than the accepted-guess lists. See [source evidence and licenses](../portuguese-sources.md).

## Orthography and collisions

Normalize spelling to NFC uppercase, then fold Unicode combining marks for gameplay. This makes accents, tilde and cedilla equivalent without removing punctuation. CH, LH and NH remain two letters. Canonical accented answer strings are retained independently of normalized guess keys, so results show the actual original spelling.

Each regional answer pool must have unique normalized keys. AVÓ and AVÔ may both be accepted spellings and have sourced English meanings, but only one may be selected as an answer in a particular pool. The same identity governs duplicate guesses, clue scoring, difficulty constraints, advice, adaptive partitions and unique-clue selection. Plain-input definitions can show several spelled headwords with distinct attribution links. An accented lookup selects its exact headword when present.

Portuguese Smashare constructs seams from folded letters and rejects component words with equal gameplay keys. It preserves both original answer components for display. This behavior is gated to the new Portuguese varieties: changing existing languages' candidate-pair ordering would change their daily puzzles and is out of scope.

## Persistence and daily schedules

New language IDs supply independent dataset identifiers, daily seeds and local-storage namespaces. No schema version, existing dataset identifier, daily shuffle algorithm, reset epoch or migration changes. Existing notebooks are not imported into either Portuguese variety. Brazil and Portugal progress, statistics and per-length notebooks remain independent; global difficulty and shared preferences remain shared. Standard replay validation applies to newly saved Portuguese rounds.

## Verification

Language tests cover NFC/NFD input, accents, cedilla, letter counts and punctuation. Integration tests cover both varieties, every supported length, all five modes, all four difficulties, repeatable dailies, practice, restore, source identity and legacy storage preservation. Browser checks use HTTP on 127.0.0.1, with isolated local storage, and exercise selectors, resumption, source attribution and canonical reveals. See [QA](../QA.md) for final executed checks and limits.
