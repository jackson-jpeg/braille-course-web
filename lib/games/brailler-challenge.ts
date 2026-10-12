/**
 * Brailler Challenge: write words and sentences cell by cell with the Perkins six-key layout
 * (see lib/braille/perkins.ts; the space bar writes a blank cell).
 *
 * The expected cells are the uncontracted UEB transcription of the target (lib/braille/transcribe),
 * checked against liblouis through brailleInventory().
 */
import type { Difficulty } from '@/lib/progress-types';
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { type Cell, sameCell } from '@/lib/braille/ueb';
import { type BrailleToken, transcribeTokens } from '@/lib/braille/transcribe';

export const CHALLENGE_TARGETS: Record<Difficulty, string[]> = {
  beginner: ['cat', 'dog', 'hi', 'Sam', 'Mom', 'Max', 'I am', 'big hug'],
  intermediate: ['CAT', '3 cats', 'Room 12', 'I am 9.', 'Hi, Ann.', 'It’s me.', 'Yes!', 'OK'],
  advanced: ['Is it 5:30?', 'I LOVE YOU', '“Hi,” said Mom.', 'my dog (Max)', 'Look at 3b.', 'DON’T', '1,000 stars'],
};

export interface ExpectedCell {
  cell: Cell;
  /** What this cell is, e.g. "capital letter indicator", "letter s", "space". */
  name: string;
  /** Index of the token it belongs to, for highlighting. */
  token: number;
}

export function expectedCells(target: string): { tokens: BrailleToken[]; cells: ExpectedCell[] } {
  const tokens = transcribeTokens(target);
  const cells: ExpectedCell[] = [];
  tokens.forEach((t, ti) =>
    t.cells.forEach((cell, ci) =>
      cells.push({
        cell,
        name: t.cells.length > 1 ? `${t.name}, cell ${ci + 1} of ${t.cells.length}` : t.name,
        token: ti,
      }),
    ),
  );
  return { tokens, cells };
}

/** Is the written cell the one expected next? (A blank cell is the space bar.) */
export function acceptsCell(expected: ExpectedCell, written: Cell): boolean {
  return sameCell(expected.cell, written);
}

export function allTargets(): string[] {
  return Object.values(CHALLENGE_TARGETS).flat();
}

export function brailleInventory(): InventoryItem[] {
  return allTargets().map((t) => g1Item('game:brailler-challenge', t));
}

/* ── Writing state (pure, used by the component and the tests) ─────────────── */

export interface WriterState {
  target: string;
  expected: ExpectedCell[];
  /** How many cells have been written correctly. */
  position: number;
  /** Wrong attempts at the current cell. */
  misses: number;
  totalMisses: number;
}

export function startWriting(target: string): WriterState {
  return { target, expected: expectedCells(target).cells, position: 0, misses: 0, totalMisses: 0 };
}

export type WriteResult = 'correct' | 'wrong' | 'done';

/** Write one cell (a blank cell is the space bar). Returns the new state and what happened. */
export function writeCell(state: WriterState, written: Cell): { state: WriterState; result: WriteResult } {
  if (state.position >= state.expected.length) return { state, result: 'done' };
  const exp = state.expected[state.position];
  if (!acceptsCell(exp, written)) {
    return { state: { ...state, misses: state.misses + 1, totalMisses: state.totalMisses + 1 }, result: 'wrong' };
  }
  const position = state.position + 1;
  return { state: { ...state, position, misses: 0 }, result: position === state.expected.length ? 'done' : 'correct' };
}
