/**
 * Sentence Decoder: sentences and answer checking (pure, no React).
 *
 * Levels:
 *   - beginner:     short uncontracted (grade 1) sentences: capitals, . ? ! , ’
 *   - intermediate: uncontracted sentences with numbers (commas, decimals, a grade 1 indicator
 *                   after a digit as in "3b"), capitalized words, quotes, parentheses, hyphens
 *   - advanced:     contracted (grade 2) sentences built only from contractions the site teaches
 *
 * Answers are compared ignoring capitals, punctuation and extra spaces (see normalizeAnswer).
 */
import type { Cell } from '@/lib/braille/ueb';
import { describeCells } from '@/lib/braille/prose';
import { type InventoryItem } from '@/lib/braille/inventory';
import { BEGINNER_SENTENCES, CONTRACTED_SENTENCES, INTERMEDIATE_SENTENCES } from '@/lib/sentence-bank';
import { type DecoderSentence, contractedSentence, uncontractedSentence } from '@/lib/sentence-generator';
import { shuffle } from './quiz';

export type DecoderDifficulty = 'beginner' | 'intermediate' | 'advanced';

export const ROUNDS = 5;

let cache: Record<DecoderDifficulty, DecoderSentence[]> | null = null;

/** Every sentence a level can show. */
export function sentencesFor(difficulty: DecoderDifficulty): DecoderSentence[] {
  if (!cache) {
    cache = {
      beginner: BEGINNER_SENTENCES.map(uncontractedSentence),
      intermediate: INTERMEDIATE_SENTENCES.map(uncontractedSentence),
      advanced: CONTRACTED_SENTENCES.map(contractedSentence),
    };
  }
  return cache[difficulty];
}

export function isContracted(difficulty: DecoderDifficulty): boolean {
  return difficulty === 'advanced';
}

/**
 * Answer normalisation (the sentences use only the letters a–z): lowercase; apostrophes dropped (it’s = its); a comma between digits
 * dropped (1,000 = 1000); a decimal point kept (3.5 ≠ 35); every other punctuation mark (including
 * hyphens, quotes and parentheses) read as a space; spaces collapsed.
 */
export function normalizeAnswer(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[‘’'`]/g, '')
    .replace(/(\d),(?=\d)/g, '$1')
    .replace(/(\d)\.(?=\d)/g, '$1\u0001')
    .replace(/[^a-z0-9\u0001\s]/g, ' ')
    .replace(/\u0001/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The answer checker the game uses. */
export function isCorrect(sentence: DecoderSentence, input: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(sentence.print);
}

/** A game's worth of sentences, in random order, no repeats. */
export function pickSentences(
  difficulty: DecoderDifficulty,
  count = ROUNDS,
  random: () => number = Math.random,
): DecoderSentence[] {
  return shuffle(sentencesFor(difficulty), random).slice(0, count);
}

/** Words of the sentence as groups of cells (split at the blank cells). */
export function cellWords(sentence: DecoderSentence): Cell[][] {
  const words: Cell[][] = [[]];
  for (const t of sentence.tokens) {
    if (t.kind === 'space') words.push([]);
    else words[words.length - 1].push(...t.cells);
  }
  return words;
}

/**
 * Dot-number description of the braille, word by word, for screen-reader users (and anyone who
 * wants it read out). It names dots, not letters, so it does not give the answer away.
 */
export function describeSentence(sentence: DecoderSentence): string {
  return cellWords(sentence)
    .map((cells, i) => `Word ${i + 1}: ${describeCells(cells)}.`)
    .join(' ');
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return (['beginner', 'intermediate', 'advanced'] as const).flatMap((d) =>
    sentencesFor(d).map((s) => ({
      where: `game:sentence-decoder:${d}`,
      print: s.print,
      table: s.table,
      cells: s.cells,
    })),
  );
}
