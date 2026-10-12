# Audit: course lessons, Number Sense, digit chart

Area: `lib/course-curriculum.ts`, `components/course/*`, `components/BrailleNumberSense.tsx`,
`lib/nemeth-map.ts` (deleted), `lib/math-problems.ts` (deleted), `components/BrailleNumbers.tsx`.

Sources: ICEB _Rules of Unified English Braille_, Third Edition 2024 (cited by section);
liblouis 3.29 `en-ueb-g1.ctb` / `en-ueb-g2.ctb`; Unicode braille block.

### Number Sense taught Nemeth, not UEB

- Where: `components/BrailleNumberSense.tsx` + `lib/nemeth-map.ts` (games page, and the practice game of the "Numbers" lesson).
- Before: problems drawn in Nemeth Code: "dropped" lower-cell digits (1 = dot 2, 2 = dots 2 3 …), Nemeth numeric indicator, plus = dots 3 4 6. The lesson right before it teaches UEB digits (numeric indicator + a–j), so a parent saw two different "1"s.
- After: UEB throughout. "3 + 5 =" is ⠼⠉ ⠐⠖ ⠼⠑ ⠐⠶ (numeric indicator + c, plus sign, numeric indicator + e, equals sign); every problem at every level and every answer choice is checked against liblouis (4,000+ strings).
- Source: ICEB 6.1 (digits), 3.17 (plus ⠐⠖, minus ⠐⠤, multiplication ⠐⠦, equals ⠐⠶; spaced as print, 3.17.1). liblouis g1: `3 + 5 = 8` → ⠼⠉⠀⠐⠖⠀⠼⠑⠀⠐⠶⠀⠼⠓.

### Number Sense's signs were wrong even as Nemeth

- Before: equals drawn as two cells of dots 4 6; multiplication as dots 1 6 alone.
- After: removed with the Nemeth code (see above).
- Source: Nemeth Code equals is ⠨⠅ (dots 4 6, 1 3) with spaces; the multiplication cross is ⠈⠡ (dot 4, dots 1 6). Recorded only to show the old game was wrong under any code.

### Minus sign typed as a hyphen

- Before: subtraction shown as "12 - 4" (ASCII hyphen). A hyphen is a different braille sign (⠤) from the minus sign (⠐⠤).
- After: the print minus sign U+2212 "−", transcribed to ⠐⠤; a test forbids "-" in any problem.
- Source: ICEB 3.17 (minus ⠐⠤) vs 7.2 (hyphen ⠤).

### Digits taught without the numeric indicator

- Where: "Numbers" lesson drill (`lib/course-curriculum.ts`), digit chart on the Intro page (`components/BrailleNumbers.tsx`).
- Before: "1", "2", "3", "0" were each taught and drilled as the bare cell of a, b, c, j ("Same cell as A"); the chart's cards showed "1" as the a cell alone.
- After: each digit is the numeric indicator followed by its letter cell (two cells), drilled cell by cell; the chart shows both cells.
- Source: ICEB 6.1 table: "⠼⠁ digit one" … "⠼⠚ digit zero"; liblouis g1 `1` → ⠼⠁. A bare ⠁ is the letter a.

### "Number sign" used for the numeric indicator

- Where: Numbers lesson ("Number sign"), learning tips, intro, admin AI reference.
- Before: "Number sign (dots 3, 4, 5, 6)".
- After: "numeric indicator" everywhere.
- Source: ICEB 6.1 calls ⠼ the numeric indicator; in UEB the "number sign" is the print symbol # (⠸⠹, ICEB 3.19), so the old name named a different sign.

### "this" said to be th + i + s

- Where: "Strong Groupsigns" lesson intro.
- Before: "“the” uses a contraction, and “this” uses the “th” groupsign followed by i and s."
- After: "“bath” is b, a, then the th groupsign." (built with `contractedWord` and checked against liblouis), plus a sentence, generated from the data, listing the six strong wordsigns (ch → child, sh → shall, th → this, wh → which, ou → out, st → still).
- Source: ICEB 10.2 strong wordsigns table "⠹ ⠞⠓⠊⠎ this"; liblouis g2 `this` → ⠹, `bath` → ⠃⠁⠹.

### "Groupsigns can sit at the start, middle, or end of a word"

- Where: "Strong Groupsigns" lesson tip.
- Before: stated for all groupsigns, including ing.
- After: "Most groupsigns are used anywhere in a word; the ing sign is never used at the very beginning of a word."
- Source: ICEB 10.4.3: "Use the strong groupsign for "ing" wherever the letters it represents occur except at the beginning of a word."

### Plain letter cells labelled as capitals

- Where: every alphabet lesson (labels "A", "B", …) and "With a capital sign in front, this reads as a capital A" drill.
- Before: the cell ⠁ labelled "A".
- After: plain letter cells are labelled in lowercase; capitals are taught as two cells (capital letter indicator + letter) in the capitals lessons, which also explain that alphabet charts print capital letter names over lowercase cells.
- Source: ICEB 4.1 table ("⠁ letter a", "⠠⠁ capital letter A"); 8.3.1.

### "E, I and J are just the same shapes shifted"

- Where: "Letters A–J" tip.
- Before: an imprecise claim (e and i are mirror images; j is not a shifted e or i).
- After: "Look for mirror images: d and f, e and i, h and j are left–right mirrors of each other." The pairs are computed from the cell data (`FACTS.firstDecadeMirrors`), so the sentence cannot drift from the cells.
- Source: cell data (d = 1 4 5, f = 1 2 4; e = 1 5, i = 2 4; h = 1 2 5, j = 2 4 5), checked in `__tests__/braille/ueb-data.test.ts` and the rulebook 4.1 table.

### Lower wordsigns undercounted

- Where: "Lower Wordsigns" lesson.
- Before: "A few whole words are written entirely in the lower cell: his, was, and were."
- After: "Six whole words are written in the lower part of the cell: be, enough, were, his, in and was. Here are three of them." (count and list generated from `CONTRACTIONS`).
- Source: ICEB 2.2 contractions summary; 10.5 table.

### Capitals lesson incomplete

- Where: "Capital Letters" lesson.
- Before: only the capital letter indicator; "doubling it capitalizes a whole word" with no word on where capitals end; no passage indicator or terminator anywhere on the site.
- After: two lessons: Capital Letters (8.3) and Words in Capitals (8.4 capitalized word indicator, including how an apostrophe or hyphen ends it; 8.5 passage indicator; 8.6 terminator, including mid-word as in "ABCs").
- Source: ICEB 8.3–8.6 and their examples (e.g. "DON'T ⠠⠠⠙⠕⠝⠄⠠⠞", "ABCs ⠠⠠⠁⠃⠉⠠⠄⠎"), reproduced exactly by the site's transcriber in `__tests__/braille/transcribe.test.ts`.

### Writing drill could not write multi-cell signs

- Where: `components/course/BraillerInput.tsx`.
- Before: one cell per item, so a capital letter, a digit or any two-cell sign could not be drilled correctly.
- After: items may be several cells; the writer goes cell by cell, names each cell ("cell 1: the capital letter indicator"), and a test writes every drill item of every lesson with the Perkins keys.
- Source: ICEB 8.3.1 (a capital letter is a two-cell symbol), 6.1.
