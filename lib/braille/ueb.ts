/**
 * Unified English Braille (UEB): the ONE place on this site where braille cells are defined.
 *
 * Every letter, digit, indicator, punctuation mark, symbol and contraction that a lesson, game,
 * caption, aria-label or AI prompt shows comes from this file. Nothing else in the codebase may
 * spell out a dot pattern (a lint test in __tests__/braille/no-hardcoded-braille.test.ts enforces
 * that).
 *
 * A cell is the list of its raised dots, ascending. The standard cell is numbered:
 *
 *     1 ● ● 4
 *     2 ● ● 5
 *     3 ● ● 6
 *
 * Every sign carries `rule`: the section of the International Council on English Braille's
 * "Rules of Unified English Braille", Third Edition 2024 (ICEB), that defines it. Those
 * citations are checked against the rulebook itself (see __tests__/fixtures/iceb-rulebook-signs.json
 * and scripts/braille/extract-rulebook-signs.py), and every pattern is checked against liblouis
 * (en-ueb-g1.ctb / en-ueb-g2.ctb) and against the Unicode braille block. If you change a
 * pattern here, tests must fail. That is the point.
 */

export type Dot = 1 | 2 | 3 | 4 | 5 | 6;
/** Raised dots of one cell, ascending. An empty array is a blank cell (a space). */
export type Cell = readonly Dot[];

export const RULEBOOK = {
  title: 'Rules of Unified English Braille',
  edition: 'Third Edition 2024',
  publisher: 'International Council on English Braille (ICEB)',
  url: 'https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf',
  sha256: 'bf742499ee2eb3cbdf4914d97bbf0b2857bd3e91621f04a4990091b64e5a105e',
} as const;

export type SignKind = 'letter' | 'digit' | 'indicator' | 'punctuation' | 'symbol';

export interface Sign {
  /** Stable id used in code, tests and prose templates, e.g. "capitalWord". */
  id: string;
  kind: SignKind;
  /** Plain-language name shown to learners (BANA / US spelling). */
  name: string;
  /** The print character(s) this sign transcribes, when it has one. */
  print?: string;
  /** One or more cells, in reading order. */
  cells: readonly Cell[];
  /** ICEB Rules of UEB (2024) section that defines the sign. */
  rule: string;
  /** Short, plain-language note on how the sign is used. Shown in lessons. */
  usage?: string;
}

/* ── Letters (ICEB 4.1) ───────────────────────────────────────────────────── */

export const LETTER_CELLS: Readonly<Record<string, Cell>> = {
  a: [1],
  b: [1, 2],
  c: [1, 4],
  d: [1, 4, 5],
  e: [1, 5],
  f: [1, 2, 4],
  g: [1, 2, 4, 5],
  h: [1, 2, 5],
  i: [2, 4],
  j: [2, 4, 5],
  k: [1, 3],
  l: [1, 2, 3],
  m: [1, 3, 4],
  n: [1, 3, 4, 5],
  o: [1, 3, 5],
  p: [1, 2, 3, 4],
  q: [1, 2, 3, 4, 5],
  r: [1, 2, 3, 5],
  s: [2, 3, 4],
  t: [2, 3, 4, 5],
  u: [1, 3, 6],
  v: [1, 2, 3, 6],
  w: [2, 4, 5, 6],
  x: [1, 3, 4, 6],
  y: [1, 3, 4, 5, 6],
  z: [1, 3, 5, 6],
};

export const ALPHABET: readonly string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');

export const LETTERS: readonly Sign[] = ALPHABET.map((l) => ({
  id: `letter-${l}`,
  kind: 'letter' as const,
  name: `Letter ${l.toUpperCase()}`,
  print: l,
  cells: [LETTER_CELLS[l]],
  rule: '4.1',
}));

/* ── Digits (ICEB 6.1): the numeric indicator, then a letter a–j ─────────── */

/** Digit → the letter whose cell it uses in numeric mode. */
export const DIGIT_LETTER: Readonly<Record<string, string>> = {
  '1': 'a',
  '2': 'b',
  '3': 'c',
  '4': 'd',
  '5': 'e',
  '6': 'f',
  '7': 'g',
  '8': 'h',
  '9': 'i',
  '0': 'j',
};

