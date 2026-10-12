/**
 * The canonical braille data (lib/braille/ueb.ts) against two independent sources:
 *   - the Unicode Character Database names of the braille patterns (U+2800 block), and
 *   - the symbol tables of the ICEB Rules of Unified English Braille, Third Edition 2024,
 *     extracted from the PDF by scripts/braille/extract-rulebook-signs.py.
 * liblouis is the third source; see liblouis-oracle.test.ts.
 */
import unicodeNames from '../fixtures/unicode-braille-names.json';
import rulebook from '../fixtures/iceb-rulebook-signs.json';
import {
  ALL_CELLS,
  ALL_SIGNS,
  ALPHABET,
  ALPHABETIC_WORDSIGNS,
  CONTRACTIONS,
  DIGIT_CELLS,
  DIGIT_LETTER,
  INDICATORS,
  LETTER_CELLS,
  PUNCTUATION,
  RULEBOOK,
  SYMBOLS,
  type Cell,
  cellKey,
  cellToGrid,
  cellToUnicode,
  cellsToUnicode,
  dotPosition,
  gridToCell,
  mirrorCell,
  unicodeToCell,
  unicodeToCells,
} from '@/lib/braille/ueb';

function nameDots(name: string): string {
  if (name === 'BRAILLE PATTERN BLANK') return '';
  const m = name.match(/^BRAILLE PATTERN DOTS-(\d+)$/);
  if (!m) throw new Error(`unexpected Unicode name ${name}`);
  return m[1];
}

