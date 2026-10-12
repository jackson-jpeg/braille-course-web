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

## Found by the independent review pass (after migration), fixed

### Number written as two digits when a capital A–J follows it inside a capitalized passage

- Where: `lib/braille/transcribe.ts` (no page showed this yet; found by adversarial testing).
- Before: `SEE 3D FILMS NOW` → ⠼⠉⠙ (reads "34"), `WE ARE 2B` → ⠼⠃⠃ ("22").
- After: ⠼⠉⠰⠙, ⠼⠃⠰⠃: the grade 1 indicator is written whenever a letter a–j follows a number without a capital indicator in between.
- Source: ICEB 6.5.2 (a–j after a digit needs the grade 1 indicator; a capital indicator ends the number), 6.3.1; liblouis g1 agrees for all three strings (now permanent verification samples).

### Runs of periods inside a number

- Before: `4..7` → ⠼⠙⠲⠼⠲⠛ (an extra numeric indicator).
- After: ⠼⠙⠲⠲⠛.
- Source: ICEB 6.3.1 example "4..7 ⠼⠙⠲⠲⠛"; 6.2.1 (period is a numeric-mode symbol); liblouis agrees.

### Apostrophe vs closing single quote guessed wrongly

- Before: `‘I like the dogs’ toys,’ she said.` closed the quotation after "dogs" and turned the real closing quote into an apostrophe.
- After: such input is refused (TranscriptionError) instead of guessed; no site content uses it.
- Source: ICEB 7.6.13 (print may not distinguish the two; software cannot decide with complete accuracy).

### Final score recorded one too high in four games

- Where: Number Sense, Sentence Decoder, Reflex Dots, Sequence (the Number Sense bug predates this work).
- Before: a last correct answer was counted twice, so 4/10 plus a correct last answer was recorded as 6, enough for a "win".
- After: the recorded score is the real score; a test plays ten right and ten wrong answers and checks 10 and 0.
- Source: game logic (not a braille rule).

### Brailler Challenge refused a correct answer

- Before: target "I LOVE YOU!" accepted only ⠽⠕⠥⠖⠠⠄, but the rulebook allows the terminator before or after the exclamation mark.
- After: target is "I LOVE YOU"; a test forbids any target with a capitals terminator next to punctuation.
- Source: ICEB 8.6.2 ("The capitals terminator may precede or follow punctuation").

### Grade 1 indicator described as used "only" in two places

- Where: `lib/braille/ueb.ts` usage text (Dot Explorer, AI reference), "Numbers in Real Text" lesson.
- Before: "needed only before a lowercase letter a to j…", "one of only two places…".
- After: "used mainly…", "where you'll meet it most often… You may also see it before a question mark at the start of a word or after a hyphen or dash."
- Source: ICEB 5.11.1 gives these as examples ("e.g."), not a complete list; 7.5.3–7.5.4.

### Overstated contraction coverage

- Where: Grade 2 lessons.
- Before: "You now know contractions from every major family"; "If a ch, sh, th, wh, ou or st cell stands alone…" in a lesson that shows only four of those cells.
- After: names the families not yet taught (initial-letter, final-letter, shortforms) and lists the six wordsign cells explicitly.
- Source: ICEB 2.2 contractions summary.

### Worksheet PDFs drew uncontracted cells for word answers

- Where: `lib/document-builders.ts` (`answerCells`, admin-generated worksheets).
- Before: an answer such as "and" was drawn as ⠁⠝⠙ even on a contractions worksheet, where it is ⠯.
- After: only answers whose braille is the same in both grades are drawn (a letter, a dot description, a number); word answers get no drawn cells.
- Source: ICEB 10.3 (strong contraction "and" ⠯).

### Answers given away

- Number Sense showed the print value next to each braille choice and read the problem aloud in print; Bingo squares showed and announced their letters. Now the print appears only after answering / marking, and screen-reader labels give dot numbers.
- Source: game design / accessibility (labels still state dot numbers, generated from the data).
