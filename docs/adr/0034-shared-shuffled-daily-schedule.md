# Shared shuffled Daily schedule

The user requested random-looking Daily answers rather than alphabetical traversal.
Answer membership, Practice randomness, Absurd's adaptive engine, difficulty and
assistance attribution, local meanings and storage namespaces remain unchanged.

## Algorithm and fairness

A fixed deterministic Fisher–Yates permutation is generated separately for each
language and length. Its seed is an explicitly versioned string containing the
answer-dataset identity, language and length, mixed with the sorted answer words
using specified UTF-16 FNV-1a/32 operations. The 32-bit Mulberry32 stream and
rejection sampling define the shuffle identically in browser and Node. No clock
entropy, browser identity, network request or Math.random enters Daily selection.
This is reproducible game randomization, not cryptographic secrecy.

From 2026-11-01 00:00 UTC, the UTC day offset from that date selects the shuffled
word modulo the pool size. Each answer appears once per cycle, and the same
permutation repeats; there is also no duplicate across the cycle boundary. All
new canonical puzzles on the same version and word lists have the same answer
for their UTC date/language/length, regardless of difficulty or lookup order.
Pool sizes/cycle lengths remain unchanged. Permutations are cached, immutable,
and contain no new answers. Tests freeze whole-cycle hashes rather than printing
future-answer lists.

## Rollout and compatibility

Before 2026-11-01 the original January 1, 2026 alphabetical schedule is retained
exactly. The new cycle begins at activation; answers already encountered in the
older, partial alphabetical cycle may therefore reappear after activation. The
once-per-cycle guarantee applies separately to the new shuffled cycle.

**Release gate:** publish before 2026-11-01 00:00 UTC. If approval/publication is
later, move the activation date to a future UTC boundary, update documentation
and date fixtures, and rerun checks before publishing. Publication was separately authorized after local verification on October 29.
Refresh/close old tabs before the activation date.

No static site can force already-cached/offline clients to execute new code. An
old client can continue making alphabetical rounds after activation. Additive
save metadata (`dailyScheduleVersion:1`, optional per-date `dailySchedules` old-rule
overrides) preserves those dated rounds and results when updated. Known old
rules reconstruct answers; arbitrary saved answer strings are never trusted.
The visible warning and share text identify these as **Legacy daily schedule**;
they are explicitly grandfathered exceptions to canonical shared Daily identity.
Future new dates return to the shuffled schedule. Daily result IDs remain one
per UTC date; migration does not grant a second attempt for a completed date.
Old tabs should be closed; simultaneous mixed-version writes cannot be made
transactionally safe by a client-only schedule update.

Existing earlier dated results keep their identity. Pending/unlimited Daily
rounds retain their original puzzle date/answer across midnight and activation
until finished, then today's setup opens. Ordinary unfinished rounds retain the
existing rollover behavior. No blanket reset, history rewrite or difficulty/
assistance reclassification occurs. The pre-rename save fixtures remain unchanged;
their round/settings data round-trip with only the additive schedule marker.

## Verification

Fail-first tests demonstrated alphabetical traversal and wrong rebinding of a
post-boundary old-client save. Both pass after implementation. Exhaustive cycles
for all eight language/length combinations prove membership, uniqueness, stable
repeat behavior, no boundary duplicate, deterministic lookup and frozen schedule
identity. Every original 2026 date before activation is crosschecked with the old
rule. Save tests exercise old/current metadata, completed wins, all locales and
lengths, continuation across midnight/activation, difficulty/settings and stats.
Isolated desktop/mobile Pages-path QA uses simulated UTC dates, including two
independent players, start/play/reload, legacy warning/share, Give Up and no double
counting; third-party requests are blocked and counted. Gameplay/word lists and
existing bundled meanings remain unchanged.
