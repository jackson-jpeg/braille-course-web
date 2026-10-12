# Accuracy audit: letters games

Area: Word Game, Hangman, Speed Match, Memory Match, Sequence, Bingo, Rain, Reflex Dots, the hero
banner (BrailleHero) and the alphabet chart (BrailleAlphabet). Daily challenges
(`lib/daily-challenges.ts`, `components/DailyChallenge.tsx`) were checked: they contain no braille
and no answer logic for these games, so they were not changed.

All 26 letter patterns in the legacy `lib/braille-map.ts` were compared with `LETTER_CELLS`
(ICEB 4.1) and all agree; the errors below are in how the games used them, not in the patterns.

Line numbers refer to the files before this migration (git `HEAD`).

### Memory Match dealt digits and indicators as if they were letters

- Where: components/BrailleMemoryMatch.tsx:9 (`const ALL_LETTERS = Object.keys(brailleMap)`). A deck
  could contain cards for the digits 0–9, `^` and `#`.
- Before: a digit card such as "3" showed only the c cell ⠉ (dots 1, 4) with no numeric indicator, so
  the deck could hold "C" and "3" with the identical braille card: two letter cards matched one
  braille card. "^" showed ⠠ (dot 6) and "#" showed ⠼ (dots 3, 4, 5, 6) as though they were letters,
  captioned with ASCII symbols.
- After: only the letters a–z are dealt (`lib/games/memorymatch.ts`, `MEMORY_LETTERS = ALPHABET`).
  Each braille card has exactly one matching letter card; tested over all 26×26 card pairs and 1,000
  random decks with an independent `transcribe` judge.
- Source: ICEB Rules of UEB 2024, 6.1 (a digit is the numeric indicator followed by a letter a–j;
  liblouis en-ueb-g1: "3" → ⠼⠉), 4.1 (letters), 8.3.1 (capital indicator is not a letter).

### Uppercase print paired with lowercase letter cells (all letters games and the alphabet chart)

- Where: every game in this area showed an uppercase print letter next to a plain letter cell, e.g.
  BrailleAlphabet.tsx:34 ("A" over ⠁), BrailleWordGame.tsx:331/364 (tiles and keys "B A K E"),
  BrailleHangman.tsx:176/204, BrailleSpeedMatch.tsx:171/189, BrailleMemoryMatch.tsx:178,
  BrailleBingo.tsx:265, BrailleSequence.tsx:209, BrailleReflexDots.tsx:186, BrailleRain (typed
  letters compared in uppercase); word lists `lib/game-words.ts` and `lib/hangman-words.ts` were all
  uppercase ("BAKE").
- Before: "A" shown as ⠁ (dot 1); the word "BAKE" shown as ⠃⠁⠅⠑. In UEB ⠁ is the lowercase letter
  a; capital A is ⠠⠁ and the word BAKE in capitals is ⠠⠠⠃⠁⠅⠑.
- After: data is lowercase a–z and the print shown next to a letter cell is lowercase ("a" over ⠁,
  "bake" over ⠃⠁⠅⠑). Screen-reader labels read "letter h, dots 1, 2, 5". Tests check every word
  shown is exactly `transcribe(word)` and that every word is in the liblouis inventory.
- Source: ICEB Rules of UEB 2024, 4.1 (table: ⠁ "letter a") and 8.3.1 (capital letter indicator
  ⠠ before a capital); liblouis en-ueb-g1: "A" → ⠠⠁, "bake" → ⠃⠁⠅⠑.

### Hero banner: capitals claimed, no capital indicators; punctuation silently dropped

- Where: components/BrailleHero.tsx:16–18 and 115 (characters not in `brailleMap` skipped), 130, 170.
  Used on the games page ("INTERACTIVE"), home page ("^DELANEY ^COSTELLO"), learn, intro, services,
  appointments, summer and every lesson page (`lesson.title.toUpperCase()`).
- Before: "INTERACTIVE" was captioned I N T E R… in capitals but drawn as lowercase letters
  ⠊⠝⠞⠑⠗⠁⠉⠞⠊⠧⠑. Any character not in the legacy map was dropped with no trace, so the lesson
  hero "LETTERS A–J" showed ⠇⠑⠞⠞⠑⠗⠎ ⠁⠚ ("letters aj", the dash missing) and "WRAP-UP & NEXT
  STEPS" showed ⠺⠗⠁⠏⠥⠏ ⠝⠑⠭⠞ ⠎⠞⠑⠏⠎ (hyphen and ampersand missing). The capital indicator cell was
  captioned "^" and announced as "Braille letter ^"; the long-press description read "dots 6".
