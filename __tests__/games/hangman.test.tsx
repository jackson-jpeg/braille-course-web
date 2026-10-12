import { render, fireEvent, act } from '@testing-library/react';
import BrailleHangman from '@/components/BrailleHangman';
import {
  HANGMAN_WORDS,
  MAX_WRONG,
  brailleInventory,
  hangmanCell,
  isHit,
  isLost,
  isWon,
  keyToLetter,
  wrongGuesses,
} from '@/lib/games/hangman';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey, LETTER_CELLS } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');

describe('Hangman: word list', () => {
  test('every word is lowercase a–z only, 4 or 5 letters, no duplicates', () => {
    expect(HANGMAN_WORDS.length).toBeGreaterThan(500);
    for (const w of HANGMAN_WORDS) expect(w).toMatch(/^[a-z]{4,5}$/);
    expect(new Set(HANGMAN_WORDS).size).toBe(HANGMAN_WORDS.length);
  });

  test('a fully revealed word shows exactly its uncontracted UEB', () => {
    for (const w of HANGMAN_WORDS) {
      const truth = transcribe(w);
      expect(truth).toHaveLength(w.length);
      expect(cellsKey([...w].map(hangmanCell))).toBe(cellsKey(truth));
    }
  });

  test('every word and letter is in the inventory', () => {
    const prints = new Set(brailleInventory().map((i) => i.print));
    for (const w of HANGMAN_WORDS) expect(prints.has(w)).toBe(true);
    for (const l of LOWER) expect(prints.has(l)).toBe(true);
  });
});

describe('Hangman: every guess for every word', () => {
  test('a guess hits exactly when the word’s braille contains the letter’s cell', () => {
    for (const w of HANGMAN_WORDS) {
      const wordCells = transcribe(w).map((c) => cellsKey([c]));
      for (const l of LOWER) expect(isHit(w, l)).toBe(wordCells.includes(cellsKey(transcribe(l))));
    }
  });

  test('win and loss', () => {
    for (const w of HANGMAN_WORDS.slice(0, 200)) {
      const right = new Set(w);
      expect(isWon(w, right)).toBe(true);
      expect(isLost(w, right)).toBe(false);
      const wrong = LOWER.filter((l) => !right.has(l)).slice(0, MAX_WRONG);
      expect(wrongGuesses(w, wrong)).toEqual(wrong);
      expect(isLost(w, wrong)).toBe(true);
      expect(isLost(w, wrong.slice(0, MAX_WRONG - 1))).toBe(false);
      expect(isWon(w, new Set([...right].slice(1)))).toBe(false);
    }
    expect(keyToLetter('E')).toBe('e');
    expect(keyToLetter('5')).toBeNull();
  });
});

describe('Hangman renders correct cells', () => {
  test('keyboard cells, labels, and revealed letters', () => {
    const { container } = render(<BrailleHangman />);
    expect(checkAllCells(container)).toEqual([]);
    const keys = [...container.querySelectorAll('.hangman-key')];
    expect(keys).toHaveLength(26);
    for (const k of keys) {
      const letter = k.querySelector('.hangman-key-letter')!.textContent!;
      expect(letter).toMatch(/^[a-z]$/);
      expect(k.querySelector('[data-braille-cell]')!.getAttribute('data-dots')).toBe(LETTER_CELLS[letter].join(''));
      expect(k.getAttribute('aria-label')).toMatch(
        new RegExp(`^letter ${letter}, dots? ${LETTER_CELLS[letter].join(', ')}$`),
      );
    }
    // Guess every vowel; every revealed slot shows its letter's cell.
    for (const v of 'AEIOU') {
      act(() => {
        fireEvent.keyDown(window, { key: v });
      });
    }
    for (const slot of container.querySelectorAll('.hangman-letter-slot.revealed')) {
      const letter = slot.querySelector('.hangman-slot-letter')!.textContent!;
      expect(slot.querySelector('[data-braille-cell]')!.getAttribute('data-dots')).toBe(LETTER_CELLS[letter].join(''));
    }
    expect(checkAllCells(container)).toEqual([]);
  });
});
