/**
 * Dot Quest: keyboard play, stars, stickers, locked stops and the grown-up unlock toggle.
 */
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import DotQuest, { generateChallenges, STAGES } from '@/components/games/DotQuest';
import { CREATURES } from '@/components/games/dot-quest/StickerBook';
import { getQuest, invalidateCache } from '@/lib/progress-storage';
import { LETTERS, sameDots } from '@/lib/ueb';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/games/dot-quest',
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  window.localStorage.clear();
  invalidateCache();
});

/** Page-level key press (the game listens on window, like a real keyboard). */
function press(key: string) {
  fireEvent.keyDown(document.body, { key });
}

function play() {
  return screen.getByTestId('game-board').querySelector('.dq-play') as HTMLElement | null;
}

/** Answer the current puzzle correctly with the keyboard only, then press Enter to move on. */
function solveCurrent() {
  const board = play()!;
  const dots = board.dataset.targetDots;
  if (dots) {
    for (const d of dots) press(d); // raise each dot with keys 1–6
    press('Enter'); // check
  } else {
    const answer = board.dataset.answer!;
    const buttons = Array.from(board.querySelectorAll<HTMLButtonElement>('.choice'));
    const n = buttons.findIndex((b) => b.querySelector(`[data-choice-id="${answer}"]`)) + 1;
    expect(n).toBeGreaterThan(0);
    press(String(n)); // pick with keys 1–4
  }
  expect(screen.getByRole('button', { name: /next puzzle|see my stars/i })).toHaveFocus();
  press('Enter'); // next puzzle (or finish)
}

function stopButton(n: number) {
  return screen.getByRole('button', { name: new RegExp(`^Stop ${n}:`) });
}

function unlockAll() {
  fireEvent.click(screen.getByText('For grown-ups'));
  fireEvent.click(screen.getByRole('checkbox', { name: /unlock all stops/i }));
}

