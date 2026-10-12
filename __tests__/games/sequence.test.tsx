import { render } from '@testing-library/react';
import BrailleSequence from '@/components/BrailleSequence';
import {
  LETTER_COUNT,
  SEQUENCE_LETTERS,
  advancedPool,
  brailleInventory,
  checkOrder,
  correctOrder,
  pickLetters,
  scramble,
  sequenceCell,
} from '@/lib/games/sequence';
import { seededRandom } from '@/lib/games/quiz';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey, LETTER_CELLS } from '@/lib/braille/ueb';
import type { Difficulty } from '@/lib/progress-types';
import { checkAllCells } from '../helpers/cells';

const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
/** Independent judge of alphabetical order: character codes of a–z. */
const judgeOrder = (letters: string[]) => [...letters].sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

describe('Sequence: every round', () => {
  test('cells are the letters’ uncontracted braille, all different', () => {
    const keys = SEQUENCE_LETTERS.map((l) => cellsKey([sequenceCell(l)]));
    SEQUENCE_LETTERS.forEach((l, i) => expect(keys[i]).toBe(cellsKey(transcribe(l))));
    expect(new Set(keys).size).toBe(26);
  });

  test('advanced: every anchor’s look-alike pool is valid', () => {
    const count = LETTER_COUNT.advanced;
    for (const anchor of SEQUENCE_LETTERS) {
      const pool = advancedPool(anchor, count);
      expect(pool).toHaveLength(count * 2);
      expect(pool).not.toContain(anchor);
      expect(new Set(pool).size).toBe(pool.length);
      for (const l of pool) expect(l).toMatch(/^[a-z]$/);
    }
  });

  test.each(LEVELS)('%s: rounds have distinct letters and exactly one correct order', (level) => {
    const rnd = seededRandom(11);
    const count = LETTER_COUNT[level];
    for (let i = 0; i < 1000; i++) {
      const letters = pickLetters(count, level, rnd);
      expect(letters).toHaveLength(count);
      expect(new Set(letters).size).toBe(count);
      expect(new Set(letters.map((l) => cellsKey(transcribe(l)))).size).toBe(count);
      const truth = judgeOrder(letters);
      expect(correctOrder(letters)).toEqual(truth);
      expect(checkOrder(truth, letters).every(Boolean)).toBe(true);
      const s = scramble(letters, rnd);
      expect(s.slice().sort()).toEqual(letters.slice().sort());
      expect(s).not.toEqual(truth);
    }
  });

  test('every arrangement of a round is judged right only when alphabetical', () => {
    const rnd = seededRandom(5);
    for (let i = 0; i < 30; i++) {
      const letters = pickLetters(LETTER_COUNT.beginner, 'beginner', rnd);
      const truth = judgeOrder(letters).join('');
      for (const p of permutations(letters)) {
        const result = checkOrder(p, letters);
        expect(result.every(Boolean)).toBe(p.join('') === truth);
        p.forEach((l, k) => expect(result[k]).toBe(l === truth[k]));
      }
    }
  });

  test('inventory lists every letter', () => {
    expect(brailleInventory().map((i) => i.print)).toEqual([...SEQUENCE_LETTERS]);
  });
});

describe('Sequence renders correct cells', () => {
  test('cards draw their cells correctly and are described by dot numbers', () => {
    const { container } = render(<BrailleSequence />);
    const cards = [...container.querySelectorAll('.seq-card')];
    expect(cards).toHaveLength(LETTER_COUNT.beginner);
    expect(checkAllCells(container)).toEqual([]);
    for (const c of cards) {
      const dots = c.querySelector('[data-braille-cell]')!.getAttribute('data-dots')!;
      expect(Object.values(LETTER_CELLS).map((x) => x.join(''))).toContain(dots);
      expect(c.getAttribute('aria-label')).toMatch(/^Position \d: braille cell, dots? [1-6]/);
    }
  });
});
