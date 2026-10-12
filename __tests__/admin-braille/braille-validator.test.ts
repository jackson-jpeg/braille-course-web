/**
 * The AI fidelity guard (lib/braille-validator.ts): correct claims are untouched, wrong claims are
 * corrected to the canonical pattern, and anything ambiguous (shared cells, bare words, labels
 * that cover two signs) is left alone. Ground truth here is liblouis output pasted as Unicode, so
 * the test does not just re-read the module's own tables.
 */
import fs from 'fs';
import path from 'path';
import { judgeClaim, parseDotSpec, validateBrailleText, validateContentJson } from '@/lib/braille-validator';
import {
  type Cell,
  ALPHABET,
  CONTRACTIONS,
  INDICATORS,
  PUNCTUATION,
  SYMBOLS,
  cellsKey,
  unicodeToCell,
  unicodeToCells,
} from '@/lib/braille/ueb';
import { describeCell, describeCells } from '@/lib/braille/prose';

/* liblouis en-ueb-g1 / g2 output (python3 louis.translateString, unicode.dis). */
const LOUIS_ALPHABET = '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵';
const L = (l: string): Cell => unicodeToCell(LOUIS_ALPHABET[ALPHABET.indexOf(l)]);
const spaced = (cell: Cell) => `dots ${cell.join(' ')}`; // the way models often write it

const fix = (t: string) => validateBrailleText(t).correctedText;
const count = (t: string) => validateBrailleText(t).corrections.length;

describe('parseDotSpec', () => {
  test.each([
    ['dots 1 2 5', [[1, 2, 5]]],
    ['dots 1, 2, 5', [[1, 2, 5]]],
    ['dots 1-2-5', [[1, 2, 5]]],
    ['dots 5, 2, 1', [[1, 2, 5]]],
    ['dot 6, then dots 1, 2', [[6], [1, 2]]],
    ['dot 6, dot 6', [[6], [6]]],
    [
      'dots 4 6 followed by dots 2 3',
      [
        [4, 6],
        [2, 3],
      ],
    ],
  ])('%s', (spec, cells) => {
    expect(parseDotSpec(spec)).toEqual(cells);
  });
});

describe('letters', () => {
  test.each(ALPHABET.map((l) => [l]))('correct claims about %s are untouched', (l) => {
    const cell = L(l);
    const U = l.toUpperCase();
    for (const t of [
      `The letter ${U} is ${spaced(cell)}.`,
      `The letter ${l} is ${describeCell(cell)}.`,
      `${U}: ${spaced(cell)}`,
      `${U} (${describeCell(cell)})`,
      `${describeCell(cell)} is the letter ${U}.`,
      `Capital ${U} is dot 6, then ${describeCell(cell)}.`,
    ]) {
      expect(fix(t)).toBe(t);
    }
  });

  test.each(ALPHABET.map((l) => [l]))('every wrong single-cell claim about %s is corrected', (l) => {
    const U = l.toUpperCase();
    for (const other of ALPHABET.filter((o) => o !== l)) {
      expect(fix(`The letter ${U} is ${spaced(L(other))}.`)).toBe(`The letter ${U} is ${describeCell(L(l))}.`);
      expect(fix(`${describeCell(L(other))} is the letter ${U}.`)).toBe(`${describeCell(L(l))} is the letter ${U}.`);
    }
  });

  test('a wrong capital claim is corrected to the capital indicator plus the letter', () => {
    expect(fix('Capital B is dots 5, then dots 1 2.')).toBe('Capital B is dot 6, then dots 1, 2.');
  });

  test('records what was corrected', () => {
    const { corrections } = validateBrailleText('The letter B is dots 1 3.');
    expect(corrections).toEqual([
      { original: 'dots 1 3', corrected: 'dots 1, 2', context: 'The letter B is dots 1 3.', letterOrContraction: 'B' },
    ]);
  });

  test('several claims in one string, across lines', () => {
    expect(fix('K: dots 1, 2. L: dots 1, 3\n  Letter m: dots 1, 3')).toBe(
      'K: dots 1, 3. L: dots 1, 2, 3\n  Letter m: dots 1, 3, 4',
    );
  });
});

