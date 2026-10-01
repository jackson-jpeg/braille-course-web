/**
 * Keyboard + accessibility smoke tests for the six upgraded legacy games:
 * Dot Explorer, Speed Match, Memory Match, Word Game, Hangman and Bingo.
 */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import BrailleDotExplorer from '@/components/BrailleDotExplorer';
import BrailleSpeedMatch from '@/components/BrailleSpeedMatch';
import BrailleMemoryMatch from '@/components/BrailleMemoryMatch';
import BrailleWordGame from '@/components/BrailleWordGame';
import BrailleHangman from '@/components/BrailleHangman';
import BrailleBingo from '@/components/BrailleBingo';
import { LETTERS, describe as describeDots } from '@/lib/ueb';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/games',
}));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

const key = (k: string, target: Element | Window = window) => {
  act(() => {
    fireEvent.keyDown(target, { key: k });
  });
};

function expectBoardBasics() {
  expect(screen.getByTestId('game-board')).toBeInTheDocument();
  expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
}

function expectNamedButtons() {
  const buttons = screen.getAllByRole('button');
  expect(buttons.length).toBeGreaterThan(0);
  for (const b of buttons) expect(b).toHaveAccessibleName();
}

const status = () => screen.getByRole('status');

describe('Dot Explorer', () => {
  it('toggles dots with the keyboard and names what was made', () => {
    render(<BrailleDotExplorer />);
    expectBoardBasics();
    expectNamedButtons();

    key('1');
    expect(screen.getByRole('button', { name: 'Dot 1' })).toHaveAttribute('aria-pressed', 'true');
    // dot 1 is the letter a (and the digit 1 after a number sign) — not "1" on its own
    expect(screen.getByText('Letter')).toBeInTheDocument();
    expect(status()).toHaveTextContent(/Letter: a/);

    key('2'); // dots 1 2 = b
    expect(status()).toHaveTextContent(/dots 1 2.*Letter: b/);

    key('Escape');
    expect(screen.getByRole('button', { name: 'Dot 1' })).toHaveAttribute('aria-pressed', 'false');

    key('n');
    expect(status()).toHaveTextContent(/Challenge: make the letter [a-z]/);
    expectNamedButtons();
  });
});

describe('Speed Match', () => {
  it('starts with Enter and takes an answer from the number keys', () => {
    render(<BrailleSpeedMatch />);
    expectBoardBasics();
    expectNamedButtons();

    key('Enter');
    const mystery = screen.getByRole('img', { name: /^Mystery cell, dots? [1-6 ]+$/ });
    expect(mystery).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Which letter is this?');
    expectNamedButtons();

    key('1');
    expect(status()).toHaveTextContent(/Correct!|Not quite/);
    expect(screen.getByRole('group', { name: 'Answers' }).querySelector('.is-correct')).not.toBeNull();
  });
});

describe('Memory Match', () => {
  it('starts with Enter, moves with arrows and flips with Enter', () => {
    render(<BrailleMemoryMatch />);
    expectBoardBasics();
    expectNamedButtons();

    key('Enter');
    const grid = screen.getByRole('group', { name: /Cards, 4 per row/ });
    const cards = within(grid).getAllByRole('button');
    expect(cards).toHaveLength(12);
    expect(document.activeElement).toBe(cards[0]);
    expect(cards.filter((c) => c.tabIndex === 0)).toHaveLength(1);
    expectNamedButtons();

    key('Enter', document.activeElement!);
    expect(cards[0]).not.toHaveAccessibleName(/face down/);

    key('ArrowRight', document.activeElement!);
    expect(document.activeElement).toBe(cards[1]);
    key(' ', document.activeElement!);
    expect(cards[1]).not.toHaveAccessibleName(/face down/);

    const moves = screen.getByText('Moves').nextElementSibling;
    expect(moves).toHaveTextContent('1');
  });
});

describe('Word Game', () => {
  it('takes typed guesses and reports each letter without relying on colour', () => {
    jest.useFakeTimers();
    render(<BrailleWordGame />);
    expectBoardBasics();
    expectNamedButtons();

    for (const k of ['z', 'z', 'z', 'z']) key(k);
    key('Enter');
    expect(status()).toHaveTextContent(/not in the word list/);

    for (let i = 0; i < 4; i++) key('Backspace');
    for (const k of ['b', 'o', 'o', 'k']) key(k);
    key('Enter');
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/^Row 1: b: (right spot|in the word, wrong spot|not in the word); o:/)).toBeInTheDocument();
    expect(status()).toHaveTextContent(/Guess 1:|You found it/);
    expectNamedButtons();
  });
});

describe('Hangman', () => {
  it('starts with Enter and guesses letters by typing', () => {
    render(<BrailleHangman />);
    expectBoardBasics();
    expectNamedButtons();

    key('Enter');
    const word = screen.getByRole('list', { name: /The word, \d letters/ });
    const cells = within(word).getAllByRole('img');
    expect(cells.length).toBeGreaterThanOrEqual(4);
    // Unrevealed letters are described by their dots only
    for (const c of cells) expect(c).toHaveAccessibleName(/^Letter \d: braille cell, dots? [1-6 ]+$/);
    expectNamedButtons();

    key('e');
    expect(screen.getByRole('button', { name: /^e, (in|not in) the word$/ })).toHaveAttribute('aria-disabled', 'true');
    expect(status()).toHaveTextContent(/Yes! e is letter|No e\./);
  });
});

describe('Bingo', () => {
  it('starts with Enter and marks the called cell using arrows + Enter', () => {
    render(<BrailleBingo />);
    expectBoardBasics();
    expectNamedButtons();

    key('Enter');
    const called = document.querySelector('.bingo-call')!.textContent!.trim();
    expect(called).toMatch(/^[a-z]$/);
    expectNamedButtons();

    const card = screen.getByRole('group', { name: /Your bingo card/ });
    const cells = within(card).getAllByRole('button');
    expect(cells).toHaveLength(25);
    // Unmarked cells give dots, never the letter
    const target = cells.findIndex((b) => b.getAttribute('aria-label')!.endsWith(`: ${describeDots(LETTERS[called])}`));
    expect(target).toBeGreaterThanOrEqual(0);

    act(() => cells[0].focus());
    for (let r = 0; r < Math.floor(target / 5); r++) key('ArrowDown', document.activeElement!);
    for (let c = 0; c < target % 5; c++) key('ArrowRight', document.activeElement!);
    expect(document.activeElement).toBe(cells[target]);
    key('Enter', document.activeElement!);

    expect(cells[target]).toHaveAttribute('aria-pressed', 'true');
    expect(status()).toHaveTextContent(new RegExp(`Marked ${called}|Bingo`));

    key('n');
    expect(status()).toHaveTextContent(/Find the letter [a-z]/);
  });
});