export const DIGITS_IN_ORDER: readonly string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/** The cell a digit uses once numeric mode is set (the same cell as its letter). */
export const DIGIT_CELLS: Readonly<Record<string, Cell>> = Object.fromEntries(
  DIGITS_IN_ORDER.map((d) => [d, LETTER_CELLS[DIGIT_LETTER[d]]]),
);

/* ── Indicators (ICEB sections 5, 6 and 8) ────────────────────────────────── */

const CAP: Cell = [6];
const NUM: Cell = [3, 4, 5, 6];
const G1: Cell = [5, 6];

export const INDICATORS = {
  capitalLetter: {
    id: 'capitalLetter',
    kind: 'indicator',
    name: 'capital letter indicator',
    cells: [CAP],
    rule: '8.3.1',
    usage: 'Makes the next letter a capital.',
  },
  capitalWord: {
    id: 'capitalWord',
    kind: 'indicator',
    name: 'capitalized word indicator',
    cells: [CAP, CAP],
    rule: '8.4',
    usage:
      'Makes every letter capital until a space, a non-letter (like an apostrophe or hyphen), or a capitals terminator.',
  },
  capitalPassage: {
    id: 'capitalPassage',
    kind: 'indicator',
    name: 'capitalized passage indicator',
    cells: [CAP, CAP, CAP],
    rule: '8.5',
    usage: 'Used before three or more capitalized words in a row. Ended by the capitals terminator.',
  },
  capitalsTerminator: {
    id: 'capitalsTerminator',
    kind: 'indicator',
    name: 'capitals terminator',
    cells: [CAP, [3]],
    rule: '8.6',
    usage: 'Ends a capitalized passage, or ends capitals partway through a word.',
  },
  numeric: {
    id: 'numeric',
    kind: 'indicator',
    name: 'numeric indicator',
    cells: [NUM],
    rule: '6.1',
    usage: 'Placed before a number. Letters a to j that follow it are read as the digits 1 to 9 and 0.',
  },
  grade1Symbol: {
    id: 'grade1Symbol',
    kind: 'indicator',
    name: 'grade 1 indicator',
    cells: [G1],
    rule: '5.2',
    usage:
      'In uncontracted braille, used mainly before a lowercase letter a to j right after a number, and before a question mark at the start of a word.',
  },
  grade1Word: {
    id: 'grade1Word',
    kind: 'indicator',
    name: 'grade 1 word indicator',
    cells: [G1, G1],
    rule: '5.3',
  },
  italicSymbol: {
    id: 'italicSymbol',
    kind: 'indicator',
    name: 'italic symbol indicator',
    cells: [
      [4, 6],
      [2, 3],
    ],
    rule: '9.2',
  },
  italicWord: { id: 'italicWord', kind: 'indicator', name: 'italic word indicator', cells: [[4, 6], [2]], rule: '9.3' },
  boldSymbol: {
    id: 'boldSymbol',
    kind: 'indicator',
    name: 'boldface symbol indicator',
    cells: [
      [4, 5],
      [2, 3],
    ],
    rule: '9.2',
  },
  boldWord: { id: 'boldWord', kind: 'indicator', name: 'boldface word indicator', cells: [[4, 5], [2]], rule: '9.3' },
  underlineSymbol: {
    id: 'underlineSymbol',
    kind: 'indicator',
    name: 'underlined symbol indicator',
    cells: [
      [4, 5, 6],
      [2, 3],
    ],
    rule: '9.2',
  },
  underlineWord: {
    id: 'underlineWord',
    kind: 'indicator',
    name: 'underlined word indicator',
    cells: [[4, 5, 6], [2]],
    rule: '9.3',
  },
} as const satisfies Record<string, Sign>;

export type IndicatorId = keyof typeof INDICATORS;

/* ── Punctuation (ICEB section 7) ─────────────────────────────────────────── */

