# 0037: Preserve English notebooks across the supplemental answer audit

## Context

The supplemental English form audit changes answer lists and dataset identities at lengths 4–11. Daily schedules, Absurd partitions and variant puzzle selection depend on those identities. Replaying old guesses against newly selected answers would change already revealed clues. Deleting local progress is unnecessary and is not part of this update.

## Decision

- Keep every original English notebook, game and statistics value unchanged at its existing localStorage key. New active English data at affected lengths uses the original base key plus `.english-base-v1`. Three-letter English, Spanish and Filipino retain their existing keys. Shared theme, global difficulty, language, selection and length preferences keep their existing keys and values.
- Copy known English notebook/game/statistics keys before loading active progress. A completion marker makes this import one-time; partial copies can retry without replacing an existing destination. If storage is full, unreadable or fails verification, disable app writes. Never delete originals or resurrect deliberately reset active data on the next reload.
- Retire the old automatic storage-epoch deletion. Its compatibility function is a no-op. Existing explicitly confirmed per-notebook reset controls affect only the active notebook, not the original archive.
- Expose “Download original English notebooks” in Settings. The JSON contains exact original stored values. No data is uploaded. Clearing the browser’s site data can still remove both versions.
- Preserve current-format preferences, validated historical outcomes and notebook statistics. Preserve their difficulty/assistance classifications and completion identities rather than inferring new ones. Older unsupported/corrupt formats remain recoverable in the original export, but are not treated as validated active rounds.

## Ruleset behavior

### Conquest

A frozen copy of the previously published answer order reconstructs historical alphabetical and shuffled schedules using the original dataset identity. It never supplies new answer candidates. Saved dates receive a validated `englishAnswerSchedules` hint; raw saved answers do not select daily answers.

An unfinished Daily or Practice round continues with its exact answer, guesses and draft when that answer remains eligible. If its answer was removed, a fresh eligible round requires Start; the old raw notebook remains separate. Completed Daily and Practice rounds may retain their original removed answer because no new guessing or advice is possible. Dated results and wins remain intact through rollover. A completed ledger remains authoritative over stale unfinished tab data. Prior-list daily boards and shares say “Previous English answer list.”

### Absurd

Old adaptive guesses cannot safely be replayed using a changed answer pool, because the largest partition and every subsequent clue can change. Affected rounds start afresh. Previously recorded statistics remain. New practice rounds get a new identity and no inherited difficulty exposure. Daily scope keeps the first recorded outcome and cannot count the replacement round a second time. Old guesses, drafts and any unrecorded old outcome remain available in the original export.

### One possibility

Keep an existing given clue and solution when the solution remains eligible and the clue is still unique. Also retain completed removed-answer boards when verified against the frozen old pool. A live removed-answer round gets a fresh verified pair and Start gate, without inherited exposure. Daily replacement rounds do not overwrite an already recorded result for that round/date. Compatible prior-list daily pairs remain fixed even though newly generated daily pairs have changed.

### Smashare

Keep a saved English pair and its exact clue history when both component answers remain eligible, including a prior-list Daily pair. If either answer was removed, start a new pair. Original raw games remain separate and existing statistics ledgers are copied unchanged; the first daily result remains authoritative. Removed-pair completed boards are recoverable in the export rather than displayed in the new pool.

### Letroso

Keep the saved answer and its exact history when eligible. Removed answers cause a fresh round. Original raw games and existing statistics ledgers remain available. Hidden-length game keys are included in the migration, while three-letter statistics retain their original unchanged key. Removed-answer completed boards are recoverable in the export rather than displayed in the new pool.

## Limits and verification

Only statistics actually recorded or safely recoverable from validated fixed-answer rounds are carried into the active statistics display. No fabricated outcome is inferred from an incompatible adaptive snapshot. Original data is retained for recovery. An older client left open can continue writing its original namespace after the one-time import; those later writes remain separate and exportable, and do not replace new progress. Close old tabs and refresh when updating.

Regression coverage checks exact old whole-cycle schedule hashes, all affected lengths, removal/retention cases for all five rulesets, stale tabs, repeated loads, rollover, namespace/language isolation, original exports, partial/quota failure and first-result identity. The pre-rename fixture JSON stays unchanged and is tested as historical evidence.
