/**
 * Braille Hangman: guess the letters of a hidden word. Each key and each revealed letter is shown
 * as its cell, so a fully revealed word is exactly its uncontracted braille, transcribe(word).
 *
 * Words are lowercase a–z only (no capitals, digits or apostrophes).
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { type Cell, ALPHABET, LETTER_CELLS } from '@/lib/braille/ueb';
import { hangmanWords } from '@/lib/hangman-words';

export const HANGMAN_WORDS: readonly string[] = hangmanWords;
export const MAX_WRONG = 6;

export function hangmanCell(letter: string): Cell {
  const cell = LETTER_CELLS[letter];
  if (!cell) throw new Error(`hangman: not a letter a–z: "${letter}"`);
  return cell;
}

export function pickWord(random: () => number = Math.random): string {
  return HANGMAN_WORDS[Math.floor(random() * HANGMAN_WORDS.length)];
}

/** A typed key, as a game letter (lowercase), or null if it is not a letter. */
export function keyToLetter(key: string): string | null {
  return /^[a-zA-Z]$/.test(key) ? key.toLowerCase() : null;
}

/** The checker the game uses: is this guessed letter in the word? */
export function isHit(word: string, letter: string): boolean {
  return word.includes(letter);
}

export function wrongGuesses(word: string, guessed: Iterable<string>): string[] {
  return [...guessed].filter((l) => !isHit(word, l));
}

export function isWon(word: string, guessed: ReadonlySet<string>): boolean {
  return word.length > 0 && [...word].every((l) => guessed.has(l));
}

export function isLost(word: string, guessed: Iterable<string>, maxWrong: number = MAX_WRONG): boolean {
  return wrongGuesses(word, guessed).length >= maxWrong;
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  // The cells the game actually draws (letter by letter), so liblouis checks the real render path.
  const item = (print: string) => ({
    where: 'game:hangman',
    print,
    table: 'g1' as const,
    cells: [...print].map(hangmanCell),
  });
  return [...ALPHABET.map(item), ...HANGMAN_WORDS.map(item)];
}
