# Italian (Italy) and Swedish (Sweden)

Separate `it-IT` and `sv-SE` dictionaries support 3–11 letters in Conquest, Absurd,
One possibility, Smashare and Letroso, with independent UTC daily schedules,
progress and statistics. The interface stays English. Meanings load from bundled,
same-origin chunks; gameplay words are never automatically sent to third parties.
Publication requires separate approval.

## Orthography decisions

Italian vowel accents are optional **for this game's tile comparison**: À→A,
È/É→E, Ì→I, Ò/Ó→O, Ù→U. This follows the accent-insensitive convention described
by [Wordle.gg's Italian game](https://wordle.gg/it/) and
[128ordle](https://www.128ordle.com/wordle-in-other-languages), rather than claiming
that accents are optional in actual Italian. [Accademia della Crusca's guidance](https://accademiadellacrusca.it/it/consulenza/vademecum-sullaccento-quando-indicarlo-e-dove-pronunciarlo/34)
explains their orthographic role. Correct original spellings remain in answers,
reveals and meanings. CITTÀ/CITTA and CAFFÈ/CAFFE share gameplay identities;
accent-colliding words cannot compete as separate answers. Plain guesses can show
several original spellings, while exact accented reveals use their own senses.
Only those vowel accents fold; Ö, Ñ and other foreign characters do not become
Italian aliases. Digraphs and double letters occupy one tile per written letter.
Smashare checks its shared seam using the same folded letters and preserves both
original component words.

Swedish uses NFC and the **29-letter alphabet A–Z, Å, Ä, Ö**, with dedicated keys.
Å, Ä and Ö each occupy one tile and remain distinct from each other and A/O.
[Isof on Swedish letters](https://frageladan.isof.se/faqs/27384) and
[their ordering](https://frageladan.isof.se/faqs/27612) support this choice.
This starter deliberately excludes accented loanwords outside that alphabet,
rather than silently changing their spelling. For example, ENTRÉ is valid Swedish
but outside this starter's playable alphabet. [Isof explains accented É](https://frageladan.isof.se/faqs/22749),
including its use in uppercase. Other games can choose a different explicit
loanword-folding policy; this implementation does not claim universal Wordle rules.
Punctuation, spaces and unsupported letters are never silently removed.

## Sources and selection

[Kaikki Italian](https://kaikki.org/dictionary/Italian/index.html) and
[Kaikki Swedish](https://kaikki.org/dictionary/Swedish/index.html) supply English
Wiktionary headwords and English glosses. The downloaded language-specific
postprocessed JSONL snapshots are **deprecated upstream**, not the raw multilingual
Wiktextract dump. Exact URLs, download byte sizes and SHA-256 hashes are in each
`src/data/italian/source.json` and `src/data/swedish/source.json`. They were downloaded
November 7, 2026. Original headwords and source-line hashes are retained; exact
article revisions are not provided by the snapshot.

Only lexical POS, English glosses, labels and form/alternative relationships are
retained. Proper-name POS, unsupported letters, punctuation and explicitly other-
country-labelled senses are omitted (Swiss/Ticino for Italian; Finland/Estonia for
Swedish). Unlabelled ordinary language is shared across regions; these sources are
not country-pure corpora. Broader guesses include attested inflections and uncommon
words at historical spelling Zipf ≥2.5. Answers require Zipf ≥4.3 (≥4.0 for eleven-letter Swedish, to provide a viable
long-word pool across modes), a qualifying
standalone sense, and a recorded model editorial decision. Every candidate is
classified in `review.json`; exact reviewed primary senses appear first in runtime
meanings. Frequency and source tags do not guarantee a particular sense is common.
The review is **not native-human certification**.

wordfreq **3.0.2**, pinned revision
`372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b`, supplies historical mixed-corpus spelling
frequency, not current, region-exclusive or sense-level frequency. Exact canonical
spelling is ranked before Italian accent folding; case variants use maximum, not
sum, of source estimates. No artificial frequency is assigned to accent aliases.
Runtime guesses and answers are separate, all selected answers are accepted, all
answers have selected English meanings, and every supported length is nonempty.
Most broader guesses have source glosses; unresolved bare synonym references and
explicitly identified defective glosses are omitted rather than presented as
translations. Missing broader-guess meanings are enumerated in coverage metadata.
Coverage counts, source-input pins, review hashes and generated-output hashes live
in each `coverage.json`. Collision reports identify normalized spellings explicitly.

## Licenses

The adapted Wiktionary/wordfreq datasets and selections retain **CC BY-SA 4.0**,
separate from application code licensing. Full license text, Wiktionary contributor
attribution, Kaikki/Wiktextract credit, modification notices, per-entry source links,
and the complete pinned wordfreq README/source credits are bundled under
`public/third-party/it-IT/` and `public/third-party/sv-SE/`. The pinned wordfreq 3.0.2
software license is MIT; that does not relicense its data. Quotations, examples and
media are not imported. [Kaikki rights](https://kaikki.org/dictionary/) and
[Wiktionary copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights) are the
upstream license references. No legal warranty or exclusivity claim is made.

## Offline reproduction

Normal builds never download dictionaries. Reproduce from the exact downloaded
source artifacts:

```sh
python3 scripts/import-italian-swedish.py italian /path/italian.jsonl /path/small_it.msgpack.gz --check
python3 scripts/import-italian-swedish.py swedish /path/swedish.jsonl /path/small_sv.msgpack.gz --check
node scripts/generate-italian-swedish.mjs --check
npm run check
node scripts/check-italian-swedish-browser.mjs
npm run build:pages
node --import tsx scripts/check-italian-swedish-pages.mjs
# Verify a published release: BASE_URL=https://intrepion.github.io/kata-inspired-by-wordle-codex-dot/ node --import tsx scripts/check-italian-swedish-pages.mjs
```

`--candidates` produces the review input. Changing it invalidates the stored review
hash and requires review before generation; duplicate Italian gameplay identities
are rejected. Browser checks use disposable profiles on 127.0.0.1, not production.
