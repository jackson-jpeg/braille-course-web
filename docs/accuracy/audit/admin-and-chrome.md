# Accuracy audit: admin, AI content generation, and site chrome

Area owner files: `app/api/admin/generate/route.ts`, `lib/braille-validator.ts`,
`components/admin/BrailleInlinePreview.tsx`, `lib/document-builders.ts`, `components/admin/AdminCreateTab.tsx`,
`components/NavBar.tsx`, `app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`, `app/not-found.tsx`,
`components/AdminLogin.tsx`, `components/OnboardingModal.tsx`.
New: `lib/ai-braille-reference.ts` (reference block builder, moved out of the route so it can be exported and
tested), `lib/site-chrome-braille.ts` (chrome cells, geometry, `brailleInventory()`).

Sources: ICEB _Rules of Unified English Braille_, Third Edition 2024 (cited by section); liblouis
`en-ueb-g1.ctb` / `en-ueb-g2.ctb` (`python3 -c "import louis; ..."`, `unicode.dis`); Unicode braille block.

## Errors found and fixed

### AI reference: alphabetic wordsigns described as "same pattern as" the first letter

- Where: `app/api/admin/generate/route.ts` ~line 81 (old `buildBrailleContext`), shown to the AI model as ground truth.
- Before: `"it": same pattern as I` (dots 2 4, ⠊) and `"as": same pattern as A` (dot 1, ⠁). Every AI-generated handout
  for intermediate/advanced could teach these two wordsigns wrong.
- After: every contraction line gives its own dots from `CONTRACTIONS`, e.g. `"it": dots 1, 3, 4, 6 (the letter x)`,
  `"as": dots 1, 3, 5, 6 (the letter z)`, plus an explicit WARNING line generated from the data. The intermediate
  preamble also says not every wordsign uses its first letter.
- Source: ICEB 10.1 (alphabetic wordsigns: `⠭ it`, `⠵ as`); liblouis en-ueb-g2: `it` → ⠭, `as` → ⠵.

### AI reference: EBAE term "Letter indicator" for the grade 1 indicator

- Where: `app/api/admin/generate/route.ts` ~line 46.
- Before: `Letter indicator: dots 5 6` (EBAE "letter sign" naming).
- After: `grade 1 indicator: dots 5, 6 [ICEB 5.2] — In uncontracted braille, needed only before a lowercase letter a to j
that comes right after a number.` plus `grade 1 word indicator`.
- Source: ICEB 5.2 (grade 1 symbol indicator ⠰), 5.3, 5.11.1, 6.5.2.

### AI reference: "Number indicator (#)"

- Where: `app/api/admin/generate/route.ts` ~line 34.
- Before: `Number indicator (#): dots 3 4 5 6`; digit lines `1: dots 1 (same as A)` without the indicator.
- After: `numeric indicator: dots 3, 4, 5, 6 [ICEB 6.1]`; each digit line gives the indicator then the cell
  (`Digit 1: dots 3, 4, 5, 6, then dot 1 (numeric indicator, then the cell of the letter a)`), and a note that the
  indicator is written once per number.
- Source: ICEB 6.1; liblouis en-ueb-g1 `2024` → ⠼⠃⠚⠃⠙.

### AI reference: "Double capital (all-caps)"; capitals passage and terminator missing

- Where: `app/api/admin/generate/route.ts` ~line 45.
- Before: `Capital indicator: dot 6`, `Double capital (all-caps): dot 6, dot 6`; nothing on passages or the terminator.
- After: all four UEB capitals signs from `INDICATORS` with names, rules and usage (capital letter indicator 8.3.1,
  capitalized word indicator 8.4, capitalized passage indicator 8.5, capitals terminator 8.6).
- Source: ICEB 8.3–8.6.

### AI reference: incomplete and unidentified code

- Where: `app/api/admin/generate/route.ts` (old `buildBrailleContext`).
- Before: no statement of which braille code; no punctuation or symbols; no strong wordsigns (child, shall, this,
  which, out, still); no `gh`; lower groupsign labelled `en (enough)` (two different signs merged under one label);
  no uncontracted convention. The model was free to fall back on EBAE or a separate math code from memory.
- After: block states UEB per ICEB 2024 and tells the model not to use EBAE or a separate mathematics code; adds
  all `PUNCTUATION` (ICEB 7) and `SYMBOLS` (ICEB 3), all contraction kinds by level with usage, a shared-cell
  table (e.g. `dots 2, 3, 6: question mark / opening quotation mark`, `question mark / contraction "his"`), the
  ICEB 5.11.1 convention, liblouis-verified worked examples, and a note that typeform indicators are not in the
  reference and must not be given dots. Dots are written as `dots 1, 2, 5`, cells joined by `then`.
- Source: ICEB 1.1.1, 2.5, 3, 5.11.1, 7, 10.2, 10.4, 10.5.2, 10.6.8.

### AI preamble: worked example "The letter A is dots 1"

