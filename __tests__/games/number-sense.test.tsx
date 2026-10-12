import { render } from '@testing-library/react';
import BrailleNumberSense from '@/components/BrailleNumberSense';
import {
  allProblems,
  choicesFor,
  distractorPool,
  isCorrect,
  brailleInventory,
  OPERATOR_SIGNS,
} from '@/lib/games/number-sense';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey, cellsToUnicode, SYMBOLS } from '@/lib/braille/ueb';
import { seededRandom } from '@/lib/games/quiz';
import type { Difficulty } from '@/lib/progress-types';
import { checkAllCells } from '../helpers/cells';

const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

/** Independent arithmetic, not the game's own answer field. */
function evaluate(print: string): number {
  const [a, op, b] = print.replace(' =', '').split(' ');
  const x = Number(a);
  const y = Number(b);
  return op === '+' ? x + y : op === '−' ? x - y : op === '×' ? x * y : NaN;
}

describe('Number Sense: every problem at every difficulty', () => {
  test.each(LEVELS)('%s: answer is right, every distractor is wrong, choices are unambiguous', (level) => {
    const problems = allProblems(level);
    expect(problems.length).toBeGreaterThan(50);
    for (const p of problems) {
      const truth = evaluate(p.print);
      expect(p.answer).toBe(truth);
      expect(isCorrect(p, truth)).toBe(true);
      for (const wrong of distractorPool(p)) {
        expect(wrong).not.toBe(truth);
        expect(wrong).toBeGreaterThanOrEqual(0);
        expect(isCorrect(p, wrong)).toBe(false);
        // Two numbers never share a braille form.
        expect(cellsKey(transcribe(String(wrong)))).not.toBe(cellsKey(transcribe(String(truth))));
      }
      expect(distractorPool(p).length).toBeGreaterThanOrEqual(3);
    }
  });

  test('shown choices are four distinct numbers including exactly one right answer', () => {
    const rnd = seededRandom(7);
    for (const level of LEVELS)
      for (const p of allProblems(level)) {
        const c = choicesFor(p, rnd);
        expect(c).toHaveLength(4);
        expect(new Set(c).size).toBe(4);
        expect(c.filter((x) => isCorrect(p, x))).toEqual([p.answer]);
      }
  });

  test('problems use UEB math signs (ICEB 3.17), the true minus sign, and never Nemeth', () => {
    expect(cellsToUnicode(OPERATOR_SIGNS['+'].cells)).toBe('⠐⠖');
    expect(cellsToUnicode(OPERATOR_SIGNS['−'].cells)).toBe('⠐⠤');
    expect(cellsToUnicode(OPERATOR_SIGNS['×'].cells)).toBe('⠐⠦');
    for (const level of LEVELS)
      for (const p of allProblems(level)) {
        expect(p.print).not.toContain('-');
        const u = cellsToUnicode(transcribe(p.print));
        expect(u).toContain(cellsToUnicode(SYMBOLS.equals.cells));
        expect(u.startsWith('⠼')).toBe(true);
      }
  });

  test('inventory covers every problem and every number a choice can show', () => {
    const prints = new Set(brailleInventory().map((i) => i.print));
    for (const level of LEVELS)
      for (const p of allProblems(level)) {
        expect(prints.has(p.print)).toBe(true);
        for (const n of [p.answer, ...distractorPool(p)]) expect(prints.has(String(n))).toBe(true);
      }
  });
});

describe('Number Sense renders correct cells', () => {
  test('every drawn cell matches its data', () => {
    const { container } = render(<BrailleNumberSense />);
    expect(container.querySelectorAll('[data-braille-cell]').length).toBeGreaterThan(5);
    expect(checkAllCells(container)).toEqual([]);
  });
});
