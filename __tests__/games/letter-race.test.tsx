import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import LetterRace from '@/components/games/LetterRace';
import { clearProgress, loadProgress } from '@/lib/progress-storage';
import { LETTERS } from '@/lib/ueb';

let mockQuery = 'set=a-j';
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockQuery),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

/** Press a key on whatever has focus, the way a browser would (Enter on a button clicks it). */
function press(key: string) {
  const el = (document.activeElement as HTMLElement) ?? document.body;
  const notCancelled = fireEvent.keyDown(el, { key });
  if (key === 'Enter' && notCancelled && el instanceof HTMLButtonElement) fireEvent.click(el);
}

const mysteryCell = () => screen.getByRole('img', { name: /^Mystery cell/ });

/** The letter on screen, read back from the rendered dots (never from component state). */
function letterOnScreen(): string {
  const dots = mysteryCell().getAttribute('data-dots');
  const hit = Object.entries(LETTERS).find(([, d]) => d.join('') === dots);
  if (!hit) throw new Error(`no letter has dots ${dots}`);
  return hit[0];
}

const statusText = () => document.querySelector('[role="status"]')!.textContent ?? '';

beforeEach(() => {
  mockQuery = 'set=a-j';
  clearProgress();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Letter Race', () => {
  it('starts with the keyboard only and puts focus on the question', () => {
    render(<LetterRace />);
    expect(screen.getByRole('heading', { level: 2, name: /ready, set, read/i })).toBeInTheDocument();
    press('Enter');
    expect(screen.getByRole('heading', { level: 2, name: 'Which letter is this?' })).toBeInTheDocument();
    expect(screen.getByTestId('game-board')).toContainElement(document.activeElement as HTMLElement);
    expect(mysteryCell()).toBeInTheDocument();
  });

  it('never names the answer in the question cell’s accessible label', () => {
    render(<LetterRace />);
    press('Enter');
    for (let i = 0; i < 10; i++) {
      const letter = letterOnScreen();
      const label = mysteryCell().getAttribute('aria-label')!;
      expect(label).toMatch(/^Mystery cell, dots? [1-6 ]+$/);
      expect(label).not.toMatch(new RegExp(`\\b${letter}\\b`, 'i'));
      press(letter);
      act(() => jest.advanceTimersByTime(1000));
    }
  });

  it('plays a full relaxed round with the keyboard and shows the results', () => {
    render(<LetterRace />);
    press('Enter');

    for (let i = 0; i < 10; i++) {
      const letter = letterOnScreen();
      expect('abcdefghij').toContain(letter);
      if (i % 2 === 0) {
        press(letter); // type the letter
      } else {
        // or press its number key
        const buttons = within(screen.getByRole('group', { name: 'Which letter is it?' })).getAllByRole('button');
        expect(buttons).toHaveLength(4);
        const n = buttons.findIndex((b) => b.getAttribute('aria-label')!.endsWith(`: ${letter}`));
        expect(n).toBeGreaterThanOrEqual(0);
        press(String(n + 1));
      }
      expect(statusText()).toContain(`Correct! That's ${letter}`);
      act(() => jest.advanceTimersByTime(1000));
    }

    const heading = screen.getByRole('heading', { level: 2, name: 'Wonderful reading!' });
    expect(heading).toHaveFocus();
    expect(screen.getByText('10 of 10 correct.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 of 3 stars' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next: letters k–t' })).toHaveAttribute(
      'href',
      '/games/letter-race?set=k-t',
    );

    const progress = loadProgress();
    expect(progress.games['letter-race']?.gamesPlayed).toBe(1);
    expect(progress.games['letter-race']?.bestScore).toBe(10);
  });

  it('explains a wrong answer, offers Next, and Enter moves on', () => {
    render(<LetterRace />);
    press('Enter');
    const letter = letterOnScreen();
    const buttons = within(screen.getByRole('group', { name: 'Which letter is it?' })).getAllByRole('button');
    const wrongIndex = buttons.findIndex((b) => !b.getAttribute('aria-label')!.endsWith(`: ${letter}`));
    const wrong = buttons[wrongIndex].getAttribute('aria-label')!.split(': ')[1];
    press(String(wrongIndex + 1));

    expect(statusText()).toContain(`Not quite — that cell is ${letter}`);
    expect(statusText()).toContain(`You chose ${wrong}.`);
    expect(buttons[wrongIndex]).toHaveClass('is-wrong');
    buttons.forEach((b) => expect(b).toHaveAttribute('aria-disabled', 'true'));
    expect(screen.getByRole('button', { name: 'Next cell' })).toBeInTheDocument();

    press('Enter');
    expect(screen.queryByRole('button', { name: 'Next cell' })).not.toBeInTheDocument();
    expect(screen.getByText('2 / 10')).toBeInTheDocument();
  });

  it('reviews a custom letter list from the URL', () => {
    mockQuery = 'letters=qrw';
    render(<LetterRace />);
    expect(screen.getByText('Reviewing: q, r, w')).toBeInTheDocument();
    press('Enter');
    for (let i = 0; i < 10; i++) {
      const letter = letterOnScreen();
      expect(['q', 'r', 'w']).toContain(letter);
      press(letter);
      act(() => jest.advanceTimersByTime(1000));
    }
    expect(screen.getByText('10 of 10 correct.')).toBeInTheDocument();
  });

  it('runs a 60-second race and ends on the clock', () => {
    render(<LetterRace />);
    fireEvent.click(screen.getByRole('radio', { name: /Race/ }));
    press('Enter');
    expect(screen.getByText('60s')).toBeInTheDocument();

    for (let i = 0; i < 12; i++) {
      press(letterOnScreen());
      act(() => jest.advanceTimersByTime(700));
    }
    act(() => jest.advanceTimersByTime(60_000));

    expect(screen.getByRole('heading', { level: 2, name: /Nicely done|Wonderful/ })).toHaveFocus();
    expect(screen.getByText(/You read 12 cells correctly in 60 seconds/)).toBeInTheDocument();
    expect(loadProgress().games['letter-race']?.gamesWon).toBe(1);
  });
});
