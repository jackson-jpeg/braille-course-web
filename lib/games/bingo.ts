/**
 * Braille Bingo: letters are called; the player marks the matching square on a 5×5 card.
 *
 * A card holds 24 different letters a–z plus a free centre. Each letter has its own cell
 * (ICEB 4.1), so a call matches at most one square, and only the square for that letter.
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { type Cell, ALPHABET, LETTER_CELLS } from '@/lib/braille/ueb';
import type { Difficulty } from '@/lib/progress-types';
import { shuffle } from './quiz';

export const BINGO_LETTERS: readonly string[] = ALPHABET;
export const FREE = 'FREE';
/** Index of the free centre square on a 5×5 card. */
export const CENTER = 12;

export type WinCondition = 'line' | 'double-line' | 'blackout';

export const WIN_CONDITION: Readonly<Record<Difficulty, WinCondition>> = {
  beginner: 'line',
  intermediate: 'double-line',
  advanced: 'blackout',
};

export function bingoCell(letter: string): Cell {
  const cell = LETTER_CELLS[letter];
  if (!cell) throw new Error(`bingo: not a letter a–z: "${letter}"`);
  return cell;
}

/** A fresh 5×5 card: 24 different random letters and a free centre. */
export function makeCard(random: () => number = Math.random): string[] {
  const pool = shuffle(BINGO_LETTERS, random).slice(0, 24);
  const card: string[] = [];
  let p = 0;
  for (let i = 0; i < 25; i++) card.push(i === CENTER ? FREE : pool[p++]);
  return card;
}

export function initialMarks(): boolean[] {
  const m = new Array<boolean>(25).fill(false);
  m[CENTER] = true;
  return m;
}

/** The 12 winning lines of a 5×5 grid (5 rows, 5 columns, 2 diagonals). */
export const LINES: readonly number[][] = (() => {
  const lines: number[][] = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines;
})();

export function countCompletedLines(marked: readonly boolean[]): number {
  return LINES.filter((line) => line.every((i) => marked[i])).length;
}

export function hasWon(marked: readonly boolean[], condition: WinCondition): boolean {
  if (condition === 'blackout') return marked.every(Boolean);
  const lines = countCompletedLines(marked);
  return condition === 'double-line' ? lines >= 2 : lines >= 1;
}

/** The checker the game uses: may this square be marked, given the letters called so far? */
export function canMark(square: string, called: ReadonlySet<string>): boolean {
  return square !== FREE && called.has(square);
}

/** The next letter to call: usually an unmarked letter on the card, so games progress. */
export function nextCall(
  card: readonly string[],
  marked: readonly boolean[],
  called: ReadonlySet<string>,
  random: () => number = Math.random,
): string | null {
  const unmarked = card.filter((l, i) => l !== FREE && !marked[i] && !called.has(l));
  if (unmarked.length > 0 && random() < 0.72) return unmarked[Math.floor(random() * unmarked.length)];
  const remaining = BINGO_LETTERS.filter((l) => !called.has(l));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(random() * remaining.length)];
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return BINGO_LETTERS.map((l) => g1Item('game:bingo', l));
}
