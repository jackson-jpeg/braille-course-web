/**
 * Braille Word Game: guess a 4-letter word in six tries. Each typed letter is shown as its cell,
 * so a guessed word is shown in uncontracted braille, letter by letter (exactly transcribe(word)).
 *
 * Words are lowercase a–z only: no capitals (which would need the capital indicator, ICEB 8.3),
 * no digits, no apostrophes.
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { type Cell, ALPHABET, LETTER_CELLS } from '@/lib/braille/ueb';
import { answerWords, validGuesses } from '@/lib/game-words';

export const WORD_LENGTH = 4;
export const MAX_GUESSES = 6;

export const ANSWER_WORDS: readonly string[] = answerWords;
export const VALID_GUESSES: ReadonlySet<string> = validGuesses;

export type TileScore = 'correct' | 'present' | 'absent';
export type KeyStatus = 'unused' | TileScore;

/** The cell shown for one letter tile or key. */
export function tileCell(letter: string): Cell {
  const cell = LETTER_CELLS[letter];
  if (!cell) throw new Error(`wordgame: not a letter a–z: "${letter}"`);
  return cell;
}

/** The cells shown for a whole word, one tile per letter. */
export function wordCells(word: string): Cell[] {
  return [...word].map(tileCell);
}

/** A typed key, as a game letter (lowercase), or null if it is not a letter. */
export function keyToLetter(key: string): string | null {
  return /^[a-zA-Z]$/.test(key) ? key.toLowerCase() : null;
}

export function pickAnswer(random: () => number = Math.random): string {
  return ANSWER_WORDS[Math.floor(random() * ANSWER_WORDS.length)];
}

export function isValidGuess(guess: string): boolean {
  return guess.length === WORD_LENGTH && VALID_GUESSES.has(guess);
}

/**
 * Green / yellow / grey scoring with repeated letters handled the standard way: exact matches
 * first; then each remaining guess letter is "present" only while unmatched copies of it remain
 * in the answer.
 */
export function scoreGuess(guess: string, answer: string): TileScore[] {
  const n = answer.length;
  const statuses: TileScore[] = Array(n).fill('absent');
  const remaining: (string | null)[] = answer.split('');
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) {
      statuses[i] = 'correct';
      remaining[i] = null;
    }
  }
  for (let i = 0; i < n; i++) {
    if (statuses[i] === 'correct') continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) {
      statuses[i] = 'present';
      remaining[idx] = null;
    }
  }
  return statuses;
}

const KEY_PRIORITY: Record<KeyStatus, number> = { unused: 0, absent: 1, present: 2, correct: 3 };

/** Keyboard colours after a guess: a key only ever moves up (grey → yellow → green). */
export function updateKeyStatuses(
  prev: Readonly<Record<string, KeyStatus>>,
  guess: string,
  scores: readonly TileScore[],
): Record<string, KeyStatus> {
  const next = { ...prev };
  [...guess].forEach((letter, i) => {
    if (KEY_PRIORITY[scores[i]] > KEY_PRIORITY[next[letter] ?? 'unused']) next[letter] = scores[i];
  });
  return next;
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return [
    // The cells the game actually draws, so liblouis checks the real render path.
    ...ALPHABET.map((l) => ({ where: 'game:wordgame', print: l, table: 'g1' as const, cells: [tileCell(l)] })),
    ...[...VALID_GUESSES].map((w) => ({ where: 'game:wordgame', print: w, table: 'g1' as const, cells: wordCells(w) })),
  ];
}
