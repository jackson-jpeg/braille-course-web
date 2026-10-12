/**
 * Prose about braille, generated from the data in lib/braille/ueb.ts.
 *
 * No lesson, game, caption or aria-label may type "dots 1 2 5" by hand. They either call the
 * describe helpers below or write a template such as "The numeric indicator is {dots:numeric}."
 * and pass it through `renderProse`. Structural claims ("K–T are A–J plus dot 3") come from
 * FACTS, which are computed from the cell data and throw if the data stops supporting them.
 */

import {
  type Cell,
  type Dot,
  ALL_DOTS,
  ALPHABET,
  CONTRACTIONS,
  dotPosition,
  DIGIT_LETTER,
  LETTER_CELLS,
  cellsToUnicode,
  getSign,
  mirrorCell,
  sameCell,
  toCell,
} from './ueb';
import { transcribe } from './transcribe';

/** "dot 6", "dots 1, 2, 5", or "blank cell". */
export function describeCell(cell: Cell): string {
  if (cell.length === 0) return 'blank cell';
  return `${cell.length === 1 ? 'dot' : 'dots'} ${cell.join(', ')}`;
}

/** "dot 6, then dots 1, 2" for a sequence of cells. */
export function describeCells(cells: readonly Cell[]): string {
  return cells.map(describeCell).join(', then ');
}

/** Short form for compact captions: "1-2-5", "6", "blank". */
export function shortDots(cell: Cell): string {
  return cell.length === 0 ? 'blank' : cell.join('-');
}

export function signCells(id: string): readonly Cell[] {
  if (id.startsWith('contraction:')) {
    const text = id.slice('contraction:'.length);
    const c = CONTRACTIONS.find((x) => x.text === text);
    if (!c) throw new Error(`prose: unknown contraction "${text}"`);
    return c.cells;
  }
  return getSign(id).cells;
}

/* ── Facts computed from the data ─────────────────────────────────────────── */

function difference(a: Cell, b: Cell): Dot[] {
  return a.filter((d) => !b.includes(d));
}

/** The single set of dots that turns every letter of `from` into the matching letter of `to`. */
function uniformAddition(from: string[], to: string[]): Cell {
  let added: Cell | null = null;
  from.forEach((f, i) => {
    const a = LETTER_CELLS[f];
    const b = LETTER_CELLS[to[i]];
    if (!a.every((d) => b.includes(d))) throw new Error(`prose fact: ${to[i]} does not contain ${f}`);
    const diff = toCell(difference(b, a));
    if (added && !sameCell(added, diff)) throw new Error(`prose fact: ${f}→${to[i]} adds a different set of dots`);
    added = diff;
  });
  return added!;
}

const firstDecade = ALPHABET.slice(0, 10); // a–j
const secondDecade = ALPHABET.slice(10, 20); // k–t
const thirdDecade = ['u', 'v', 'x', 'y', 'z'];

function dotsUsedBy(letters: string[]): Cell {
  return toCell(letters.flatMap((l) => LETTER_CELLS[l]));
}

function mirrorPairs(letters: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (const a of letters)
    for (const b of letters) if (a < b && sameCell(mirrorCell(LETTER_CELLS[a]), LETTER_CELLS[b])) pairs.push([a, b]);
  return pairs;
}

export const FACTS = {
  /** Dots that a–j are built from. */
  firstDecadeDots: dotsUsedBy(firstDecade),
  /** k–t = a–j plus these dots. */
  secondDecadeAdds: uniformAddition(firstDecade, secondDecade),
  /** u, v, x, y, z = a, b, c, d, e plus these dots. */
  thirdDecadeAdds: uniformAddition(['a', 'b', 'c', 'd', 'e'], thirdDecade),
  /** Letters of a–j that are left–right mirror images of each other. */
  firstDecadeMirrors: mirrorPairs(firstDecade),
  /** Is w the only letter outside the three-decade pattern? (Checked below.) */
  wIsException: (() => {
    const w = LETTER_CELLS.w;
    // w is j + dot 6; no other letter is formed that way.
    return sameCell(toCell([...LETTER_CELLS.j, 6]), w);
  })(),
};

if (!FACTS.wIsException) throw new Error('prose fact: w is no longer j plus dot 6');

/* ── Templates ────────────────────────────────────────────────────────────── */

