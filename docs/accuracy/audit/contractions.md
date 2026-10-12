# Accuracy audit: contractions & reading

Area: Dot Explorer, Contraction Sprint, Sentence Decoder, the Intro to Braille page (`app/intro/page.tsx`)
and the learning tips shown after games (`lib/learning-tips.ts`).

Line numbers refer to the files before this migration. "liblouis g2" means liblouis 3.29.0
`en-ueb-g2.ctb` (contracted UEB) via `unicode.dis`; "ICEB" means _Rules of Unified English Braille_,
Third Edition 2024.

All braille in these files now comes from `lib/braille`; every word and sentence the games can show
is in their `brailleInventory()` and matches liblouis cell for cell (`npm run braille:oracle`,
`__tests__/braille/liblouis-oracle.test.ts`). In addition, `__tests__/games/fixtures/liblouis-backtranslations.json`
(regenerate with `python3 __tests__/games/fixtures/liblouis-backtranslate.py`) records liblouis's
back-translation of every Sprint word and Decoder sentence; the tests require that liblouis reads each
one back as the same words (one reading only).

## Contraction Sprint

### Word list wrote words with contractions in the wrong places (or missed required ones)

- Where: lib/contraction-words.ts:36–78 (application questions "Which contraction is in this word?").
- Before (pieces shown → what UEB writes, liblouis g2):
  - CHILD `ch i l d` → ⠡ (child is a strong wordsign standing alone, one cell); WHICH `wh i ch` → ⠱;
    THIS `th i s` → ⠹ (ICEB 10.2, 10.2.1).
  - MOTHER `m o th er` → ⠐⠍; FATHER → ⠐⠋; THERE `th e r e` → ⠐⠮; WHERE `wh e r e` → ⠐⠱;
    EVERYTHING `e v er y th ing` → ⠐⠑⠽⠹⠬; SOMETHING `s o m e th ing` → ⠐⠎⠹⠬ (initial-letter
    contractions, ICEB 10.7 — not taught on this site).
  - TOGETHER `t o g e th er` → ⠞⠛⠗ (shortform, ICEB 10.9); SUCH `s u ch` is the shortform ⠎⠡.
  - OTHER/ANOTHER/BROTHER `… th er` → ⠕⠮⠗, ⠁⠝⠕⠮⠗, ⠃⠗⠕⠮⠗ ("the" + r); THEN `th e n` → ⠮⠝;
    THEM `th e m` → ⠮⠍ (ICEB 10.10.3 lists "other ⠕⠮⠗" and "then ⠮⠝": prefer the strong contraction).
  - WHEN `wh e n` → ⠱⠢ (wh + en, ICEB 10.6.8).
  - WEATHER `w e a th er` → ⠺⠂⠮⠗; TEACHING `t e a ch ing` → ⠞⠂⠡⠬; REACHING → ⠗⠂⠡⠬;
    EACH `e a ch` → ⠑⠁⠡ (ea is used only between letters, so "each" is right but the others need ea,
    ICEB 10.6.5).
  - THOUSAND `th ou s a n d` → ⠹⠳⠎⠯ ("and", ICEB 10.3); THEIRS `th e i r s` → ⠸⠮⠎ (initial-letter
    "their", 10.7).
- After: the list is rebuilt with `contractedWord()` from `lib/braille/ueb.ts` CONTRACTIONS only (144
  multi-piece words + all 40 standalone wordsigns). Words needing initial-letter contractions,
  final-letter groupsigns or shortforms are dropped (mother, father, there, where, everything,
  something, together, theirs, such, much, children, …). Corrected words kept: then = the+n,
  them = the+m, other = o+the+r, weather = w+ea+the+r, teaching = t+ea+ch+ing, thousand =
  th+ou+s+and. Every word is in the g2 inventory and matches liblouis; a test also rejects any word
  on the ICEB 2.2 shortform list.
