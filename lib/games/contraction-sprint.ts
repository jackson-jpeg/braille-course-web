/**
 * Contraction Sprint: question logic (pure, no React).
 *
 * Three kinds of question:
 *   - recognition: a cell is shown; pick what it stands for in contracted braille.
 *   - recall: a contraction is named; pick its cell.
 *   - application: a word is shown in print; pick the contraction its braille uses.
 *
 * One right answer, always:
 *   - Some cells carry two contractions (dots of "ch" are also the wordsign "child"; "be" is
 *     both a lower wordsign and a lower groupsign, and shares its cell with "bb"). A recognition
 *     choice is therefore a CELL, labelled with every contraction that cell stands for
 *     ("child / ch"), so no two choices can both be right and the right choice is complete.
 *   - Recall choices are distinct cells, and no distractor cell also stands for the prompt.
 *   - Application distractors never occur in the word's print at all (so "th" is never offered
 *     for OTHER, which uses "the").
 */
import { type Cell, type Contraction, type ContractionKind, CONTRACTIONS, cellKey } from '@/lib/braille/ueb';
import { contractionsWithCells } from '@/lib/braille/shared';
import { describeCell } from '@/lib/braille/prose';
import type { ContractedWord } from '@/lib/braille/contracted';
import type { InventoryItem } from '@/lib/braille/inventory';
import { contractionWords, standaloneWords } from '@/lib/contraction-words';
import { type QuestionSpec, buildChoices, pickOne } from './quiz';

export type SprintDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type SprintQuestionKind = 'recognition' | 'recall' | 'application';

/** Contraction families practised at each level (each level adds to the one before). */
export const LEVEL_KINDS: Readonly<Record<SprintDifficulty, readonly ContractionKind[]>> = {
  beginner: ['alphabetic-wordsign'],
  intermediate: ['alphabetic-wordsign', 'strong-wordsign', 'strong-contraction', 'strong-groupsign'],
  advanced: [
    'alphabetic-wordsign',
    'strong-wordsign',
    'strong-contraction',
    'strong-groupsign',
    'lower-wordsign',
    'lower-groupsign',
  ],
};

/** Families that can be used inside a longer word. */
const INSIDE_WORD_KINDS: readonly ContractionKind[] = ['strong-contraction', 'strong-groupsign', 'lower-groupsign'];

export const TIME_LIMITS: Readonly<Record<SprintDifficulty, number>> = { beginner: 60, intermediate: 45, advanced: 30 };

export interface SprintChoice {
  /** Identity used for answer checking: a cell key (recognition, recall) or contraction text. */
  key: string;
  /** Text shown (recognition, application) or read to screen readers (recall: dot numbers). */
  label: string;
  /** Recall choices show a cell. */
  cell?: Cell;
}

export interface SprintPrompt {
  kind: SprintQuestionKind;
  /** Recognition: the cell shown. */
  cell?: Cell;
  /** Recall: the contraction named. Application: the word shown in print. */
  text?: string;
  /** Application: the word with its contracted pieces (revealed after answering). */
  word?: ContractedWord;
}

export type SprintSpec = QuestionSpec<SprintPrompt, SprintChoice>;

export function contractionPool(difficulty: SprintDifficulty): Contraction[] {
  const kinds = LEVEL_KINDS[difficulty];
  return CONTRACTIONS.filter((c) => kinds.includes(c.kind));
}

/** Every contraction a single cell stands for, e.g. "child / ch". */
export function cellMeaningLabel(cell: Cell): string {
  const texts = [...new Set(contractionsWithCells([cell]).map((c) => c.text))];
  if (texts.length === 0) throw new Error(`contraction-sprint: no contraction uses ${describeCell(cell)}`);
  return texts.join(' / ');
}

function uniqueCells(pool: readonly Contraction[]): Cell[] {
  const seen = new Map<string, Cell>();
  for (const c of pool) {
    if (c.cells.length !== 1) throw new Error(`contraction-sprint: ${c.text} is not one cell`);
    seen.set(cellKey(c.cells[0]), c.cells[0]);
  }
  return [...seen.values()];
}

function recognitionChoice(cell: Cell): SprintChoice {
  return { key: cellKey(cell), label: cellMeaningLabel(cell) };
}

function recallChoice(cell: Cell): SprintChoice {
  return { key: cellKey(cell), label: describeCell(cell), cell };
}

export function recognitionSpecs(difficulty: SprintDifficulty): SprintSpec[] {
  const cells = uniqueCells(contractionPool(difficulty));
  return cells.map((cell) => ({
    id: `contraction-sprint:${difficulty}:recognition:${cellKey(cell)}`,
    prompt: { kind: 'recognition', cell },
    answer: recognitionChoice(cell),
    distractorPool: cells.filter((c) => cellKey(c) !== cellKey(cell)).map(recognitionChoice),
  }));
}

