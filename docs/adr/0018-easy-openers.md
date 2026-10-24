# Easy opening recommendations are explicit before the first guess

The user requested five Optimal guesses for a brand-new Easy round in Daily, Practice and Absurd. The existing zero-history analysis already runs against the entire current curated pool and searches every accepted guess, without the hidden selected answer. Identical public histories intentionally share cache entries across modes; other histories, kinds and datasets have distinct keys. New-round/reload behavior must not require submitting a guess.

This is a discoverability improvement with regression coverage, not a claimed ranking/engine defect. A visible hint above the board points to the Optimal list below the keyboard while Easy has zero accepted guesses. The list explicitly says it is finding opening guesses from all curated candidates, then labels the five opening recommendations. Inline definitions, assistance and existing one-step minimax metric remain. Normal/Hard/Strict/finished rounds hide opening guidance and Optimal advice as established. No storage reset, first-guess injection, difficulty override, hidden-answer transport or extra ranking work in unassisted modes.

The public worker contract was green before changes. A UI regression was red for missing start guidance, then green. Desktop/mobile regression covers all three variants, drafts, reloads, fresh Practice/Absurd rounds, cached mode switches, five meanings, assistance and non-Easy hiding. Full109tests/typecheck/build pass and both independent reviews report no findings.

The later answer-form policy in ADR0019 supplies the current filtered pool; underlying mechanics remain unchanged.
