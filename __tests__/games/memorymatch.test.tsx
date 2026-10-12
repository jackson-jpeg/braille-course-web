import { render } from '@testing-library/react';
import BrailleMemoryMatch from '@/components/BrailleMemoryMatch';
import {
  MEMORY_LETTERS,
  PAIR_COUNT,
  type MemoryCard,
  brailleInventory,
  buildDeck,
  cardCell,
  dealLetters,
  isMatch,
  newDeck,
} from '@/lib/games/memorymatch';
import { seededRandom } from '@/lib/games/quiz';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

/**
 * Independent judge: a braille card and a letter card match when the cell on the braille card is
 * the uncontracted braille of the print on the letter card.
 */
function judge(a: MemoryCard, b: MemoryCard): boolean {
  if (a.id === b.id || a.type === b.type) return false;
  const [br, le] = a.type === 'braille' ? [a, b] : [b, a];
  return cellsKey([cardCell(br)]) === cellsKey(transcribe(le.letter));
}

describe('Memory Match: decks', () => {
  test('only the letters a–z can be dealt (no digits, no indicators)', () => {
    expect([...MEMORY_LETTERS]).toEqual('abcdefghijklmnopqrstuvwxyz'.split(''));
    for (const l of MEMORY_LETTERS) expect(transcribe(l)).toHaveLength(1);
  });

  test('every braille/letter card pair over the whole alphabet: match exactly when the braille agrees', () => {
    const deck = buildDeck(MEMORY_LETTERS);
    for (const a of deck)
      for (const b of deck) {
        expect(isMatch(a, b)).toBe(judge(a, b));
      }
    // Each braille card matches exactly one letter card.
    for (const br of deck.filter((c) => c.type === 'braille')) {
      expect(deck.filter((c) => judge(br, c))).toHaveLength(1);
    }
  });

  test('random decks: right size, distinct letters, one unambiguous partner per card', () => {
    const rnd = seededRandom(3);
    for (let i = 0; i < 1000; i++) {
      const deck = newDeck(PAIR_COUNT, rnd);
      expect(deck).toHaveLength(PAIR_COUNT * 2);
      const letters = new Set(deck.map((c) => c.letter));
      expect(letters.size).toBe(PAIR_COUNT);
      for (const l of letters) expect(l).toMatch(/^[a-z]$/);
      const brailleCells = deck.filter((c) => c.type === 'braille').map((c) => cellsKey([cardCell(c)]));
      expect(new Set(brailleCells).size).toBe(PAIR_COUNT);
      for (const a of deck) {
        const partners = deck.filter((b) => judge(a, b));
        expect(partners).toHaveLength(1);
        expect(deck.filter((b) => isMatch(a, b))).toEqual(partners);
      }
    }
  });

  test('dealLetters never repeats a letter, and the deck rejects duplicates', () => {
    const rnd = seededRandom(9);
    for (let i = 0; i < 200; i++) expect(new Set(dealLetters(10, rnd)).size).toBe(10);
    expect(() => buildDeck(['c', 'c'])).toThrow();
    expect(() => buildDeck(['3'])).toThrow();
  });

  test('inventory lists every letter', () => {
    expect(brailleInventory().map((i) => i.print)).toEqual([...MEMORY_LETTERS]);
  });
});

describe('Memory Match renders correct cells', () => {
  test('six braille cards, distinct, drawn as their data says; labels give dots, not the letter', () => {
    const { container } = render(<BrailleMemoryMatch />);
    const cells = [...container.querySelectorAll('[data-braille-cell]')].map((e) => e.getAttribute('data-dots'));
    expect(cells).toHaveLength(PAIR_COUNT);
    expect(new Set(cells).size).toBe(PAIR_COUNT);
    expect(checkAllCells(container)).toEqual([]);
    const letters = [...container.querySelectorAll('.memorymatch-card-letter')].map((e) => e.textContent!);
    for (const l of letters) expect(l).toMatch(/^[a-z]$/);
    // Every braille card has exactly one letter card with the same braille.
    for (const d of cells) expect(letters.filter((l) => cellsKey(transcribe(l)) === d)).toHaveLength(1);
  });
});