- After: the hero's `word` is converted to print (`lib/games/hero.ts`, `heroPrint`): letters are
  lowercase unless marked `^`, which gives a real capital. The print is transcribed by
  `lib/braille/transcribe.ts`, so "INTERACTIVE" is shown and captioned as lowercase "interactive"
  (⠊⠝⠞⠑⠗⠁⠉⠞⠊⠧⠑), "Delaney Costello" gets ⠠ before each capital, "letters a–j" shows the dash
  ⠇⠑⠞⠞⠑⠗⠎ ⠁⠠⠤⠚, and "wrap-up & next steps" shows ⠺⠗⠁⠏⠤⠥⠏ ⠈⠯ ⠝⠑⠭⠞ ⠎⠞⠑⠏⠎. Indicators are
  captioned by name ("capital letter", "numeric") and every group is announced with its dot numbers.
  Choice documented: pages pass upper-case words for styling, so the hero presents them as
  lowercase letters rather than adding capitalized-word indicators.
- Source: ICEB Rules of UEB 2024, 8.3.1, 7.2 (dash ⠠⠤, hyphen ⠤), 3.1 (ampersand ⠈⠯); liblouis
  en-ueb-g1 output for every hero word (all in the oracle inventory and matching).

### Screen-reader labels gave the answer away, or described nothing

- Where: BrailleSpeedMatch.tsx:184 (write mode "braille pattern for C"; read-mode prompt cell had no
  text alternative at all), BrailleMemoryMatch.tsx:169 ("Braille pattern for C"),
  BrailleRain.tsx:265 ("Falling letter C"), BrailleSequence.tsx:206 ("Position 1", nothing about
  the cell), BrailleBingo.tsx:256 (letter only), BrailleReflexDots.tsx:184–214 (the flashed cell was
  six ●/○ characters read in grid order 1, 4, 2, 5, 3, 6 with no dot numbers).
- Before: a screen-reader user was told the answer instead of the braille (Speed Match write mode,
  Memory Match, Rain), or got no description of the cell (Speed Match read mode, Sequence, Reflex).
- After: each cell is announced with its dot numbers from `describeCell` ("Braille cell, dots 1, 4";
  "Falling braille cell, dots 1, 4"; "Position 1: braille cell, dots 1, 4"); the answer letter is not
  in the label of a question cell. Render tests check the labels.
- Source: MIGRATION-BRIEF rule 6 (accessibility); dot numbering ICEB 4.1.

### Legacy dot descriptions: wrong grammar and no separators

- Where: lib/braille-map.ts:68 (`dotDescription`), used by BrailleAlphabet.tsx:13/26,
  BrailleHangman.tsx:201, BrailleWordGame.tsx:354 and BrailleHero.tsx:170.
- Before: "A, dots 1" (plural for a single dot); "Letter H, Braille dots 1 2 5" (unseparated).
- After: `describeCell`: "letter a, dot 1", "letter h, dots 1, 2, 5".
- Source: lib/braille/prose.ts (site convention); ICEB 4.1 for the dot numbers.

### Checked and found correct (no change in behaviour)

- Reflex Dots keyboard map (BrailleReflexDots.tsx:162–169): keys 1–6 did toggle dots 1–6 through
  the grid-index map. It now uses `dotForKey` (key n → dot n) and `BrailleDotPad`; a render test
  presses each key and checks the pad's raised dot.
- Word Game scoring (`computeStatuses`): repeated letters were already handled correctly. Moved to
  `scoreGuess` and tested on repeated-letter cases (bell/lull, lamb/ball, dove/deed, free/eeee,
  eels/seen, book/oboe) and against scoring properties for every answer.
- Speed Match / Sequence / Rain / Bingo only used A–Z from the legacy map (no digits).

## Open questions

- Letter names in prose. Labels say "letter h" (lowercase, per the lead's site-wide decision). Many
  teaching materials name letters in capitals ("the letter H") without meaning a capital; we chose
  lowercase everywhere a letter is paired with its cell to avoid implying ⠓ is a capital.
- Hero words. Pages pass upper-case strings ("INTERACTIVE", "TVI SERVICES"). We present them as
  lowercase letters. If capitals are wanted, the page should say so explicitly (e.g. pass `^` marks,
  or a future prop for real print), and the hero would then show ⠠⠠ (capitalized word indicator).
- Word list content (not braille accuracy): `lib/hangman-words.ts` includes words such as "slave",
  "bomb", "drunk", and the Word Game answers include "jerk". Left unchanged; flag for the owner.