export const PUNCTUATION = {
  period: { id: 'period', kind: 'punctuation', name: 'period', print: '.', cells: [[2, 5, 6]], rule: '7.1' },
  comma: { id: 'comma', kind: 'punctuation', name: 'comma', print: ',', cells: [[2]], rule: '7.1' },
  question: {
    id: 'question',
    kind: 'punctuation',
    name: 'question mark',
    print: '?',
    cells: [[2, 3, 6]],
    rule: '7.5',
    usage: 'Shares its cell with the opening quotation mark. Its place in the sentence tells you which it is.',
  },
  exclamation: {
    id: 'exclamation',
    kind: 'punctuation',
    name: 'exclamation mark',
    print: '!',
    cells: [[2, 3, 5]],
    rule: '7.1',
  },
  colon: { id: 'colon', kind: 'punctuation', name: 'colon', print: ':', cells: [[2, 5]], rule: '7.1' },
  semicolon: { id: 'semicolon', kind: 'punctuation', name: 'semicolon', print: ';', cells: [[2, 3]], rule: '7.1' },
  apostrophe: { id: 'apostrophe', kind: 'punctuation', name: 'apostrophe', print: '’', cells: [[3]], rule: '7.6.6' },
  hyphen: { id: 'hyphen', kind: 'punctuation', name: 'hyphen', print: '-', cells: [[3, 6]], rule: '7.2' },
  dash: { id: 'dash', kind: 'punctuation', name: 'dash', print: '–', cells: [[6], [3, 6]], rule: '7.2' },
  openQuote: {
    id: 'openQuote',
    kind: 'punctuation',
    name: 'opening quotation mark',
    print: '“',
    cells: [[2, 3, 6]],
    rule: '7.6.1',
    usage: 'Shares its cell with the question mark. It comes at the start of a word; a question mark comes at the end.',
  },
  closeQuote: {
    id: 'closeQuote',
    kind: 'punctuation',
    name: 'closing quotation mark',
    print: '”',
    cells: [[3, 5, 6]],
    rule: '7.6.1',
  },
  openSingleQuote: {
    id: 'openSingleQuote',
    kind: 'punctuation',
    name: 'opening single quotation mark',
    print: '‘',
    cells: [[6], [2, 3, 6]],
    rule: '7.6.2',
  },
  closeSingleQuote: {
    id: 'closeSingleQuote',
    kind: 'punctuation',
    name: 'closing single quotation mark',
    print: '’',
    cells: [[6], [3, 5, 6]],
    rule: '7.6.2',
  },
  openParen: {
    id: 'openParen',
    kind: 'punctuation',
    name: 'opening parenthesis',
    print: '(',
    cells: [[5], [1, 2, 6]],
    rule: '7.1',
  },
  closeParen: {
    id: 'closeParen',
    kind: 'punctuation',
    name: 'closing parenthesis',
    print: ')',
    cells: [[5], [3, 4, 5]],
    rule: '7.1',
  },
  slash: {
    id: 'slash',
    kind: 'punctuation',
    name: 'slash',
    print: '/',
    cells: [
      [4, 5, 6],
      [3, 4],
    ],
    rule: '7.4',
  },
  ellipsis: {
    id: 'ellipsis',
    kind: 'punctuation',
    name: 'ellipsis',
    print: '...',
    cells: [
      [2, 5, 6],
      [2, 5, 6],
      [2, 5, 6],
    ],
    rule: '7.3',
  },
} as const satisfies Record<string, Sign>;

export type PunctuationId = keyof typeof PUNCTUATION;

/* ── General symbols (ICEB section 3) ─────────────────────────────────────── */