describe('contractions', () => {
  const texts = [...new Set(CONTRACTIONS.map((c) => c.text))];
  test.each(texts.map((t) => [t]))('"%s": correct claim untouched, wrong claim corrected', (text) => {
    const c = CONTRACTIONS.find((x) => x.text === text)!;
    const right = `The contraction "${text}" is ${describeCells(c.cells)}.`;
    expect(fix(right)).toBe(right);
    const wrongCell: Cell = cellsKey(c.cells) === cellsKey([[1]]) ? [2] : [1];
    expect(fix(`The contraction "${text}" is ${describeCell(wrongCell)}.`)).toBe(right);
  });

  test('"it" is x and "as" is z (liblouis en-ueb-g2)', () => {
    expect(cellsKey([L('x')])).toBe(cellsKey(unicodeToCells('⠭')));
    expect(fix('"it" is dots 2 4')).toBe(`"it" is ${describeCell(L('x'))}`);
    expect(fix('"as" is dot 1')).toBe(`"as" is ${describeCell(L('z'))}`);
    expect(count(`"it" is ${spaced(L('x'))}`)).toBe(0);
    expect(count(`"as" is ${spaced(L('z'))}`)).toBe(0);
  });

  test('a contraction spelled out uncontracted is accepted; a misspelling is fixed', () => {
    const ok = '"and" uncontracted is dot 1, then dots 1 3 4 5, then dots 1 4 5';
    expect(fix(ok)).toBe(ok);
    expect(fix('"and": dot 1, then dots 1 3 4 5, then dots 1 4 6')).toBe(
      '"and": dot 1, then dots 1, 3, 4, 5, then dots 1, 4, 5',
    );
  });
});

describe('indicators, punctuation and symbols by name', () => {
  test.each([
    ['The capital indicator is dot 6.', 'The capital indicator is dot 6.'],
    ['The capital indicator is dots 5 6.', 'The capital indicator is dot 6.'],
    ['The capital letter indicator is dot 5.', 'The capital letter indicator is dot 6.'],
    ['The capitalized word indicator is dot 6, dot 6.', 'The capitalized word indicator is dot 6, dot 6.'],
    ['The capitalized word indicator is dot 6.', 'The capitalized word indicator is dot 6, then dot 6.'],
    ['The capitals terminator is dot 6, then dot 3.', 'The capitals terminator is dot 6, then dot 3.'],
    ['The numeric indicator (dots 3-4-5-6) comes first.', 'The numeric indicator (dots 3-4-5-6) comes first.'],
    ['The numeric indicator is dots 3 4 5.', 'The numeric indicator is dots 3, 4, 5, 6.'],
    ['The number sign is dots 3 4 5 6.', 'The number sign is dots 3 4 5 6.'],
    ['The number indicator is dots 1 2 3 4.', 'The number indicator is dots 3, 4, 5, 6.'],
    ['The grade 1 indicator is dots 5 6.', 'The grade 1 indicator is dots 5 6.'],
    ['The grade 1 indicator is dot 6.', 'The grade 1 indicator is dots 5, 6.'],
    ['The period is dots 2 5 6.', 'The period is dots 2 5 6.'],
    ['A full stop is dots 2 5.', 'A full stop is dots 2, 5, 6.'],
    ['The comma is dot 2.', 'The comma is dot 2.'],
    ['The question mark is dots 2 3 5.', 'The question mark is dots 2, 3, 6.'],
    ['The exclamation mark is dots 2 3 6.', 'The exclamation mark is dots 2, 3, 5.'],
    ['The apostrophe is dot 3.', 'The apostrophe is dot 3.'],
    ['The hyphen is dots 3 6.', 'The hyphen is dots 3 6.'],
    ['The dollar sign is dot 4, then dots 2 3 4.', 'The dollar sign is dot 4, then dots 2 3 4.'],
    ['The plus sign is dots 2 3 5.', 'The plus sign is dot 5, then dots 2, 3, 5.'],
  ])('%s', (input, output) => {
    expect(fix(input)).toBe(output);
  });

  test.each(
    [...Object.values(INDICATORS), ...Object.values(PUNCTUATION), ...Object.values(SYMBOLS)].map((s) => [s.name, s]),
  )('%s: canonical claim untouched', (_n, sign) => {
    const t = `The ${sign.name} is ${describeCells(sign.cells)}.`;
    expect(fix(t)).toBe(t);
  });
});