- Source: ICEB 10.2–10.10 (esp. 10.2.1, 10.3, 10.6.5, 10.6.8, 10.7, 10.9, 10.10.3); liblouis g2 output as above.

### Application questions could have two right answers

- Where: lib/contraction-words.ts + components/BrailleContractionSprint.tsx:104–131.
- Before: for OTHER the answer was "th" or "er" (wrong: the word uses "the") and distractors were
  drawn by dot similarity from all contractions, so a distractor could also occur in the word.
- After: the answer is a contraction actually used in the word's UEB form; distractors are only
  groupsign-type contractions whose letters do not occur in the word at all (so "th" and "er" are
  never offered for "other"). Tested for every word × contraction at both levels against liblouis.
- Source: ICEB 10.10.3; liblouis g2 "other" → ⠕⠮⠗.

### A cell with two meanings was shown as only one of them

- Where: components/BrailleContractionSprint.tsx:75–88 (recognition) using
  lib/contracted-braille-map.ts.
- Before: the legacy map had no strong wordsigns (child, shall, this, which, out, still), no ea, bb, cc,
  ff, gg, no "enough" or "be"/"in"/"were"/"his"/"was" as words (only groupsign labels such as
  "en (enough)"). A recognition question on ⠡ (dots 1, 6) accepted only "ch", although the same cell
  standing alone is "child".
- After: a recognition choice is a cell, labelled with every contraction that cell stands for
  ("child / ch", "be / bb", "en / enough", "were / gg", "out / ou"…), from `contractionsWithCells`.
  Choices are always different cells, so exactly one is right and it is complete. Tested against the
  ICEB 10.1–10.6 sign tables (an independent extraction of the rulebook) for every question.
- Source: ICEB 2.4.2 ("Many braille signs have more than one meaning", e.g. ⠳ "ou" and "out"), 10.2, 10.4, 10.5, 10.6.

### Recall choices announced the answer to screen readers

- Where: components/BrailleContractionSprint.tsx:435 (`aria-label={`Choice ${i + 1}: ${choice.label}`}`).
- Before: in "Find the braille for this contraction", each braille choice was labelled with the
  contraction it stands for ("Choice 2: and"), so a screen-reader user heard the answer.
- After: recall choices are announced by dot numbers only ("Choice 2: dots 1, 2, 3, 4, 6", generated
  by `describeCell`); the prompt cell is labelled "Contraction cell, dots …". Render-tested.
- Source: accessibility requirement of the migration brief.

### Cells were drawn by mapping over a legacy 0/1 array

- Where: components/BrailleContractionSprint.tsx:164–172.
- After: `<BrailleCell>` with the existing csprint-\* classes; `checkAllCells` passes for every
  question shown in a render test.

## Dot Explorer

### Contracted mode showed one meaning per cell, and missed many contractions

- Where: components/BrailleDotExplorer.tsx:25,75 (`buildContractedReverseLookup()` → `Map.get`).
- Before: one label per dot pattern; ⠃ showed only "but" (not the letter b), ⠡ only "ch" (no "child"),
  ⠆ only "be" (no "bb", and not marked as both a lower wordsign and groupsign), ⠂ ⠖ ⠶ ⠒ showed no
  contraction at all (ea, ff, gg, cc missing), ⠌ ⠹ ⠱ ⠩ ⠳ had no wordsign meaning.
- After: `lib/games/explorer.ts` `cellMeanings()` lists every meaning from the canonical data: letter
  (lowercase), single-cell punctuation and indicators (`signsWithCells`), the digit it becomes after
  the numeric indicator, the multi-cell signs it begins (e.g. dot 5 begins the opening parenthesis), and
  in contracted mode every contraction with its kind, rule of use and ICEB section
  (`contractionsWithCells`). All 64 cells in both modes are tested against the data, and all
  contraction meanings against the ICEB 10.1–10.6 tables; the rulebook's 2.4.2 examples (⠋ = f / 6 /
  from, ⠳ = ou / out, ⠦ = ? / “ / his) are checked explicitly.
