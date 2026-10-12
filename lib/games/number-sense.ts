/**
 * Number Sense: read a UEB arithmetic problem and pick the answer, written in UEB braille.
 *
 * UEB only (no separate math code): numbers use the numeric indicator + a–j (ICEB 6.1), and the
 * signs are the UEB plus, minus, multiplication and equals signs from lib/braille/ueb.ts SYMBOLS
 * (ICEB 3.17), spaced as in print (3.17.1).
 * The print minus sign is U+2212 (−), never the hyphen, which is a different braille sign.
 */
import type { Difficulty } from '@/lib/progress-types';
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { SYMBOLS } from '@/lib/braille/ueb';
import { shuffle } from './quiz';

export type Operator = '+' | '−' | '×';

export interface MathProblem {
  a: number;
  b: number;
  operator: Operator;
  answer: number;
  /** Print form shown under the braille, e.g. "12 − 4 =". */
  print: string;
}

export const OPERATOR_SIGNS = { '+': SYMBOLS.plus, '−': SYMBOLS.minus, '×': SYMBOLS.times } as const;

export const NUMBER_SENSE_LEVELS: Record<Difficulty, { maxNumber: number; operators: Operator[]; maxFactor: number }> =
  {
    beginner: { maxNumber: 10, operators: ['+'], maxFactor: 0 },
    intermediate: { maxNumber: 20, operators: ['+', '−'], maxFactor: 0 },
    advanced: { maxNumber: 50, operators: ['+', '−', '×'], maxFactor: 12 },
  };

function problem(a: number, operator: Operator, b: number): MathProblem {
  const answer = operator === '+' ? a + b : operator === '−' ? a - b : a * b;
  return { a, b, operator, answer, print: `${a} ${operator} ${b} =` };
}

/** Every problem the game can pose at a difficulty. */
export function allProblems(difficulty: Difficulty): MathProblem[] {
  const { maxNumber, operators, maxFactor } = NUMBER_SENSE_LEVELS[difficulty];
  const out: MathProblem[] = [];
  for (const op of operators) {
    if (op === '+')
      for (let a = 1; a <= maxNumber; a++) for (let b = 1; b <= maxNumber; b++) out.push(problem(a, op, b));
    if (op === '−') for (let a = 2; a <= maxNumber; a++) for (let b = 1; b < a; b++) out.push(problem(a, op, b));
    if (op === '×')
      for (let a = 2; a <= maxFactor; a++) for (let b = 2; b <= maxFactor; b++) out.push(problem(a, op, b));
  }
  return out;
}

export function randomProblem(difficulty: Difficulty, random: () => number = Math.random): MathProblem {
  const all = allProblems(difficulty);
  return all[Math.floor(random() * all.length)];
}

/** Wrong answers a problem may offer: nearby, non-negative, never the answer. */
export function distractorPool(p: MathProblem): number[] {
  const range = Math.max(5, Math.ceil(p.answer * 0.3));
  const pool: number[] = [];
  for (let d = -range; d <= range; d++) {
    const n = p.answer + d;
    if (d !== 0 && n >= 0) pool.push(n);
  }
  return pool;
}

export function choicesFor(p: MathProblem, random: () => number = Math.random): number[] {
  const wrong = shuffle(distractorPool(p), random).slice(0, 3);
  return shuffle([p.answer, ...wrong], random);
}

export function isCorrect(p: MathProblem, choice: number): boolean {
  return choice === p.answer;
}

/** Largest number any choice can show at any difficulty. */
function maxShownNumber(): number {
  return Math.max(
    ...(['beginner', 'intermediate', 'advanced'] as Difficulty[]).flatMap((d) =>
      allProblems(d).map((p) => Math.max(...distractorPool(p), p.answer)),
    ),
  );
}

export function brailleInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  const seen = new Set<string>();
  for (const d of ['beginner', 'intermediate', 'advanced'] as Difficulty[]) {
    for (const p of allProblems(d)) {
      if (seen.has(p.print)) continue;
      seen.add(p.print);
      items.push(g1Item('game:number-sense', p.print));
    }
  }
  for (let n = 0; n <= maxShownNumber(); n++) items.push(g1Item('game:number-sense', String(n)));
  return items;
}
