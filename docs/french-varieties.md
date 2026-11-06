# French Canada and France word packs

These are conservative starter packs, not comprehensive national dictionaries.
The shared reviewed core is supplemented with twelve Canada choices and six
France choices. Accepted guesses are filtered by source regional-sense labels and inherited
form labels, with reviewed exceptions for incomplete source labels. Common
French remains shared. A word
being selected as an answer for one variety does not make it invalid elsewhere.
Canada includes common French plus labelled Canadian, North American and
Québec terms; Acadian and other Canadian usage is not comprehensively covered.

## Runtime integration contract

- `src/data/french/vocabulary-fr-CA.json` and `vocabulary-fr-FR.json` each expose
  `Record<number, {answers: string[], guesses: string[]}>` for lengths 3–11.
- Answer/guess strings retain accents and cedilla but expand Œ/OE and Æ/AE into
  two tiles. Therefore ordinary `answer.length` matches grid length.
- Use `frenchGuessKey` for comparison, duplicate feedback, allowed guesses,
  adaptive partitions, advice, keyboard state and repeated-guess detection.
  It folds accents/diaeresis/cedilla after explicitly expanding the ligatures.
  It does not map Œ to O, equate Æ with E, or apply rules to unrelated languages.
- `frenchDisplaySpelling` restores canonical ligatures for expanded answer
  identities. `canonical-spellings.json` is a **sparse override map**: identity
  spelling is the fallback. Do not guess missing accents for a plain guess.
- `normalized-keys.json` records every admitted expanded spelling's comparison
  key. Each variety has one answer per folded key. SUR/SÛR and MARCHÉ/MARCHE
  collisions are logged; deterministic frequency precedence selects one.
- `frenchDefinition(raw, variety)` loads definitions by expanded tile length.
  The optional variety is `fr-CA` or `fr-FR` (default France). Only explicit reviewed primary meanings for the 18 regional additions
  move first, without hiding other labelled senses. Ordinary words retain source
  sense order; regional tags alone never promote a sense. All source links retain original French headwords.
- Keep each new locale's datasets and persistence separate. Existing languages
  and their saved game rules are not changed by these data modules.

Examples: ÉTÉ/ETE and FAÇON/FACON score alike. CŒUR/COEUR uses five tiles,
ŒIL/OEIL four, NŒUD/NOEUD five, ŒUVRE/OEUVRE six. Reveals can spell CŒUR.
The French Wordle implementation at
https://sutomjeu.fr/wordle-francais/ explicitly documents accent folding and
OE input. Æ is handled consistently as AE for admitted lexical forms, but
this is an explicit game convention, not a claim that all orthographic
ligatures are accent marks. No Æ form is a curated answer in this starter pack.

## Regional editorial decisions

Examples selected for Canada: CÉGEP (Québec college), TUQUE, BLEUET,
DÉPANNEUR (convenience-store sense), MAGASINAGE, POUDRERIE, MITAINE,
CLAVARDAGE, BALADO, CHANDAIL, COURRIEL and POURRIEL. France adds BONNET,
MYRTILLE, PULL, SHOPPING, MAIL and MOUFLE. Nonexclusive vocabulary choices are
explicitly identified in `review.json`; this is a small vocabulary preference,
not blanket rejection of the other variety's words or meanings.

Regional labels in the licensed Wiktionary source are retained. Additional
usage checks, without copying these sites' dictionary content into the packs:

- OQLF, tuque: https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/8356212/tuque
  explains the Québec/Canada label and the differing prevalence of bonnet.
- Usito, magasinage: https://usito.usherbrooke.ca/d%C3%A9finitions/magasinage_2
  labels the shopping sense Québec/Canada.
- Usito, bleuet: https://usito.usherbrooke.ca/d%C3%A9finitions/bleuet
  distinguishes the Canadian fruit sense from other senses.
- OQLF, myrtille: https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/8358067/myrtille
  distinguishes myrtille and bleuet botanically. These are not presented as
  universal exact synonyms; all original sense labels remain visible.

Answer curation is model review, not native-human certification. Historical
wordfreq estimates combine regions and cannot certify national usage or a
particular sense. The ordinary shared-answer threshold is Zipf 4.3. NOEUD and
the explicit regional additions are reviewed exceptions. The wider guess lists
use Zipf 2.5 plus named lexical review candidates and include inflections and
labelled historic words. They are intentionally not exhaustive. A spelling is
admitted when at least one supplied sense is general French or matches the
selected region; known inflections inherit their base word's regional admission.
Missing regional labels/references are not invented. `regional-guess-policy.json`
records every exclusion and reviewed exception. For example, France excludes
CÉGEP/TUQUE; Canada excludes PRÉPA. BLEUET and DÉPANNEUR remain in both because
other common senses exist. CHOCOLATINE/CARIBOU in France and DENTIFRICE in
Canada have explicitly documented usage exceptions. This is source-supported
regional filtering, not a complete national dictionary certification.

The source has a few overbroad inherited regional tags (for example Louisiana
on ESPOIR, LÉGUME and POISON), and sometimes supplies only one region's meaning
(RUNNING as a shoe, TOBOGGAN as a slide). Reviewed admission overrides preserve
known valid words; dictionaries' original labels/senses remain unchanged, and
these limitations must not be mistaken for exhaustive semantic coverage. Usage
checks and source URLs are recorded in the review and regional-policy metadata.
BRÈME and BRÈMES are explicit lexical import exceptions so the ordinary
fish word survives accent-folded regional filtering, rather than relying on
Louisiana BRÊME (eggplant). No protected content from secondary usage checks
is copied into the definitions.

## Sources, license and reproduction

Source metadata, original headwords, per-record hashes, input checksums and
modification notes are in `src/data/french/source.json` and lexical evidence.
English Wiktionary French entries are supplied via Kaikki's postprocessed
per-language JSONL, not its raw multilingual extract. The full downloaded
snapshot is 592,920,809 bytes, SHA-256
`9053b1845fb3e045fa1fbe3f749122fa43e21b49bfa741cadd50255ae6ca0126`.
The wordfreq v3.0.2 snapshot is pinned to commit
`372f6dbb3bd2ad4b675a3b18b94d44d0dd5fea8b` and SHA-256
`8fbbf619ff2e6ff5b3d99d41e69c105daf5795771ce8ef36529f210d571abe6e`.

The derived data is CC BY-SA 4.0. Required attribution, complete CC BY-SA
license, wordfreq README credits and MIT software notice are bundled under
`public/third-party/fr/`. Keep these with redistributed data. The app's code
license is separate. No translations, audio, examples or non-Wiktionary
postprocessing fields are imported. No dictionary content is fetched at runtime.

To reimport the same downloaded snapshots:

```
python3 scripts/import-french.py /path/French.jsonl /path/small_fr.msgpack.gz --check
node scripts/generate-french.mjs --check
node --import tsx --test tests/french-data.test.ts
```

Omit `--check` only when intentionally regenerating. A changed upstream dump
fails its pinned hash; review and version a new dataset rather than silently
changing existing daily answers. The offline generator verifies input hashes,
answer policy, folded uniqueness, all output hashes and minimum pool coverage.
The importer requires only Python's standard library; the generator uses Node
built-ins. The original downloads are local audit inputs, not shipped assets.