- Source: ICEB 2.4.2, 4.1, 6.1, 7, 8.3, 10.1–10.6.

### Alphabetic mode showed raw "^" and "#" keys and uppercase letters

- Where: components/BrailleDotExplorer.tsx:10–16 (reverse lookup over `brailleMap`, which also held
  digits and "^"/"#").
- Before: dot 6 showed "^", dots 3, 4, 5, 6 showed "#", and dots 1, 2 showed "B", although a plain
  letter cell is a lowercase letter. Digit keys overwrote letters (⠁ could show "1" or "A" depending on
  map order).
- After: dot 6 shows "capital letter indicator" (and that it begins the capitalized word indicator,
  capitals terminator, dash and single quotes); dots 3, 4, 5, 6 show "numeric indicator"; letters are
  lowercase ("b"), with the digit listed as a separate meaning "Digit 2, after the numeric indicator".
  The mode is now labelled "Uncontracted" rather than "Alphabetic", since it shows punctuation and
  indicators as well.
- Source: ICEB 4.1, 6.1, 8.3.1; coordinator's lowercase-letter convention.

### Keyboard and dot buttons

- Where: components/BrailleDotExplorer.tsx:44–71, 136–146.
- After: `BrailleDotPad` (keeps explorer-cell / explorer-dot / active classes); keys 1–6 toggle dots 1–6,
  C clears (ignored while typing in a text field). Render test drives all 64 cells by keyboard in both
  modes and checks the drawn dots and the listed meanings.

## Sentence Decoder

### "Contracted" sentences were neither grade 2 nor grade 1

- Where: lib/sentence-generator.ts:286–328, lib/sentence-bank.ts (random frames).
- Before: only whole words tagged as contractions were contracted; everything else was spelled letter
  by letter, including words that UEB contracted braille always contracts, e.g. (liblouis g2):
  "they" shown ⠞⠓⠑⠽ → ⠮⠽; "star" ⠎⠞⠁⠗ → ⠌⠜; "song" ⠎⠕⠝⠛ → ⠎⠰⠛ (final-letter groupsign);
  "fish" ⠋⠊⠎⠓ → ⠋⠊⠩; "she" → ⠩⠑; "the" in "together", etc. Uncontracted words and single-cell
  wordsigns were mixed in one sentence, which no UEB grade does.
- After: the random generator is replaced by curated banks (lib/sentence-bank.ts):
  beginner (15) and intermediate (15) uncontracted sentences rendered with `transcribe()`, and 24
  advanced contracted sentences whose every word is built with `contractedWord()` pieces using only
  CONTRACTIONS (no initial-letter, final-letter or shortform words; e.g. "bright" was rejected because
  liblouis writes ⠃⠐⠗ with the initial-letter "right"). Every sentence matches liblouis g1/g2 and
  back-translates to itself.
- Source: ICEB 2.5 (grades), 10.1–10.10; liblouis g1/g2 output (oracle fixture).

### No capital indicator for the capital first letter

- Where: lib/sentence-generator.ts:283 (capitalised the print only) and 316–324 (letters rendered from
  `brailleMap[ch.toUpperCase()]`).
- Before: "The cat…" was shown starting ⠞ (a lowercase t); "I" was ⠊.
- After: ⠠ (capital indicator) before the capital letter in every sentence, ⠠⠠ for an all-capitals
  word ("BEN WON!", "NYC"); tested for every sentence.
- Source: ICEB 8.3.1, 8.4; liblouis g1/g2.

### Answer checking and its explanation

