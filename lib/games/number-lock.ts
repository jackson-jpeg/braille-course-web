/**
 * Number Lock: crack the code by reading numbers in braille.
 *
 * "Read" mode shows the lock's code in braille and asks for the print; "Set" mode shows the print
 * and asks which braille dial setting is right. Every choice is the real uncontracted UEB
 * transcription of some print string, so a wrong choice is always the braille of something else.
 *
 * Skills: numeric indicator and digits (ICEB 6.1), commas and decimal points inside a number
 * (6.2.1), what ends a number (6.3.1), the grade 1 indicator before a lowercase a–j right after a
 * number (6.5.2), and that digits without the numeric indicator are just letters.
 */
import type { Difficulty } from '@/lib/progress-types';
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { cellsKey } from '@/lib/braille/ueb';
import { transcribe } from '@/lib/braille/transcribe';
import { type QuestionSpec, buildChoices } from './quiz';

export type LockMode = 'read' | 'set';

export interface LockItem {
  answer: string;
  /** Print strings that look close but have different braille. */
  variants: string[];
  /** What to notice, shown after answering. */
  lesson: string;
}

const ONE_INDICATOR = 'One numeric indicator, then a to j for the digits.';
const INSIDE = 'Commas and decimal points stay inside the number: still one numeric indicator.';
const ENDS = 'A colon, hyphen, slash or space ends the number, so the next number gets its own numeric indicator.';
const G1 = 'A lowercase a to j right after a number gets the grade 1 indicator, so it is not read as a digit.';

export const LOCK_ITEMS: Record<Difficulty, LockItem[]> = {
  beginner: [
    { answer: '7', variants: ['6', '9', '0'], lesson: ONE_INDICATOR },
    { answer: '12', variants: ['21', '11', '120'], lesson: ONE_INDICATOR },
    { answer: '35', variants: ['53', '30', '36'], lesson: ONE_INDICATOR },
    { answer: '40', variants: ['4', '400', '49'], lesson: 'Zero uses the cell of j.' },
    { answer: '108', variants: ['180', '18', '801'], lesson: ONE_INDICATOR },
    { answer: '250', variants: ['205', '25', '520'], lesson: ONE_INDICATOR },
    { answer: '999', variants: ['99', '969', '699'], lesson: ONE_INDICATOR },
    { answer: '2026', variants: ['2062', '2006', '226'], lesson: ONE_INDICATOR },
    {
      answer: 'bed',
      variants: ['254', '2 5 4', 'BED'],
      lesson: 'No numeric indicator, so these cells are letters, not digits.',
    },
    {
      answer: 'jab',
      variants: ['012', 'JAB', '0 1 2'],
      lesson: 'No numeric indicator, so these cells are letters, not digits.',
    },
  ],
  intermediate: [
    { answer: '1,000', variants: ['1.000', '1000', '10,00'], lesson: INSIDE },
    { answer: '3.5', variants: ['3,5', '35', '3 5'], lesson: INSIDE },
    { answer: '12,500', variants: ['12.500', '1,250', '125,00'], lesson: INSIDE },
    { answer: '0.25', variants: ['0,25', '25', '2.5'], lesson: INSIDE },
    { answer: '5:30', variants: ['530', '5.30', '53:0'], lesson: ENDS },
    { answer: '3-4', variants: ['34', '3 4', '3.4'], lesson: ENDS },
    { answer: '9/11', variants: ['911', '9.11', '9-11'], lesson: ENDS },
    { answer: '7:45', variants: ['745', '7.45', '74:5'], lesson: ENDS },
    { answer: '$4.50', variants: ['$450', '$4,50', '$45.0'], lesson: INSIDE },
  ],
  advanced: [
    { answer: '3b', variants: ['32', '3B', '3 b'], lesson: G1 },
    {
      answer: '32',
      variants: ['3b', '3 2', '3B'],
      lesson: 'Without the grade 1 indicator, a to j after a number are digits.',
    },
    {
      answer: '4B',
      variants: ['4b', '42', '4 B'],
      lesson: 'A capital letter indicator ends the number by itself: no grade 1 indicator needed.',
    },
    {
      answer: '3rd',
      variants: ['3d', '34', '3RD'],
      lesson: 'k to z cannot be digits, so they need no grade 1 indicator.',
    },
    {
      answer: '2nd',
      variants: ['2d', '24', '2ND'],
      lesson: 'k to z cannot be digits, so they need no grade 1 indicator.',
    },
    { answer: '7am', variants: ['7AM', '71m', '7 am'], lesson: G1 },
    { answer: '10a', variants: ['101', '10A', '10 a'], lesson: G1 },
    { answer: '6j', variants: ['60', '6J', '6 j'], lesson: G1 },
    {
      answer: '1st',
      variants: ['1ST', '1 st', '1s'],
      lesson: 'k to z cannot be digits, so they need no grade 1 indicator.',
    },
  ],
};

export interface LockPrompt {
  mode: LockMode;
  item: LockItem;
}

export type LockSpec = QuestionSpec<LockPrompt, string>;

export function questionSpecs(difficulty: Difficulty, mode: LockMode): LockSpec[] {
  return LOCK_ITEMS[difficulty].map((item) => ({
    id: `number-lock:${difficulty}:${mode}:${item.answer}`,
    prompt: { mode, item },
    answer: item.answer,
    distractorPool: item.variants,
  }));
}

export function allQuestionSpecs(): LockSpec[] {
  const levels: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  return levels.flatMap((d) => [...questionSpecs(d, 'read'), ...questionSpecs(d, 'set')]);
}

export function isCorrect(spec: LockSpec, choice: string): boolean {
  return cellsKey(transcribe(choice)) === cellsKey(transcribe(spec.answer));
}

export function makeRound(spec: LockSpec, random: () => number = Math.random) {
  return buildChoices(spec, Math.min(4, spec.distractorPool.length + 1), random);
}

export function brailleInventory(): InventoryItem[] {
  const prints = new Set<string>();
  for (const level of Object.values(LOCK_ITEMS))
    for (const item of level) [item.answer, ...item.variants].forEach((p) => prints.add(p));
  return [...prints].map((p) => g1Item('game:number-lock', p));
}
