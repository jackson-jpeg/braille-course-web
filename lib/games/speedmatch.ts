/**
 * Speed Match: read a braille cell and pick its letter, or read a letter and pick its cell.
 *
 * Only the 26 letters a–z are used. Each letter has its own cell (ICEB 4.1), so in either mode
 * exactly one choice is right. Digits are never used here: a digit is the numeric indicator plus
 * a letter cell, so showing "3" as the c cell alone would be wrong and would give two right answers.
 *
 * Print letters are shown in lowercase, because the cell shown is the lowercase letter. A capital
 * would need the capital indicator first (ICEB 8.3).
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { type Cell, ALL_DOTS, ALPHABET, LETTER_CELLS } from '@/lib/braille/ueb';
import { type QuestionSpec, buildChoices } from './quiz';

export type SpeedMatchMode = 'read' | 'write';
export const SPEEDMATCH_MODES: readonly SpeedMatchMode[] = ['read', 'write'];

/** The letters a–z, lowercase. */
export const SPEEDMATCH_LETTERS: readonly string[] = ALPHABET;

/** Number of choices shown per round. */
export const CHOICE_COUNT = 4;

/** How many of the most similar letters a question may draw its distractors from. */
export const DISTRACTOR_POOL_SIZE = 8;

/** The cell for a letter (lowercase a–z). Throws on anything else. */
export function letterCell(letter: string): Cell {
  const cell = LETTER_CELLS[letter];
  if (!cell) throw new Error(`not a letter a–z: "${letter}"`);
  return cell;
}

/** How many of the six dot positions agree (raised in both, or flat in both). */
export function cellSimilarity(a: Cell, b: Cell): number {
  return ALL_DOTS.filter((d) => a.includes(d) === b.includes(d)).length;
}

/**
 * The `n` letters whose cells look most like `letter`'s cell, most similar first (ties in
 * alphabetical order). Never includes `letter` itself.
 */
export function similarLetters(letter: string, n: number, letters: readonly string[] = ALPHABET): string[] {
  const target = letterCell(letter);
  return letters
    .filter((l) => l !== letter)
    .map((l) => ({ l, sim: cellSimilarity(target, letterCell(l)) }))
    .sort((a, b) => b.sim - a.sim || a.l.localeCompare(b.l))
    .slice(0, n)
    .map((x) => x.l);
}

/**
 * Every question the game can ask in a mode. Prompt and answer are both the letter: in read mode
 * the prompt is drawn as the letter's cell and the choices are printed letters; in write mode the
 * prompt is the printed letter and the choices are drawn as cells.
 */
export function questionSpecs(mode: SpeedMatchMode): QuestionSpec<string, string>[] {
  return SPEEDMATCH_LETTERS.map((letter) => ({
    id: `speedmatch:${mode}:${letter}`,
    prompt: letter,
    answer: letter,
    distractorPool: similarLetters(letter, DISTRACTOR_POOL_SIZE),
  }));
}

/** A round: one question and the choices shown. */
export function makeRound(
  mode: SpeedMatchMode,
  random: () => number = Math.random,
): { spec: QuestionSpec<string, string>; choices: string[] } {
  const specs = questionSpecs(mode);
  const spec = specs[Math.floor(random() * specs.length)];
  const { choices } = buildChoices(spec, CHOICE_COUNT, random);
  return { spec, choices };
}

/** The answer checker the game uses. */
export function isCorrect(spec: QuestionSpec<string, string>, choice: string): boolean {
  return choice === spec.answer;
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return SPEEDMATCH_LETTERS.map((l) => g1Item('game:speedmatch', l));
}
