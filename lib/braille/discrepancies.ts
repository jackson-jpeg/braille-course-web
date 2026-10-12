/**
 * Documented disagreements between independent sources.
 *
 * When liblouis and the ICEB rulebook disagree, the site follows the rulebook (ICEB writes the
 * code; liblouis is software that implements it), and records the case here with the rule and a
 * verbatim rulebook example. The liblouis-oracle test then requires, for each entry:
 *   - liblouis still produces exactly `liblouis` (so a liblouis change is noticed), and
 *   - the site produces exactly `site`.
 * Never add an entry to make a test pass without a rulebook citation.
 */
export interface Discrepancy {
  table: 'g1' | 'g2';
  print: string;
  /** What liblouis 3.29 en-ueb produces. */
  liblouis: string;
  /** What the site produces (and what the rulebook requires). */
  site: string;
  rule: string;
  /** A verbatim example from the rulebook showing the required form. */
  rulebookExample: { print: string; braille: string; page: number };
  /**
   * The braille that decides the case. It must appear in both the rulebook example and the site's
   * output (spaces compared as spaces), and must not appear in liblouis's output.
   */
  essential: string;
  explanation: string;
}

export const DISCREPANCIES: readonly Discrepancy[] = [
  {
    table: 'g1',
    print: 'He shouted “I WILL NOT!”',
    liblouis: '⠠⠓⠑⠀⠎⠓⠕⠥⠞⠑⠙⠀⠦⠠⠠⠠⠊⠀⠺⠊⠇⠇⠀⠝⠕⠞⠖⠴⠠⠄',
    site: '⠠⠓⠑⠀⠎⠓⠕⠥⠞⠑⠙⠀⠦⠠⠠⠠⠊⠀⠺⠊⠇⠇⠀⠝⠕⠞⠖⠠⠄⠴',
    rule: '8.6.2',
    rulebookExample: { print: 'He shouted "I WILL NOT!"', braille: '⠠⠓⠑ ⠩⠳⠞⠫ ⠦⠠⠠⠠⠊ ⠺ ⠝⠖⠠⠄⠴', page: 96 },
    essential: '⠖⠠⠄⠴',
    explanation:
      'Rule 8.6.2: indicators and paired marks such as quotes should be nested, closing in reverse order of opening. The passage opened inside the quotation, so the capitals terminator ⠠⠄ comes before the closing quotation mark ⠴. liblouis places the terminator after the quote. (The rulebook example is contracted; the placement of ⠠⠄ before ⠴ is the same in uncontracted braille.)',
  },
  {
    table: 'g1',
    print: 'rock ’n’ roll',
    liblouis: '⠗⠕⠉⠅⠀⠠⠴⠝⠠⠴⠀⠗⠕⠇⠇',
    site: '⠗⠕⠉⠅⠀⠄⠝⠄⠀⠗⠕⠇⠇',
    rule: '7.6.6',
    rulebookExample: { print: 'rock ’n’ roll', braille: '⠗⠕⠉⠅ ⠄⠰⠝⠄ ⠗⠕⠇⠇', page: 84 },
    essential: '⠗⠕⠉⠅ ⠄',
    explanation:
      'Rule 7.6.6: use ⠄ for the apostrophe; the rulebook example writes both marks in ’n’ as apostrophes. liblouis treats the first as a closing single quotation mark (⠠⠴). (The rulebook example is contracted, so the n there carries a grade 1 indicator; uncontracted braille does not need it, ICEB 5.11.1.)',
  },
  {
    table: 'g1',
    print: '’90s',
    liblouis: '⠠⠴⠼⠊⠚⠎',
    site: '⠄⠼⠊⠚⠎',
    rule: '7.6.6',
    rulebookExample: { print: "the '90s", braille: '⠮ ⠄⠼⠊⠚⠎', page: 84 },
    essential: '⠄⠼⠊⠚⠎',
    explanation:
      'Rule 7.6.6: the apostrophe marking the omitted digits in ’90s is ⠄, as in the rulebook example. liblouis writes a closing single quotation mark (⠠⠴).',
  },
];
