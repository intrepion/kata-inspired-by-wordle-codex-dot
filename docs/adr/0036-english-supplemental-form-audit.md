# Supplemental English plural/past audit (2026-11-06)

The user reported plural nouns and past-tense verbs still appearing as English curated answers. The previous policy was implemented correctly against its narrow AGID gate, but that gate deliberately skipped uncertain part-of-speech records, marked guesses, less-preferred variants and missing mappings. Those omissions are not proof that a word is a base form. Examples include BLOGGED, COSTED, British IDOLISED/REALISED, and DUCKLINGS.

## Selection and audit

All nine current English pools (3–11 letters) were screened against the retained AGID mappings, including records skipped by the automatic gate, the existing pinned English/Simple English definition snapshots, and candidate spellings. Decisions are explicit per word in `src/data/english-answer-review.json`. The original AGID gate and original common independent-sense exceptions remain. The supplemental review is applied by all three generators; it does not infer grammar from S or ED endings and does not modify source snapshots or accepted guesses.

The review removes **184 additional answers**: 74 reviewed finite-past forms, 87 reviewed noun plurals, and 23 explicit plural-only/uncertain-spelling curation decisions.

`english-answer-review.mjs` verifies every pinned evidence-file hash and referenced AGID/definition row before generation. The JSON records which decisions have only editorial support and any supplementary checked dictionary URLs. Existing retained contributor/license notices continue to apply to original source evidence. No external definition prose was imported for the additional web corroboration.

This is model-reviewed editorial work, independently checked by a second model for irregular forms, plural-only nouns, and ambiguous exceptions. It is not native-human certification or an exhaustive lexical classification of every possible sense. Cases with insufficient evidence are not automatically rejected.

## Boundaries and ambiguity

- A qualifying plural noun still excludes a spelling that is also an inflected present verb (BLOGS, NULLS, MOUSES, ISOLATES). Plural-only nouns such as ALMS, PLIERS and CLOTHES are treated consistently with the already excluded PANTS and JEANS.
- Clear common independent base senses remain: FOUND, WOUND, MOPED, MEANS, THANKS (interjection), SUDS (base verb). Invariant singular/base uses such as SHEEP, GALLOWS, FORCEPS and WATERWORKS remain. Modern singular disease/discipline nouns and mass nouns such as MUMPS, MEASLES, DIABETES, ECONOMICS, MATHEMATICS, DATA and CONFETTI remain.
- Contemporary lexical adjectives ASHAMED, BELATED, BELOVED, RENOWNED, RUGGED, WIZENED, DEMENTED and HAIRED remain where the competing finite verb is rare/historical or not the ordinary reading. This clarifies the earlier “not merely a derived adjective” rule: it does not make a common adjective eligible when it is also an ordinary finite-past form such as TIRED. Nor does any obscure generated verb mapping automatically disqualify an established adjective.
- Present-only forms and participle-only forms remain out of scope: SEEMS, LOSES, EATEN, TAKEN, FROZEN and TRODDEN. The reviewed dataset includes explicit safeguards against known bad Simple English labels calling CHANCING, SEDUCING, JERKING or NIPPING past tense, or FROZEN/TRODDEN finite past.
- JELLS, EKES, IRKS, LOOSES, SMITES and ROUSES retain their ordinary present readings because the additional noun evidence was insufficiently qualified. CHEQUED is deferred because its generated past mapping is uncertain and there is a possible historical adjective reading. WHISKYS and SCOTCHS are excluded as uncertain apparent variant inflections lacking an established qualifying base sense, not described as a verified standard English plural.

## Counts

| Letters | Previous answers | Current answers | Removed | Accepted guesses |
|---|---:|---:|---:|---:|
|3|447|447|0|1,151|
|4|1,480|1,479|1|4,964|
|5|2,103|2,094|9|11,193|
|6|3,166|3,148|18|19,816|
|7|4,138|4,121|17|29,870|
|8|4,234|4,208|26|37,175|
|9|3,734|3,700|34|36,799|
|10|2,831|2,788|43|32,523|
|11|1,783|1,747|36|25,693|

The five-letter accepted-guess file remains byte-identical; tests also compare the ordered accepted-guess sets at every length directly with the original pinned SCOWL snapshots. Every current answer remains an accepted guess.

## Runtime and migration

English dataset identifiers change only for changed pools: five-letter answers/Absurd v3, other 4–11 lengths v2, and unchanged three-letter v1. Spanish and Filipino identifiers and pools are untouched. Per-word eligibility now includes the extended English curation reports, so the 3/8/9/10/11-letter forms receive concrete grammatical explanations too.

