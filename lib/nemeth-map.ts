/**
 * Nemeth Code patterns for the Number Sense game (US braille mathematics code).
 * Nemeth digits are "dropped" into the lower part of the cell, unlike UEB literary
 * numbers, which reuse the letters a–j.
 *
 * Verified in __tests__/lib/nemeth.test.ts against the Nemeth chart and liblouis.
 * Array format: [d1, d4, d2, d5, d3, d6] (legacy grid order), built from dot numbers.
 */

import { toGrid } from './ueb';

const DIGIT_DOTS: Record<string, number[]> = {
  '1': [2],
  '2': [2, 3],
  '3': [2, 5],
  '4': [2, 5, 6],
  '5': [2, 6],
  '6': [2, 3, 5],
  '7': [2, 3, 5, 6],
  '8': [2, 3, 6],
  '9': [3, 5],
  '0': [3, 5, 6],
};

/** Nemeth numeric indicator: dots 3 4 5 6 — used at the start of a line and after a space. */
export const NEMETH_NUMERIC_INDICATOR = [3, 4, 5, 6];

/** Operation signs, as one or more cells of dot numbers. */
export const NEMETH_OPERATORS: Record<string, number[][]> = {
  '+': [[3, 4, 6]],
  '-': [[3, 6]],
  '×': [[4], [1, 6]], // multiplication cross
};

/** Equals sign (a comparison sign, written with a space on each side): dots 4 6, 1 3. */
export const NEMETH_EQUALS = [
  [4, 6],
  [1, 3],
];

export const NEMETH_DIGITS: Readonly<Record<string, number[]>> = DIGIT_DOTS;

/** Legacy grid-order exports. */
export const nemethDigits: Record<string, number[]> = Object.fromEntries(
  Object.entries(DIGIT_DOTS).map(([d, dots]) => [d, toGrid(dots)]),
);
export const nemethNumericIndicator: number[] = toGrid(NEMETH_NUMERIC_INDICATOR);

export interface NemethCell {
  dots: number[];
  label: string;
}

/**
 * Cells for "a op b = " in Nemeth: numeric indicator at the start of the line, no numeric
 * indicator after the operation sign (no space), a space either side of the equals sign.
 */
export function nemethProblem(a: number, op: string, b: number): NemethCell[] {
  const ops = NEMETH_OPERATORS[op];
  if (!ops) throw new Error(`nemeth: unknown operator "${op}"`);
  const num = (n: number) =>
    String(n)
      .split('')
      .map((d) => ({ dots: DIGIT_DOTS[d], label: d }));
  const opName = op === '+' ? 'plus' : op === '-' ? 'minus' : 'times';
  return [
    { dots: NEMETH_NUMERIC_INDICATOR, label: 'numeric indicator' },
    ...num(a),
    ...ops.map((dots) => ({ dots, label: opName })),
    ...num(b),
    { dots: [], label: 'space' },
    ...NEMETH_EQUALS.map((dots) => ({ dots, label: 'equals' })),
    { dots: [], label: 'space' },
  ];
}

/** Cells for an answer number on its own (numeric indicator first). */
export function nemethNumber(n: number): NemethCell[] {
  return [
    { dots: NEMETH_NUMERIC_INDICATOR, label: 'numeric indicator' },
    ...String(n)
      .split('')
      .map((d) => ({ dots: DIGIT_DOTS[d], label: d })),
  ];
}
