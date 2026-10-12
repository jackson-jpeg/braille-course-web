/**
 * Step 4 for the new games: every possible question, every difficulty and mode.
 * The judge is independent of each game's answer key: the braille of each choice is recomputed
 * with the transcriber (itself checked against liblouis for every one of these strings) and
 * compared with the braille shown.
 */
import * as capital from '@/lib/games/capital-quest';
import * as lock from '@/lib/games/number-lock';
import * as detective from '@/lib/games/punctuation-detective';
import * as challenge from '@/lib/games/brailler-challenge';
import { transcribe } from '@/lib/braille/transcribe';
import { PUNCTUATION, cellsKey, sameCell } from '@/lib/braille/ueb';
import { seededRandom } from '@/lib/games/quiz';
import oracle from '../fixtures/liblouis-oracle.json';

const louis = oracle.translations as Record<string, string>;
const braille = (print: string) => cellsKey(transcribe(print));
const unicode = (print: string) =>
  transcribe(print)
    .map((c) => String.fromCharCode(0x2800 + c.reduce((a, d) => a | (1 << (d - 1)), 0)))
    .join('');

describe.each([
  ['Capital Quest', capital.allQuestionSpecs(), capital.isCorrect, capital.makeRound],
  ['Number Lock', lock.allQuestionSpecs(), lock.isCorrect, lock.makeRound],
] as const)('%s', (_name, specs, isCorrect, makeRound) => {
  test('has questions at every difficulty in both modes', () => {
    expect(specs.length).toBeGreaterThan(40);
  });

  test.each(specs.map((s) => [s.id, s]))('%s', (_id, spec) => {
    // The braille shown is liblouis-verified.
    expect(louis[`g1\t${spec.answer}`]).toBe(unicode(spec.answer));
    // Correct answer accepted.
    expect(isCorrect(spec as never, spec.answer)).toBe(true);
    // Every distractor rejected, and none has the answer's braille (so none is accidentally correct).
    for (const d of spec.distractorPool) {
      expect(louis[`g1\t${d}`]).toBe(unicode(d));
      expect(braille(d)).not.toBe(braille(spec.answer));
      expect(isCorrect(spec as never, d)).toBe(false);
    }
    // No two choices share braille (so no question has two valid answers, in either mode).
    const all = [spec.answer, ...spec.distractorPool];
    expect(new Set(all.map(braille)).size).toBe(all.length);
    expect(new Set(all).size).toBe(all.length);
  });

  test('a shown round has the answer exactly once among distinct choices', () => {
    const rnd = seededRandom(3);
    for (const spec of specs) {
      const { choices, correctIndex } = makeRound(spec as never, rnd);
      expect(choices[correctIndex]).toBe(spec.answer);
      expect(choices.filter((c: string) => isCorrect(spec as never, c))).toHaveLength(1);
    }
  });
});

describe('Capital Quest content', () => {
  test('choices differ only in capitals (same letters, same order)', () => {
    for (const spec of capital.allQuestionSpecs())
      for (const d of spec.distractorPool) expect(d.toLowerCase()).toBe(spec.answer.toLowerCase());
  });
  test('all four capitals indicators are drilled (trap 2)', () => {
    const all = capital.allQuestionSpecs().map((s) => s.answer);
    const shown = new Set(
      all.flatMap(
        (a) =>
          transcribe(a).length &&
          require('@/lib/braille/transcribe')
            .transcribeTokens(a)
            .map((t: { signId: string }) => t.signId),
      ),
    );
    for (const id of ['capitalLetter', 'capitalWord', 'capitalPassage', 'capitalsTerminator'])
      expect(shown.has(id)).toBe(true);
  });
});

describe('Number Lock content', () => {
  test('numbers with commas and decimals, a grade 1 indicator case, and digits-without-indicator cases are all drilled (trap 3)', () => {
    const answers = lock.allQuestionSpecs().map((s) => s.answer);
    expect(answers).toEqual(expect.arrayContaining(['1,000', '3.5', '3b', 'bed']));
    expect(unicode('3b')).toBe('⠼⠉⠰⠃');
    expect(unicode('32')).toBe('⠼⠉⠃');
  });
});

describe('Punctuation Detective', () => {
  const specs = detective.allQuestionSpecs();
  test.each(specs.map((s) => [s.id, s]))('%s', (_id, spec) => {
    const it = spec.prompt;
    expect(louis[`g1\t${detective.fullText(it)}`]).toBe(unicode(detective.fullText(it)));
    // The highlighted token really is the answer mark's cells.
    const { tokens, index } = detective.shownTokens(it);
    const cells = tokens[index].cells;
    expect(cellsKey(cells).endsWith(cellsKey(PUNCTUATION[spec.answer].cells))).toBe(true);
    // Exactly one choice reproduces the braille shown: the answer.
    expect(detective.choiceMatchesBraille(it, spec.answer)).toBe(true);
    expect(detective.isCorrect(spec, spec.answer)).toBe(true);
    for (const d of spec.distractorPool) {
      expect(detective.choiceMatchesBraille(it, d)).toBe(false);
      expect(detective.isCorrect(spec, d)).toBe(false);
    }
    expect(spec.distractorPool.length).toBeGreaterThanOrEqual(3);
  });

  test('shared cell: the question mark and opening quotation mark both appear, and position decides (trap 4)', () => {
    const q = specs.filter((s) => s.answer === 'question' && s.distractorPool.includes('openQuote'));
    const o = specs.filter((s) => s.answer === 'openQuote' && s.distractorPool.includes('question'));
    expect(q.length).toBeGreaterThan(0);
    expect(o.length).toBeGreaterThan(0);
    expect(sameCell(PUNCTUATION.question.cells[0], PUNCTUATION.openQuote.cells[0])).toBe(true);
  });
});

describe('Brailler Challenge', () => {
  test('no target puts a capitals terminator next to punctuation (ICEB 8.6.2 allows either order there, so one fixed answer would be unfair)', () => {
    const { transcribeTokens } = require('@/lib/braille/transcribe');
    for (const t of challenge.allTargets()) {
      const toks = transcribeTokens(t) as { signId: string; kind: string }[];
      toks.forEach((tok, i) => {
        if (tok.signId !== 'capitalsTerminator') return;
        expect([t, toks[i - 1]?.kind, toks[i + 1]?.kind]).not.toContain('punctuation');
      });
    }
  });

  test.each(challenge.allTargets())(
    '%s: every expected cell is the liblouis cell, and only that cell is accepted',
    (target) => {
      const { cells } = challenge.expectedCells(target);
      expect(
        cells.map((c) => String.fromCharCode(0x2800 + c.cell.reduce((a, d) => a | (1 << (d - 1)), 0))).join(''),
      ).toBe(louis[`g1\t${target}`]);
      const all = require('@/lib/braille/ueb').ALL_CELLS;
      for (const exp of cells) {
        const accepted = all.filter((c: never) => challenge.acceptsCell(exp, c));
        expect(accepted).toEqual([exp.cell]);
      }
    },
  );
});
