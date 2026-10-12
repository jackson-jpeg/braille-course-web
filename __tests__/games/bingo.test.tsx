import { render, fireEvent, act } from '@testing-library/react';
import BrailleBingo from '@/components/BrailleBingo';
import {
  BINGO_LETTERS,
  CENTER,
  FREE,
  LINES,
  bingoCell,
  brailleInventory,
  canMark,
  hasWon,
  initialMarks,
  makeCard,
  nextCall,
} from '@/lib/games/bingo';
import { seededRandom } from '@/lib/games/quiz';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

const braille = (l: string) => cellsKey(transcribe(l));

describe('Bingo: every card and every call', () => {
  test('letters a–z only, each with its own cell', () => {
    expect([...BINGO_LETTERS]).toEqual('abcdefghijklmnopqrstuvwxyz'.split(''));
    for (const l of BINGO_LETTERS) expect(cellsKey([bingoCell(l)])).toBe(braille(l));
  });

  test('random cards: 24 distinct letters + free centre; each call matches at most one square', () => {
    const rnd = seededRandom(21);
    for (let i = 0; i < 500; i++) {
      const card = makeCard(rnd);
      expect(card).toHaveLength(25);
      expect(card[CENTER]).toBe(FREE);
      const letters = card.filter((s) => s !== FREE);
      expect(letters).toHaveLength(24);
      expect(new Set(letters.map(braille)).size).toBe(24);
      for (const call of BINGO_LETTERS) {
        const called = new Set([call]);
        const markable = card.filter((sq) => canMark(sq, called));
        // Independent judge: the square shows the same braille as the call.
        const judged = card.filter((sq) => sq !== FREE && braille(sq) === braille(call));
        expect(markable).toEqual(judged);
        expect(markable.length).toBeLessThanOrEqual(1);
      }
    }
  });

  test('win conditions', () => {
    const m = initialMarks();
    expect(hasWon(m, 'line')).toBe(false);
    for (const i of LINES[0]) m[i] = true;
    expect(hasWon(m, 'line')).toBe(true);
    expect(hasWon(m, 'double-line')).toBe(false);
    for (const i of LINES[11]) m[i] = true;
    expect(hasWon(m, 'double-line')).toBe(true);
    expect(hasWon(m, 'blackout')).toBe(false);
    expect(hasWon(new Array(25).fill(true), 'blackout')).toBe(true);
  });

  test('a letter is never called twice; calling stops when all are called', () => {
    const rnd = seededRandom(1);
    const card = makeCard(rnd);
    const called = new Set<string>();
    for (let i = 0; i < 26; i++) {
      const c = nextCall(card, initialMarks(), called, rnd)!;
      expect(called.has(c)).toBe(false);
      called.add(c);
    }
    expect(nextCall(card, initialMarks(), called, rnd)).toBeNull();
  });

  test('inventory lists every letter', () => {
    expect(brailleInventory().map((i) => i.print)).toEqual([...BINGO_LETTERS]);
  });
});

describe('Bingo renders correct cells', () => {
  test('card and caller cells match their data and their print letters', () => {
    jest.useFakeTimers();
    try {
      const { container, getByText } = render(<BrailleBingo />);
      fireEvent.click(getByText('Start Bingo'));
      act(() => {
        jest.advanceTimersByTime(600);
      });
      expect(checkAllCells(container)).toEqual([]);
      const squares = [...container.querySelectorAll('.bingo-cell:not(.free)')];
      expect(squares).toHaveLength(24);
      // Unmarked squares show braille only (finding the braille is the game).
      for (const sq of squares) {
        expect(sq.querySelector('.bingo-cell-letter')!.textContent!.trim()).toBe('');
        expect(sq.getAttribute('aria-label')).toMatch(/^braille dots? /);
      }
      const current = container.querySelector('.bingo-current')!;
      const letter = current.querySelector('.bingo-current-letter')!.textContent!;
      expect(current.querySelector('[data-braille-cell]')!.getAttribute('data-dots')).toBe(braille(letter));
      // Marking the square whose braille is the called letter reveals that letter.
      const match = squares.find(
        (sq) => sq.querySelector('[data-braille-cell]')!.getAttribute('data-dots') === braille(letter),
      );
      if (match) {
        fireEvent.click(match);
        expect(match.querySelector('.bingo-cell-letter')!.textContent).toBe(letter);
        expect(match.getAttribute('aria-label')).toContain(`letter ${letter}`);
      }
    } finally {
      jest.useRealTimers();
    }
  });
});
