/**
 * Shared cells: one cell (or cell sequence) can mean different things. A quiz may only ask about
 * such a cell when its context decides the meaning. Games use these helpers to check that every
 * question has exactly one right answer.
 */
import { type Cell, type Contraction, type Sign, ALL_SIGNS, CONTRACTIONS, cellsKey } from './ueb';

/** Every non-contraction sign whose cells are exactly these cells. */
export function signsWithCells(cells: readonly Cell[]): Sign[] {
  const key = cellsKey(cells);
  return ALL_SIGNS.filter((s) => cellsKey(s.cells) === key);
}

/** Every contraction whose cells are exactly these cells. */
export function contractionsWithCells(cells: readonly Cell[]): Contraction[] {
  const key = cellsKey(cells);
  return CONTRACTIONS.filter((c) => cellsKey(c.cells) === key);
}

/** Groups of signs (uncontracted: letters, indicators, punctuation, symbols) that share cells. */
export function sharedSignGroups(): Sign[][] {
  const groups = new Map<string, Sign[]>();
  for (const s of ALL_SIGNS) {
    const k = cellsKey(s.cells);
    groups.set(k, [...(groups.get(k) ?? []), s]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}
