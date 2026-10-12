/**
 * Memory Match: pairs of cards, one showing a braille cell and one showing its print letter.
 *
 * Only the letters a–z are dealt. Each has its own cell (ICEB 4.1), so every braille card matches
 * exactly one letter card. Digits are never dealt: a digit needs the numeric indicator in front
 * of its cell (ICEB 6.1), and the digits 1–0 use the same cells as a–j, so dealing "c" and "3"
 * together would give one braille card two matching letter cards. Indicators are not letters and
 * are not dealt either.
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { type Cell, ALPHABET, LETTER_CELLS } from '@/lib/braille/ueb';
import { shuffle } from './quiz';

/** Every letter that can be dealt (lowercase a–z). */
export const MEMORY_LETTERS: readonly string[] = ALPHABET;

export const PAIR_COUNT = 6;

export type CardType = 'braille' | 'letter';

export interface MemoryCard {
  id: number;
  letter: string;
  type: CardType;
}

/** The cell a braille card shows. */
export function cardCell(card: Pick<MemoryCard, 'letter'>): Cell {
  const cell = LETTER_CELLS[card.letter];
  if (!cell) throw new Error(`memorymatch: not a letter a–z: "${card.letter}"`);
  return cell;
}

/** `count` different letters, chosen at random. */
export function dealLetters(count: number = PAIR_COUNT, random: () => number = Math.random): string[] {
  if (count > MEMORY_LETTERS.length) throw new Error('memorymatch: not enough letters');
  return shuffle(MEMORY_LETTERS, random).slice(0, count);
}

/** One braille card and one letter card per letter, shuffled. */
export function buildDeck(letters: readonly string[], random: () => number = Math.random): MemoryCard[] {
  if (new Set(letters).size !== letters.length) throw new Error('memorymatch: duplicate letter in deck');
  const cards: MemoryCard[] = [];
  let id = 0;
  for (const letter of letters) {
    cardCell({ letter });
    cards.push({ id: id++, letter, type: 'braille' });
    cards.push({ id: id++, letter, type: 'letter' });
  }
  return shuffle(cards, random);
}

/** A new random deck of `pairs` pairs. */
export function newDeck(pairs: number = PAIR_COUNT, random: () => number = Math.random): MemoryCard[] {
  return buildDeck(dealLetters(pairs, random), random);
}

/** The match checker the game uses: one braille card and one letter card for the same letter. */
export function isMatch(a: MemoryCard, b: MemoryCard): boolean {
  return a.id !== b.id && a.type !== b.type && a.letter === b.letter;
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return MEMORY_LETTERS.map((l) => g1Item('game:memorymatch', l));
}
