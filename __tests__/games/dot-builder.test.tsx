import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import DotBuilder from '@/components/games/DotBuilder';
import { clearProgress, loadProgress } from '@/lib/progress-storage';
import { LETTERS, describe as describeDots } from '@/lib/ueb';

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

/** The cell the game wants right now ("b", or "dot 4"). */
const current = () => document.querySelector('[data-current]')!.getAttribute('data-current')!;
const statusText = () => document.querySelector('[role="status"]')!.textContent ?? '';
const pad = () => screen.getByRole('group', { name: /^Writing pad for/ });

function writeLetter(letter: string) {
  for (const d of LETTERS[letter]) press(String(d));
  press('Enter');
}

beforeEach(() => {
  mockQuery = 'set=a-j';
  clearProgress();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Dot Builder', () => {
  it('starts with the keyboard only and focuses the first dot', () => {
    render(<DotBuilder />);
    press('Enter');
    expect(screen.getByRole('heading', { level: 2, name: /^Write the letter [a-j]$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dot 1' })).toHaveFocus();
  });

  it('does not give the dots away in the pad’s accessible label', () => {
    render(<DotBuilder />);
    press('Enter');
    const letter = current();
    const label = pad().getAttribute('aria-label')!;
    expect(label).toBe(`Writing pad for ${letter}. Raised: blank cell`);
    expect(label).not.toContain(describeDots(LETTERS[letter]));
  });

  it('builds a full relaxed round with the keyboard and shows the results', () => {
    render(<DotBuilder />);
    press('Enter');

    for (let i = 0; i < 10; i++) {
      const letter = current();
      expect('abcdefghij').toContain(letter);
      writeLetter(letter);
      expect(statusText()).toContain(`Yes! ${letter} is ${describeDots(LETTERS[letter])}`);
      // Focus stays on the pad, ready for the next letter.
      if (i < 9) expect(pad()).toContainElement(document.activeElement as HTMLElement);
    }

    expect(screen.getByRole('heading', { level: 2, name: 'Master builder!' })).toHaveFocus();
    expect(screen.getByText('10 of 10 cells right on the first try.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Now read a–j in Letter Race' })).toHaveAttribute(
      'href',
      '/games/letter-race?set=a-j',
    );
    const progress = loadProgress();
    expect(progress.games['dot-builder']?.gamesPlayed).toBe(1);
  });

  it('marks extra and missing dots on a wrong try, then offers Show me', () => {
    render(<DotBuilder />);
    press('Enter');
    const letter = current();
    const want = LETTERS[letter];
    const wrongDot = [1, 2, 3, 4, 5, 6].find((d) => !want.includes(d))!;

    press(String(wrongDot));
    press('Enter');
    expect(statusText()).toContain(`Almost! You raised dot ${wrongDot}. ${letter} is ${describeDots(want)}.`);
    expect(screen.getByRole('button', { name: `Dot ${wrongDot}` })).toHaveClass('is-extra');
    expect(screen.getByRole('button', { name: `Dot ${want[0]}` })).toHaveClass('is-missing');
    act(() => jest.advanceTimersByTime(1600));
    expect(screen.getByRole('button', { name: `Dot ${wrongDot}` })).not.toHaveClass('is-extra');

    expect(screen.queryByRole('button', { name: 'Show me' })).not.toBeInTheDocument();
    press('Enter');
    expect(screen.getByRole('button', { name: 'Show me' })).toBeInTheDocument();

    press('h');
    expect(statusText()).toContain(
      `${letter} is ${describeDots(want)}. Raise ${describeDots(want)}. Lower dot ${wrongDot}.`,
    );
    expect(screen.getByRole('button', { name: `Dot ${wrongDot}` })).toHaveClass('is-extra');

    // Fix it with the keyboard: lower the wrong dot, raise the right ones.
    press(String(wrongDot));
    writeLetter(letter);
    expect(statusText()).toContain(`Yes! ${letter}`);
    expect(screen.getByText('First try', { selector: 'dt' }).nextSibling).toHaveTextContent('0');
  });

  it('builds short words cell by cell', () => {
    mockQuery = 'set=words';
    render(<DotBuilder />);
    press('Enter');
    expect(screen.getByRole('heading', { level: 2, name: /^Write the word [a-z]{3,4}$/ })).toBeInTheDocument();
    const word = screen.getByRole('heading', { level: 2 }).textContent!.replace('Write the word ', '').trim();
    expect(screen.getByText(/^Cell 1 of/)).toHaveTextContent(`Cell 1 of ${word.length}`);

    for (let i = 0; i < word.length; i++) {
      expect(current()).toBe(word[i]);
      writeLetter(word[i]);
      if (i < word.length - 1)
        expect(screen.getByText(/^Cell \d of/)).toHaveTextContent(`Cell ${i + 2} of ${word.length}`);
    }
    expect(statusText()).toContain(`You wrote “${word}”!`);
    expect(screen.getByText('Word')).toBeInTheDocument();
  });

  it('runs the single-dot set', () => {
    mockQuery = 'set=dots';
    render(<DotBuilder />);
    press('Enter');
    expect(screen.getByRole('heading', { level: 2, name: /^Raise dot [1-6]$/ })).toBeInTheDocument();
    const n = current().replace('dot ', '');
    press(n);
    press('Enter');
    expect(statusText()).toContain(`Yes! That’s dot ${n}.`);
  });

  it('runs a 90-second timed round', () => {
    render(<DotBuilder />);
    fireEvent.click(screen.getByRole('radio', { name: /Timed/ }));
    press('Enter');
    expect(screen.getByText('90s')).toBeInTheDocument();
    for (let i = 0; i < 11; i++) writeLetter(current());
    act(() => jest.advanceTimersByTime(90_000));
    expect(screen.getByText('You built 11 cells in 90 seconds.')).toBeInTheDocument();
    expect(loadProgress().games['dot-builder']?.gamesWon).toBe(1);
  });
});
