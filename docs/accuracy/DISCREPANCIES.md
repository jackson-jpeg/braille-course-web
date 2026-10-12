# Discrepancy report

Every braille fact on teachbraille.org is checked against three independent sources:

1. **ICEB rulebook**: _Rules of Unified English Braille_, Third Edition 2024, International Council on English Braille (the body that defines UEB). PDF sha256 `bf742499…5a105e`.
2. **liblouis 3.29** `en-ueb-g1.ctb` (uncontracted) and `en-ueb-g2.ctb` (contracted), the open-source braille translator used by most screen readers.
3. **Unicode**: the Braille Patterns block (U+2800–U+283F) and its official character names.

**Resolution policy**: when sources disagree, the site follows the ICEB rulebook, because ICEB writes the code and liblouis is software that implements it. Every disagreement is recorded in `lib/braille/discrepancies.ts` with the rule, a rulebook example (checked verbatim against the PDF by `scripts/braille/verify-rulebook-examples.py`), the deciding cells, and both outputs. The test suite then fails if either liblouis or the site output changes, so a disagreement can never be "fixed" silently. No test was changed or loosened to resolve a disagreement.

## Disagreements between sources

### 1. Where the capitals terminator goes when a quotation closes a capitalized passage

|                  | Braille for `He shouted “I WILL NOT!”`                                                       |
| ---------------- | -------------------------------------------------------------------------------------------- |
| liblouis 3.29 g1 | `⠠⠓⠑⠀⠎⠓⠕⠥⠞⠑⠙⠀⠦⠠⠠⠠⠊⠀⠺⠊⠇⠇⠀⠝⠕⠞⠖⠴⠠⠄` (terminator **after** the closing quote)                    |
| ICEB rulebook    | example under rule 8.6.2: `⠠⠓⠑ ⠩⠳⠞⠫ ⠦⠠⠠⠠⠊ ⠺ ⠝⠖⠠⠄⠴` (terminator **before** the closing quote) |
| Site             | terminator before the closing quote, as ICEB                                                 |

- **Rule**: 8.6.2: "The capitals terminator may precede or follow punctuation and other terminators but it is best that indicators and paired characters such as parentheses, square brackets and quotes be nested. That is, close punctuation and indicators in reverse order of opening." The passage opens inside the quotation, so it closes inside it.
- **Resolution**: follow ICEB. The rulebook example is contracted; the placement of the terminator relative to the quote is the same in uncontracted braille.
- **Exposure**: no page or game currently shows a capitalized passage that ends inside a quotation. The case is exercised only by the verification suite, so learners never see a form where the sources differ.

### 2. Apostrophes at the edge of a word: `rock ’n’ roll`, `’90s`

|                                       | rock ’n’ roll                             | ’90s                            |
| ------------------------------------- | ----------------------------------------- | ------------------------------- |
| liblouis 3.29 g1                      | `⠗⠕⠉⠅⠀⠠⠴⠝⠠⠴⠀⠗⠕⠇⠇` (closing single quotes) | `⠠⠴⠼⠊⠚⠎` (closing single quote) |
| ICEB rulebook, 7.6.6 examples (p. 84) | `⠗⠕⠉⠅ ⠄⠰⠝⠄ ⠗⠕⠇⠇` (apostrophes)            | the '90s `⠮ ⠄⠼⠊⠚⠎` (apostrophe) |
| Site                                  | `⠗⠕⠉⠅⠀⠄⠝⠄⠀⠗⠕⠇⠇`                           | `⠄⠼⠊⠚⠎`                         |

- **Rule**: 7.6.6: "Use ⠄ for the apostrophe." The rulebook's own examples write these marks as apostrophes. (Its "rock ’n’ roll" is contracted, so the lone n there carries a grade 1 indicator; uncontracted braille does not need one, 5.11.1.)
- **Resolution**: follow ICEB. Where an apostrophe could also be a closing single quote (7.6.13), the site's transcriber refuses the text rather than guess.
- **Exposure**: neither string appears in lessons or games; both are verification samples only.

## Not disagreements, but worth knowing

- **Em dash.** The rulebook's section 7 symbol table lists "—" as the long dash ⠐⠠⠤, but rule 7.2.4 says to use the long dash "only when print uses both a short and long dash". The site transcribes a lone em dash as the dash ⠠⠤ (7.2.4). liblouis does the same. The site's lessons and games use the en dash "–".
- **Terminology.** ICEB uses British terms ("full stop", "solidus", "capitalised", "capitals word indicator"). The site uses the US terms that BANA teaching materials use ("period", "slash", "capitalized word indicator"). Every sign is matched to the rulebook by its cells and section, not by its name, and the test lists both names side by side.
- **Unicode.** All 64 six-dot cells agree with the Unicode character names; no disagreement was found.
- **liblouis and the rulebook's worked examples.** All 54 curated uncontracted rulebook examples are reproduced exactly by both liblouis and the site.
- **Uncontracted convention (single letters standing alone).** ICEB 5.11.1, liblouis en-ueb-g1, and the site agree: in uncontracted braille a letter standing alone ("b") needs no grade 1 indicator. In contracted braille it would (⠰⠃), because "b" alone is the wordsign "but". The site states this convention in the "Reading Your First Words" lesson.
- **Back-translation of curly quotes.** liblouis back-translates braille quotation marks as straight quotes ("), not curly ones. This affects only the contraction agent's back-translation fixture, which compares quotes loosely; forward translation, which is what the site is checked against, is unaffected.
- **Population statistics.** The intro page's 43 million blind people and 295 million with moderate or severe vision impairment (2020) come from the Vision Loss Expert Group study (_The Lancet Global Health_, 2021). Some other sources quote older WHO estimates with different figures. This is not braille, but it is noted in `audit/contractions.md`.
