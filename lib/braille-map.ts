/**
 * Full A-Z UEB braille dot mappings.
 * Array format: [d1, d4, d2, d5, d3, d6] matching the 2x3 CSS grid.
 * Standard cell:  1 4
 *                 2 5
 *                 3 6
 */
export const brailleMap: Record<string, number[]> = {
  A: [1, 0, 0, 0, 0, 0],
  B: [1, 0, 1, 0, 0, 0],
  C: [1, 1, 0, 0, 0, 0],
  D: [1, 1, 0, 1, 0, 0],
  E: [1, 0, 0, 1, 0, 0],
  F: [1, 1, 1, 0, 0, 0],
  G: [1, 1, 1, 1, 0, 0],
  H: [1, 0, 1, 1, 0, 0],
  I: [0, 1, 1, 0, 0, 0],
  J: [0, 1, 1, 1, 0, 0],
  K: [1, 0, 0, 0, 1, 0],
  L: [1, 0, 1, 0, 1, 0],
  M: [1, 1, 0, 0, 1, 0],
  N: [1, 1, 0, 1, 1, 0],
  O: [1, 0, 0, 1, 1, 0],
  P: [1, 1, 1, 0, 1, 0],
  Q: [1, 1, 1, 1, 1, 0],
  R: [1, 0, 1, 1, 1, 0],
  S: [0, 1, 1, 0, 1, 0],
  T: [0, 1, 1, 1, 1, 0],
  U: [1, 0, 0, 0, 1, 1],
  V: [1, 0, 1, 0, 1, 1],
  W: [0, 1, 1, 1, 0, 1],
  X: [1, 1, 0, 0, 1, 1],
  Y: [1, 1, 0, 1, 1, 1],
  Z: [1, 0, 0, 1, 1, 1],
  '0': [0, 1, 1, 1, 0, 0], // J
  '1': [1, 0, 0, 0, 0, 0], // A
  '2': [1, 0, 1, 0, 0, 0], // B
  '3': [1, 1, 0, 0, 0, 0], // C
  '4': [1, 1, 0, 1, 0, 0], // D
  '5': [1, 0, 0, 1, 0, 0], // E
  '6': [1, 1, 1, 0, 0, 0], // F
  '7': [1, 1, 1, 1, 0, 0], // G
  '8': [1, 0, 1, 1, 0, 0], // H
  '9': [0, 1, 1, 0, 0, 0], // I
};

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
  const pattern = brailleMap[letter.toUpperCase()];
  if (!pattern) return '';
  // Map grid positions back to dot numbers: [d1, d4, d2, d5, d3, d6]
  const dotNumbers = [1, 4, 2, 5, 3, 6];
  const raised = pattern
    .map((v, i) => (v ? dotNumbers[i] : null))
    .filter(Boolean)
    .sort((a, b) => a! - b!);
  return `dots ${raised.join(' ')}`;
}