/**
 * Render a prose template. Tokens:
 *   {dots:ID}      describeCells of a sign or "contraction:the"   → "dots 3, 4, 5, 6"
 *   {braille:ID}   Unicode braille of a sign                      → "⠼"
 *   {name:ID}      the sign's name                                → "numeric indicator"
 *   {ueb:TEXT}     Unicode braille of print TEXT (uncontracted)   → "⠠⠉⠁⠞"
 *   {uebdots:TEXT} dot description of print TEXT                  → "dot 6, then dots 1, 4, ..."
 *   {letter:x}     dot description of a letter                    → "dots 1, 2"
 *   {digit:3}      the letter a digit shares its cell with        → "c"
 *   {fact:NAME}    a computed fact from FACTS                     → "dot 3"
 * Unknown tokens throw, so a typo cannot reach the page.
 */
export function renderProse(template: string): string {
  return template.replace(/\{(\w+):([^}]+)\}/g, (_m, kind: string, arg: string) => {
    switch (kind) {
      case 'dots':
        return describeCells(signCells(arg));
      case 'braille':
        return cellsToUnicode(signCells(arg));
      case 'name':
        return getSign(arg).name;
      case 'ueb':
        return cellsToUnicode(transcribe(arg));
      case 'uebdots':
        return describeCells(transcribe(arg));
      case 'letter': {
        const cell = LETTER_CELLS[arg.toLowerCase()];
        if (!cell) throw new Error(`prose: unknown letter "${arg}"`);
        return describeCell(cell);
      }
      case 'digit': {
        const l = DIGIT_LETTER[arg];
        if (!l) throw new Error(`prose: unknown digit "${arg}"`);
        return l;
      }
      case 'fact':
        return renderFact(arg);
      case 'lowered':
        return loweredLetter(arg);
      default:
        throw new Error(`prose: unknown token {${kind}:${arg}}`);
    }
  });
}

function renderFact(name: string): string {
  switch (name) {
    case 'firstDecadeDots':
      return `dots ${FACTS.firstDecadeDots.join(', ')}`;
    case 'secondDecadeAdds':
      return describeCell(FACTS.secondDecadeAdds);
    case 'thirdDecadeAdds':
      return FACTS.thirdDecadeAdds.length === 2
        ? `dots ${FACTS.thirdDecadeAdds[0]} and ${FACTS.thirdDecadeAdds[1]}`
        : describeCell(FACTS.thirdDecadeAdds);
    case 'firstDecadeMirrors':
      return FACTS.firstDecadeMirrors.map(([a, b]) => `${a} and ${b}`).join(', ');
    case 'leftColumn':
    case 'rightColumn': {
      const col = name === 'leftColumn' ? 1 : 2;
      const dots = ALL_DOTS.filter((d) => dotPosition(d).column === col);
      return `dots ${dots.slice(0, -1).join(', ')} and ${dots[dots.length - 1]}`;
    }
    case 'topRow': {
      const dots = ALL_DOTS.filter((d) => dotPosition(d).row === 1);
      return `dots ${dots.join(' and ')}`;
    }
    case 'wAddsToJ':
      return describeCell(toCell(difference(LETTER_CELLS.w, LETTER_CELLS.j)));
    default:
      throw new Error(`prose: unknown fact "${name}"`);
  }
}

/**
 * The letter from a–j whose shape, moved down one row, is this one-cell sign (e.g. the period is
 * a lowered d). Throws when there is none, so a template cannot make the claim falsely.
 */
export function loweredLetter(signId: string): string {
  const cells = signCells(signId);
  if (cells.length !== 1) throw new Error(`prose: ${signId} is not one cell`);
  const target = cells[0];
  for (const l of firstDecade) {
    const cell = LETTER_CELLS[l];
    if (cell.some((d) => d === 3 || d === 6)) continue;
    const lowered = toCell(cell.map((d) => (d + 1) as Dot));
    if (sameCell(lowered, target)) return l;
  }
  throw new Error(`prose: ${signId} is not a lowered letter a–j`);
}

/** Screen-reader label for a cell: "dots 1, 2, 5" (or a name first when known). */
export function cellLabel(cell: Cell, name?: string): string {
  return name ? `${name}, ${describeCell(cell)}` : describeCell(cell);
}
