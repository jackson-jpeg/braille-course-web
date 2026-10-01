/**
 * Six upgraded games: Braille Rain, Reflex Dots, Sequence, Number Sense, Contraction Sprint,
 * Sentence Decoder. Each must render a game board without an h1, be playable with only the
 * keyboard, and give every button an accessible name.
 */
import '@testing-library/jest-dom';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';

import BrailleRain from '@/components/BrailleRain';
import BrailleReflexDots from '@/components/BrailleReflexDots';
import BrailleSequence from '@/components/BrailleSequence';
import BrailleNumberSense from '@/components/BrailleNumberSense';
import BrailleContractionSprint, { makeQuestion } from '@/components/BrailleContractionSprint';
import BrailleSentenceDecoder from '@/components/BrailleSentenceDecoder';
import { LETTERS, toUnicode } from '@/lib/ueb';
import { CONTRACTED_SENTENCES } from '@/lib/games/contracted-content';
import contracted from '@/lib/data/ueb-contracted.json';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/games',
  useSearchParams: () => new URLSearchParams(),
}));

const BRAILLE = (contracted as { braille: Record<string, string> }).braille;

let reducedMotion = false;

beforeEach(() => {
  reducedMotion = false;
  window.localStorage.clear();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** Press a key on the page body (not inside a text box). */
function pressOnPage(key: string) {
  fireEvent.keyDown(document.body, { key });
}

function expectBoard(container: HTMLElement) {
  expect(screen.getByTestId('game-board')).toBeInTheDocument();
  expect(container.querySelector('h1')).toBeNull();
}

/** Accessible name of a button: aria-labelledby, aria-label, or its text minus aria-hidden parts. */
function accessibleName(el: HTMLElement): string {
  const ids = el.getAttribute('aria-labelledby');
  if (ids) {
    return ids
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
      .trim();
  }
  const label = el.getAttribute('aria-label');
  if (label) return label.trim();
  const copy = el.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return (copy.textContent ?? '').trim() || (el.getAttribute('title') ?? '').trim();
}

function expectNamedButtons() {
  const buttons = screen.queryAllByRole('button');
  for (const b of buttons) {
    expect(accessibleName(b)).not.toBe('');
  }
}

function status(): string {
  return screen.getByRole('status').textContent ?? '';
}

const LETTER_BY_DOTS = new Map(Object.entries(LETTERS).map(([l, d]) => [d.join(''), l]));
const letterOf = (cell: Element) => LETTER_BY_DOTS.get(cell.getAttribute('data-dots') ?? '') ?? '?';

/* ── shared checks for every game ────────────────────────────────────────── */

const GAMES: [string, ComponentType][] = [
  ['Braille Rain', BrailleRain],
  ['Reflex Dots', BrailleReflexDots],
  ['Sequence', BrailleSequence],
  ['Number Sense', BrailleNumberSense],
  ['Contraction Sprint', BrailleContractionSprint],
  ['Sentence Decoder', BrailleSentenceDecoder],
];

describe.each(GAMES)('%s', (_name, Game) => {
  it('renders a game board with no h1 and named buttons, before and after starting', () => {
    const { container } = render(<Game />);
    expectBoard(container);
    expectNamedButtons();
    pressOnPage('Enter');
    expectBoard(container);
    expect(screen.queryByRole('button', { name: /^start$/i })).toBeNull();
    expectNamedButtons();
  });
});

/* ── keyboard play, game by game ─────────────────────────────────────────── */

describe('Braille Rain', () => {
  it('starts with Enter and catches a cell by typing its letter', () => {
    const { container } = render(<BrailleRain />);
    pressOnPage('Enter');
    const cell = container.querySelector('.rain-drop .cell');
    expect(cell).not.toBeNull();
    expect(cell).toHaveAttribute('role', 'img');
    expect(cell!.getAttribute('aria-label')).toMatch(/^Falling cell, dots? [1-6 ]+$/);
    const letter = letterOf(cell!);
    pressOnPage(letter);
    expect(status()).toMatch(new RegExp(`Caught ${letter}`));
    expectNamedButtons();
  });

  it('pauses and resumes from the keyboard', () => {
    render(<BrailleRain />);
    pressOnPage('Enter');
    pressOnPage(' ');
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Resume' }).length).toBeGreaterThan(0);
    pressOnPage('Escape');
    expect(screen.queryByText('Paused')).toBeNull();
  });

  it('shows a static queue instead of falling cells under reduced motion', () => {
    reducedMotion = true;
    const { container } = render(<BrailleRain />);
    pressOnPage('Enter');
    expect(screen.getByTestId('rain-queue')).toBeInTheDocument();
    expect(container.querySelector('.rain-drop')).toBeNull();
    const cell = container.querySelector('.rain-queue .cell')!;
    pressOnPage(letterOf(cell));
    expect(status()).toMatch(/Caught/);
  });
});

describe('Reflex Dots', () => {
  it('shows a cell, hides it, and checks the dots typed with keys 1–6', () => {
    jest.useFakeTimers();
    render(<BrailleReflexDots />);
    pressOnPage('Enter');
    const shown = screen.getByRole('img', { name: /^Cell to remember/ });
    const dots = (shown.getAttribute('data-dots') ?? '').split('');
    expect(dots.length).toBeGreaterThan(0);
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(screen.getByRole('group', { name: /^Your cell/ })).toBeInTheDocument();
    for (const d of dots) pressOnPage(d);
    pressOnPage('Enter');
    expect(status()).toMatch(/^Correct!/);
    expectNamedButtons();
  });
});

describe('Sequence', () => {
  it('sorts the cards with number keys and checks with Enter', () => {
    const { container } = render(<BrailleSequence />);
    pressOnPage('Enter');
    const lettersNow = () =>
      Array.from(container.querySelectorAll('.seq-card')).map((b) => letterOf(b.querySelector('.cell')!));
    const target = [...lettersNow()].sort();
    for (let i = 0; i < target.length; i++) {
      const j = lettersNow().indexOf(target[i]);
      if (j !== i) {
        pressOnPage(String(i + 1));
        pressOnPage(String(j + 1));
      }
    }
    expect(lettersNow()).toEqual(target);
    pressOnPage('Enter');
    expect(status()).toMatch(/^All in order!/);
    expectNamedButtons();
  });
});

describe('Number Sense', () => {
  it('shows the Nemeth note and an equals sign of dots 4 6 then 1 3, and answers with a number key', () => {
    render(<BrailleNumberSense />);
    expect(screen.getByText('Math braille here uses Nemeth Code, used in many US schools.')).toBeInTheDocument();
    pressOnPage('Enter');
    const cells = Array.from(screen.getByTestId('ns-problem').querySelectorAll('.cell')).map((c) =>
      c.getAttribute('data-dots'),
    );
    expect(cells[0]).toBe('3456'); // one numeric indicator at the start of the line
    expect(cells.filter((d) => d === '3456')).toHaveLength(1);
    const eq = cells.indexOf('46');
    expect(eq).toBeGreaterThan(0);
    expect(cells[eq + 1]).toBe('13');
    // The equals sign has a blank cell on each side.
    const run = screen.getByTestId('ns-problem').querySelector('.ns-cells')!;
    const kids = Array.from(run.children).map((el) =>
      el.classList.contains('ns-space') ? ' ' : el.getAttribute('data-dots'),
    );
    const at = kids.indexOf('46');
    expect(kids[at - 1]).toBe(' ');
    expect(kids[at + 2]).toBe(' ');
    // The question is described by dots, not by the print problem.
    expect(screen.getByRole('img', { name: /^Math problem in braille: dots 3 4 5 6/ })).toBeInTheDocument();

    pressOnPage('1');
    expect(status()).toMatch(/^(Correct!|Not quite\.)/);
    expect(screen.getByRole('button', { name: /Next problem/ })).toHaveFocus();
    expectNamedButtons();
  });
});

describe('full rounds', () => {
  it('Number Sense: ten problems by keyboard end on a focused results heading', () => {
    render(<BrailleNumberSense />);
    pressOnPage('Enter');
    for (let i = 0; i < 10; i++) {
      pressOnPage('1');
      pressOnPage('Enter'); // focus is on the Next button; Enter on the page also advances
    }
    const heading = screen.getByRole('heading', { level: 2, name: /Perfect|Great|Good|Keep/ });
    expect(heading).toHaveFocus();
    expect(screen.getByText(/of 10 correct/)).toBeInTheDocument();
    expectNamedButtons();
  });

  it('Contraction Sprint relaxed mode has no timer and ends after 20 questions', () => {
    render(<BrailleContractionSprint />);
    fireEvent.click(screen.getByRole('radio', { name: /Relaxed/ }));
    pressOnPage('Enter');
    expect(screen.queryByText('Time')).toBeNull();
    for (let i = 0; i < 20; i++) {
      pressOnPage('1');
      pressOnPage('Enter');
    }
    expect(screen.getByText(/of 20 correct/)).toBeInTheDocument();
  });
});

describe('Contraction Sprint', () => {
  it('answers a question with a number key', () => {
    render(<BrailleContractionSprint />);
    pressOnPage('Enter');
    pressOnPage('1');
    expect(status()).toMatch(/^(Correct!|Not quite\.)/);
    expectNamedButtons();
  });

  it('never shows two options with the same cell (30 questions per level)', () => {
    for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
      const recent: string[] = [];
      for (let i = 0; i < 30; i++) {
        const q = makeQuestion(level, recent);
        recent.push(q.answer.text);
        expect(q.options).toHaveLength(4);
        expect(q.options).toContain(q.answer);
        const cells = q.options.map((o) => [...o.dots].sort().join(''));
        expect(new Set(cells).size).toBe(4);
        expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
        if (q.kind === 'application' && q.word) {
          const others = q.options.filter((o) => o !== q.answer);
          for (const o of others) expect(q.word.print.toLowerCase()).not.toContain(o.text);
        }
      }
    }
  });

  it('describes a recognition cell without giving away the answer', () => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.1); // roll < 0.5 → recognition
    try {
      render(<BrailleContractionSprint />);
      pressOnPage('Enter');
    } finally {
      spy.mockRestore();
    }
    const mystery = screen.getByRole('img', { name: /^Mystery cell, dots? [1-6 ]+$/ });
    expect(mystery).toBeInTheDocument();
  });
});

