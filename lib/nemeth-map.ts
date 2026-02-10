/**
 * Nemeth Code braille patterns for mathematics.
 * Nemeth digits are "dropped" to the lower cell (dots 2,3,5,6 region)
 * unlike UEB literary numbers which reuse letter patterns A-J.
 *
 * Array format: [d1, d4, d2, d5, d3, d6] matching the 2x3 CSS grid.
 * Standard cell:  1 4
 *                 2 5
 *                 3 6
 */

/** Nemeth digit patterns (0-9) */
export const nemethDigits: Record<string, number[]> = {
  '1': [0, 0, 1, 0, 0, 0], // dot 2
  '2': [0, 0, 1, 0, 1, 0], // dots 2,3
  '3': [0, 0, 1, 1, 0, 0], // dots 2,5
  '4': [0, 0, 1, 1, 0, 1], // dots 2,5,6
  '5': [0, 0, 1, 0, 0, 1], // dots 2,6
  '6': [0, 0, 1, 1, 1, 0], // dots 2,3,5
  '7': [0, 0, 1, 1, 1, 1], // dots 2,3,5,6
  '8': [0, 0, 1, 0, 1, 1], // dots 2,3,6
  '9': [0, 0, 0, 1, 1, 0], // dots 3,5
  '0': [0, 0, 0, 1, 1, 1], // dots 3,5,6
};

/** Nemeth operator patterns */
export const nemethOperators: Record<string, number[]> = {
  '+': [0, 1, 0, 0, 1, 1], // dots 3,4,6
  '-': [0, 0, 0, 0, 1, 1], // dots 3,6
  x: [1, 0, 0, 0, 0, 1], // dots 1,6
  '×': [1, 0, 0, 0, 0, 1], // dots 1,6 (unicode multiply)
};

/** Nemeth equals sign — two cells, each dots 4,6 */
export const nemethEquals: number[] = [0, 1, 0, 0, 0, 1]; // dots 4,6

/** Nemeth numeric indicator (dots 3,4,5,6) — placed before each number */
export const nemethNumericIndicator: number[] = [0, 1, 0, 1, 1, 1];