- Where: `app/api/admin/generate/route.ts` (old `buildPedagogicalPreamble`).
- Before: hand-typed `"The letter A is dots 1"`; hand-typed format examples in the worksheet prompt
  (`dots 1 2`, `dots 1 2 4`).
- After: generated with `renderProse` (`The letter A is dot 1`, `The letter B is dots 1, 2`, F = `dots 1, 2, 4`).
  The values were right; the wording and the hand-typing were not.
- Source: ICEB 4.1.

### Fidelity guard rewrote CORRECT text into WRONG text

- Where: `lib/braille-validator.ts` (old regex `([A-Za-z])\s*(?:is|=|:|…)\s*dots?`, no word boundary).
- Before (reproduced by running the old guard):
  - `The contraction this is dots 1 4 5 6.` → `... dots 2 3 4.` (the final "s" of "this" read as the letter S)
  - `The word his is dots 2 3 6.` → `... dots 2 3 4.` (same: "s")
  - `The capital indicator is dot 6.` → `... dots 1 2 3 5.` (the final "r" of "indicator" read as R)
  - `Capital B is dot 6, then dots 1 2.` → `Capital B is dots 1 2 then dots 1 2.` (capital indicator removed)
  - indicators, punctuation and symbols were never checked; the guard used the legacy grid maps.
- After: rebuilt on `lib/braille` (no hand-typed patterns). Labels must be unambiguous (quoted print, uppercase
  single letter, `letter x`, `digit/number N`, or a known sign name such as `numeric indicator`, `period`,
  `capital indicator`, `question mark`, `dollar sign`). Each label maps to every correct form (letter or capital
  - letter; contraction or its uncontracted spelling; digit with or without the numeric indicator; both quotation
    marks for "quotation mark"). A wrong claim is corrected only when exactly one correct form fits; shared or
    ambiguous cases are left alone. Claims never cross a line break. Supports reverse claims (`dots 1, 2 is the
letter B`). 205 tests.
- Source: ICEB 4.1, 6.1, 7, 8.3–8.6, 10; liblouis en-ueb-g1/g2.

### PDF answer key: a digit answer drawn as a letter

- Where: `lib/document-builders.ts` ~line 577 (worksheet answer key, braille sections).
- Before: answer `8` drew `brailleMap['8']` = dots 1, 2, 5 alone (reads as the letter h; no numeric indicator).
- After: `answerCells()` draws numeric indicator + h (dots 3, 4, 5, 6, then dots 1, 2, 5); also draws the cells of
  a dot-description answer (`dots 1, 2, 4` → f) and of short words via `transcribe`.
- Source: ICEB 6.1; liblouis en-ueb-g1 `8` → ⠼⠓.

### PDF practice drill: wrong number of answer boxes

- Where: `lib/document-builders.ts` ~line 510 (ghost cells for students).
- Before: one empty cell per print letter after stripping everything else: `Cat` → 3 boxes (UEB needs 4: ⠠⠉⠁⠞),
  `B2` → 1 box (needs 4: ⠠⠃⠼⠃), and an answer like `dots 1, 2, 4` → 4 boxes (for D-O-T-S).
- After: one box per uncontracted UEB cell of the answer (spaces as gaps), or per cell of a dot description.
- Source: ICEB 8.3, 6.1; liblouis en-ueb-g1.

### PDF `drawBrailleWord`: no capital or numeric indicators

- Where: `lib/document-builders.ts` ~line 154 (exported helper).
- Before: upper-cased the word and drew each character's legacy cell: `A1` → ⠁⠁ (two a cells).
- After: draws `transcribeTokens(word)` (⠠⠁⠼⠁), letters labelled, indicators unlabelled.
- Source: ICEB 6.1, 8.3.

### PDF cell geometry (checked, no error)

- Where: `lib/document-builders.ts` `drawBrailleCell`.
- Before: hand-written map `[d1, d4, d2, d5, d3, d6]` → col/row; verified correct (1-2-3 left, 4-5-6 right).
- After: `brailleCellGeometry()` derived from `dotPosition`; tested for all 64 cells with a recording fake PDF doc.
- Source: ICEB 1.1.1 ("the dots in the left column are numbered 1, 2 and 3 from top to bottom and the dots in the right column are numbered 4, 5 and 6"); `lib/braille/ueb.ts` `dotPosition`.

### Admin presets: EBAE and Nemeth content, wrong typeform dots

- Where: `components/admin/AdminCreateTab.tsx` lines ~100–118 (`BUILTIN_PRESETS`, seed the AI prompt).
- Before:
  - "numbers (using number indicator #)", "number indicator (dots 3-4-5-6)";
  - "Cover the Nemeth code basics for math: plus, minus, multiplication, division, equals sign";
  - "double capital for all-caps (dot 6, dot 6), letter indicator (dots 5-6), italic indicator (dots 4-6), bold
    indicator (dots 4-5-6), and termination indicator".
    Dots 4 6 alone is the EBAE italic sign; in UEB the italic symbol indicator is ⠨⠆ (dots 4 6, then dots 2 3) and
    the italic word indicator ⠨⠂. Dots 4 5 6 alone is not bold in UEB; the bold symbol indicator is ⠘⠆ (dots 4 5,
    then dots 2 3). "Termination indicator" is not a UEB name (capitals terminator ⠠⠄; typeform terminators ⠨⠄ etc.).
