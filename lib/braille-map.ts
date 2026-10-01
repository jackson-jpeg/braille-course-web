/**
 * Legacy grid-order view of the UEB letters and digits, derived from lib/ueb.ts
 * (the single source of truth). Do not add patterns here — add them to lib/ueb.ts.
 *
 * Array format: [d1, d4, d2, d5, d3, d6], the reading order of a 2-column CSS grid:
 *                 1 4
 *                 2 5
 *                 3 6
 */

import { LETTERS, DIGITS, INDICATORS, toGrid, describe } from './ueb';

const map: Record<string, number[]> = {};
for (const [letter, dots] of Object.entries(LETTERS)) map[letter.toUpperCase()] = toGrid(dots);
map['^'] = toGrid(INDICATORS.capital.cells[0]); // capital indicator (dot 6)
map['#'] = toGrid(INDICATORS.numeric.cells[0]); // numeric indicator (dots 3 4 5 6)
for (const [digit, dots] of Object.entries(DIGITS)) map[digit] = toGrid(dots); // after a numeric indicator

export const brailleMap: Readonly<Record<string, number[]>> = map;

/** Count how many of the 6 dot positions match between two patterns */
export function computeSimilarity(a: number[], b: number[]): number {
  let matches = 0;
  for (let i = 0; i < 6; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches;
}

/** Describe which dots are raised for a letter (e.g., "dots 1 2") */
export function dotDescription(letter: string): string {
  const dots = LETTERS[letter.toLowerCase()];
  return dots ? describe(dots) : '';
}
