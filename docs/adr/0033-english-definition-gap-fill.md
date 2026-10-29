# English definition gap fill

The user approved expanding local English definitions without changing word lists,
existing definitions, saves or runtime network behavior. Publication was separately
authorized after local verification. Existing Spanish coverage is outside the scope.

The earlier full raw English Wiktionary artifact is not present locally. The current
Kaikki raw artifact was checked before download: 3,082,185,963 compressed bytes,
Last-Modified 2026-10-25, still extracted from the 2026-10-01 dump. It differs from
the earlier Spanish input and has its own SHA256 in english-source.json. The Mac
had 60 GiB free before download; the compressed file stays outside the repository.
No decompressed full dump is saved.

The importer selects only English-language lowercase headwords already accepted
at lengths 4–7 and missing from the existing Simple English tables. It retains
up to four entries and four source senses each, supplied usage/grammar labels,
and no examples, quotations, media or inferred definitions. For example ABACAS
remains a labelled plural reference, BROIDER retains its archaic label, and ABACA
has the source's banana/fibre meanings. This is a bounded dictionary selection,
not a claim of complete senses, commonness or human review of every definition.

The original 17,676 definitions and their four files remain byte-identical and
take precedence. Separate lazy length chunks add 44,234 words, giving 61,910 of
65,843 accepted words (3,933 gaps). Actual default-client lookup covers 10,882
of 10,887 possible English answers. New JSON is 7,225,479 bytes; combined original
and new JSON is 10,077,927 bytes, about 2,337,196 bytes gzipped independently.
Only a missing original entry requests the corresponding same-origin gap chunk.
Failed chunks retain the existing unavailable/retry behavior, no external fallback.

English Wiktionary contributor text and this modified selection remain CC BY-SA
4.0, separately from application code. Every added result links its source article
and English section, with article history providing contributor attribution; exact
entry revisions are not provided by the extract. Public source/license notices and
WORDS-LICENSE.md document input/output hashes, transformations and reproduction.
The raw multi-gigabyte input, word lists, gameplay and storage epochs are unchanged.
