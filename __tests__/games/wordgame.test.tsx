import { render, fireEvent, act } from '@testing-library/react';
import BrailleWordGame from '@/components/BrailleWordGame';
import {
  ANSWER_WORDS,
  VALID_GUESSES,
  WORD_LENGTH,
  brailleInventory,
  isValidGuess,
  keyToLetter,
  scoreGuess,
  updateKeyStatuses,
  wordCells,
} from '@/lib/games/wordgame';
import { seededRandom } from '@/lib/games/quiz';
import { transcribe } from '@/lib/braille/transcribe';
import { cellsKey, LETTER_CELLS } from '@/lib/braille/ueb';
import { checkAllCells } from '../helpers/cells';

describe('Word Game: word lists', () => {
  test('every word is exactly four lowercase letters a–z, with no duplicates', () => {
    for (const w of VALID_GUESSES) expect(w).toMatch(/^[a-z]{4}$/);
    expect(new Set(ANSWER_WORDS).size).toBe(ANSWER_WORDS.length);
    for (const w of ANSWER_WORDS) expect(VALID_GUESSES.has(w)).toBe(true);
    expect(WORD_LENGTH).toBe(4);
  });

  test('the braille shown for every word is exactly its uncontracted UEB', () => {
    for (const w of VALID_GUESSES) {
      const truth = transcribe(w);
      expect(truth).toHaveLength(4); // no indicators: lowercase letters only
      expect(cellsKey(wordCells(w))).toBe(cellsKey(truth));
    }
  });

  test('every word is in the inventory (so liblouis checks it)', () => {
    const prints = new Set(brailleInventory().map((i) => i.print));
    for (const w of VALID_GUESSES) expect(prints.has(w)).toBe(true);
    for (const l of 'abcdefghijklmnopqrstuvwxyz') expect(prints.has(l)).toBe(true);
  });

  test('guess validation and keys', () => {
    expect(isValidGuess(ANSWER_WORDS[0])).toBe(true);
    expect(isValidGuess(ANSWER_WORDS[0].toUpperCase())).toBe(false);
    expect(isValidGuess('zzzz')).toBe(false);
    expect(keyToLetter('Q')).toBe('q');
    expect(keyToLetter('q')).toBe('q');
    expect(keyToLetter('1')).toBeNull();
    expect(keyToLetter('Enter')).toBeNull();
  });
});

describe('Word Game: green / yellow / grey scoring', () => {
  const C = 'correct';
  const P = 'present';
  const A = 'absent';
  test.each([
    ['bell', 'lull', [A, A, C, C]], // the extra l has no unmatched copy left
    ['lamb', 'ball', [P, C, P, A]], // only one l in the answer: second l is grey
    ['dove', 'deed', [C, P, A, A]], // one e, one d (already green)
    ['free', 'eeee', [A, A, C, C]], // both e greens use up the answer’s e’s
    ['eels', 'seen', [P, C, P, A]], // two e’s: one green, one yellow
    ['abcd', 'dcba', [P, P, P, P]],
    ['book', 'oboe', [P, P, C, A]], // o at 2 green, o at 0 yellow (second o), b yellow
    ['geese', 'eerie', [P, C, A, A, C]], // five letters: the function is length-general
    ['bake', 'bake', [C, C, C, C]],
  ])('answer %s, guess %s', (answer, guess, expected) => {
    expect(scoreGuess(guess, answer)).toEqual(expected);
  });

  /** Independent properties every scoring must satisfy. */
  function checkProperties(guess: string, answer: string) {
    const s = scoreGuess(guess, answer);
    for (let i = 0; i < guess.length; i++) expect(s[i] === 'correct').toBe(guess[i] === answer[i]);
    for (const letter of new Set(guess)) {
      const inGuess = [...guess].filter((c) => c === letter).length;
      const inAnswer = [...answer].filter((c) => c === letter).length;
      const coloured = [...guess].filter((c, i) => c === letter && s[i] !== 'absent').length;
      expect(coloured).toBe(Math.min(inGuess, inAnswer));
      // Yellows never come after a grey of the same letter (left-to-right allocation).
      const yellows = [...guess].map((c, i) => (c === letter && s[i] === 'present' ? i : -1)).filter((i) => i >= 0);
      const greys = [...guess].map((c, i) => (c === letter && s[i] === 'absent' ? i : -1)).filter((i) => i >= 0);
      if (yellows.length && greys.length) expect(Math.max(...yellows)).toBeLessThan(Math.min(...greys));
    }
  }

  test('every answer against a sample of guesses obeys the scoring rules', () => {
    const guesses = [...VALID_GUESSES];
    const rnd = seededRandom(4);
    for (const answer of ANSWER_WORDS) {
      for (let i = 0; i < 40; i++) checkProperties(guesses[Math.floor(rnd() * guesses.length)], answer);
      checkProperties(answer, answer);
    }
  });

  test('keyboard colours only move up', () => {
    let k = updateKeyStatuses({}, 'ball', scoreGuess('ball', 'lamb'));
    expect(k).toEqual({ b: 'present', a: 'correct', l: 'present' });
    k = updateKeyStatuses(k, 'lamb', scoreGuess('lamb', 'lamb'));
    expect(k).toEqual({ b: 'correct', a: 'correct', l: 'correct', m: 'correct' });
    k = updateKeyStatuses(k, 'lull', scoreGuess('lull', 'lamb'));
    expect(k.l).toBe('correct');
    expect(k.u).toBe('absent');
  });
});

describe('Word Game renders correct cells', () => {
  test('keys and typed tiles show each letter’s cell', () => {
    const { container } = render(<BrailleWordGame />);
    expect(checkAllCells(container)).toEqual([]);
    const keys = [...container.querySelectorAll('.wordgame-key')].filter((k) => k.querySelector('[data-braille-cell]'));
    expect(keys).toHaveLength(26);
    for (const k of keys) {
      const letter = k.querySelector('.key-letter')!.textContent!;
      expect(letter).toMatch(/^[a-z]$/);
      expect(k.querySelector('[data-braille-cell]')!.getAttribute('data-dots')).toBe(LETTER_CELLS[letter].join(''));
      expect(k.getAttribute('aria-label')).toBe(
        `letter ${letter}, ${LETTER_CELLS[letter].length === 1 ? 'dot' : 'dots'} ${LETTER_CELLS[letter].join(', ')}`,
      );
    }
    for (const ch of 'BAKE') {
      act(() => {
        fireEvent.keyDown(window, { key: ch });
      });
    }
    const tiles = [...container.querySelectorAll('.wordgame-board [data-braille-cell]')].map((e) =>
      e.getAttribute('data-dots'),
    );
    expect(tiles.join('|')).toBe(cellsKey(transcribe('bake')));
    expect(checkAllCells(container)).toEqual([]);
  });
});