export function recallSpecs(difficulty: SprintDifficulty): SprintSpec[] {
  const pool = contractionPool(difficulty);
  const cells = uniqueCells(pool);
  const texts = [...new Set(pool.map((c) => c.text))];
  return texts.map((text) => {
    const answerCells = uniqueCells(pool.filter((c) => c.text === text));
    if (answerCells.length !== 1) throw new Error(`contraction-sprint: "${text}" has more than one cell`);
    const answer = answerCells[0];
    return {
      id: `contraction-sprint:${difficulty}:recall:${text}`,
      prompt: { kind: 'recall', text },
      answer: recallChoice(answer),
      distractorPool: cells.filter((c) => cellKey(c) !== cellKey(answer)).map(recallChoice),
    };
  });
}

/** Words whose contractions all belong to this level's families. */
export function applicationWords(difficulty: SprintDifficulty): ContractedWord[] {
  if (difficulty === 'beginner') return [];
  const kinds = LEVEL_KINDS[difficulty];
  return contractionWords.filter((w) => w.pieces.every((p) => !p.contraction || kinds.includes(p.contraction.kind)));
}

export function applicationSpecs(difficulty: SprintDifficulty): SprintSpec[] {
  const kinds = LEVEL_KINDS[difficulty].filter((k) => INSIDE_WORD_KINDS.includes(k));
  const insideTexts = [...new Set(CONTRACTIONS.filter((c) => kinds.includes(c.kind)).map((c) => c.text))];
  return applicationWords(difficulty).flatMap((w) => {
    const used = [...new Set(w.pieces.filter((p) => p.contraction).map((p) => p.contraction!.text))];
    const distractors = insideTexts.filter((t) => !w.word.includes(t));
    return used.map((text) => ({
      id: `contraction-sprint:${difficulty}:application:${w.word}:${text}`,
      prompt: { kind: 'application' as const, text: w.word, word: w },
      answer: { key: text, label: text },
      distractorPool: distractors.map((t) => ({ key: t, label: t })),
    }));
  });
}

/** Every question this level can ask. */
export function questionSpecs(difficulty: SprintDifficulty): SprintSpec[] {
  return [...recognitionSpecs(difficulty), ...recallSpecs(difficulty), ...applicationSpecs(difficulty)];
}

/** The answer checker the game uses. */
export function isCorrect(spec: SprintSpec, choice: SprintChoice): boolean {
  return choice.key === spec.answer.key;
}

export interface SprintQuestion {
  spec: SprintSpec;
  choices: SprintChoice[];
  correctIndex: number;
}

const KIND_WEIGHTS: Readonly<Record<SprintDifficulty, readonly [SprintQuestionKind, number][]>> = {
  beginner: [
    ['recognition', 0.5],
    ['recall', 0.5],
  ],
  intermediate: [
    ['recognition', 0.35],
    ['recall', 0.35],
    ['application', 0.3],
  ],
  advanced: [
    ['recognition', 0.3],
    ['recall', 0.3],
    ['application', 0.4],
  ],
};

const specCache = new Map<SprintDifficulty, Record<SprintQuestionKind, SprintSpec[]>>();

function specsByKind(difficulty: SprintDifficulty): Record<SprintQuestionKind, SprintSpec[]> {
  let specs = specCache.get(difficulty);
  if (!specs) {
    specs = {
      recognition: recognitionSpecs(difficulty),
      recall: recallSpecs(difficulty),
      application: applicationSpecs(difficulty),
    };
    specCache.set(difficulty, specs);
  }
  return specs;
}

/** Pick a random question (avoiding recently asked spec ids) and its four choices. */
export function nextQuestion(
  difficulty: SprintDifficulty,
  recentIds: readonly string[] = [],
  random: () => number = Math.random,
): SprintQuestion {
  const roll = random();
  let acc = 0;
  let kind: SprintQuestionKind = 'recognition';
  for (const [k, w] of KIND_WEIGHTS[difficulty]) {
    acc += w;
    if (roll < acc) {
      kind = k;
      break;
    }
  }
  const specs = specsByKind(difficulty)[kind];
  const fresh = specs.filter((s) => !recentIds.includes(s.id));
  const spec = pickOne(fresh.length > 0 ? fresh : specs, random);
  const { choices, correctIndex } = buildChoices(spec, 4, random);
  return { spec, choices, correctIndex };
}

/** Every piece of braille this game can show (checked against liblouis en-ueb-g2). */
export function brailleInventory(): InventoryItem[] {
  return [...standaloneWords, ...contractionWords].map((w) => ({
    where: 'game:contraction-sprint',
    print: w.word,
    table: 'g2' as const,
    cells: w.cells,
  }));
}