- Where: components/BrailleSentenceDecoder.tsx:87–89 (only case and spaces were ignored; no hint).
- After: `isCorrect` ignores capitals, punctuation and extra spaces; apostrophes are dropped (it’s =
  its), a comma between digits is dropped (1,000 = 1000), a decimal point is kept (3.5 ≠ 35); the UI
  hint says "Capitals and punctuation don’t count". Tested: every answer accepted in several
  spellings; other sentences, a dropped word, a changed letter or digit, and (contracted) reading a
  wordsign as its bare letter are rejected.

### Screen-reader labels gave the answer away

- Where: components/BrailleSentenceDecoder.tsx:23 (`aria-label` "Letter T" / `Contraction for "you"` on
  every cell).
- After: the braille sentence is one image labelled with its cell count; a "Describe the cells" button
  reads the dot numbers word by word (`describeCells`), never the letters.

## Intro to Braille page

### Hand-typed cells and prose dot numbers

- Where: app/intro/page.tsx:21–27 (CONTRACTIONS with 0/1 arrays), 29–40 (own cell renderer), 75, 177–191
  (dot numbers typed in prose and aria-label), 266–268, 276 (grade cards from `brailleMap` and a literal
  array).
- Before/After: the patterns themselves were correct (and ⠯, for ⠿, of ⠷, the ⠮, with ⠾; "the" ⠞⠓⠑ vs
  ⠮), but they are now taken from `getContraction`, `transcribeTokens('the')` and
  `contractedWord('the', ['the'])`, drawn with `<BrailleCell>`, and the cell-layout prose and the
  diagram's label are generated with `describeCell`. Grade 1 letters are labelled lowercase ("t h e").
- Source: ICEB 4.1, 10.3; liblouis g2 "the" → ⠮.

### "number indicator" and "180+ contractions"

- Where: app/intro/page.tsx:83, 91, 283, 307.
- Before: "Grade 2 … uses over 180 abbreviations and contractions"; "180+ contractions"; "number
  indicator (dots 3, 4, 5, 6)".
- After: "the UEB rulebook lists 180 contractions and shortforms"; "numeric indicator ({dots:numeric})".
  Counting ICEB 2.2: 23 alphabetic wordsigns, 6 strong wordsigns, 5 strong contractions, 12 strong
  groupsigns, 6 lower wordsigns, 10 lower groupsigns, 33 initial-letter contractions, 12 final-letter
  groupsigns, 75 shortforms = 182 entries; "be" and "in" each appear twice (wordsign and groupsign), so
  180 distinct.
- Source: ICEB 2.2 (rules2024.txt lines 1263–1306), 6.1 ("numeric indicator").

### History and statistics

