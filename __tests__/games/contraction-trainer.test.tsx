import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ContractionTrainer, {
  buildDeck,
  exampleFor,
  makeQuestion,
  type DeckId,
} from '@/components/games/ContractionTrainer';
import { clearProgress, loadProgress } from '@/lib/progress-storage';
import { describe as describeDots } from '@/lib/ueb';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('deck=more'),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

beforeEach(() => {
  clearProgress();
});

describe('Contraction Trainer decks and questions', () => {
  it('builds the decks from lib/ueb.ts', () => {
    expect(buildDeck('first')).toHaveLength(28);
    expect(buildDeck('more')).toHaveLength(24);
    expect(buildDeck('all')).toHaveLength(52);
    expect(buildDeck('more').map((c) => c.text)).toEqual(
      expect.arrayContaining(['ch', 'child', 'st', 'still', 'be', 'in', 'enough', 'ing']),
    );
    // Item keys are unique within every deck.
    for (const id of ['first', 'more', 'all'] as DeckId[]) {
      const texts = buildDeck(id).map((c) => c.text);
      expect(new Set(texts).size).toBe(texts.length);
    }
  });

  it('never offers two options with the same cell (30 generated questions per deck)', () => {
    for (const id of ['first', 'more', 'all'] as DeckId[]) {
      const deck = buildDeck(id);
      for (let i = 0; i < 30; i++) {
        const card = deck[i % deck.length];
        const q = makeQuestion(card, deck, i % 2 ? 'cell' : 'meaning');
        expect(q.options).toHaveLength(4);
        expect(q.options).toContain(card);
        const cells = q.options.map((o) => o.dots.join(''));
        expect(new Set(cells).size).toBe(4);
      }
    }
  });

  it('has a real contracted-braille example for every card, with the contraction marked', () => {
    for (const c of buildDeck('all')) {
      const ex = exampleFor(c);
      expect(ex).not.toBeNull();
      expect(ex!.cells.some((cell) => cell.focus)).toBe(true);
    }
  });
});

describe('<ContractionTrainer />', () => {
  it('plays a full keyboard-only round; a missed card comes back once; results appear', () => {
    render(<ContractionTrainer />);
    expect(screen.getByRole('radio', { name: /more contractions/i })).toBeChecked();
    expect(screen.getByRole('progressbar', { name: /deck mastery/i })).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'Enter' });

    const deck = buildDeck('more');
    let cards = 0;
    let firstMissed: string | null = null;
    let sawReview = false;

    for (let guard = 0; guard < 30; guard++) {
      const board = screen.getByTestId('game-board');
      if (!board.hasAttribute('data-card')) break;
      cards++;
      const text = board.getAttribute('data-card')!;
      const type = board.getAttribute('data-card-type');
      const card = deck.find((c) => c.text === text)!;
      expect(type).toBe(cards % 2 === 1 ? 'meaning' : 'cell');
      expect(document.activeElement).toHaveClass('game-prompt');

      const group = screen.getByRole('group', { name: type === 'meaning' ? 'Print meanings' : 'Braille cells' });
      const buttons = within(group).getAllByRole('button');
      expect(buttons).toHaveLength(4);

      // Never two options with the same cell.
      const optionDots =
        type === 'cell'
          ? buttons.map((b) => b.querySelector('.cell')!.getAttribute('data-dots'))
          : buttons.map((b) => deck.find((c) => c.text === b.textContent!.slice(1))!.dots.join(''));
      expect(new Set(optionDots).size).toBe(4);

      const right =
        type === 'meaning'
          ? buttons.findIndex((b) => b.textContent!.slice(1) === text)
          : buttons.findIndex((b) => b.getAttribute('aria-label')!.endsWith(`: ${describeDots(card.dots)}`));
      expect(right).toBeGreaterThanOrEqual(0);

      const isReview = within(board).queryByText('Review card') !== null;
      if (isReview) {
        sawReview = true;
        expect(text).toBe(firstMissed);
      }
      // Miss the very first card on purpose; answer everything else correctly.
      const pick = cards === 1 ? (right + 1) % 4 : right;
      if (cards === 1) firstMissed = text;
      fireEvent.keyDown(document.body, { key: String(pick + 1) });

      expect(screen.getByText(/in real braille/i)).toBeInTheDocument();
      expect(screen.getByText(card.usage, { exact: false })).toBeInTheDocument();
      // Focus is on "Next card"; Enter/Space on a focused button activates it.
      expect(document.activeElement).toHaveTextContent(/Next card|See my results/);
      fireEvent.keyDown(document.body, { key: ' ' });
    }

    expect(cards).toBe(11); // 10 cards + 1 review of the missed card
    expect(sawReview).toBe(true);

    const heading = screen.getByRole('heading', { name: /getting faster/i });
    expect(heading).toHaveFocus();
    expect(screen.getByText('9 of 10 right the first time')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 of 3 stars' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sentence decoder/i })).toHaveAttribute('href', '/games/sentence-decoder');
    expect(screen.getByText('Worth another look')).toBeInTheDocument();

    const items = loadProgress().items;
    expect(items[`contraction:${firstMissed}`]).toMatchObject({ seen: 2, correct: 1 });
  });
});
