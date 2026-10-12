/**
 * The new game components: cells drawn as the data says, the right choice accepted, a wrong
 * choice rejected, keyboard and screen-reader basics, and the Brailler Challenge written end to
 * end with real six-key chords (trap 7).
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import BrailleCapitalQuest from '@/components/BrailleCapitalQuest';
import BrailleNumberLock from '@/components/BrailleNumberLock';
import BraillePunctuationDetective from '@/components/BraillePunctuationDetective';
import BraillerChallenge from '@/components/BraillerChallenge';
import { allTargets, startWriting, writeCell } from '@/lib/games/brailler-challenge';
import { DOT_TO_SIX_KEY } from '@/lib/braille/perkins';
import type { Cell } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

jest.useFakeTimers();

describe.each([
  ['Capital Quest', BrailleCapitalQuest],
  ['Number Lock', BrailleNumberLock],
  ['Punctuation Detective', BraillePunctuationDetective],
])('%s', (_name, Game) => {
  test('draws every cell as its data says, and choices state what they are', () => {
    const { container } = render(<Game />);
    expect(container.querySelectorAll('[data-braille-cell]').length).toBeGreaterThan(0);
    expect(checkAllCells(container)).toEqual([]);
    const choices = within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole('button');
    expect(choices.length).toBeGreaterThanOrEqual(2);
    for (const c of choices) expect(c.getAttribute('aria-label')).toMatch(/^Choice \d: .+/);
  });

  test('playing a whole game: each round accepts exactly one choice and explains the answer', () => {
    render(<Game />);
    for (let round = 0; round < 8; round++) {
      const group = screen.queryByRole('group', { name: 'Answer choices' });
      if (!group) break;
      fireEvent.click(within(group).getAllByRole('button')[0]);
      const status = screen.getAllByRole('status').find((s) => /Correct!|Not quite/.test(s.textContent ?? ''));
      expect(status).toBeDefined();
      const buttons = within(group).getAllByRole('button');
      // Exactly one choice is marked correct.
      expect(buttons.filter((b) => b.className.includes('correct'))).toHaveLength(1);
      fireEvent.click(screen.getByRole('button', { name: /Next|See results/ }));
    }
    expect(screen.getByRole('button', { name: 'Play again' })).toBeTruthy();
  });
});

describe('Brailler Challenge', () => {
  test('pure writer: every target at every level can be written, and wrong cells are refused', () => {
    for (const t of allTargets()) {
      let s = startWriting(t);
      for (const exp of s.expected) {
        const wrong = writeCell(s, exp.cell.length ? [] : [1]);
        expect(wrong.result).toBe('wrong');
        expect(wrong.state.position).toBe(s.position);
        const right = writeCell(s, exp.cell);
        expect(right.result).not.toBe('wrong');
        s = right.state;
      }
      expect(s.position).toBe(s.expected.length);
    }
  });

  function chord(el: HTMLElement, cell: Cell) {
    if (cell.length === 0) {
      fireEvent.keyDown(el, { key: ' ' });
      return;
    }
    const keys = cell.map((d) => DOT_TO_SIX_KEY[d]);
    keys.forEach((k) => fireEvent.keyDown(el, { key: k }));
    keys.forEach((k) => fireEvent.keyUp(el, { key: k }));
  }

  test('writing the shown phrases with six-key chords completes the game', () => {
    const { container } = render(<BraillerChallenge />);
    const keys = screen.getByRole('application');
    for (let i = 0; i < 5; i++) {
      const target = container.querySelector('.bchal-target')!.textContent!;
      const { expected } = startWriting(target);
      for (const e of expected) {
        chord(keys, e.cell);
        act(() => jest.advanceTimersByTime(400));
      }
      expect(screen.getByRole('status').textContent).toContain('Written!');
      expect(checkAllCells(container)).toEqual([]);
      fireEvent.click(screen.getByRole('button', { name: /Next phrase|See results/ }));
    }
    expect(screen.getByText(/Flawless writing!/)).toBeTruthy();
  });

  test('a wrong chord is refused and after two misses the hint names the keys', () => {
    const { container } = render(<BraillerChallenge />);
    const keys = screen.getByRole('application');
    const target = container.querySelector('.bchal-target')!.textContent!;
    const first = startWriting(target).expected[0];
    const wrong: Cell = first.cell.join() === '1' ? [2] : [1];
    chord(keys, wrong);
    chord(keys, wrong);
    expect(screen.getByRole('status').textContent).toMatch(/Hint: .* is .*\(keys .*\)/);
  });
});
