/**
 * Trap 6: the drawn dot positions match the data, for every one of the 64 cells, in both the
 * display cell (BrailleCell) and the interactive cell (BrailleDotPad).
 */
import { render, fireEvent } from '@testing-library/react';
import BrailleCell from '@/components/BrailleCell';
import BrailleDotPad from '@/components/BrailleDotPad';
import { ALL_CELLS, cellKey } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

describe('BrailleCell', () => {
  test.each(ALL_CELLS.map((c) => [cellKey(c) || 'blank', c]))('cell %s is drawn as its data says', (_k, cell) => {
    const { container } = render(<BrailleCell cell={cell} />);
    expect(container.querySelectorAll('[data-braille-cell]')).toHaveLength(1);
    expect(checkAllCells(container)).toEqual([]);
  });

  test('dots are in two columns: 1, 2, 3 on the left and 4, 5, 6 on the right, top to bottom', () => {
    const { container } = render(<BrailleCell cell={[1, 2, 3, 4, 5, 6]} />);
    const pos = [...container.querySelectorAll('[data-dot]')].map((d) => {
      const s = (d as HTMLElement).style;
      return [d.getAttribute('data-dot'), s.gridColumn, s.gridRow].join(':');
    });
    expect(pos.sort()).toEqual(['1:1:1', '2:1:2', '3:1:3', '4:2:1', '5:2:2', '6:2:3']);
  });

  test('a labelled cell announces its dot numbers', () => {
    const { getByRole } = render(<BrailleCell cell={[1, 2, 5]} label="Letter H" />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Letter H, dots 1, 2, 5');
  });

  test('an unlabelled cell is hidden from screen readers (its control must describe it)', () => {
    const { container } = render(<BrailleCell cell={[1]} />);
    expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('BrailleDotPad', () => {
  test.each(ALL_CELLS.map((c) => [cellKey(c) || 'blank', c]))('pad %s is drawn as its data says', (_k, cell) => {
    const { container } = render(<BrailleDotPad cell={cell} onToggle={() => {}} label="Writer" />);
    expect(checkAllCells(container)).toEqual([]);
  });

  test('clicking a dot button toggles that dot number', () => {
    const seen: number[] = [];
    const { getByLabelText } = render(<BrailleDotPad cell={[]} onToggle={(d) => seen.push(d)} label="Writer" />);
    for (const d of [1, 2, 3, 4, 5, 6]) fireEvent.click(getByLabelText(`Dot ${d}`));
    expect(seen).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