- Where: app/intro/page.tsx:67, 99, 134–137, 152, 218–235, 243.
- Before → After:
  - "Created by Louis Braille in 1824" / "lost his sight at age 3" → developed in the 1820s; he was 15
    in 1824; the accident at 3 led to blindness by about age 5 (he was not blind immediately).
  - "1824: … into the elegant 6-dot code" → "1820s: … the 6-dot code that is still the basis of braille"
    (Braille's first publication of the system was 1829 and it was revised in 1837).
  - "39M+ blind people … over 250 million experiencing vision impairment" (WHO 2010 figures) →
    "43M blind people worldwide in 2020, about 295 million more with moderate or severe vision
    impairment" (Bourne et al., GBD 2019 Blindness and Vision Impairment Collaborators / VLEG, _Lancet
    Global Health_ 2021).
  - "90% of braille-literate adults are employed, compared to roughly 30% of non-readers" → removed. The
    often-repeated statistic is a misstatement (the usual claim is that most _employed_ blind adults read
    braille); no primary source supports the figure as written.
  - "133 languages have braille codes" → removed (could not verify the figure against a primary
    source); replaced by "by 2016, every ICEB member country had adopted UEB" (ICEB rulebook foreword)
    and "World Braille Day, January 4, marked by the United Nations since 2019" (UN General Assembly
    resolution 73/161, 2018).
  - "Braille is knowledge, and knowledge is power. — Louis Braille" → attribution removed (not found in
    Louis Braille's writings; widely circulated without a source).
  - "Grade 2 is the standard for published braille materials" → "used for most braille books for adult
    readers"; "contractions and abbreviations" → "contractions and shortforms" (UEB terms, ICEB 2.2).
- Source: ICEB rulebook foreword (rules2024.txt ~lines 515–545); others as cited.

## Learning tips

### Braille typed by hand in tips

- Where: lib/learning-tips.ts:393, 401, 413 ("⠼", "⠮", "⠯ ⠿ ⠮" typed as characters).
- After: rendered with `renderProse` tokens ({braille:numeric}, {dots:numeric},
  {braille:contraction:the}, …), so they cannot drift from the data. Test checks them against
  liblouis g2.

### False or dubious facts

- "Braille is used on currency in many countries, including the US, UK, and EU." (line 420) — false:
  US paper money has no braille, and neither do Bank of England or euro banknotes (they have other
  tactile features). Replaced with: "Across the European Union, medicine packaging must show the name
  of the medicine in braille." Source: Directive 2001/83/EC Art. 56a, as inserted by Directive
  2004/27/EC.
- "UEB was formally published in 2010 and adopted by major English-speaking countries starting in
  2012." (line 381) → "UEB was first adopted by Australia in 2005. The first edition of its rulebook
  appeared in 2010, and by 2016 every member country of ICEB had adopted it." Source: ICEB rulebook,
  Preface to the First Edition (Australia adopted UEB 14 May 2005) and Foreword to the Third Edition
  (first edition 2010; all member countries by 2016).
- "There are over 180 contractions in Grade 2 braille" (line 409) → "The UEB rulebook’s contractions
  summary (rule 2.2) lists 180 different contractions and shortforms." Source: ICEB 2.2 (count above).
- "The number indicator (⠼)…" / "preceded by a number sign" (lines 393, 397) → "numeric indicator"
  (ICEB 6.1).
- "A–J only use dots 1, 2, 4, and 5 — the top four positions" (line 388) → "…the top two rows of the
  cell" (dots 1, 2, 4, 5 are the top two rows; generated from FACTS.firstDecadeDots).
- "The braille cell has remained unchanged since 1824" (line 379) → "The six-dot cell Louis Braille
  developed in the 1820s is still the basis of braille today" (the 1829 system included dash signs
  that were dropped in 1837).
- "Louis Braille invented the braille system in 1824, when he was just 15" → "developed his reading
  system as a teenager in the 1820s; he was 15 in 1824."
- "Experienced braille readers can read at speeds of 200+ words per minute" (line 418) → removed (no
  source given; typical adult reading rates reported in the literature are well below that). Replaced
  with a general statement about two-handed reading.
- "B = "but", C = "can"" → lowercase letters, matching the site convention that a plain letter cell is
  lowercase.

## Open questions

- **"ing" standing alone and contracted-mode headline in the Explorer.** The Explorer lists every
  contraction a cell carries without judging position (e.g. ⠬ "ing" may not begin a word, ICEB
  10.4.3); the usage text from ueb.ts states the restriction. No source disagreement, but the display
  is a summary, not a rule.
- **Back-translation of quotes/apostrophes.** liblouis back-translates ⠄ as a straight `'` and ⠦/⠴ as
  `"`; the site prints curly ’ “ ”. The Decoder ignores punctuation in answers, so this does not
  affect checking.
- **Statistics on the Intro page** (43 million blind, 295 million moderate/severe VI) come from the
  _Lancet Global Health_ 2021 VLEG/GBD paper; WHO's own fact sheet uses a different framing (at least
  2.2 billion with near or distance vision impairment). Both are current; the page uses the VLEG
  figures because they separate blindness.
- **BrailleNumbers (not in this area)** still says "Number Indicator" and pairs digits with uppercase
  letters "1(A)"; it renders on the Intro page. Reported to the lead rather than edited here.