describe('numbers', () => {
  test.each([
    ['The number 4 is dots 3 4 5 6, then dots 1 4 5.', 0],
    ['The digit 4 uses dots 1 4 5 after the numeric indicator.', 0],
    ['The number 42 is dots 3 4 5 6, then dots 1 4 5, then dots 1 2.', 0],
  ])('%s', (t, n) => {
    expect(count(t)).toBe(n);
  });
  test('a wrong digit is corrected in the form it was written', () => {
    expect(fix('The digit 4 is dots 1 4.')).toBe('The digit 4 is dots 1, 4, 5.');
    expect(fix('The number 4 is dots 3 4 5 6, then dots 1 4.')).toBe(
      'The number 4 is dots 3, 4, 5, 6, then dots 1, 4, 5.',
    );
  });
});

describe('ambiguity and shared cells are never "corrected" into something wrong', () => {
  test.each([
    // Bare words are not labels; the old guard read "this" as the letter s and "his" as s.
    'The contraction this is dots 1 4 5 6.',
    'The word his is dots 2 3 6.',
    'The word was is dots 3 5 6.',
    'this is dots 1 2.',
    // Shared cells: each claim is true of its own label.
    '"his" is dots 2 3 6, the same cell as the question mark.',
    'The question mark is dots 2 3 6 and "his" is dots 2 3 6.',
    'The opening quotation mark is dots 2 3 6.',
    'The closing quotation mark is dots 3 5 6, like "was" (dots 3 5 6).',
    '"be" is dots 2 3 and the semicolon is dots 2 3.',
    // A name that covers two signs: either is accepted, a third is left alone.
    'A quotation mark is dots 2 3 6.',
    'A quotation mark is dots 3 5 6.',
    'A quotation mark is dots 2 3 5.',
    'A parenthesis is dots 1 2 6.',
    // Lowercase single letters are not labels (could be the article "a").
    'a is dot 2',
    // Counts after the dots are not swallowed.
    'B is dots 1 2 and 3 other letters use dot 1.',
    // A claim that runs into the next "is" is not decidable.
    'the number 1 is dot 1, 2 is dots 1 2',
    // Unknown quoted words are not checked (could be meant contracted or not).
    'The word "cat" is dots 1 4, then dot 1, then dots 2 3 4 5.',
    // Typeform indicators are not in lib/braille: never "corrected".
    'The italic symbol indicator is dots 4 6, then dots 2 3.',
  ])('%s', (t) => {
    expect(fix(t)).toBe(t);
  });

  test('judgeClaim refuses to choose between two same-length answers', () => {
    expect(judgeClaim([[[2, 3, 6]], [[3, 5, 6]]], [[2, 3, 5]])).toBeNull();
    expect(judgeClaim([[[2, 3, 6]], [[3, 5, 6]]], [[3, 5, 6]])).toBe('ok');
    expect(judgeClaim([[[1, 2]], [[6], [1, 2]]], [[1, 3]])).toEqual([[1, 2]]);
  });

  test('reverse claims about a shared cell are judged by the named sign', () => {
    expect(fix('Dots 2, 3, 6 is the question mark.')).toBe('Dots 2, 3, 6 is the question mark.');
    expect(fix('dots 2 3 5 means "his".')).toBe('dots 2, 3, 6 means "his".');
  });
});

describe('validateContentJson', () => {
  test('walks nested JSON and reports every correction', () => {
    const input = {
      sections: [
        { heading: 'Letters', bullets: ['B is dots 1 3', 'C is dots 1 4'] },
        { items: [{ prompt: 'What is the period?', answer: 'The period is dots 2 5' }], n: 3 },
      ],
    };
    const { corrected, corrections, wasCorrected } = validateContentJson(input);
    expect(wasCorrected).toBe(true);
    expect(corrections.map((c) => c.letterOrContraction)).toEqual(['B', 'period']);
    expect(corrected).toEqual({
      sections: [
        { heading: 'Letters', bullets: ['B is dots 1, 2', 'C is dots 1 4'] },
        { items: [{ prompt: 'What is the period?', answer: 'The period is dots 2, 5, 6' }], n: 3 },
      ],
    });
  });
  test('clean content is returned unchanged', () => {
    const input = { slides: [{ title: 'The letter A', bullets: ['A is dot 1'] }] };
    expect(validateContentJson(input)).toEqual({ corrected: input, corrections: [], wasCorrected: false });
  });
});

test('the guard has no hand-typed braille and no legacy maps', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../../lib/braille-validator.ts'), 'utf8');
  expect(src).not.toMatch(/braille-map|contracted-braille-map|nemeth/i);
  expect(src).not.toMatch(/\bdots?\s*[1-6](?:[\s,\-–and]+[1-6])*\b/i);
  expect(src).not.toMatch(/[⠀-⣿]/);
});
