/**
 * Braille Rain: letter cells fall; the player types each letter before it lands.
 *
 * Only the letters a–z fall, each with its own cell (ICEB 4.1), so each cell has exactly one
 * right key. Keys are matched case-insensitively (the cell is the lowercase letter; a typed
 * capital is accepted as the same letter key).
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { type Cell, ALPHABET, LETTER_CELLS } from '@/lib/braille/ueb';
import { similarLetters } from './speedmatch';

export const RAIN_LETTERS: readonly string[] = ALPHABET;

/** How many look-alike letters an advanced spawn may choose from. */
export const SIMILAR_POOL_SIZE = 6;

export interface Drop {
  id: number;
  letter: string;
  x: number;
  y: number;
}

export function rainCell(letter: string): Cell {
  const cell = LETTER_CELLS[letter];
  if (!cell) throw new Error(`rain: not a letter a–z: "${letter}"`);
  return cell;
}

/** Letters an advanced spawn may pick after `near` (look-alikes). */
export function similarPool(near: string): string[] {
  return similarLetters(near, SIMILAR_POOL_SIZE);
}

/** Pick a letter to drop, optionally biased toward one that looks like the previous one. */
export function pickLetter(near: string | null, similar: boolean, random: () => number = Math.random): string {
  if (similar && near && random() < 0.5) {
    const pool = similarPool(near);
    return pool[Math.floor(random() * pool.length)];
  }
  return RAIN_LETTERS[Math.floor(random() * RAIN_LETTERS.length)];
}

/** The letter a key press means, or null if it is not a letter key. */
export function keyToLetter(key: string): string | null {
  return /^[a-zA-Z]$/.test(key) ? key.toLowerCase() : null;
}

/** The checker the game uses: does this key clear this drop? */
export function keyMatchesDrop(key: string, drop: Pick<Drop, 'letter'>): boolean {
  const letter = keyToLetter(key);
  return letter !== null && letter === drop.letter;
}

/** The drop a key press clears: the lowest matching drop, or null. */
export function dropForKey<D extends Drop>(key: string, drops: readonly D[]): D | null {
  const matches = drops.filter((d) => keyMatchesDrop(key, d));
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => (b.y > a.y ? b : a));
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return RAIN_LETTERS.map((l) => g1Item('game:rain', l));
}
