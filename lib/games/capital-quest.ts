/**
 * Capital Quest: read the capitals indicators.
 *
 * Each round shows a word or phrase in uncontracted UEB; the learner picks the print that matches,
 * from choices that differ only in capitalization ("Read" mode), or picks the braille that matches
 * a print phrase ("Write" mode). Every choice is a real transcription of a real print string, so a
 * wrong choice is always the braille of something else, never made-up braille.
 *
 * Skills: capital letter indicator (ICEB 8.3), capitalized word indicator (8.4), capitalized
 * passage indicator and capitals terminator (8.5, 8.6), and how a non-letter ends a capitalized
 * word (8.4.2).
 */
import type { Difficulty } from '@/lib/progress-types';
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { type Cell, cellsKey } from '@/lib/braille/ueb';
import { transcribe } from '@/lib/braille/transcribe';
import { type QuestionSpec, buildChoices } from './quiz';

export type CapitalMode = 'read' | 'write';

export interface CapitalItem {
  /** The print the braille shows. */
  answer: string;
  /** Same letters, different capitals. */
  variants: string[];
  /** What to notice, shown after answering. */
  lesson: string;
}

const LETTER_RULE = 'One capital letter: the capital letter indicator, right before it.';
const WORD_RULE = 'A whole word in capitals: the capitalized word indicator, once, before the word.';
const PASSAGE_RULE =
  'Three or more capitalized words: the capitalized passage indicator at the start, the capitals terminator after the last word.';
const BREAK_RULE =
  'A non-letter, like an apostrophe or hyphen, ends a capitalized word, so the capitals start again after it.';
const TERMINATOR_RULE = 'The capitals terminator ends capitals partway through a word.';

export const CAPITAL_ITEMS: Record<Difficulty, CapitalItem[]> = {
  beginner: [
    { answer: 'Sam', variants: ['sam', 'SAM', 'sAm'], lesson: LETTER_RULE },
    { answer: 'Max', variants: ['max', 'MAX', 'maX'], lesson: LETTER_RULE },
    { answer: 'Mom', variants: ['mom', 'MOM', 'MoM'], lesson: LETTER_RULE },
    { answer: 'Dad', variants: ['dad', 'DAD', 'DaD'], lesson: LETTER_RULE },
    { answer: 'ZOO', variants: ['zoo', 'Zoo', 'ZoO'], lesson: WORD_RULE },
    { answer: 'CAT', variants: ['cat', 'Cat', 'CaT'], lesson: WORD_RULE },
    { answer: 'dog', variants: ['Dog', 'DOG', 'doG'], lesson: 'No indicator at all: every letter is lowercase.' },
    { answer: 'sun', variants: ['Sun', 'SUN', 'sUn'], lesson: 'No indicator at all: every letter is lowercase.' },
    { answer: 'HI', variants: ['hi', 'Hi', 'hI'], lesson: WORD_RULE },
    { answer: 'Ann', variants: ['ann', 'ANN', 'AnN'], lesson: LETTER_RULE },
    { answer: 'I', variants: ['i'], lesson: 'The word I is a capital letter: one capital letter indicator.' },
    { answer: 'OK', variants: ['ok', 'Ok', 'oK'], lesson: WORD_RULE },
  ],
  intermediate: [
    {
      answer: 'McKay',
      variants: ['Mckay', 'MCKAY', 'mcKay'],
      lesson: 'Each capital inside a word gets its own capital letter indicator.',
    },
    { answer: 'DON’T', variants: ['Don’t', 'DON’t', 'don’t'], lesson: BREAK_RULE },
    { answer: 'X-RAY', variants: ['X-ray', 'x-ray', 'x-RAY'], lesson: BREAK_RULE },
    { answer: 'ABCs', variants: ['ABCS', 'Abcs', 'abcs'], lesson: TERMINATOR_RULE },
    { answer: 'TVs', variants: ['TVS', 'Tvs', 'tvs'], lesson: TERMINATOR_RULE },
    {
      answer: 'iPad',
      variants: ['IPad', 'ipad', 'IPAD'],
      lesson: 'A capital in the middle of a word still gets the capital letter indicator.',
    },
    { answer: 'BIG dog', variants: ['Big Dog', 'BIG DOG', 'big DOG'], lesson: WORD_RULE },
    {
      answer: 'BIG DOG',
      variants: ['BIG dog', 'Big Dog', 'big dog'],
      lesson: 'Two capitalized words: each gets its own capitalized word indicator. A passage needs three.',
    },
    { answer: 'New York', variants: ['new york', 'NEW YORK', 'New york'], lesson: LETTER_RULE },
    { answer: 'LOL', variants: ['Lol', 'lol', 'LoL'], lesson: WORD_RULE },
  ],
  advanced: [
    { answer: 'I LOVE YOU', variants: ['I love you', 'I LOVE you', 'I Love You'], lesson: PASSAGE_RULE },
    { answer: 'WE WIN TODAY', variants: ['We win today', 'WE WIN today', 'We Win Today'], lesson: PASSAGE_RULE },
    { answer: 'STOP AND LOOK', variants: ['Stop and look', 'STOP and LOOK', 'STOP AND look'], lesson: PASSAGE_RULE },
    {
      answer: 'I LOVE MY DOG now',
      variants: ['I LOVE MY DOG NOW', 'I love my dog now', 'I Love My Dog now'],
      lesson: PASSAGE_RULE,
    },
    {
      answer: 'READ IT ALOUD, Sam.',
      variants: ['Read it aloud, Sam.', 'READ IT ALOUD, SAM.', 'READ IT aloud, Sam.'],
      lesson: PASSAGE_RULE,
    },
    {
      answer: 'SPOT! GO HOME!',
      variants: ['Spot! Go home!', 'SPOT! GO home!', 'Spot! GO HOME!'],
      lesson: PASSAGE_RULE,
    },
    {
      answer: 'DON’T TOUCH IT',
      variants: ['Don’t touch it', 'DON’T touch it', 'DON’T TOUCH it'],
      lesson: `${PASSAGE_RULE} Inside a passage, the apostrophe does not restart anything.`,
    },
    { answer: 'MY ABCs', variants: ['MY ABCS', 'My ABCs', 'my abcs'], lesson: TERMINATOR_RULE },
  ],
};

