# Verification report: how teachbraille.org proves its braille is right

Current numbers (test counts, oracle size, geometry results) are generated from a real run into
[VERIFICATION-RESULTS.md](VERIFICATION-RESULTS.md) by `npx tsx scripts/braille/verification-report.ts`.
At the time of writing: **1,583 tests, all passing, none skipped**; **7,787** print strings compared
with liblouis; **1,912** drawn cells measured in a real browser with **0** problems.

## The rule: one source of truth

`lib/braille/ueb.ts` is the only place a braille cell is defined (letters, digits, indicators,
punctuation, symbols, contractions), each with its ICEB rule section. Everything else derives from it:

- `transcribe.ts`: print → uncontracted UEB, implementing ICEB 5.11, 6.1–6.5, 7.x, 8.3–8.6; it throws
  on anything it cannot do correctly (no made-up cells).
- `prose.ts`: every sentence that names dots is generated (`describeCell`, templates like
  `{dots:numeric}`, and _facts_ such as "k–t are a–j plus dot 3" computed from the data, which throw
  if the data stops supporting the claim).
- `contracted.ts`: contracted words built from named contraction pieces.
- `components/BrailleCell.tsx` / `BrailleDotPad.tsx`: the only components that draw dots.

**Enforced by** `__tests__/braille/no-hardcoded-braille.test.ts`, which scans `app/`, `components/`,
`lib/`, `hooks/` and fails on: Unicode braille characters, 0/1 dot arrays, literal cell arrays,
hand-typed "dot(s) N" prose, legacy maps, Nemeth, EBAE terms ("letter sign"), dot layout code outside
the two cell components, and any skipped / focused / todo test anywhere in the suite.

## Three independent sources

| Source                                             | How it is used                                                                                                                                                                                                                                                                                                                                                                                   | Test                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **liblouis 3.29** `en-ueb-g1.ctb`, `en-ueb-g2.ctb` | Every lesson, game and page module lists every print string it can show as braille, with the cells it actually draws (`brailleInventory()`). `scripts/braille/liblouis-oracle.py` forward-translates all of them; the test compares cell by cell.                                                                                                                                                | `__tests__/braille/liblouis-oracle.test.ts`                |
| **ICEB Rules of UEB, 2024**                        | `scripts/braille/extract-rulebook-signs.py` downloads the PDF (sha256-pinned) and extracts its symbol tables (490 entries) and section headings. Every sign must match the table in its cited section. 54 uncontracted worked examples and 3 cited contracted examples are checked verbatim against the PDF by `verify-rulebook-examples.py`, and the transcriber must reproduce the 54 exactly. | `__tests__/braille/ueb-data.test.ts`, `transcribe.test.ts` |
| **Unicode**                                        | All 64 cells → code point → the Unicode Character Database name ("BRAILLE PATTERN DOTS-125") must list the same dots; round trip for every sign.                                                                                                                                                                                                                                                 | `ueb-data.test.ts`                                         |

Disagreements may only be accepted in `lib/braille/discrepancies.ts` with a rulebook citation that
the PDF check has verified; see [DISCREPANCIES.md](DISCREPANCIES.md).

## The known traps, each with explicit tests

1. **UEB only**: tests assert UEB parentheses, dash, decimal point, dollar sign and math signs, and
   that no digit cell is a Nemeth lower-cell digit; the lint test bans Nemeth and EBAE terms.
2. **Four capitals indicators** are distinct and each is drilled (capital letter, capitalized word,
   capitalized passage, capitals terminator), including where a capitalized word ends (DON’T) and a
   mid-word terminator (ABCs); Capital Quest's question set must cover all four.
3. **Numbers**: numeric indicator, digits a–j, one indicator across commas and decimals (1,000; 3.5;
   12,345.67), new indicator after space / hyphen / colon, grade 1 indicator before a–j after a
   digit (3b vs 32), none before k–z or capitals, and inside capitalized passages.
4. **Shared cells**: ? and “ share a cell; Punctuation Detective re-transcribes each sentence with
   every choice and requires exactly one choice to reproduce the braille shown; Contraction Sprint
   labels a shared cell with every meaning; Dot Explorer lists every meaning of all 64 cells.
5. **Uncontracted convention**: ICEB 5.11.1, letters standing alone get no grade 1 indicator.
   Stated in the "Reading Your First Words" lesson; tested against liblouis for every single letter.
6. **Cell layout**: `dotPosition` puts 1-2-3 down the left and 4-5-6 down the right; jsdom tests
   check every drawn cell's dot placement and raised/flat state on all 64 cells and every lesson;
   `scripts/braille/check-rendered-cells.mjs` measures real on-screen geometry in Chromium on every
   page at 1280px and 390px.
7. **Writing**: Perkins key order (dot 3, 2, 1, space, 4, 5, 6) and six-key entry S D F / J K L are
   tested; every lesson drill item is written cell by cell with those keys; Brailler Challenge is
   played end to end with real chords. (The site has no slate-and-stylus writing, so mirror writing
   is not exercised; `mirrorCell` exists and is tested if it is ever added.)

## Game logic

For every game, every possible question at every difficulty is enumerated (`lib/games/*.ts`) and
the test checks, using an independent judge (liblouis fixture, canonical letters, or arithmetic):
the correct answer is accepted, every wrong answer is rejected, no distractor has the answer's
braille, and no question has two valid answers. The components call the same tested functions.

## Where it runs

- **Every build** (`npm run build`, which Vercel runs for production): the full jest suite runs
  first; a failing or skipped accuracy test stops the deploy.
- **GitHub Actions** (`.github/workflows/braille-accuracy.yml`): installs liblouis fresh, regenerates
  the oracle and the rulebook extraction and fails if they differ from the committed fixtures, runs
  the suite, builds, and runs the real-browser geometry check.