export const SYMBOLS = {
  ampersand: {
    id: 'ampersand',
    kind: 'symbol',
    name: 'ampersand',
    print: '&',
    cells: [[4], [1, 2, 3, 4, 6]],
    rule: '3.1',
  },
  at: { id: 'at', kind: 'symbol', name: 'at sign', print: '@', cells: [[4], [1]], rule: '3.7' },
  dollar: { id: 'dollar', kind: 'symbol', name: 'dollar sign', print: '$', cells: [[4], [2, 3, 4]], rule: '3.10' },
  percent: {
    id: 'percent',
    kind: 'symbol',
    name: 'percent sign',
    print: '%',
    cells: [
      [4, 6],
      [3, 5, 6],
    ],
    rule: '3.21',
  },
  plus: { id: 'plus', kind: 'symbol', name: 'plus sign', print: '+', cells: [[5], [2, 3, 5]], rule: '3.17' },
  minus: { id: 'minus', kind: 'symbol', name: 'minus sign', print: '−', cells: [[5], [3, 6]], rule: '3.17' },
  times: {
    id: 'times',
    kind: 'symbol',
    name: 'multiplication sign',
    print: '×',
    cells: [[5], [2, 3, 6]],
    rule: '3.17',
  },
  divide: { id: 'divide', kind: 'symbol', name: 'division sign', print: '÷', cells: [[5], [3, 4]], rule: '3.17' },
  equals: { id: 'equals', kind: 'symbol', name: 'equals sign', print: '=', cells: [[5], [2, 3, 5, 6]], rule: '3.17' },
} as const satisfies Record<string, Sign>;

export type SymbolId = keyof typeof SYMBOLS;

/* ── All non-contraction signs ───────────────────────────────────────────── */

export const DIGIT_SIGNS: readonly Sign[] = DIGITS_IN_ORDER.map((d) => ({
  id: `digit-${d}`,
  kind: 'digit' as const,
  name: `Digit ${d}`,
  print: d,
  cells: [NUM, DIGIT_CELLS[d]],
  rule: '6.1',
}));

export const ALL_SIGNS: readonly Sign[] = [
  ...LETTERS,
  ...DIGIT_SIGNS,
  ...Object.values(INDICATORS),
  ...Object.values(PUNCTUATION),
  ...Object.values(SYMBOLS),
];

const SIGN_BY_ID = new Map<string, Sign>(ALL_SIGNS.map((s) => [s.id, s]));

export function getSign(id: string): Sign {
  const s = SIGN_BY_ID.get(id);
  if (!s) throw new Error(`ueb: unknown sign "${id}"`);
  return s;
}

/* ── Contractions (UEB contracted / grade 2, ICEB section 10) ─────────────── */

export type ContractionKind =
  | 'alphabetic-wordsign'
  | 'strong-wordsign'
  | 'strong-contraction'
  | 'strong-groupsign'
  | 'lower-wordsign'
  | 'lower-groupsign';

export interface Contraction {
  /** The print letters it stands for, e.g. "the", "ch". */
  text: string;
  cells: readonly Cell[];
  kind: ContractionKind;
  rule: string;
  /** Short, plain-language rule of use for learners. */
  usage: string;
}

const ALONE = 'Means the whole word only when it stands alone.';
const LOWER_ALONE =
  'Means the whole word when it stands alone and does not touch punctuation that uses only lower dots.';

/** ICEB 2.2 / 10.1: the 23 alphabetic wordsigns, as [word, letter]. */
export const ALPHABETIC_WORDSIGNS: readonly (readonly [string, string])[] = [
  ['but', 'b'],
  ['can', 'c'],
  ['do', 'd'],
  ['every', 'e'],
  ['from', 'f'],
  ['go', 'g'],
  ['have', 'h'],
  ['just', 'j'],
  ['knowledge', 'k'],
  ['like', 'l'],
  ['more', 'm'],
  ['not', 'n'],
  ['people', 'p'],
  ['quite', 'q'],
  ['rather', 'r'],
  ['so', 's'],
  ['that', 't'],
  ['us', 'u'],
  ['very', 'v'],
  ['will', 'w'],
  ['it', 'x'],
  ['you', 'y'],
  ['as', 'z'],
];

function contraction(text: string, cell: Cell, kind: ContractionKind, rule: string, usage: string): Contraction {
  return { text, cells: [cell], kind, rule, usage };
}

