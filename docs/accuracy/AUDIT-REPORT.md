# Braille accuracy audit: teachbraille.org (October 2026)

Every lesson, game, caption, screen-reader label, learning tip, intro page, site icon and admin AI
prompt was checked against the ICEB _Rules of Unified English Braille_ (2024), liblouis 3.29 UEB
tables, and Unicode. Every error below was fixed, and a test now fails if it comes back.

The detailed entries (before → after → source for each) are in `audit/`:

| File                                                         | Area                                                                                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [audit/lessons-and-numbers.md](audit/lessons-and-numbers.md) | Course lessons, Number Sense, digit chart, and the fixes from the independent review pass                                    |
| [audit/letters.md](audit/letters.md)                         | Word Game, Hangman, Speed Match, Memory Match, Sequence, Bingo, Rain, Reflex Dots, hero banner, alphabet chart               |
| [audit/contractions.md](audit/contractions.md)               | Contraction Sprint, Dot Explorer, Sentence Decoder, Intro page, learning tips                                                |
| [audit/admin-and-chrome.md](audit/admin-and-chrome.md)       | AI content generator reference, braille "fidelity guard", PDF worksheets, admin presets, logo, icons, social image, 404 page |

## The errors that mattered most

These would have taught a parent something false, or marked a right answer wrong.

| #   | What the site did                                                                                                                                                      | Now                                                                                                             | Source                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | **Number Sense taught Nemeth Code**, a different braille code, right after a lesson teaching UEB digits; its equals and multiplication signs were wrong even as Nemeth | UEB numbers and UEB math signs (⠐⠖ ⠐⠤ ⠐⠦ ⠐⠶), every problem checked by liblouis                                 | ICEB 6.1, 3.17         |
| 2   | **Digits taught without the numeric indicator** ("1" drilled as the a cell alone)                                                                                      | Numeric indicator + letter, two cells                                                                           | ICEB 6.1 table         |
| 3   | **"this" taught as th + i + s**                                                                                                                                        | "this" alone is one cell (⠹); the lesson uses "bath" (b, a, th)                                                 | ICEB 10.2; liblouis g2 |
| 4   | **Contraction Sprint word list wrong in many words** (child, which, this, when, then, them, mother, there, together, weather, thousand…)                               | Rebuilt: 184 words, every one identical to liblouis contracted output, only using contractions the site teaches | ICEB 10.x; liblouis g2 |
| 5   | **Sentence Decoder "contracted" sentences were neither contracted nor uncontracted**, and had no capital indicator                                                     | Curated uncontracted (beginner, intermediate) and contracted (advanced) sentences, all identical to liblouis    | ICEB 8.3, 10.x         |
| 6   | **Memory Match could deal "C" and "3" with the same cell**: two right answers                                                                                          | Letters only                                                                                                    | ICEB 6.1               |
| 7   | **AI teaching-material generator was told "it" = i and "as" = a** (they are x and z), plus EBAE and Nemeth content in its presets                                      | Reference generated from the canonical data; UEB only                                                           | ICEB 10.1, 5.2, 9.2    |
| 8   | **The "fidelity guard" corrupted correct AI text** ("this is dots 1 4 5 6" became wrong)                                                                               | Rewritten; only corrects when exactly one pattern fits                                                          | canonical data         |
| 9   | **Plain letter cells labelled as capitals** everywhere ("A" over ⠁)                                                                                                    | Lowercase labels; capitals taught with the capital indicator                                                    | ICEB 4.1, 8.3.1        |
| 10  | **"Number sign"** used for the numeric indicator (in UEB the number sign is the print #, ⠸⠹)                                                                           | "numeric indicator"                                                                                             | ICEB 6.1, 3.19         |
| 11  | **Learning tip: "Braille is used on currency in … the US"** (US paper money has no braille)                                                                            | Replaced with a sourced fact                                                                                    | —                      |
| 12  | **A final correct answer was counted twice** in four games (a losing run could be recorded as a win)                                                                   | Fixed, with a regression test                                                                                   | game logic             |
| 13  | **Screen-reader labels gave answers away or described nothing**                                                                                                        | Labels give dot numbers, generated from the data                                                                | accessibility          |

## Counts

- Area audit files: 4, with 59 logged entries (before / after / source). A few entries record items checked and found already correct.
- Checked and found already correct (also logged): all 26 letter cells and the core contraction
  cells in the old maps, the Perkins key mapping, the 404 page, the nav logo, the PDF dot layout.

## What changed structurally (so these errors cannot return)

- One canonical module, `lib/braille/`, defines every cell. Nothing else may contain a dot
  pattern, a Unicode braille character, or hand-typed dot numbers; a test scans the source tree.
- All print is turned into braille by one transcriber (`lib/braille/transcribe.ts`) that refuses
  input it cannot handle correctly rather than guessing.
- Every string the site shows as braille (7,787 of them) is compared cell by cell with liblouis.
- Every game's question logic is a pure module with every possible question enumerated and tested.
- See VERIFICATION.md for the full method and VERIFICATION-RESULTS.md for the generated numbers.
