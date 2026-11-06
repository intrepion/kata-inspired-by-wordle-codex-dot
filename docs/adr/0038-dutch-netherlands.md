# Dutch (Netherlands)

Status: implemented locally; publication requires separate authorization.

Add `nl-NL`, labelled Nederlands (Nederland), as a puzzle language with English UI and locally bundled English meanings. Reuse all five rule variants, both schedules and four difficulties. Support only lengths backed by sufficient licensed vocabulary and verified variant pools.

Dutch IJ uses two tiles. Normalize Unicode Ĳ/ĳ to IJ before NFC and uppercase; never conflate IJ with Y. Preserve accents and trema. Exclude punctuation rather than silently deleting it. Every supported character is available on the on-screen keyboard. A normalized IJ keyboard event adds two tiles atomically only when both fit.

Keep common standalone answers separate from broader attested guesses. Dutch general-source labels inform Netherlands exclusions but cannot establish complete Netherlands usage. Spellings with frequency can reflect other senses, proper names or routine inflections, so answer selection needs conservative sense filtering and independent model review. Do not describe this as native-human certification.

Use original source headword links and preserved usage labels for bounded English meanings. Definitions never determine guess validity and do not fall back to English homographs. All lookup data is local; source links are attribution opened only at user request. Pin input checksums and notices; make generation reproducible offline.

Add distinct Dutch dataset identifiers and `.nl-NL` save namespaces. Existing datasets, shuffled schedules, storage epoch, active/original English notebooks, Spanish and Filipino notebooks, and preferences remain unchanged. No global reset or rewriting prior languages.

Verification covers source/output hashes, all supported lengths, normalization/diacritics/duplicate scoring, all difficulties and variants, deterministic schedules, advice isolation, statistics, rejected wrong-language restores, local definitions, existing-language preservation and desktop/mobile browser flows. See QA for the checks actually run and any limits.