describe('Sentence Decoder', () => {
  it('shows exactly the liblouis braille for a sentence and accepts a typed answer', () => {
    const { container } = render(<BrailleSentenceDecoder />);
    pressOnPage('Enter');
    const words = Array.from(container.querySelectorAll('[data-testid="sd-sentence"] .sd-word')).map((w) =>
      Array.from(w.querySelectorAll('.cell'))
        .map((c) => toUnicode((c.getAttribute('data-dots') ?? '').split('').map(Number)))
        .join(''),
    );
    const rendered = words.join('⠀');
    const level1 = CONTRACTED_SENTENCES.filter((s) => s.level === 1);
    const match = level1.find((s) => BRAILLE[s.text] === rendered);
    expect(match).toBeDefined();

    // The sentence is described by dots, never by its print words (until a hint).
    const line = screen.getByTestId('sd-sentence');
    expect(line.getAttribute('aria-label')).not.toContain(match!.text.split(' ').slice(-1)[0] + ':');

    const input = screen.getByLabelText('Type the sentence');
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: `  ${match!.text.toUpperCase()}!  ` } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(status()).toMatch(/^Correct!/);
    expect(screen.getByRole('button', { name: /Next sentence/ })).toHaveFocus();
    expectNamedButtons();
  });

  it('reveals one print word at a time as a hint', () => {
    const { container } = render(<BrailleSentenceDecoder />);
    pressOnPage('Enter');
    (document.activeElement as HTMLElement).blur();
    pressOnPage('h');
    expect(container.querySelectorAll('.sd-word.is-revealed')).toHaveLength(1);
    expect(status()).toMatch(/^Word 1 says/);
  });
});
