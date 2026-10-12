/**
 * Punctuation Detective: one cell group in a braille sentence is highlighted; which punctuation
 * mark is it?
 *
 * The answer is decided by the braille alone. For marks that share a cell (the question mark and
 * the opening quotation mark share one cell, ICEB 7.5 / 7.6.1), the position in the word
 * decides; a question is only ever posed when exactly one choice gives the braille shown (checked
 * in __tests__/games/punctuation-detective.test.ts by re-transcribing the sentence with each
 * choice in place).
 */
import type { Difficulty } from '@/lib/progress-types';
import type { InventoryItem } from '@/lib/braille/inventory';
import { g1Item } from '@/lib/braille/inventory';
import { PUNCTUATION, type PunctuationId, cellsKey } from '@/lib/braille/ueb';
import { type BrailleToken, TranscriptionError, transcribe, transcribeTokens } from '@/lib/braille/transcribe';
import { type QuestionSpec, buildChoices } from './quiz';

export interface DetectiveItem {
  before: string;
  mark: string;
  after: string;
}

function item(before: string, mark: string, after: string): DetectiveItem {
  return { before, mark, after };
}

export const DETECTIVE_ITEMS: Record<Difficulty, DetectiveItem[]> = {
  beginner: [
    item('I can swim', '.', ''),
    item('Hi', ',', ' Sam.'),
    item('Can you see it', '?', ''),
    item('We won', '!', ''),
    item('Is it 5', '?', ''),
    item('Yes', ',', ' I can.'),
    item('Look out', '!', ''),
    item('My dog is Max', '.', ''),
    item('Where is Mom', '?', ''),
    item('Red', ',', ' blue and green.'),
    item('Run', '!', ' Run!'),
    item('It is 10', '.', ''),
  ],
  intermediate: [
    item('It', '’', 's my hat.'),
    item('Ben', '’', 's dog ran.'),
    item('a well', '-', 'known song'),
    item('Note', ':', ' bring a pen.'),
    item('I came', ';', ' I saw.'),
    item('Mom', '’', 's car is red.'),
    item('an x', '-', 'ray'),
    item('We ran', ';', ' we won.'),
    item('Dear Sam', ':', ''),
    item('I can’t', '!', ''),
  ],
  advanced: [
    item('', '“', 'Hi,” said Sam.'),
    item('“Hi,', '”', ' said Sam.'),
    item('“Is it time?', '”', ''),
    item('“Is it time', '?', '”'),
    item('my dog ', '(', 'Max)'),
    item('my dog (Max', ')', ''),
    item('Wait ', '–', ' look!'),
    item('yes', '/', 'no'),
    item('', '“', 'Go!” I said.'),
    item('Ann ', '(', 'my mom) is here.'),
    item('Who is it', '?', '” he asked.'),
  ],
};

export const POOLS: Record<Difficulty, PunctuationId[]> = {
  beginner: ['period', 'comma', 'question', 'exclamation'],
  intermediate: ['period', 'comma', 'question', 'exclamation', 'apostrophe', 'hyphen', 'colon', 'semicolon'],
  advanced: [
    'question',
    'exclamation',
    'hyphen',
    'openQuote',
    'closeQuote',
    'openParen',
    'closeParen',
    'dash',
    'slash',
    'period',
  ],
};

export function fullText(it: DetectiveItem): string {
  return `${it.before}${it.mark}${it.after}`;
}

/** The punctuation id of the asked-about mark, according to the transcriber. */
export function answerId(it: DetectiveItem): PunctuationId {
  const { tokens, index } = shownTokens(it);
  return tokens[index].signId as PunctuationId;
}

/** Tokens of the sentence and which one is highlighted. */
export function shownTokens(it: DetectiveItem): { tokens: BrailleToken[]; index: number } {
  const tokens = transcribeTokens(fullText(it));
  let pos = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.print && pos === it.before.length && t.print === it.mark && t.kind === 'punctuation')
      return { tokens, index: i };
    pos += t.print.length;
  }
  throw new Error(`punctuation-detective: mark not found in "${fullText(it)}"`);
}

export type DetectiveSpec = QuestionSpec<DetectiveItem, PunctuationId>;

export function questionSpecs(difficulty: Difficulty): DetectiveSpec[] {
  return DETECTIVE_ITEMS[difficulty].map((it) => {
    const answer = answerId(it);
    return {
      id: `punctuation-detective:${difficulty}:${fullText(it)}@${it.before.length}`,
      prompt: it,
      answer,
      distractorPool: POOLS[difficulty].filter((id) => id !== answer),
    };
  });
}

export function allQuestionSpecs(): DetectiveSpec[] {
  return (['beginner', 'intermediate', 'advanced'] as Difficulty[]).flatMap(questionSpecs);
}

/**
 * Would the sentence, with `choice` in place of the mark, be written with exactly the braille shown?
 * This is the judge: a choice is right only if it reproduces the braille.
 */
export function choiceMatchesBraille(it: DetectiveItem, choice: PunctuationId): boolean {
  const print = PUNCTUATION[choice].print;
  try {
    return cellsKey(transcribe(`${it.before}${print}${it.after}`)) === cellsKey(transcribe(fullText(it)));
  } catch (e) {
    if (e instanceof TranscriptionError) return false; // that mark cannot stand there
    throw e;
  }
}

export function isCorrect(spec: DetectiveSpec, choice: PunctuationId): boolean {
  return choice === spec.answer;
}

export function makeRound(spec: DetectiveSpec, random: () => number = Math.random) {
  return buildChoices(spec, 4, random);
}

/** Print with the asked-about mark hidden, for the clue line. */
export function printWithBlank(it: DetectiveItem): string {
  return `${it.before}▢${it.after}`;
}

export function brailleInventory(): InventoryItem[] {
  return allQuestionSpecs().map((s) => g1Item('game:punctuation-detective', fullText(s.prompt)));
}
