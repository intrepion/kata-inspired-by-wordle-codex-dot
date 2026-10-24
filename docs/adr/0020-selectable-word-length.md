# Selectable word length

Status: accepted. User authorized committing, pushing and deploying the completed feature on October24,2026.

Morrowmark supports 4, 5, 6 and 7 letters, default5, with six guesses per round in Daily, Practice and Absurd. A labelled Word length selector above the board opens or resumes that length's notebook while keeping the current variant. It never reinterprets guesses or deletes another length. The selected length persists for reload/home navigation. Native selector keyboard events do not submit guesses.

## Independently licensed vocabulary

The exact existing SCOWL2020.12.07 release archive and AGID2016.01.19 repository archive are reused: revision `5ef55f9c42730ebe4394a78b77855468a6f15dd2`. All archive and source hashes remain pinned in `scowl-source.json` and `agid-source.json`. Complete SCOWL and AGID permission/contributor notices remain unmodified and ship with both builds.

| Letters | Curated answers | Accepted guesses |
|---|---:|---:|
|4|1,480|4,964|
|5|2,103|11,193|
|6|3,166|19,816|
|7|4,138|29,870|

General/American/British lowercase ASCII source words, common tier35 for answers and tier80 for guesses. Qualified AGID regular/irregular plural nouns and finite-past forms are removed only from answers, using the same parser/policy as five letters. Identity forms and participle-only forms are not broadly excluded. Reviewed independent homographs are documented in `length-form-overrides.json`: examples BORE/FEED/ROSE/SHOT, GROUND, OVERLAY/REBOUND/THOUGHT/WORSTED. DATA retains its common mass-noun sense. This is an explicit limited curation policy, not exhaustive grammatical or suitability certification. No official Wordle equivalence is claimed.

Five-letter source snapshots, curated/guess modules, datasets and schedules are byte-identical to the published guide. Additional inputs, morphology records and removals have separate snapshots/audit files, avoiding incidental five-letter changes.

Reproduce with:

```
python3 scripts/import-lengths.py /path/scowl-2020.12.07.tar.gz /path/wordlist-source.tar.gz --check
node scripts/generate-lengths.mjs --check
```

Import verifies both archive hashes, all27 selected SCOWL source hashes and the complete AGID input hash without executing source code. Generation verifies the filtered snapshot hashes and audited output. The archives are not required by ordinary builds; no build downloads dictionaries.

## Notebook and daily identity

Five letters keeps the exact root/project save key and schema3 dataset. Existing rounds, drafts, difficulty, assistance, history and statistics continue. Other lengths suffix the already namespaced key with `.letters-N`, use independent dataset identifiers and have separate validated settings, daily ledgers, practice and adaptive histories. The `.word-length` preference key contains only the chosen number. Malformed/unsupported preferences default5. Wrong-length/dataset notebooks fail closed rather than mis-scoring clues. No blanket migration/reset is introduced. Erase targets only the currently selected notebook; other lengths and unrelated origin keys remain untouched.

Each length uses its own sorted answer cycle and the existing January1,2026 UTC epoch. Daily difficulty/preferences apply to future ordinary rounds of that length; Absurd difficulty remains separately saved within that notebook. Shares explicitly identify length and preserve difficulty/assistance labels.

## Clues, advice and definitions

Feedback and all green/yellow/duplicate constraints scale to the chosen answer length. Absurd buckets use exact scoring, stable ties and only that length's curated answers, including reconstruction and final reveal. Every length still permits its broader accepted guesses, subject to difficulty.

Advice receives only length, submitted guesses and feedback, never a selected hidden answer. Cache/dataset keys distinguish lengths even with empty history. Full exact minimax search remains in cancellable workers; switching length terminates old calculations and late replies cannot replace current advice. Optional Suboptimal remains off by default. Easy still displays five suggestions, including before the first guess. A local benchmark of full opening Optimal search took approximately0.25/1.1/4.2/12.5seconds in Node for4/5/6/7; isolated Chromium took about0.2/3.7/9.6seconds for4/6/7. Device speeds vary. Loading text explains longer calculations and typing remains usable; no approximation or global winning guarantee is claimed. Bundled vocabulary increases the compressed main build to roughly248KB; Vite reports its normal large-chunk warning.

Automatic definitions accept only displayed4–7-letter words; existing debounce, bounded queue/cache, cancellation, source attribution and coverage limitations apply. No hidden answers are requested.