export interface CapitalPrompt {
  mode: CapitalMode;
  item: CapitalItem;
}

/** A choice is print text; in write mode the UI shows its braille. */
export type CapitalSpec = QuestionSpec<CapitalPrompt, string>;

export function questionSpecs(difficulty: Difficulty, mode: CapitalMode): CapitalSpec[] {
  return CAPITAL_ITEMS[difficulty].map((item) => ({
    id: `capital-quest:${difficulty}:${mode}:${item.answer}`,
    prompt: { mode, item },
    answer: item.answer,
    distractorPool: item.variants,
  }));
}

export function allQuestionSpecs(): CapitalSpec[] {
  const levels: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  return levels.flatMap((d) => [...questionSpecs(d, 'read'), ...questionSpecs(d, 'write')]);
}

/** The braille shown for a print string. */
export function brailleFor(print: string): Cell[] {
  return transcribe(print);
}

/**
 * Is `choice` a right answer? In read mode the learner picks print for the shown braille; in write
 * mode the braille of the chosen print. Either way it is right exactly when its braille is the
 * braille of the answer.
 */
export function isCorrect(spec: CapitalSpec, choice: string): boolean {
  return cellsKey(brailleFor(choice)) === cellsKey(brailleFor(spec.answer));
}

export function makeRound(spec: CapitalSpec, random: () => number = Math.random) {
  return buildChoices(spec, Math.min(4, spec.distractorPool.length + 1), random);
}

export function brailleInventory(): InventoryItem[] {
  const prints = new Set<string>();
  for (const level of Object.values(CAPITAL_ITEMS))
    for (const item of level) [item.answer, ...item.variants].forEach((p) => prints.add(p));
  return [...prints].map((p) => g1Item('game:capital-quest', p));
}
