import { render, fireEvent } from '@testing-library/react';
import BrailleSpeedMatch from '@/components/BrailleSpeedMatch';
import {
  CHOICE_COUNT,
  SPEEDMATCH_MODES,
  brailleInventory,
  isCorrect,
  letterCell,
  makeRound,
  questionSpecs,
} from '@/lib/games/speedmatch';
import { seededRandom } from '@/lib/games/quiz';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey, LETTER_CELLS } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

/** Independent judge: the uncontracted braille of a printed choice. */
const brailleOf = (print: string) => cellsKey(transcribe(print));

describe('Speed Match: every question in both modes', () => {
  test.each(SPEEDMATCH_MODES)('%s: answer accepted, every distractor rejected and genuinely wrong', (mode) => {
    const specs = questionSpecs(mode);
    expect(specs.map((s) => s.answer).sort()).toEqual('abcdefghijklmnopqrstuvwxyz'.split(''));
    for (const spec of specs) {
      // The cell the game shows for the letter is the letter's uncontracted braille, one cell.
      const shown = cellsKey([letterCell(spec.prompt)]);
      expect(shown).toBe(brailleOf(spec.prompt));
      expect(isCorrect(spec, spec.answer)).toBe(true);
      expect(brailleOf(spec.answer)).toBe(shown);
      expect(spec.distractorPool.length).toBeGreaterThanOrEqual(CHOICE_COUNT - 1);
      for (const d of spec.distractorPool) {
        expect(d).toMatch(/^[a-z]$/); // never a digit, indicator or capital
        expect(isCorrect(spec, d)).toBe(false);
        expect(brailleOf(d)).not.toBe(shown);
      }
      // No two choices that could be shown together look the same.
      const all = [spec.answer, ...spec.distractorPool];
      expect(new Set(all.map(brailleOf)).size).toBe(all.length);
    }
  });

  test('rounds show distinct choices with exactly one right answer', () => {
    const rnd = seededRandom(42);
    for (let i = 0; i < 2000; i++) {
      const mode = SPEEDMATCH_MODES[i % 2];
      const { spec, choices } = makeRound(mode, rnd);
      expect(choices).toHaveLength(CHOICE_COUNT);
      expect(new Set(choices).size).toBe(CHOICE_COUNT);
      expect(choices.filter((c) => isCorrect(spec, c))).toEqual([spec.answer]);
      expect(choices.filter((c) => brailleOf(c) === brailleOf(spec.prompt))).toEqual([spec.answer]);
    }
  });

  test('inventory lists every letter the game can show', () => {
    const prints = brailleInventory().map((i) => i.print);
    for (const s of questionSpecs('read')) expect(prints).toContain(s.answer);
  });
});

describe('Speed Match renders correct cells', () => {
  test('read mode: drawn cells match their data, and exactly one choice matches the prompt', () => {
    const { container } = render(<BrailleSpeedMatch />);
    expect(checkAllCells(container)).toEqual([]);
    const prompt = container.querySelector('.speedmatch-prompt [data-braille-cell]')!;
    const dots = prompt.getAttribute('data-dots');
    const letters = [...container.querySelectorAll('.speedmatch-choice-letter')].map((e) => e.textContent!);
    expect(letters).toHaveLength(CHOICE_COUNT);
    for (const l of letters) expect(l).toMatch(/^[a-z]$/);
    expect(letters.filter((l) => LETTER_CELLS[l].join('') === dots)).toHaveLength(1);
    expect(prompt.getAttribute('aria-label')).toMatch(/^Braille cell, dots? /);
  });

  test('write mode: choice cells are distinct and their labels give dots, not the answer', () => {
    const { container, getByText } = render(<BrailleSpeedMatch />);
    fireEvent.click(getByText('Write Braille'));
    expect(checkAllCells(container)).toEqual([]);
    const letter = container.querySelector('.speedmatch-prompt-letter')!.textContent!;
    expect(letter).toMatch(/^[a-z]$/);
    const choiceCells = [...container.querySelectorAll('.speedmatch-choice [data-braille-cell]')].map((e) =>
      e.getAttribute('data-dots'),
    );
    expect(new Set(choiceCells).size).toBe(CHOICE_COUNT);
    expect(choiceCells.filter((d) => d === LETTER_CELLS[letter].join(''))).toHaveLength(1);
    for (const b of container.querySelectorAll('.speedmatch-choice')) {
      expect(b.getAttribute('aria-label')).toMatch(/^Choice \d: braille cell, dots? [1-6]/);
    }
  });
});
