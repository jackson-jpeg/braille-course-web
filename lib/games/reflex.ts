/**
 * Reflex Dots: a letter's cell flashes; the player raises the same dots from memory.
 *
 * Only the letters a–z are used (ICEB 4.1). The answer is judged on the dots alone, and no two
 * letters share a cell, so exactly one of the 64 possible cells is accepted for each letter.
 *
 * Keyboard: number key n toggles dot n, for n from 1 to 6.
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { type Cell, type Dot, ALL_DOTS, ALPHABET, LETTER_CELLS, sameCell } from '@/lib/braille/ueb';
import type { Difficulty } from '@/lib/progress-types';

export const REFLEX_LETTERS: readonly string[] = ALPHABET;

/** Display time and rounds at each difficulty (mirrors lib/difficulty-settings.ts). */
export const REFLEX_PARAMS: Readonly<Record<Difficulty, { displayTime: number; rounds: number }>> = {
  beginner: { displayTime: 2000, rounds: 10 },
  intermediate: { displayTime: 1200, rounds: 15 },
  advanced: { displayTime: 700, rounds: 20 },
};

export function reflexCell(letter: string): Cell {
  const cell = LETTER_CELLS[letter];
  if (!cell) throw new Error(`reflex: not a letter a–z: "${letter}"`);
  return cell;
}

export function pickLetter(random: () => number = Math.random): string {
  return REFLEX_LETTERS[Math.floor(random() * REFLEX_LETTERS.length)];
}

/** The checker the game uses: did the player raise exactly the letter's dots? */
export function isCorrect(answer: Cell, letter: string): boolean {
  return sameCell(answer, reflexCell(letter));
}

/** Keyboard key → the dot it toggles (key n → dot n, for n from 1 to 6). Anything else → null. */
export function dotForKey(key: string): Dot | null {
  const n = Number(key);
  return key.length === 1 && (ALL_DOTS as readonly number[]).includes(n) ? (n as Dot) : null;
}

/** Which dots the player missed and which they raised that should be flat. */
export function cellDiff(answer: Cell, target: Cell): { missing: Cell; extra: Cell } {
  return {
    missing: target.filter((d) => !answer.includes(d)),
    extra: answer.filter((d) => !target.includes(d)),
  };
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return REFLEX_LETTERS.map((l) => g1Item('game:reflex', l));
}
