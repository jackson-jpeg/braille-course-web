import { render, fireEvent } from '@testing-library/react';
import BrailleAlphabet from '@/components/BrailleAlphabet';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey } from '@/lib/braille/ueb';
import { describeCell } from '@/lib/braille/prose';
import { checkAllCells } from '../helpers/cells';

describe('Braille alphabet chart', () => {
  test('26 lowercase letter cards, each with its own uncontracted cell and a dot-number label', () => {
    const { container } = render(<BrailleAlphabet />);
    const cards = [...container.querySelectorAll('.alpha-card')];
    expect(cards).toHaveLength(26);
    expect(checkAllCells(container)).toEqual([]);
    for (const card of cards) {
      const letter = card.querySelector('.alpha-card-letter')!.textContent!;
      expect(letter).toMatch(/^[a-z]$/);
      const [cell] = transcribe(letter);
      expect(card.querySelector('[data-braille-cell]')!.getAttribute('data-dots')).toBe(cellsKey([cell]));
      expect(card.getAttribute('aria-label')).toBe(`letter ${letter}, ${describeCell(cell)}`);
    }
  });

  test('the detail panel shows the chosen letter’s cell with numbered dots', () => {
    const { container } = render(<BrailleAlphabet />);
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
      fireEvent.click(container.querySelector(`[aria-label^="letter ${letter},"]`)!);
      const detail = container.querySelector('.alpha-detail')!;
      const [cell] = transcribe(letter);
      expect(detail.querySelector('[data-braille-cell]')!.getAttribute('data-dots')).toBe(cellsKey([cell]));
      expect(detail.querySelector('.alpha-detail-desc')!.textContent!.toLowerCase()).toBe(describeCell(cell));
      expect(checkAllCells(container)).toEqual([]);
      fireEvent.click(container.querySelector('.alpha-detail-close')!);
    }
  });
});