Old English saves must not be rescored with changed answer pools or overwritten by a silent reset. The accompanying preservation implementation and its regression tests define how original dated rounds, compatible progress and archived incompatible rounds are handled. The release report must disclose any old rounds that cannot continue under the new pool. No global storage-reset epoch is changed by this audit.

## Reproduction and verification

- `node scripts/generate-vocabulary.mjs --check`
- `node scripts/generate-lengths.mjs --check`
- `node scripts/generate-extended-lengths.mjs --check`
- `node --import tsx --test tests/english-answer-audit.test.ts`
- `npm run check`

The audit regression enumerates every supplemental removal, confirms it remains a legal guess through gameplay submission, checks all explicit retained exceptions and exact length counts, compares all accepted words against SCOWL, checks dataset identity boundaries, tests extended grammatical explanations, and replays all three offline generators. The broader suite checks updated advice/adaptive counts, deterministic daily-cycle fingerprints and save compatibility.

## Additional removed spellings

### 4 letters (1)

ALMS

### 5 letters (9)

BALDS, BLOGS, FECES, GYBES, MARIA, NULLS, RARES, SLIMS, SPAYS

### 6 letters (18)

AMENDS, ANNALS, BLUNTS, COSTED, EMBEDS, FAECES, LAZIES, MERGES, MOUSES, OODLES, PLIERS, PSYCHS, REUSES, SCRAMS, SWEARS, SWINES, TIGHTS, WOULDS

### 7 letters (17)

ARREARS, BLOGGED, CLOTHES, COLONES, INNARDS, JITTERS, KIDNAPS, LISTENS, REGALIA, REMAINS, REREADS, RETRIES, SCOTCHS, TRIALED, UNSTUCK, WHISKYS, WITHERS

### 8 letters (26)

BIFOCALS, BLOGGERS, BRITCHES, COMMUTES, CONSULTS, DIALINGS, DOLDRUMS, EARNINGS, ENTRAILS, ENVIRONS, FEELINGS, GENITALS, GOSLINGS, IDOLISED, IMPOUNDS, INKLINGS, ISOLATES, ITEMISED, KNICKERS, PROCEEDS, RAILINGS, REALISED, SAPLINGS, SCISSORS, SIBLINGS, STICKIES

### 9 letters (34)

BACKWOODS, CELLULARS, COLONISED, COLOUREDS, CREATIVES, DIALLINGS, DIGITISED, DROPPINGS, DUCKLINGS, DUELLINGS, DUMPLINGS, EQUALISED, FINALISED, IMMUNISED, LEGALISED, LIFEFORMS, MAXIMISED, MEMORISED, MINIMISED, MOBILISED, MODELINGS, MOTORISED, OPTIMISED, PENALISED, POLARISED, RECHARGES, REDESIGNS, REDIRECTS, SATIRISED, SEEDLINGS, UNIONISED, WEAKLINGS, WEASELLED, YEARLINGS

### 10 letters (43)

APPETISERS, BEDCLOTHES, CORNFLAKES, DELIMITERS, DEODORISED, FERTILISED, FLAMMABLES, FORMALISED, FOSSILISED, FOUNDLINGS, GLAMORISED, HANDSHAKES, HARMONISED, HYPNOTISED, ITALICISED, MECHANISED, MODERNISED, ORGANISERS, PATRONISED, PRACTICALS, PREDEFINED, PREVIEWERS, PRIVATISED, PULVERISED, RECOGNISED, RECOMPILED, REVELLINGS, SOCIALISED, STABILISED, STERILISED, SUBSIDISED, SUMMARISED, SUNGLASSES, SYMBOLISED, TENDERISED, TERRORISED, TIMESCALES, TRAVELINGS, TUNNELINGS, TYRANNISED, UNDERPANTS, VISUALISED, WASTELANDS

### 11 letters (36)

BREAKPOINTS, BUSHELLINGS, CAPITALISED, CATEGORISED, CENTRALISED, DEMORALISED, DESCRIPTORS, DISCONNECTS, ENAMELLINGS, FERTILISERS, FRATERNISED, FURNISHINGS, HOMOGENISED, IDENTIFIERS, IMMOBILISED, INCREMENTED, INITIALISED, JEOPARDISED, LIBERALISED, MAINTAINERS, MONOPOLISED, NATURALISED, NEUTRALISED, PASTEURISED, PENCILLINGS, POPULARISED, REFORMATTED, REORGANISED, SCANDALISED, SCRUTINISED, SMITHEREENS, SPECIALISED, SYMPATHISED, TRAUMATISED, TUNNELLINGS, WATERLOGGED