describe('Dot Quest', () => {
  it('builds valid stages from lib/ueb data', () => {
    expect(STAGES).toHaveLength(12);
    for (const stage of STAGES) {
      const list = generateChallenges(stage);
      expect(list).toHaveLength(5);
      for (const c of list) {
        if (c.letter) expect(sameDots(c.target, LETTERS[c.letter])).toBe(true);
        if (c.choices) {
          expect(c.choices).toContain(c.answer);
          expect(new Set(c.choices).size).toBe(c.choices.length);
        }
        if (c.word) expect(c.word.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it('can be completed with the keyboard only and saves 3 stars', () => {
    render(<DotQuest />);
    expect(screen.getByRole('heading', { level: 2, name: 'Braille Bay' })).toBeInTheDocument();

    const stop1 = stopButton(1);
    expect(stop1).toHaveAccessibleName('Stop 1: Dot Dock, dots 1, 2 and 3. 0 of 3 stars. You are here.');
    stop1.focus();
    fireEvent.click(stop1); // Enter on a focused native button

    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Puzzle ${i + 1} of 5:`, { exact: false })).toBeInTheDocument();
      solveCurrent();
    }

    expect(screen.getByRole('heading', { name: /stop 1 done/i })).toHaveFocus();
    expect(screen.getByRole('img', { name: '3 of 3 stars' })).toBeInTheDocument();
    expect(getQuest().stars['dock-1']).toBe(3);
  });

  it('is gentle about misses: shows the answer, lets you retry, and lowers the stars', () => {
    render(<DotQuest />);
    fireEvent.click(stopButton(1));

    // Miss the first puzzle once.
    const board = play()!;
    if (board.dataset.targetDots) {
      const wrong = board.dataset.targetDots === '1' ? '2' : '1';
      press(wrong);
      press('Enter');
    } else {
      const buttons = Array.from(board.querySelectorAll<HTMLButtonElement>('.choice'));
      const n = buttons.findIndex((b) => !b.querySelector(`[data-choice-id="${board.dataset.answer}"]`)) + 1;
      press(String(n));
    }
    expect(screen.getByText('Ooh, close! Let’s look together.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/look together/i);

    // Fix it and carry on.
    if (board.dataset.targetDots) press('Backspace');
    for (let i = 0; i < 5; i++) solveCurrent();

    expect(screen.getByRole('heading', { name: /stop 1 done/i })).toBeInTheDocument();
    expect(getQuest().stars['dock-1']).toBe(2);
  });

  it('keeps later stops locked until the one before is finished', () => {
    render(<DotQuest />);
    const stop2 = stopButton(2);
    expect(stop2).toHaveAttribute('aria-disabled', 'true');
    expect(stop2).toHaveAccessibleName(/locked — finish stop 1 first/i);

    fireEvent.click(stop2);
    expect(play()).toBeNull();
    expect(screen.getByText(/stop 2 is still locked/i, { selector: '.dq-map-note' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/stop 2 is still locked/i);

    fireEvent.click(stopButton(1));
    for (let i = 0; i < 5; i++) solveCurrent();
    fireEvent.click(screen.getByRole('button', { name: 'Back to the map' }));

    expect(stopButton(1)).toHaveFocus();
    expect(stopButton(1)).toHaveAccessibleName(/3 of 3 stars/);
    expect(stopButton(2)).not.toHaveAttribute('aria-disabled');
    expect(stopButton(3)).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(stopButton(2));
    expect(play()).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Stop 2: Dot Dock' })).toBeInTheDocument();
  });

  it('lets a grown-up unlock every stop', () => {
    render(<DotQuest />);
    expect(stopButton(12)).toHaveAttribute('aria-disabled', 'true');

    unlockAll();
    for (let n = 1; n <= 12; n++) expect(stopButton(n)).not.toHaveAttribute('aria-disabled');

    fireEvent.click(stopButton(12));
    expect(screen.getByRole('heading', { name: 'Stop 12: Zebra Jungle' })).toBeInTheDocument();
    for (let i = 0; i < 5; i++) solveCurrent();
    expect(getQuest().stars['jungle-3']).toBe(3);

    // Turning it off locks unfinished stops again.
    fireEvent.click(screen.getByRole('button', { name: 'Back to the map' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /unlock all stops/i }));
    expect(stopButton(2)).toHaveAttribute('aria-disabled', 'true');
  });

  it('awards letter stickers and shows them in the Sticker Book', () => {
    render(<DotQuest />);
    unlockAll();
    fireEvent.click(stopButton(4)); // Shell Cove: letters a to e
    for (let i = 0; i < 5; i++) solveCurrent();

    const stickers = getQuest().stickers.filter((s) => s.startsWith('letter:'));
    expect(stickers.length).toBeGreaterThan(0);
    const letter = stickers[0].slice('letter:'.length);
    expect('abcde').toContain(letter);

    // Celebrated on the results screen…
    expect(screen.getByRole('heading', { name: /new stickers?!/i })).toBeInTheDocument();
    expect(screen.getAllByText(CREATURES[letter]).length).toBeGreaterThan(0);

    // …and kept in the Sticker Book.
    fireEvent.click(screen.getByRole('button', { name: 'Back to the map' }));
    const bookButton = screen.getByRole('button', { name: 'Sticker Book' });
    fireEvent.click(bookButton);
    const book = screen.getByRole('region', { name: 'Sticker Book' });
    expect(within(book).getByRole('heading', { name: 'Sticker Book' })).toHaveFocus();
    expect(within(book).getByText(`${stickers.length} of 26 letter stickers`, { exact: false })).toBeInTheDocument();
    expect(within(book).getByRole('img', { name: new RegExp(`^Letter ${letter}, dots? `) })).toBeInTheDocument();
    expect(within(book).getByText(CREATURES[letter])).toBeInTheDocument();
    expect(within(book).getAllByText('not found yet')).toHaveLength(26 - stickers.length);

    fireEvent.click(within(book).getByRole('button', { name: 'Back to the map' }));
    expect(screen.getByRole('button', { name: 'Sticker Book' })).toHaveFocus();
  });

  it('gives an island badge when every stop on the island is finished', () => {
    render(<DotQuest />);
    for (const n of [1, 2, 3]) {
      fireEvent.click(stopButton(n));
      for (let i = 0; i < 5; i++) solveCurrent();
      if (n < 3) fireEvent.click(screen.getByRole('button', { name: 'Back to the map' }));
    }
    expect(getQuest().stickers).toContain('island:dot-dock');
    expect(screen.getByText('You finished all of Dot Dock!')).toBeInTheDocument();
  });
});