- After: four UEB-only presets, every dot generated by `renderProse`: numeric indicator, grade 1 indicator with the
  `3b` example (⠼⠉⠰⠃), UEB math signs plus ⠐⠖ / minus ⠐⠤ / multiplication ⠐⠦ / division ⠐⠌ / equals ⠐⠶ and
  dollar ⠈⠎, the four capitals signs, "it" = x and "as" = z, and the ICEB 5.11.1 convention. Typeform indicators are
  mentioned (ICEB section 9) without dots, because they are not in `lib/braille` (see open questions).
- Source: ICEB 3.10, 3.17, 5.2, 6.1, 6.5.2, 8.3–8.6, 9.2, 9.3, 9.4; liblouis en-ueb-g1 (`2 + 3` → ⠼⠃⠀⠐⠖⠀⠼⠉ etc.).

### Open Graph image: "TEACH" drawn without capitals indicators

- Where: `app/opengraph-image.tsx` lines ~10–16, 77–80 (social share image).
- Before: comment and code said the cells spell `TEACH`, drawing ⠞⠑⠁⠉⠓. In UEB, `TEACH` is ⠠⠠⠞⠑⠁⠉⠓
  (capitalized word indicator, ICEB 8.4), so the image did not show what the code claimed.
- After: the image declares the word as lowercase `teach` (uncontracted) and draws `transcribe('teach')` =
  ⠞⠑⠁⠉⠓ (same visible cells, now correctly described). Chose lowercase over adding ⠠⠠ to keep the design (five
  evenly spaced cells) and because nothing in print on the image says "TEACH" in capitals.
- Source: ICEB 8.4; liblouis en-ueb-g1 `teach` → ⠞⠑⠁⠉⠓, `TEACH` → ⠠⠠⠞⠑⠁⠉⠓.

### Decorative ⠃ glyph read out by screen readers

- Where: `components/AdminLogin.tsx` line 43, `components/OnboardingModal.tsx` lines 10 and 100.
- Before: hand-typed U+2803 in a plain `div`, announced as "braille pattern dots-1-2" (or as an unlabelled symbol).
- After: generated from `lib/braille` (letter b, for "braille") and `aria-hidden="true"` (the onboarding icon
  wrapper, which also holds emoji, is hidden as a whole).
- Source: Unicode U+2803 BRAILLE PATTERN DOTS-12; liblouis en-ueb-g1 `b` → ⠃.

### Checked, correct, migrated (no error)

- `components/NavBar.tsx` logo: letter t (dots 2, 3, 4, 5) — now `<BrailleCell>` from `lib/braille`, aria-hidden.
- `app/icon.tsx`, `app/apple-icon.tsx`: letter t — now `cellColumns(iconCell())` (positions from `dotPosition`).
- `app/not-found.tsx`: `404` = ⠼⠙⠚⠙ (numeric indicator, d j d) — now `transcribe('404')`. liblouis agrees.
- `components/admin/BrailleInlinePreview.tsx`: letter cells were correct; now drawn with `<BrailleCell>` (each with
  an accessible name and dots). The old contraction list had the merged label `en (enough)`, so neither "en" nor
  "enough" ever previewed; now every contraction is available.

## Open questions

- **Typeform indicators are not in `lib/braille`.** The AI reference and presets therefore give no dots for italic,
  bold, underline or script. Recommend the lead add them to `INDICATORS` (ICEB 9.2 symbol ⠨⠆ ⠘⠆ ⠸⠆ ⠈⠆, 9.3 word
  ⠨⠂ ⠘⠂ ⠸⠂ ⠈⠂, 9.4 passage/terminator) so the reference can include them.
- **Chrome letters standing alone.** The nav logo / favicon (t) and the login / onboarding icon (b) are single
  letters. Under the site's uncontracted convention (ICEB 5.11.1) they need no grade 1 indicator; in contracted
  braille liblouis writes them ⠰⠞ / ⠰⠃ because t and b alone are the wordsigns "that" and "but" (ICEB 5.7). They are
  decorative and aria-hidden; inventory lists them as g1.
- **OG word, contracted or not.** Contracted UEB writes `teach` as ⠞⠂⠡ (ea, ch groupsigns). The image uses the
  uncontracted form, matching the beginner track.
- **Answer key letters.** A single-letter worksheet answer (`B`) is drawn as the letter's cell without the capital
  indicator: it names a letter, the convention used across the site's letter lessons. A capitalized word answer is
  drawn with its indicators.
- **Guard coverage.** The guard only checks claims in recognised phrasings with unambiguous labels; free-form claims
  ("the cell with the top two dots") and arbitrary quoted words are not checked. Admins still review every draft.
