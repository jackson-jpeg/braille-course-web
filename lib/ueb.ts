/**
 * Unified English Braille (UEB): the single source of truth for every cell on this site.
 *
 * Every letter, digit, indicator, punctuation mark and contraction that any page, lesson or
 * game shows is defined here ONCE, as the list of raised dot numbers (1–6) in the standard cell:
 *
 *     1 ● ● 4
 *     2 ● ● 5
 *     3 ● ● 6
 *
 * Everything else (the legacy grid arrays in lib/braille-map.ts, the contraction list in
 * lib/contracted-braille-map.ts, Unicode braille strings, the lesson cells) is derived from
 * this file. The tests in __tests__/lib/ueb.test.ts check every entry against the official
 * UEB charts and against liblouis, the reference braille translator used by screen readers.
 *
 * If you change a pattern here, a test must fail — that is the point.
 */

/** Raised dot numbers, ascending, e.g. [1, 2] for "b". An empty array is a blank cell. */
export type Dots = readonly number[];

/* ── Letters ──────────────────────────────────────────────────────────────── */

export const LETTERS: Readonly<Record<string, Dots>> = {
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

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

/* ── Indicators ───────────────────────────────────────────────────────────── */

export interface Sign {
  /** Stable id used in code and tests. */
  id: string;
  /** Plain-language name shown to learners. */
  name: string;
  /** One or more cells. */
  cells: readonly Dots[];
  /** Print character(s) this sign stands for, when there is one. */
  print?: string;
}

export const INDICATORS = {
  capital: { id: 'capital', name: 'Capital letter indicator', cells: [[6]] },
  capitalWord: { id: 'capitalWord', name: 'Capitalized word indicator', cells: [[6], [6]] },
  capitalPassage: { id: 'capitalPassage', name: 'Capitalized passage indicator', cells: [[6], [6], [6]] },
  capitalTerminator: { id: 'capitalTerminator', name: 'Capitals terminator', cells: [[6], [3]] },
  numeric: { id: 'numeric', name: 'Numeric indicator (number sign)', cells: [[3, 4, 5, 6]] },
  grade1: { id: 'grade1', name: 'Grade 1 indicator', cells: [[5, 6]] },
  grade1Word: {
    id: 'grade1Word',
    name: 'Grade 1 word indicator',
    cells: [
      [5, 6],
      [5, 6],
    ],
  },
} as const satisfies Record<string, Sign>;

/* ── Digits: the numeric indicator followed by letters a–j ───────────────── */

/** Digit → the letter whose cell it shares (after a numeric indicator). */
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

export const DIGITS: Readonly<Record<string, Dots>> = Object.fromEntries(
  Object.entries(DIGIT_LETTER).map(([digit, letter]) => [digit, LETTERS[letter]]),
);

/* ── Punctuation ──────────────────────────────────────────────────────────── */

export const PUNCTUATION: readonly Sign[] = [
  { id: 'period', name: 'Period', print: '.', cells: [[2, 5, 6]] },
  { id: 'comma', name: 'Comma', print: ',', cells: [[2]] },
  { id: 'question', name: 'Question mark', print: '?', cells: [[2, 3, 6]] },
  { id: 'exclamation', name: 'Exclamation mark', print: '!', cells: [[2, 3, 5]] },
  { id: 'apostrophe', name: 'Apostrophe', print: '’', cells: [[3]] },
  { id: 'hyphen', name: 'Hyphen', print: '-', cells: [[3, 6]] },
  { id: 'colon', name: 'Colon', print: ':', cells: [[2, 5]] },
  { id: 'semicolon', name: 'Semicolon', print: ';', cells: [[2, 3]] },
  { id: 'openQuote', name: 'Opening quotation mark', print: '“', cells: [[2, 3, 6]] },
  { id: 'closeQuote', name: 'Closing quotation mark', print: '”', cells: [[3, 5, 6]] },
  { id: 'dash', name: 'Dash', print: '–', cells: [[6], [3, 6]] },
  { id: 'openParen', name: 'Opening parenthesis', print: '(', cells: [[5], [1, 2, 6]] },
  { id: 'closeParen', name: 'Closing parenthesis', print: ')', cells: [[5], [3, 4, 5]] },
  {
    id: 'slash',
    name: 'Slash',
    print: '/',
    cells: [
      [4, 5, 6],
      [3, 4],
    ],
  },
];

export function getPunctuation(id: string): Sign {
  const sign = PUNCTUATION.find((p) => p.id === id);
  if (!sign) throw new Error(`ueb: unknown punctuation "${id}"`);
  return sign;
}

/* ── Contractions (UEB Grade 2) ───────────────────────────────────────────── */

export type ContractionKind =
  | 'alphabetic-wordsign'
  | 'strong-contraction'
  | 'strong-groupsign'
  | 'strong-wordsign'
  | 'lower-groupsign'
  | 'lower-wordsign';

export interface Contraction {
  /** The print letters it stands for, e.g. "the", "ch". */
  text: string;
  dots: Dots;
  kind: ContractionKind;
  /** Short, plain-language rule of use for learners. */
  usage: string;
}

const STANDING_ALONE = 'Means the whole word only when it stands alone.';

/** The 23 alphabetic wordsigns: a single letter standing alone means a whole word. */
const ALPHABETIC_WORDSIGNS: readonly [string, string][] = [
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

export const CONTRACTIONS: readonly Contraction[] = [
  ...ALPHABETIC_WORDSIGNS.map(
    ([text, letter]): Contraction => ({
      text,
      dots: LETTERS[letter],
      kind: 'alphabetic-wordsign',
      usage: `The letter ${letter} standing alone. ${STANDING_ALONE}`,
    }),
  ),

  // Strong contractions: whole words with a cell of their own. Also used inside longer words.
  { text: 'and', dots: [1, 2, 3, 4, 6], kind: 'strong-contraction', usage: 'Used as a word or inside words.' },
  { text: 'for', dots: [1, 2, 3, 4, 5, 6], kind: 'strong-contraction', usage: 'Used as a word or inside words.' },
  { text: 'of', dots: [1, 2, 3, 5, 6], kind: 'strong-contraction', usage: 'Used as a word or inside words.' },
  { text: 'the', dots: [2, 3, 4, 6], kind: 'strong-contraction', usage: 'Used as a word or inside words.' },
  { text: 'with', dots: [2, 3, 4, 5, 6], kind: 'strong-contraction', usage: 'Used as a word or inside words.' },

  // Strong groupsigns: letter groups, used anywhere in a word.
  { text: 'ch', dots: [1, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'gh', dots: [1, 2, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'sh', dots: [1, 4, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'th', dots: [1, 4, 5, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'wh', dots: [1, 5, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'ed', dots: [1, 2, 4, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'er', dots: [1, 2, 4, 5, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'ou', dots: [1, 2, 5, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'ow', dots: [2, 4, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'st', dots: [3, 4], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'ar', dots: [3, 4, 5], kind: 'strong-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'ing', dots: [3, 4, 6], kind: 'strong-groupsign', usage: 'Used anywhere in a word except at the start.' },

  // Strong wordsigns: the same cells as six groupsigns, meaning a whole word when standing alone.
  { text: 'child', dots: [1, 6], kind: 'strong-wordsign', usage: `The ch sign standing alone. ${STANDING_ALONE}` },
  { text: 'shall', dots: [1, 4, 6], kind: 'strong-wordsign', usage: `The sh sign standing alone. ${STANDING_ALONE}` },
  { text: 'this', dots: [1, 4, 5, 6], kind: 'strong-wordsign', usage: `The th sign standing alone. ${STANDING_ALONE}` },
  { text: 'which', dots: [1, 5, 6], kind: 'strong-wordsign', usage: `The wh sign standing alone. ${STANDING_ALONE}` },
  { text: 'out', dots: [1, 2, 5, 6], kind: 'strong-wordsign', usage: `The ou sign standing alone. ${STANDING_ALONE}` },
  { text: 'still', dots: [3, 4], kind: 'strong-wordsign', usage: `The st sign standing alone. ${STANDING_ALONE}` },

  // Lower groupsigns: written in the lower part of the cell.
  { text: 'ea', dots: [2], kind: 'lower-groupsign', usage: 'Only in the middle of a word.' },
  { text: 'bb', dots: [2, 3], kind: 'lower-groupsign', usage: 'Only in the middle of a word.' },
  { text: 'cc', dots: [2, 5], kind: 'lower-groupsign', usage: 'Only in the middle of a word.' },
  { text: 'ff', dots: [2, 3, 5], kind: 'lower-groupsign', usage: 'Only in the middle of a word.' },
  { text: 'gg', dots: [2, 3, 5, 6], kind: 'lower-groupsign', usage: 'Only in the middle of a word.' },
  { text: 'be', dots: [2, 3], kind: 'lower-groupsign', usage: 'Only at the start of a word.' },
  { text: 'con', dots: [2, 5], kind: 'lower-groupsign', usage: 'Only at the start of a word.' },
  { text: 'dis', dots: [2, 5, 6], kind: 'lower-groupsign', usage: 'Only at the start of a word.' },
  { text: 'en', dots: [2, 6], kind: 'lower-groupsign', usage: 'Used anywhere in a word.' },
  { text: 'in', dots: [3, 5], kind: 'lower-groupsign', usage: 'Used anywhere in a word.' },

  // Lower wordsigns: whole words written in the lower part of the cell, standing alone.
  { text: 'be', dots: [2, 3], kind: 'lower-wordsign', usage: STANDING_ALONE },
  { text: 'enough', dots: [2, 6], kind: 'lower-wordsign', usage: STANDING_ALONE },
  { text: 'were', dots: [2, 3, 5, 6], kind: 'lower-wordsign', usage: STANDING_ALONE },
  { text: 'his', dots: [2, 3, 6], kind: 'lower-wordsign', usage: STANDING_ALONE },
  { text: 'in', dots: [3, 5], kind: 'lower-wordsign', usage: STANDING_ALONE },
  { text: 'was', dots: [3, 5, 6], kind: 'lower-wordsign', usage: STANDING_ALONE },
];

/** Find a contraction by its print text, optionally restricted to one kind. */
export function getContraction(text: string, kind?: ContractionKind): Contraction {
  const found = CONTRACTIONS.find((c) => c.text === text && (!kind || c.kind === kind));
  if (!found) throw new Error(`ueb: unknown contraction "${text}"${kind ? ` (${kind})` : ''}`);
  return found;
}

export const KIND_LABELS: Readonly<Record<ContractionKind, string>> = {
  'alphabetic-wordsign': 'Alphabetic wordsign',
  'strong-contraction': 'Strong contraction',
  'strong-groupsign': 'Strong groupsign',
  'strong-wordsign': 'Strong wordsign',
  'lower-groupsign': 'Lower groupsign',
  'lower-wordsign': 'Lower wordsign',
};

/* ── Conversions ──────────────────────────────────────────────────────────── */

/** Dots → Unicode braille pattern character (U+2800 block). */
export function toUnicode(dots: Dots): string {
  let code = 0x2800;
  for (const d of dots) code |= 1 << (d - 1);
  return String.fromCharCode(code);
}

/** Unicode braille pattern character → dots. */
export function fromUnicode(ch: string): number[] {
  const code = ch.charCodeAt(0) - 0x2800;
  if (code < 0 || code > 0x3f) throw new Error(`ueb: not a 6-dot braille character: "${ch}"`);
  const dots: number[] = [];
  for (let d = 1; d <= 6; d++) if (code & (1 << (d - 1))) dots.push(d);
  return dots;
}

/** Cells → Unicode string. */
export function cellsToUnicode(cells: readonly Dots[]): string {
  return cells.map(toUnicode).join('');
}

/**
 * Dots → legacy 6-slot grid array [d1, d4, d2, d5, d3, d6] (1 = raised).
 * This is the reading order of a 2-column CSS grid, used by older components.
 */
export function toGrid(dots: Dots): number[] {
  return [1, 4, 2, 5, 3, 6].map((d) => (dots.includes(d) ? 1 : 0));
}

/** Legacy grid array → dots. */
export function fromGrid(grid: readonly number[]): number[] {
  const order = [1, 4, 2, 5, 3, 6];
  return order.filter((_, i) => grid[i]).sort((a, b) => a - b);
}

/** Dots → "dots 1 2 5" style description for screen readers and captions. */
export function describe(dots: Dots): string {
  if (dots.length === 0) return 'blank cell';
  return `${dots.length === 1 ? 'dot' : 'dots'} ${dots.join(' ')}`;
}

/** Same as describe, for a sequence of cells: "dots 3 4 5 6, then dot 1". */
export function describeCells(cells: readonly Dots[]): string {
  return cells.map(describe).join(', then ');
}

export function sameDots(a: Dots, b: Dots): boolean {
  return a.length === b.length && [...a].sort().every((d, i) => d === [...b].sort()[i]);
}

/* ── Uncontracted (Grade 1) transcription ─────────────────────────────────── */

export interface Cell {
  dots: Dots;
  /** What this cell represents in print, for labels ("H", "number sign", "."). */
  label: string;
}

const PUNCT_BY_PRINT = new Map<string, Sign>();
for (const p of PUNCTUATION) if (p.print) PUNCT_BY_PRINT.set(p.print, p);
PUNCT_BY_PRINT.set("'", getPunctuation('apostrophe'));

/**
 * Transcribe print text into uncontracted UEB (no contractions), cell by cell.
 *
 * Handles what the beginner track teaches: letters, capital letters (single-letter and
 * whole-word capital indicators), numbers (numeric indicator, with a grade 1 indicator when a
 * letter a–j directly follows digits), spaces, and the common punctuation in PUNCTUATION.
 * Straight double quotes alternate between opening and closing.
 * Throws on any character it does not know, so a game can never show a made-up cell.
 */
export function transcribe(text: string): Cell[] {
  const out: Cell[] = [];
  const words = text.split(/( +)/);
  let quoteOpen = false;

  for (const chunk of words) {
    if (/^ +$/.test(chunk)) {
      for (let i = 0; i < chunk.length; i++) out.push({ dots: [], label: 'space' });
      continue;
    }
    if (!chunk) continue;

    // Capital indicators apply per run of letters: a run of 2+ capitals takes the capitalized
    // word indicator; any other capital letter takes the single capital indicator. A non-letter
    // (such as an apostrophe) ends the run, as in UEB §8.
    const capsRunStart = new Set<number>();
    const inCapsRun = new Set<number>();
    for (const m of chunk.matchAll(/[A-Za-z]+/g)) {
      const run = m[0];
      if (run.length >= 2 && run === run.toUpperCase()) {
        capsRunStart.add(m.index!);
        for (let k = 0; k < run.length; k++) inCapsRun.add(m.index! + k);
      }
    }

    let inNumber = false;
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];

      if (/[0-9]/.test(ch)) {
        if (!inNumber) out.push({ dots: INDICATORS.numeric.cells[0], label: 'number sign' });
        inNumber = true;
        out.push({ dots: DIGITS[ch], label: ch });
        continue;
      }

      if (/[A-Za-z]/.test(ch)) {
        const lower = ch.toLowerCase();
        if (inNumber && 'abcdefghij'.includes(lower) && ch === lower) {
          out.push({ dots: INDICATORS.grade1.cells[0], label: 'grade 1 indicator' });
        }
        inNumber = false;
        if (capsRunStart.has(i)) {
          out.push(...INDICATORS.capitalWord.cells.map((dots) => ({ dots, label: 'capital word' })));
        } else if (!inCapsRun.has(i) && ch !== lower) {
          out.push({ dots: INDICATORS.capital.cells[0], label: 'capital' });
        }
        out.push({ dots: LETTERS[lower], label: ch });
        continue;
      }

      if (inNumber && (ch === '.' || ch === ',') && /[0-9]/.test(chunk[i + 1] ?? '')) {
        // Decimal point or digit-group comma inside a number keeps numeric mode.
        out.push({ dots: ch === '.' ? [2, 5, 6] : [2], label: ch });
        continue;
      }
      inNumber = false;

      let sign: Sign | undefined;
      if (ch === '"') {
        sign = getPunctuation(quoteOpen ? 'closeQuote' : 'openQuote');
        quoteOpen = !quoteOpen;
      } else {
        sign = PUNCT_BY_PRINT.get(ch);
        if (ch === '“') quoteOpen = true;
        if (ch === '”') quoteOpen = false;
      }
      if (!sign) throw new Error(`ueb.transcribe: no braille defined for "${ch}" in "${text}"`);
      for (const dots of sign.cells) out.push({ dots, label: sign.name.toLowerCase() });
    }
  }
  return out;
}

/** Transcribe to a Unicode braille string (spaces become U+2800 blank cells). */
export function transcribeToUnicode(text: string): string {
  return transcribe(text)
    .map((c) => toUnicode(c.dots))
    .join('');
}

/** A spoken-friendly description of a word's cells, e.g. for aria-labels. */
export function describeWord(text: string): string {
  return transcribe(text)
    .map((c) => (c.label === 'space' ? 'space' : `${c.label}: ${describe(c.dots)}`))
    .join('; ');
}
