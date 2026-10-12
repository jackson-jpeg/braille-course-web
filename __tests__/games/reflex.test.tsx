import { render, fireEvent, act } from '@testing-library/react';
import BrailleReflexDots from '@/components/BrailleReflexDots';
import {
  REFLEX_LETTERS,
  REFLEX_PARAMS,
  brailleInventory,
  cellDiff,
  dotForKey,
  isCorrect,
  reflexCell,
} from '@/lib/games/reflex';
import { transcribe } from '@/lib/braille/transcribe';
import { ALL_CELLS, LETTER_CELLS, cellsKey } from '@/lib/braille/ueb';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import { checkAllCells } from '../helpers/cells';

describe('Reflex Dots: every letter against all 64 cells', () => {
  test.each([...REFLEX_LETTERS])('%s: exactly its own cell is accepted', (letter) => {
    const truth = cellsKey(transcribe(letter));
    expect(cellsKey([reflexCell(letter)])).toBe(truth);
    const accepted = ALL_CELLS.filter((c) => isCorrect(c, letter));
    expect(accepted.map((c) => cellsKey([c]))).toEqual([truth]);
    for (const c of ALL_CELLS) expect(isCorrect(c, letter)).toBe(cellsKey([c]) === truth);
  });

  test('number key n toggles dot n; nothing else is a dot key', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) expect(dotForKey(String(n))).toBe(n);
    for (const k of ['0', '7', '8', '9', '12', 'a', 'f', 'Enter', ' ']) expect(dotForKey(k)).toBeNull();
  });

  test('difficulty settings match the game module', () => {
    for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
      expect(getDifficultyParams('reflex-dots', level)).toEqual(REFLEX_PARAMS[level]);
    }
  });

  test('cellDiff reports missing and extra dots', () => {
    expect(cellDiff([1, 2], [1, 4])).toEqual({ missing: [4], extra: [2] });
    expect(cellDiff(LETTER_CELLS.h, LETTER_CELLS.h)).toEqual({ missing: [], extra: [] });
  });

  test('inventory lists every letter', () => {
    expect(brailleInventory().map((i) => i.print)).toEqual([...REFLEX_LETTERS]);
  });
});

describe('Reflex Dots renders correct cells and keyboard entry', () => {
  test('shown cell, dot pad and keys 1–6 all agree on dot numbers', () => {
    jest.useFakeTimers();
    try {
      const { container, getByText } = render(<BrailleReflexDots />);
      fireEvent.click(getByText('Start Game'));
      const shown = container.querySelector('.reflex-display [data-braille-cell]')!;
      const letter = container.querySelector('.reflex-display .reflex-letter-badge')!.textContent!;
      expect(letter).toMatch(/^[a-z]$/);
      expect(shown.getAttribute('data-dots')).toBe(cellsKey(transcribe(letter)));
      expect(checkAllCells(container)).toEqual([]);

      act(() => {
        jest.advanceTimersByTime(REFLEX_PARAMS.beginner.displayTime + 10);
      });
      const pad = () => container.querySelector('.reflex-input [data-braille-cell]')!;
      expect(pad().getAttribute('data-dots')).toBe('');
      for (const n of [1, 2, 3, 4, 5, 6]) {
        act(() => {
          fireEvent.keyDown(window, { key: String(n) });
        });
        expect(pad().getAttribute('data-dots')).toBe(String(n));
        expect(pad().querySelector(`[data-dot="${n}"]`)!.getAttribute('aria-pressed')).toBe('true');
        expect(checkAllCells(container)).toEqual([]);
        act(() => {
          fireEvent.keyDown(window, { key: String(n) });
        });
        expect(pad().getAttribute('data-dots')).toBe('');
      }

      // Enter the right answer by keyboard and check it is accepted.
      for (const d of LETTER_CELLS[letter]) {
        act(() => {
          fireEvent.keyDown(window, { key: String(d) });
        });
      }
      expect(pad().getAttribute('data-dots')).toBe(LETTER_CELLS[letter].join(''));
      act(() => {
        fireEvent.keyDown(window, { key: 'Enter' });
      });
      expect(container.querySelector('.reflex-feedback.correct')).not.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});
