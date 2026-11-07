# 0041. German (Germany)

Status: accepted; publication approved by the user on November 7, 2026.

## Decision

Add `Deutsch → Deutschland` (`de-DE`) as a separate language/variety, with lengths
3–11 and the existing five rules and both schedules. Existing languages, dictionary
bytes, dataset identities and save keys do not change. German gets versioned dataset
IDs and independent notebooks, statistics and remembered length. Global difficulty
and appearance remain shared.

The playable alphabet is A–Z plus Ä, Ö, Ü and ẞ. NFC composes combining marks.
Lowercase ß is mapped to ẞ **before** Unicode uppercasing, which otherwise expands
it into SS and silently changes word length. Umlauts and eszett count as one tile
and are not aliases of A/O/U, AE/OE/UE or SS. A German QWERTZ on-screen keyboard
provides all letters. Source spelling and noun capitalization are retained for
reveals and source links; tiles remain uppercase.

German Wordle implementations differ. [Wortchamp](https://wortchamp.com/) supports
distinct umlauts and eszett in its German/Austrian mode. [128ordle](https://www.128ordle.com/de/wortliste)
counts umlauts as individual letters but excludes eszett. These establish differing
conventions, not a universal German Wordle rule. Lexi Conquest explicitly chooses
the original-spelling rule above, which keeps Maße and Masse distinct. No word lists
or definition text are copied from either game.

## Data and meanings

Use pinned German records from English Wiktionary via Kaikki and wordfreq frequency
evidence. Broader dictionary guesses and curated standalone answer words remain
separate. Definitions are English source glosses, loaded lazily from bundled
same-origin files, not automatic requests to a third-party dictionary. German Gift
must mean poison rather than importing the English homograph's meaning. Original
German noun case is preserved in attribution links.

See [German sources and reproducible selection](../german-sources.md) for exact
inputs, licenses, thresholds, editorial review and limitations. Source statements
are not legal warranties or native-human certification. German loanwords with
characters outside the playable alphabet are excluded, not silently transliterated.

## Verification

Tests cover NFC, ß/ẞ round trips, umlaut distinction, duplicate scoring, all
supported lengths, all five rule sets, daily identities, all difficulties,
restoration, advice, source-linked meanings, and separate save keys. The original
language regression suite must still pass. Browser gameplay and layout are checked
through a loopback HTTP server before publication, including interrupted dialogs,
reloads, repeated switches and special-character input.
