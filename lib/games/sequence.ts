/**
 * Braille Sequence: put braille cells for different letters into alphabetical order.
 *
 * Only the letters a–z are used, each with its own cell (ICEB 4.1), and the letters in a round
 * are all different, so there is exactly one correct order.
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { type Cell, ALPHABET, LETTER_CELLS } from '@/lib/braille/ueb';
import type { Difficulty } from '@/lib/progress-types';
import { shuffle } from './quiz';
import { similarLetters } from './speedmatch';

export const SEQUENCE_LETTERS: readonly string[] = ALPHABET;

/** Letters per round at each difficulty (mirrors lib/difficulty-settings.ts). */
export const LETTER_COUNT: Readonly<Record<Difficulty, number>> = {
  beginner: 4,
  intermediate: 6,
  advanced: 8,
};

export const TOTAL_ROUNDS = 5;

export function sequenceCell(letter: string): Cell {
  const cell = LETTER_CELLS[letter];
  if (!cell) throw new Error(`sequence: not a letter a–z: "${letter}"`);
  return cell;
}

/**
 * The pool an advanced round draws from: an anchor letter plus the `2 × count` letters whose
 * cells look most like it. Exported so tests can check every possible advanced round.
 */
export function advancedPool(anchor: string, count: number): string[] {
  return similarLetters(anchor, count * 2);
}

/** Pick `count` different letters; advanced rounds pick letters whose cells look alike. */
export function pickLetters(count: number, difficulty: Difficulty, random: () => number = Math.random): string[] {
  if (difficulty === 'advanced') {
    const anchor = SEQUENCE_LETTERS[Math.floor(random() * SEQUENCE_LETTERS.length)];
    const others = shuffle(advancedPool(anchor, count), random).slice(0, count - 1);
    return shuffle([anchor, ...others], random);
  }
  return shuffle(SEQUENCE_LETTERS, random).slice(0, count);
}

/** The correct order: alphabetical. */
export function correctOrder(letters: readonly string[]): string[] {
  return [...letters].sort((a, b) => SEQUENCE_LETTERS.indexOf(a) - SEQUENCE_LETTERS.indexOf(b));
}

/** Shuffle the letters so they are not already in order (when that is possible). */
export function scramble(letters: readonly string[], random: () => number = Math.random): string[] {
  const sorted = correctOrder(letters);
  let out = shuffle(letters, random);
  for (let i = 0; i < 20 && letters.length > 1 && out.every((l, k) => l === sorted[k]); i++)
    out = shuffle(letters, random);
  return out;
}

/** The checker the game uses: for each position, is the right letter there? */
export function checkOrder(arranged: readonly string[], letters: readonly string[]): boolean[] {
  const expected = correctOrder(letters);
  return arranged.map((l, i) => l === expected[i]);
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return SEQUENCE_LETTERS.map((l) => g1Item('game:sequence', l));
}
