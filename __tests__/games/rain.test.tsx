import { render, fireEvent } from '@testing-library/react';
import BrailleRain from '@/components/BrailleRain';
import {
  RAIN_LETTERS,
  SIMILAR_POOL_SIZE,
  brailleInventory,
  dropForKey,
  keyMatchesDrop,
  pickLetter,
  rainCell,
  similarPool,
} from '@/lib/games/rain';
import { seededRandom } from '@/lib/games/quiz';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
const KEYS = [...LOWER, ...LOWER.map((l) => l.toUpperCase()), '1', '3', ' ', 'Enter', '#'];

describe('Rain: every drop and every key', () => {
  test('each drop is cleared by exactly its own letter key (either case), judged by the braille', () => {
    for (const letter of RAIN_LETTERS) {
      const drop = { id: 0, letter, x: 0, y: 0 };
      const shown = cellsKey([rainCell(letter)]);
      expect(shown).toBe(cellsKey(transcribe(letter)));
      for (const key of KEYS) {
        const judged = /^[a-z]$/i.test(key) && cellsKey(transcribe(key.toLowerCase())) === shown;
        expect(keyMatchesDrop(key, drop)).toBe(judged);
      }
      expect(LOWER.filter((k) => keyMatchesDrop(k, drop))).toEqual([letter]);
    }
  });

  test('look-alike pools are valid for every letter', () => {
    for (const l of RAIN_LETTERS) {
      const pool = similarPool(l);
      expect(pool).toHaveLength(SIMILAR_POOL_SIZE);
      expect(pool).not.toContain(l);
      for (const p of pool) expect(p).toMatch(/^[a-z]$/);
    }
  });

  test('spawned letters are always a–z', () => {
    const rnd = seededRandom(8);
    let prev: string | null = null;
    for (let i = 0; i < 2000; i++) {
      prev = pickLetter(prev, i % 2 === 0, rnd);
      expect(prev).toMatch(/^[a-z]$/);
    }
  });

  test('a key clears the lowest matching drop', () => {
    const drops = [
      { id: 1, letter: 'a', x: 0, y: 10 },
      { id: 2, letter: 'a', x: 0, y: 50 },
      { id: 3, letter: 'b', x: 0, y: 90 },
    ];
    expect(dropForKey('a', drops)!.id).toBe(2);
    expect(dropForKey('A', drops)!.id).toBe(2);
    expect(dropForKey('c', drops)).toBeNull();
  });

  test('inventory lists every letter', () => {
    expect(brailleInventory().map((i) => i.print)).toEqual([...RAIN_LETTERS]);
  });
});

describe('Rain renders correct cells', () => {
  test('falling cells are drawn as their data says and labelled by dots, not by letter', () => {
    const { container, getByText } = render(<BrailleRain />);
    fireEvent.click(getByText('Start Rain'));
    const cells = container.querySelectorAll('.rain-drop [data-braille-cell]');
    expect(cells.length).toBeGreaterThanOrEqual(1);
    expect(checkAllCells(container)).toEqual([]);
    for (const c of cells) expect(c.getAttribute('aria-label')).toMatch(/^Falling braille cell, dots? [1-6]/);
  });
});
