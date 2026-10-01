/**
 * Nemeth Code checks for the Number Sense game, against the Nemeth chart (typed as Unicode
 * braille) and liblouis's Nemeth definitions (en-us-mathtext.ctb, via the oracle fixture).
 */
import oracle from '../fixtures/ueb-oracle.json';
import {
  NEMETH_DIGITS,
  NEMETH_OPERATORS,
  NEMETH_EQUALS,
  NEMETH_NUMERIC_INDICATOR,
  nemethProblem,
} from '../../lib/nemeth-map';
import { toUnicode, cellsToUnicode } from '../../lib/ueb';

const OFFICIAL_DIGITS: Record<string, string> = {
  '1': '⠂',
  '2': '⠆',
  '3': '⠒',
  '4': '⠲',
  '5': '⠢',
  '6': '⠖',
  '7': '⠶',
  '8': '⠦',
  '9': '⠔',
  '0': '⠴',
};
const { nemeth, nemethDefs } = oracle as unknown as {
  nemeth: Record<string, string>;
  nemethDefs: Record<string, string>;
};
const dotsToCells = (spec: string) => spec.split('-').map((cell) => cell.split('').map(Number));

test.each(Object.keys(OFFICIAL_DIGITS))('Nemeth digit %s matches the chart and liblouis', (d) => {
  expect(toUnicode(NEMETH_DIGITS[d])).toBe(OFFICIAL_DIGITS[d]);
  expect(nemeth[d]).toBe('⠼' + OFFICIAL_DIGITS[d]);
});

test('numeric indicator, plus, minus, times, equals match the chart and liblouis', () => {
  expect(toUnicode(NEMETH_NUMERIC_INDICATOR)).toBe('⠼');
  expect(cellsToUnicode(NEMETH_OPERATORS['+'])).toBe('⠬');
  expect(cellsToUnicode(NEMETH_OPERATORS['-'])).toBe('⠤');
  expect(cellsToUnicode(NEMETH_OPERATORS['×'])).toBe('⠈⠡');
  expect(cellsToUnicode(NEMETH_EQUALS)).toBe('⠨⠅');
  expect(nemeth['4+5=9']).toContain('⠬');
  expect(nemeth['7-2=5']).toContain('⠤');
  // liblouis's math-text translator writes × as the multiplication dot (⠡); its Nemeth sign
  // table defines the multiplication cross, which is what the game shows.
  expect(cellsToUnicode(dotsToCells(nemethDefs['×']))).toBe(cellsToUnicode(NEMETH_OPERATORS['×']));
  expect(nemeth['4+5=9']).toContain('⠀⠨⠅⠀');
});

test('a problem line: one numeric indicator at the start, spaced equals', () => {
  expect(cellsToUnicode(nemethProblem(4, '+', 5).map((c) => c.dots))).toBe('⠼⠲⠬⠢⠀⠨⠅⠀');
  expect(cellsToUnicode(nemethProblem(12, '×', 3).map((c) => c.dots))).toBe('⠼⠂⠆⠈⠡⠒⠀⠨⠅⠀');
});
