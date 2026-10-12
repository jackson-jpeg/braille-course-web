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
    explanation:
      'Rule 8.6.2: indicators and paired marks such as quotes should be nested, closing in reverse order of opening. The passage opened inside the quotation, so the capitals terminator ⠠⠄ comes before the closing quotation mark ⠴. liblouis places the terminator after the quote. (The rulebook example is contracted; the placement of ⠠⠄ before ⠴ is the same in uncontracted braille.)',
  },
];
