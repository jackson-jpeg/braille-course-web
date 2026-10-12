/**
 * Dot Explorer: what a single cell means (pure, no React).
 *
 * Every meaning comes from lib/braille: letters, single-cell indicators and punctuation
 * (signsWithCells), the digit a cell becomes after the numeric indicator (DIGIT_CELLS), the
 * multi-cell signs the cell begins, and — in contracted mode — every contraction written with
 * that cell (contractionsWithCells), with its kind and rule of use. Many cells mean several
 * things (ICEB 2.4.2); the explorer lists them all instead of picking one.
 *
 * Site convention: a plain letter cell is a lowercase letter (ICEB 4.1, 8.3.1), so letters are
 * shown in lowercase.
 */
import {
  type Cell,
  type Dot,
  ALL_SIGNS,
  CONTRACTION_KIND_LABELS,
  DIGITS_IN_ORDER,
  DIGIT_CELLS,
  cellKey,
  getSign,
} from '@/lib/braille/ueb';
import { contractionsWithCells, signsWithCells } from '@/lib/braille/shared';
import { describeCell, describeCells } from '@/lib/braille/prose';
import { type InventoryItem, g1Item } from '@/lib/braille/inventory';
import { standaloneWords } from '@/lib/contraction-words';

export type ExplorerMode = 'alphabetic' | 'contracted';

export type MeaningKind = 'letter' | 'digit' | 'indicator' | 'punctuation' | 'symbol' | 'starts-sign' | 'contraction';

export interface CellMeaning {
  /** Stable id: a sign id ("letter-h", "period"), "digit-8", "starts:openParen" or "contraction:ch:strong-groupsign". */
  id: string;
  kind: MeaningKind;
  /** Short form for the big display: "h", "ch", ".", "numeric indicator". */
  short: string;
  /** Full line: "Letter h", "Strong groupsign: ch". */
  title: string;
  /** How it is used (from the canonical data). */
  detail?: string;
  /** ICEB Rules of UEB (2024) section. */
  rule: string;
}

/** The dot keys 1–6 toggle; C clears. */
export const DOT_KEYS: Readonly<Record<string, Dot>> = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };

export function cellMeanings(cell: Cell, mode: ExplorerMode): CellMeaning[] {
  if (cell.length === 0) return [];
  const out: CellMeaning[] = [];

  for (const s of signsWithCells([cell])) {
    if (s.kind === 'letter') {
      out.push({
        id: s.id,
        kind: 'letter',
        short: s.print!,
        title: `Letter ${s.print}`,
        detail: s.usage,
        rule: s.rule,
      });
    } else {
      out.push({
        id: s.id,
        kind: s.kind,
        short: s.kind === 'indicator' ? s.name : (s.print ?? s.name),
        title:
          s.kind === 'indicator' ? capitalize(s.name) : `${capitalize(s.name)} ${s.print ? `(${s.print})` : ''}`.trim(),
        detail: s.usage,
        rule: s.rule,
      });
    }
  }

  for (const d of DIGITS_IN_ORDER) {
    if (cellKey(DIGIT_CELLS[d]) === cellKey(cell)) {
      const numeric = getSign('numeric');
      out.push({
        id: `digit-${d}`,
        kind: 'digit',
        short: d,
        title: `Digit ${d}, after the ${numeric.name}`,
        detail: `In numeric mode (after ${describeCells(numeric.cells)}).`,
        rule: getSign(`digit-${d}`).rule,
      });
    }
  }

  for (const s of ALL_SIGNS) {
    if (s.kind === 'digit' || s.cells.length < 2 || cellKey(s.cells[0]) !== cellKey(cell)) continue;
    out.push({
      id: `starts:${s.id}`,
      kind: 'starts-sign',
      short: s.name,
      title: `First cell of the ${s.name}${s.print ? ` (${s.print})` : ''}`,
      detail: `The whole sign is ${describeCells(s.cells)}.`,
      rule: s.rule,
    });
  }

  if (mode === 'contracted') {
    for (const c of contractionsWithCells([cell])) {
      out.push({
        id: `contraction:${c.text}:${c.kind}`,
        kind: 'contraction',
        short: c.text,
        title: `${CONTRACTION_KIND_LABELS[c.kind]}: ${c.text}`,
        detail: c.usage,
        rule: c.rule,
      });
    }
  }
  return out;
}

/** The headline for the big display: letter and contractions ("b / but"), else punctuation, indicator or symbol. */
export function headline(cell: Cell, mode: ExplorerMode): string | null {
  const meanings = cellMeanings(cell, mode);
  if (meanings.length === 0) return null;
  const groups: MeaningKind[][] = [['letter', 'contraction'], ['punctuation'], ['indicator'], ['symbol']];
  for (const kinds of groups) {
    const of = meanings.filter((m) => kinds.includes(m.kind));
    if (of.length) return [...new Set(of.map((m) => m.short))].join(' / ');
  }
  return null;
}

/** Capitalized dot description for the caption under the result. */
export function dotsCaption(cell: Cell): string {
  return capitalize(describeCell(cell));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Every piece of braille this game can show: the explorer shows single cells only. Their
 * letter meanings are checked as uncontracted letters, and their wordsign meanings as
 * contracted words standing alone.
 */
export function brailleInventory(): InventoryItem[] {
  return [
    ...'abcdefghijklmnopqrstuvwxyz'.split('').map((l) => g1Item('game:explorer', l)),
    ...standaloneWords.map((w) => ({ where: 'game:explorer', print: w.word, table: 'g2' as const, cells: w.cells })),
  ];
}
