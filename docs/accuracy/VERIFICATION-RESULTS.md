# Verification results (generated)

Generated 2026-10-12T03:27:55.410Z by `scripts/braille/verification-report.ts` from a real run of the whole test suite. Do not edit by hand.

## Totals

- Tests: **1574 passed**, 0 failed, 0 skipped/todo, 1574 total, in 32 files.
- liblouis oracle: liblouis 3.29.0, 7780 translations in the fixture; the site shows **7780** distinct print strings as braille (7572 uncontracted via en-ueb-g1.ctb, 208 contracted via en-ueb-g2.ctb), every one compared cell by cell.
- Documented source disagreements: 1 (see DISCREPANCIES.md).
- ICEB rulebook: 490 symbol-table entries and 134 section headings extracted from the PDF (sha256 bf742499ee2e…); 54 verbatim worked examples reproduced exactly.
- Canonical data: 75 signs (letters, digits, indicators, punctuation, symbols) and 62 contraction entries, each matched to the rulebook tables; all 64 cells round-tripped through Unicode and checked against Unicode character names.
- Real-browser geometry (Chromium, 1280px and 390px): 1908 drawn cells checked, 0 problem(s)

## Braille inventory by area

| Area                               | Items |
| ---------------------------------- | ----- |
| admin                              | 6     |
| chrome                             | 7     |
| data                               | 88    |
| game:bingo                         | 26    |
| game:brailler-challenge            | 23    |
| game:capital-quest                 | 115   |
| game:contraction-sprint            | 184   |
| game:explorer                      | 66    |
| game:hangman                       | 1508  |
| game:memorymatch                   | 26    |
| game:number-lock                   | 106   |
| game:number-sense                  | 4035  |
| game:punctuation-detective         | 33    |
| game:rain                          | 26    |
| game:reflex                        | 26    |
| game:sentence-decoder:advanced     | 24    |
| game:sentence-decoder:beginner     | 15    |
| game:sentence-decoder:intermediate | 15    |
| game:sequence                      | 26    |
| game:speedmatch                    | 26    |
| game:wordgame                      | 2397  |
| hero                               | 25    |
| lesson:alphabet-wordsigns          | 6     |
| lesson:capital-words               | 6     |
| lesson:capitals                    | 5     |
| lesson:letters-a-j                 | 10    |
| lesson:letters-k-t                 | 10    |
| lesson:letters-u-z                 | 6     |
| lesson:lower-wordsigns             | 3     |
| lesson:numbers                     | 9     |
| lesson:numbers-in-text             | 10    |
| lesson:punctuation                 | 4     |
| lesson:punctuation-more            | 6     |
| lesson:reading-sentences           | 3     |
| lesson:reading-words               | 9     |
| lesson:strong-contractions         | 5     |
| lesson:strong-groupsigns           | 1     |
| lesson:the-braille-cell            | 3     |
| verification                       | 116   |

## Tests by file

| File                                              | Passed | Failed | Skipped |
| ------------------------------------------------- | ------ | ------ | ------- |
| **tests**/admin-braille/admin-presets.test.tsx    | 5      | 0      | 0       |
| **tests**/admin-braille/ai-reference.test.ts      | 25     | 0      | 0       |
| **tests**/admin-braille/braille-validator.test.ts | 211    | 0      | 0       |
| **tests**/admin-braille/document-builders.test.ts | 78     | 0      | 0       |
| **tests**/admin-braille/site-chrome.test.tsx      | 75     | 0      | 0       |
| **tests**/api/school-contact.test.ts              | 22     | 0      | 0       |
| **tests**/braille/liblouis-oracle.test.ts         | 6      | 0      | 0       |
| **tests**/braille/no-hardcoded-braille.test.ts    | 9      | 0      | 0       |
| **tests**/braille/render-cell.test.tsx            | 132    | 0      | 0       |
| **tests**/braille/transcribe.test.ts              | 77     | 0      | 0       |
| **tests**/braille/ueb-data.test.ts                | 184    | 0      | 0       |
| **tests**/course/brailler.test.tsx                | 205    | 0      | 0       |
| **tests**/games/alphabet.test.tsx                 | 2      | 0      | 0       |
| **tests**/games/bingo.test.tsx                    | 6      | 0      | 0       |
| **tests**/games/contraction-sprint.test.tsx       | 23     | 0      | 0       |
| **tests**/games/explorer.test.tsx                 | 10     | 0      | 0       |
| **tests**/games/hangman.test.tsx                  | 6      | 0      | 0       |
| **tests**/games/hero.test.tsx                     | 55     | 0      | 0       |
| **tests**/games/intro-and-tips.test.tsx           | 4      | 0      | 0       |
| **tests**/games/memorymatch.test.tsx              | 6      | 0      | 0       |
| **tests**/games/new-games-logic.test.ts           | 180    | 0      | 0       |
| **tests**/games/new-games-ui.test.tsx             | 9      | 0      | 0       |
| **tests**/games/number-sense.test.tsx             | 7      | 0      | 0       |
| **tests**/games/rain.test.tsx                     | 6      | 0      | 0       |
| **tests**/games/reflex.test.tsx                   | 31     | 0      | 0       |
| **tests**/games/sentence-decoder.test.tsx         | 36     | 0      | 0       |
| **tests**/games/sequence.test.tsx                 | 8      | 0      | 0       |
| **tests**/games/speedmatch.test.tsx               | 6      | 0      | 0       |
| **tests**/games/wordgame.test.tsx                 | 16     | 0      | 0       |
| **tests**/lib/admin-auth.test.ts                  | 8      | 0      | 0       |
| **tests**/lib/course-curriculum.test.ts           | 104    | 0      | 0       |
| **tests**/lib/progress-storage.test.ts            | 22     | 0      | 0       |
