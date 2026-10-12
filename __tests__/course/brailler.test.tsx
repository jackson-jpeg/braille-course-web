/**
 * Trap 7: writing. The lesson writer uses the Perkins brailler key layout (S D F = dots 3 2 1,
 * J K L = dots 4 5 6). Every drill item in every lesson can be written cell by cell with those
 * keys and is accepted; a wrong cell is rejected.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import BraillerInput, { dotForKey } from '@/components/course/BraillerInput';
import LessonRunner from '@/components/course/LessonRunner';
import { ALL_LESSONS, getAdjacentLessons } from '@/lib/course-curriculum';
import {
  ChordReader,
  DOT_TO_SIX_KEY,
  PERKINS_KEYS_LEFT_TO_RIGHT,
  SIX_KEY_TO_DOT,
  keysForCell,
} from '@/lib/braille/perkins';
import { ALL_CELLS, type Cell, type Dot } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

jest.mock('next/dynamic', () => () => {
  const Stub = () => null;
  return Stub;
});

describe('Perkins key layout', () => {
  test('a Perkins brailler reads, left to right: dot 3, dot 2, dot 1, space, dot 4, dot 5, dot 6', () => {
    expect(PERKINS_KEYS_LEFT_TO_RIGHT).toEqual([3, 2, 1, 'space', 4, 5, 6]);
  });

  test('six-key entry puts the same fingers on S D F and J K L, in the same left-to-right order', () => {
    const homeRow = 'asdfghjkl'.split('').filter((k) => k in SIX_KEY_TO_DOT);
    expect(homeRow).toEqual(['s', 'd', 'f', 'j', 'k', 'l']);
    expect(homeRow.map((k) => SIX_KEY_TO_DOT[k])).toEqual(PERKINS_KEYS_LEFT_TO_RIGHT.filter((k) => k !== 'space'));
  });

  test('the lesson writer uses that layout, plus number keys 1–6', () => {
    expect(['f', 'd', 's', 'j', 'k', 'l'].map(dotForKey)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(['F', 'D', 'S', 'J', 'K', 'L'].map(dotForKey)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(['1', '2', '3', '4', '5', '6'].map(dotForKey)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(dotForKey('a')).toBeUndefined();
    expect(dotForKey('7')).toBeUndefined();
  });

  test('keysForCell lists the keys to press for every cell, left to right on the keyboard', () => {
    expect(keysForCell([1, 2, 5])).toEqual(['D', 'F', 'K']);
    for (const cell of ALL_CELLS) {
      const keys = keysForCell(cell);
      expect(keys.map((k) => SIX_KEY_TO_DOT[k.toLowerCase()]).sort()).toEqual([...cell]);
    }
    for (const d of [1, 2, 3, 4, 5, 6] as Dot[]) expect(SIX_KEY_TO_DOT[DOT_TO_SIX_KEY[d]]).toBe(d);
  });

  test('chord reader writes a cell when every key of the chord is released', () => {
    const r = new ChordReader();
    r.keyDown('f');
    r.keyDown('d');
    expect(r.keyUp('f')).toBeNull();
    r.keyDown('k');
    expect(r.keyUp('d')).toBeNull();
    expect(r.keyUp('k')).toEqual([1, 2, 5]);
    expect(r.keyDown('x')).toBe(false);
    for (const cell of ALL_CELLS.filter((c) => c.length)) {
      const keys = cell.map((d) => DOT_TO_SIX_KEY[d]);
      keys.forEach((k) => r.keyDown(k));
      let out: Cell | null = null;
      keys.forEach((k) => (out = r.keyUp(k) ?? out));
      expect(out).toEqual(cell);
    }
  });
});

function typeCell(group: HTMLElement, cell: Cell) {
  for (const d of cell) fireEvent.keyDown(group, { key: DOT_TO_SIX_KEY[d] });
  fireEvent.keyDown(group, { key: 'Enter' });
}

describe('lesson writer accepts every drill item, cell by cell', () => {
  const items = ALL_LESSONS.flatMap((l) => l.chars.map((c) => [l.slug, c.print, c] as const));
  test.each(items)('%s: %s', (_slug, _print, item) => {
    const solved = jest.fn();
    render(<BraillerInput target={item} onSolved={solved} solved={false} />);
    const group = screen.getByRole('group');
    item.cells.forEach((cell, i) => {
      expect(solved).not.toHaveBeenCalled();
      typeCell(group, cell);
      if (i < item.cells.length - 1) expect(screen.getByRole('status').textContent).toContain(`Cell ${i + 1} is right`);
    });
    expect(solved).toHaveBeenCalledWith(true);
  });

  test.each(items)('%s: %s rejects a wrong first cell', (_slug, _print, item) => {
    const solved = jest.fn();
    render(<BraillerInput target={item} onSolved={solved} solved={false} />);
    const group = screen.getByRole('group');
    const wrong = ALL_CELLS.find((c) => c.length && c.join() !== item.cells[0].join())!;
    typeCell(group, wrong);
    expect(solved).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain('Not quite');
    // Fix it: clear and write all cells correctly; it is solved, but not first try.
    fireEvent.keyDown(group, { key: 'Backspace' });
    item.cells.forEach((cell) => typeCell(group, cell));
    expect(solved).toHaveBeenCalledWith(false);
  });
});

describe('every lesson page draws its cells as the data says', () => {
  test.each(ALL_LESSONS.map((l) => [l.slug, l]))('%s', (_slug, lesson) => {
    const { prev, next } = getAdjacentLessons(lesson.slug);
    const { container } = render(<LessonRunner lesson={lesson} prev={prev} next={next} />);
    expect(checkAllCells(container)).toEqual([]);
    const expected = lesson.chars.reduce((n, c) => n + c.cells.length, 0);
    expect(container.querySelectorAll('.lesson-chars [data-braille-cell]').length).toBe(expected);
  });
});