export const CONTRACTIONS: readonly Contraction[] = [
  ...ALPHABETIC_WORDSIGNS.map(([text, l]) =>
    contraction(text, LETTER_CELLS[l], 'alphabetic-wordsign', '10.1', `The letter ${l} standing alone. ${ALONE}`),
  ),

  contraction('child', [1, 6], 'strong-wordsign', '10.2', `The ch cell standing alone. ${ALONE}`),
  contraction('shall', [1, 4, 6], 'strong-wordsign', '10.2', `The sh cell standing alone. ${ALONE}`),
  contraction('this', [1, 4, 5, 6], 'strong-wordsign', '10.2', `The th cell standing alone. ${ALONE}`),
  contraction('which', [1, 5, 6], 'strong-wordsign', '10.2', `The wh cell standing alone. ${ALONE}`),
  contraction('out', [1, 2, 5, 6], 'strong-wordsign', '10.2', `The ou cell standing alone. ${ALONE}`),
  contraction('still', [3, 4], 'strong-wordsign', '10.2', `The st cell standing alone. ${ALONE}`),

  contraction('and', [1, 2, 3, 4, 6], 'strong-contraction', '10.3', 'Used as a whole word or inside longer words.'),
  contraction('for', [1, 2, 3, 4, 5, 6], 'strong-contraction', '10.3', 'Used as a whole word or inside longer words.'),
  contraction('of', [1, 2, 3, 5, 6], 'strong-contraction', '10.3', 'Used as a whole word or inside longer words.'),
  contraction('the', [2, 3, 4, 6], 'strong-contraction', '10.3', 'Used as a whole word or inside longer words.'),
  contraction('with', [2, 3, 4, 5, 6], 'strong-contraction', '10.3', 'Used as a whole word or inside longer words.'),

  contraction('ch', [1, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('gh', [1, 2, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('sh', [1, 4, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('th', [1, 4, 5, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('wh', [1, 5, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('ed', [1, 2, 4, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('er', [1, 2, 4, 5, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('ou', [1, 2, 5, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('ow', [2, 4, 6], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('st', [3, 4], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('ar', [3, 4, 5], 'strong-groupsign', '10.4', 'Used anywhere in a word.'),
  contraction('ing', [3, 4, 6], 'strong-groupsign', '10.4.3', 'Used anywhere in a word except at the beginning.'),

  contraction('be', [2, 3], 'lower-wordsign', '10.5.1', LOWER_ALONE),
  contraction('enough', [2, 6], 'lower-wordsign', '10.5.2', ALONE),
  contraction('were', [2, 3, 5, 6], 'lower-wordsign', '10.5.1', LOWER_ALONE),
  contraction('his', [2, 3, 6], 'lower-wordsign', '10.5.1', LOWER_ALONE),
  contraction(
    'in',
    [3, 5],
    'lower-wordsign',
    '10.5.3',
    'Used for the word “in” wherever it occurs, as long as it touches a cell with an upper dot or stands alone.',
  ),
  contraction('was', [3, 5, 6], 'lower-wordsign', '10.5.1', LOWER_ALONE),

  contraction('ea', [2], 'lower-groupsign', '10.6.5', 'Only between two letters inside a word.'),
  contraction('bb', [2, 3], 'lower-groupsign', '10.6.5', 'Only between two letters inside a word.'),
  contraction('cc', [2, 5], 'lower-groupsign', '10.6.5', 'Only between two letters inside a word.'),
  contraction('ff', [2, 3, 5], 'lower-groupsign', '10.6.5', 'Only between two letters inside a word.'),
  contraction('gg', [2, 3, 5, 6], 'lower-groupsign', '10.6.5', 'Only between two letters inside a word.'),
  contraction('be', [2, 3], 'lower-groupsign', '10.6.2', 'Only at the beginning of a word, followed by more letters.'),
  contraction('con', [2, 5], 'lower-groupsign', '10.6.2', 'Only at the beginning of a word, followed by more letters.'),
  contraction(
    'dis',
    [2, 5, 6],
    'lower-groupsign',
    '10.6.2',
    'Only at the beginning of a word, followed by more letters.',
  ),
  contraction('en', [2, 6], 'lower-groupsign', '10.6.8', 'Used anywhere in a word.'),
  contraction('in', [3, 5], 'lower-groupsign', '10.6.8', 'Used anywhere in a word.'),
];

export const CONTRACTION_KIND_LABELS: Readonly<Record<ContractionKind, string>> = {
  'alphabetic-wordsign': 'Alphabetic wordsign',
  'strong-wordsign': 'Strong wordsign',
  'strong-contraction': 'Strong contraction',
  'strong-groupsign': 'Strong groupsign',
  'lower-wordsign': 'Lower wordsign',
  'lower-groupsign': 'Lower groupsign',
};

/** Find a contraction by its print text, optionally restricted to one kind. */
export function getContraction(text: string, kind?: ContractionKind): Contraction {
  const found = CONTRACTIONS.find((c) => c.text === text && (!kind || c.kind === kind));
  if (!found) throw new Error(`ueb: unknown contraction "${text}"${kind ? ` (${kind})` : ''}`);
  return found;
}

/* ── Cell utilities ───────────────────────────────────────────────────────── */

export function cellKey(cell: Cell): string {
  return cell.join('');
}

export function cellsKey(cells: readonly Cell[]): string {
  return cells.map(cellKey).join('|');
}

export function sameCell(a: Cell, b: Cell): boolean {
  return cellKey(a) === cellKey(b);
}

export function sameCells(a: readonly Cell[], b: readonly Cell[]): boolean {
  return cellsKey(a) === cellsKey(b);
}

/** Validate and normalise an arbitrary list of dot numbers into a Cell. Throws on bad input. */
export function toCell(dots: readonly number[]): Cell {
  const set = new Set(dots);
  for (const d of set) if (!Number.isInteger(d) || d < 1 || d > 6) throw new Error(`ueb: bad dot ${d}`);
  return [...set].sort((a, b) => a - b) as Dot[];
}

/** Dots → Unicode braille pattern character (U+2800 block, dot n = bit 2^(n-1)). */
export function cellToUnicode(cell: Cell): string {
  let code = 0x2800;
  for (const d of cell) code |= 1 << (d - 1);
  return String.fromCharCode(code);
}

/** Unicode braille pattern character → dots. Rejects 8-dot patterns (dots 7, 8). */
export function unicodeToCell(ch: string): Cell {
  const code = ch.codePointAt(0)! - 0x2800;
  if (ch.length !== 1 || code < 0 || code > 0x3f) throw new Error(`ueb: not a 6-dot braille character: "${ch}"`);
  const dots: Dot[] = [];
  for (let d = 1; d <= 6; d++) if (code & (1 << (d - 1))) dots.push(d as Dot);
  return dots;
}

export function cellsToUnicode(cells: readonly Cell[]): string {
  return cells.map(cellToUnicode).join('');
}

export function unicodeToCells(text: string): Cell[] {
  return [...text].map(unicodeToCell);
}

/**
 * Where a dot is drawn in the cell: column 1 holds dots 1-2-3 (top to bottom), column 2 holds
 * dots 4-5-6. Every renderer uses this, and the rendering tests check it.
 */
export function dotPosition(dot: Dot): { column: 1 | 2; row: 1 | 2 | 3 } {
  return { column: dot <= 3 ? 1 : 2, row: (((dot - 1) % 3) + 1) as 1 | 2 | 3 };
}

export const ALL_DOTS: readonly Dot[] = [1, 2, 3, 4, 5, 6];

/** All 64 possible six-dot cells (including the blank cell). */
export const ALL_CELLS: readonly Cell[] = Array.from({ length: 64 }, (_, n) =>
  ALL_DOTS.filter((d) => n & (1 << (d - 1))),
);

/** Left-right mirror (dot 1↔4, 2↔5, 3↔6): how a cell looks from the back of the page. */
export function mirrorCell(cell: Cell): Cell {
  return toCell(cell.map((d) => (d <= 3 ? d + 3 : d - 3)));
}

/* ── Legacy grid adapter ──────────────────────────────────────────────────── */

/**
 * The older components store a cell as a 6-slot array in [d1, d4, d2, d5, d3, d6] order.
 * These adapters exist only so they can be fed from this module.
 */
export const GRID_ORDER: readonly Dot[] = [1, 4, 2, 5, 3, 6];

export function cellToGrid(cell: Cell): number[] {
  return GRID_ORDER.map((d) => (cell.includes(d) ? 1 : 0));
}

export function gridToCell(grid: readonly number[]): Cell {
  if (grid.length !== 6) throw new Error('ueb: grid must have 6 slots');
  return toCell(GRID_ORDER.filter((_, i) => grid[i]));
}