describe('Unicode braille patterns (U+2800 block)', () => {
  test('every one of the 64 six-dot cells maps to the code point whose Unicode name lists the same dots', () => {
    expect(ALL_CELLS).toHaveLength(64);
    for (const cell of ALL_CELLS) {
      const ch = cellToUnicode(cell);
      const cp = `U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;
      const name = (unicodeNames.names as Record<string, string>)[cp];
      expect({ cell: cellKey(cell), unicode: nameDots(name) }).toEqual({ cell: cellKey(cell), unicode: cellKey(cell) });
    }
  });

  test('dot n is bit 2^(n-1): dot 1 = 0x01 … dot 6 = 0x20', () => {
    for (let d = 1 as 1 | 2 | 3 | 4 | 5 | 6; d <= 6; d++) {
      expect(cellToUnicode([d]).codePointAt(0)! - 0x2800).toBe(1 << (d - 1));
    }
  });

  test('round trip: cell → Unicode → cell for all 64 cells, and for every sign on the site', () => {
    for (const cell of ALL_CELLS) expect(unicodeToCell(cellToUnicode(cell))).toEqual(cell);
    for (const sign of ALL_SIGNS) expect(unicodeToCells(cellsToUnicode(sign.cells))).toEqual(sign.cells);
    for (const c of CONTRACTIONS) expect(unicodeToCells(cellsToUnicode(c.cells))).toEqual(c.cells);
  });

  test('8-dot patterns and non-braille characters are rejected', () => {
    expect(() => unicodeToCell('⡀')).toThrow();
    expect(() => unicodeToCell('a')).toThrow();
  });
});

describe('cell data is well formed', () => {
  const everyCell: Cell[] = [...ALL_SIGNS.flatMap((s) => s.cells), ...CONTRACTIONS.flatMap((c) => c.cells)];
  test('dots are integers 1–6, ascending, without repeats', () => {
    for (const cell of everyCell) {
      expect(cell.every((d) => Number.isInteger(d) && d >= 1 && d <= 6)).toBe(true);
      expect([...cell].sort((a, b) => a - b)).toEqual(cell);
      expect(new Set(cell).size).toBe(cell.length);
    }
  });

  test('the 26 letters have 26 different, non-empty cells', () => {
    expect(ALPHABET).toHaveLength(26);
    const keys = ALPHABET.map((l) => cellKey(LETTER_CELLS[l]));
    expect(new Set(keys).size).toBe(26);
    expect(keys.every((k) => k.length > 0)).toBe(true);
  });

  test('digits 1–9 and 0 use the cells of letters a–i and j (ICEB 6.1)', () => {
    expect(Object.entries(DIGIT_LETTER)).toEqual([
      ['0', 'j'],
      ['1', 'a'],
      ['2', 'b'],
      ['3', 'c'],
      ['4', 'd'],
      ['5', 'e'],
      ['6', 'f'],
      ['7', 'g'],
      ['8', 'h'],
      ['9', 'i'],
    ]);
    for (const [d, l] of Object.entries(DIGIT_LETTER)) expect(DIGIT_CELLS[d]).toEqual(LETTER_CELLS[l]);
  });

  test('legacy grid adapter round-trips and uses [d1, d4, d2, d5, d3, d6] order', () => {
    for (const cell of ALL_CELLS) expect(gridToCell(cellToGrid(cell))).toEqual(cell);
    expect(cellToGrid([1])).toEqual([1, 0, 0, 0, 0, 0]);
    expect(cellToGrid([4])).toEqual([0, 1, 0, 0, 0, 0]);
    expect(cellToGrid([3, 6])).toEqual([0, 0, 0, 0, 1, 1]);
  });

  test('cell layout: dots 1, 2, 3 run down the left column and 4, 5, 6 down the right', () => {
    expect([1, 2, 3, 4, 5, 6].map((d) => dotPosition(d as 1))).toEqual([
      { column: 1, row: 1 },
      { column: 1, row: 2 },
      { column: 1, row: 3 },
      { column: 2, row: 1 },
      { column: 2, row: 2 },
      { column: 2, row: 3 },
    ]);
  });

  test('mirror swaps the columns (dot 1↔4, 2↔5, 3↔6)', () => {
    expect(mirrorCell([1])).toEqual([4]);
    expect(mirrorCell([1, 2, 5])).toEqual([2, 4, 5]); // h ↔ j
    for (const cell of ALL_CELLS) expect(mirrorCell(mirrorCell(cell))).toEqual(cell);
  });
});

/* ── ICEB rulebook ─────────────────────────────────────────────────────── */

interface Entry {
  section: string;
  braille: string;
  text: string;
  print?: string;
  see?: string;
}
const entries = rulebook.entries as Entry[];
const headings = rulebook.headings as { section: string; title: string; braille: string[] }[];

function topSection(rule: string): string {
  return rule.split('.')[0];
}

function rulebookHas(braille: string, rule: string, words: RegExp): Entry | undefined {
  return entries.find(
    (e) =>
      e.braille === braille &&
      words.test(e.text) &&
      (e.section === rule ||
        e.section === topSection(rule) ||
        rule.startsWith(`${e.section}.`) ||
        (e.see ? rule.startsWith(e.see) : false)),
  );
}

describe('ICEB Rules of Unified English Braille (2024): symbol tables', () => {
  test('fixture was extracted from the expected PDF', () => {
    expect(rulebook.source.sha256).toBe(RULEBOOK.sha256);
    expect(rulebook.source.edition).toBe(RULEBOOK.edition);
    expect(entries.length).toBeGreaterThan(400);
  });

  test.each(ALPHABET)('letter %s matches the 4.1 English alphabet table', (l) => {
    expect(rulebookHas(cellToUnicode(LETTER_CELLS[l]), '4.1', new RegExp(`^letter ${l}$`))).toBeDefined();
  });

  test.each(ALPHABET)('capital %s = capital letter indicator + letter, as in the 4.1 table', (l) => {
    const braille = cellsToUnicode([...INDICATORS.capitalLetter.cells, LETTER_CELLS[l]]);
    expect(rulebookHas(braille, '4.1', new RegExp(`^capital letter ${l.toUpperCase()}$`))).toBeDefined();
  });

  const digitWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  test.each(Object.keys(DIGIT_LETTER))('digit %s matches the section 6 table', (d) => {
    const braille = cellsToUnicode([...INDICATORS.numeric.cells, DIGIT_CELLS[d]]);
    expect(rulebookHas(braille, '6.1', new RegExp(`^digit ${digitWords[Number(d)]}$`))).toBeDefined();
  });

  // Each indicator / punctuation / symbol, with the words the rulebook uses for it in its tables
  // or section headings. ICEB uses British terms (full stop, solidus, capitalised).
  const expected: [string, RegExp][] = [
    ['capitalWord', /capitals word indicator/],
    ['capitalPassage', /capitals passage indicator/],
    ['capitalsTerminator', /capitals terminator/],
    ['grade1Symbol', /^grade 1 symbol indicator$/],
    ['grade1Word', /^grade 1 word indicator$/],
    ['italicSymbol', /^italic symbol indicator$/],
    ['italicWord', /^italic word indicator$/],
    ['boldSymbol', /^boldface symbol indicator$/],
    ['boldWord', /^boldface word indicator$/],
    ['underlineSymbol', /^underlined symbol indicator$/],
    ['underlineWord', /^underlined word indicator$/],
    ['period', /^full stop/],
    ['comma', /^comma \(see 7\.1\)/],
    ['question', /^question mark/],
    ['exclamation', /^exclamation mark/],
    ['colon', /^colon/],
    ['semicolon', /^semicolon/],
    ['apostrophe', /^apostrophe/],
    ['hyphen', /^hyphen/],
    ['dash', /^dash/],
    ['openQuote', /^opening double quotation mark/],
    ['closeQuote', /^closing double quotation mark/],
    ['openSingleQuote', /^opening single quotation mark/],
    ['closeSingleQuote', /^closing single quotation mark/],
    ['openParen', /^opening parenthesis/],
    ['closeParen', /^closing parenthesis/],
    ['slash', /^solidus/],
    ['ellipsis', /^ellipsis/],
    ['ampersand', /^ampersand/],
    ['at', /^commercial at sign/],
    ['dollar', /^dollar sign/],
    ['percent', /^percent sign/],
    ['plus', /^plus sign/],
    ['minus', /^minus sign/],
    ['times', /^multiplication sign/],
    ['divide', /^division sign/],
    ['equals', /^equals sign/],
  ];
  const signById = new Map(ALL_SIGNS.map((s) => [s.id, s]));

  test('every indicator, punctuation mark and symbol on the site is covered by this test', () => {
    const covered = new Set([...expected.map(([id]) => id), 'capitalLetter', 'numeric']);
    const all = [...Object.keys(INDICATORS), ...Object.keys(PUNCTUATION), ...Object.keys(SYMBOLS)];
    expect(all.filter((id) => !covered.has(id))).toEqual([]);
  });

  test.each(expected)('%s matches the rulebook table in its cited section', (id, words) => {
    const sign = signById.get(id)!;
    const found = rulebookHas(cellsToUnicode(sign.cells), sign.rule, words);
    expect(found).toBeDefined();
  });

  test('numeric indicator: section 6 heading lists ⠼ followed by a–j as the digits', () => {
    const h = headings.find((x) => x.section === '6.1')!;
    expect(h.braille[0]).toBe(cellsToUnicode([...INDICATORS.numeric.cells, LETTER_CELLS.a]));
  });

  test('capital letter indicator: 8.3.1 table entries are dot 6 + letter', () => {
    expect(rulebookHas('⠠⠁ to ⠠⠵', '8', /capital letters A to Z/)).toBeDefined();
    expect(cellToUnicode(INDICATORS.capitalLetter.cells[0])).toBe('⠠');
  });

  test('the four capitals indicators are four different cell sequences (trap 2)', () => {
    const ids = ['capitalLetter', 'capitalWord', 'capitalPassage', 'capitalsTerminator'] as const;
    const keys = ids.map((id) => cellsToUnicode(INDICATORS[id].cells));
    expect(new Set(keys).size).toBe(4);
    expect(keys).toEqual(['⠠', '⠠⠠', '⠠⠠⠠', '⠠⠄']);
  });

  test('every sign cites a rule section that exists as a heading in the rulebook', () => {
    const sections = new Set(headings.map((h) => h.section));
    for (const s of ALL_SIGNS) {
      const twoLevel = s.rule.split('.').slice(0, 2).join('.');
      expect([s.id, sections.has(twoLevel)]).toEqual([s.id, true]);
    }
  });
});

describe('ICEB Rules of Unified English Braille (2024): contraction tables (section 10)', () => {
  test('the 23 alphabetic wordsigns match table 10.1', () => {
    expect(ALPHABETIC_WORDSIGNS).toHaveLength(23);
    for (const [word, letter] of ALPHABETIC_WORDSIGNS) {
      const e = entries.find((x) => x.section === '10.1' && x.text === word);
      expect([word, e?.braille]).toEqual([word, cellToUnicode(LETTER_CELLS[letter])]);
    }
  });

  test.each(CONTRACTIONS.map((c) => [c.text, c.kind, c] as const))(
    '%s (%s) matches its section 10 table',
    (_t, _k, c) => {
      const section = c.rule.split('.').slice(0, 2).join('.');
      const e = entries.find((x) => x.section === section && x.text.replace(/ \(see .*\)$/, '') === c.text);
      expect(e?.braille).toBe(cellsToUnicode(c.cells));
    },
  );
});

describe('UEB only: no EBAE or Nemeth patterns (trap 1)', () => {
  // Patterns from English Braille American Edition and the Nemeth Code that differ from UEB.
  test('parentheses are the two-cell UEB signs, not EBAE ⠶ (dots 2, 3, 5, 6)', () => {
    expect(cellsToUnicode(PUNCTUATION.openParen.cells)).toBe('⠐⠣');
    expect(cellsToUnicode(PUNCTUATION.closeParen.cells)).toBe('⠐⠜');
    expect(cellsToUnicode(PUNCTUATION.openParen.cells)).not.toBe('⠶');
  });
  test('dash is UEB ⠠⠤, not EBAE ⠤⠤', () => {
    expect(cellsToUnicode(PUNCTUATION.dash.cells)).toBe('⠠⠤');
  });
  test('decimal point is UEB ⠲ (dots 2, 5, 6), not EBAE ⠨ (dots 4, 6)', () => {
    expect(cellToUnicode(PUNCTUATION.period.cells[0])).toBe('⠲');
  });
  test('dollar sign is UEB ⠈⠎, not EBAE ⠫', () => {
    expect(cellsToUnicode(SYMBOLS.dollar.cells)).toBe('⠈⠎');
  });
  test('digits are the upper-cell letters a–j, never Nemeth lower-cell digits', () => {
    const nemethDigits = ['⠴', '⠂', '⠆', '⠒', '⠲', '⠢', '⠖', '⠶', '⠦', '⠔'];
    for (const d of Object.keys(DIGIT_CELLS)) expect(nemethDigits).not.toContain(cellToUnicode(DIGIT_CELLS[d]));
  });
  test('UEB math signs are the two-cell dot-5 signs, not Nemeth (⠬ plus, ⠨⠅ equals)', () => {
    expect(cellsToUnicode(SYMBOLS.plus.cells)).toBe('⠐⠖');
    expect(cellsToUnicode(SYMBOLS.equals.cells)).toBe('⠐⠶');
    expect(cellsToUnicode(SYMBOLS.times.cells)).toBe('⠐⠦');
    expect(cellsToUnicode(SYMBOLS.minus.cells)).toBe('⠐⠤');
  });
});
