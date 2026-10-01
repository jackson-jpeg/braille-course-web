/**
 * Every piece of print text the site renders as braille, gathered in one place so the
 * accuracy tests can check each one against liblouis (see scripts/generate-ueb-oracle.ts).
 *
 * - UNCONTRACTED: shown cell-by-cell with our own transcriber (lib/ueb.ts `transcribe`).
 * - CONTRACTED: shown in UEB grade 2; the cells come from liblouis output stored in
 *   lib/data/ueb-contracted.json, because grade 2 has too many rules to hand-roll safely.
 *
 * When you add words or sentences to a game, add their source here. The test suite fails
 * until the oracle is regenerated, so nothing reaches learners unchecked.
 */

import { answerWords } from './game-words';
import { hangmanWords } from './hangman-words';
import { WORD_DECODER_LEVELS } from './games/word-decoder-content';
import { CONTRACTED_SENTENCES, CONTRACTION_EXAMPLES } from './games/contracted-content';
import { LESSON_BRAILLE_TEXT } from './course-curriculum';
import { contractionWords } from './contraction-words';

function unique(list: string[]): string[] {
  return Array.from(new Set(list)).sort();
}

export function uncontractedCorpus(): string[] {
  return unique([
    ...answerWords.map((w) => w.toLowerCase()),
    ...hangmanWords.map((w) => w.toLowerCase()),
    ...WORD_DECODER_LEVELS.flatMap((l) => l.items.map((i) => i.text)),
    ...LESSON_BRAILLE_TEXT.uncontracted,
  ]);
}

export function contractedCorpus(): string[] {
  return unique([
    ...CONTRACTED_SENTENCES.map((s) => s.text),
    ...CONTRACTION_EXAMPLES.map((e) => e.sentence),
    ...contractionWords.map((w) => w.word.toLowerCase()),
    ...LESSON_BRAILLE_TEXT.contracted,
  ]);
}
