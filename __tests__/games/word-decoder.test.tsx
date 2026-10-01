import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import WordDecoder, { brailleLabel, isMatch } from '@/components/games/WordDecoder';
import { WORD_DECODER_LEVELS } from '@/lib/games/word-decoder-content';
import { clearProgress, loadProgress } from '@/lib/progress-storage';
import { transcribe } from '@/lib/ueb';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('level=a-j'),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

/** Keyboard "Enter" on whatever has focus: buttons activate (as browsers do), text fields submit their form. */
function pressEnter() {
  const el = document.activeElement as HTMLElement;
  if (el instanceof HTMLButtonElement) fireEvent.click(el);
  else if (el instanceof HTMLInputElement && el.form) fireEvent.submit(el.form);
  else fireEvent.keyDown(el ?? document.body, { key: 'Enter' });
}

function typeInFocused(text: string) {
  const el = document.activeElement as HTMLInputElement;
  expect(el.tagName).toBe('INPUT');
  fireEvent.change(el, { target: { value: text } });
}

const feedback = () => document.getElementById('wd-feedback')!;
const answerNow = () => screen.getByTestId('game-board').getAttribute('data-answer')!;

beforeEach(() => {
  clearProgress();
});

describe('Word Decoder helpers', () => {
  it('matches case-insensitively outside the capitals levels, and treats curly apostrophes as straight', () => {
    expect(isMatch('  BAD ', 'bad', 'a-j')).toBe(true);
    expect(isMatch("it's", 'it’s', 'punctuation')).toBe(true);
    expect(isMatch('bed', 'bad', 'a-j')).toBe(false);
  });

  it('is case-sensitive in capitals and sentences (trailing spaces still fine)', () => {
    expect(isMatch('mom', 'Mom', 'capitals')).toBe(false);
    expect(isMatch('Mom  ', 'Mom', 'capitals')).toBe(true);
    expect(isMatch('i am 7.', 'I am 7.', 'sentences')).toBe(false);
    expect(isMatch('I am 7. ', 'I am 7.', 'sentences')).toBe(true);
  });

  it('describes braille by dots only, never by print', () => {
    for (const level of WORD_DECODER_LEVELS) {
      for (const { text } of level.items) {
        const label = brailleLabel(transcribe(text));
        expect(label.startsWith('Braille to decode: ')).toBe(true);
        // No letters other than the fixed words of the description.
        const words = label
          .replace('Braille to decode:', '')
          .split(/[^A-Za-z]+/)
          .filter(Boolean);
        for (const w of words) expect(['cell', 'dot', 'dots', 'space']).toContain(w);
      }
    }
  });
});

describe('<WordDecoder />', () => {
  it('plays a full round with the keyboard only and shows results', () => {
    render(<WordDecoder />);
    expect(screen.getByRole('heading', { level: 2, name: /read the braille/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /words from a to j/i })).toBeChecked();

    // Enter anywhere on the page starts the round; focus lands in the answer box.
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /what does it say/i }));

    const levelWords = WORD_DECODER_LEVELS[0].items.map((i) => i.text);
    for (let i = 0; i < 8; i++) {
      expect(screen.getByText(`${i + 1} / 8`)).toBeInTheDocument();
      const word = answerNow();
      expect(levelWords).toContain(word);

      const braille = screen.getByRole('img', { name: /^Braille to decode:/ });
      const label = braille.getAttribute('aria-label')!;
      expect(label).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
      expect(label).toContain('cell 1: dot');

      typeInFocused(i % 2 ? word.toUpperCase() : `  ${word} `);
      pressEnter(); // check
      expect(feedback()).toHaveTextContent(/Yes! It says/);
      expect(document.activeElement).toHaveTextContent(i === 7 ? 'See my results' : 'Next word');
      pressEnter(); // next
    }

    const heading = screen.getByRole('heading', { name: 'Lovely reading!' });
    expect(heading).toHaveFocus();
    expect(screen.getByText(/8 of 8 read correctly · 80 points/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 of 3 stars' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /next level/i })).toHaveAttribute('href', '/games/word-decoder?level=a-t');

    // Progress memory: word, letters.
    const items = loadProgress().items;
    expect(items['word:a-j'].seen).toBe(8);
    expect(Object.keys(items).some((k) => /^letter:[a-j]$/.test(k))).toBe(true);
  });

  it('hints reveal one cell at a time, and two misses show the answer cell by cell', () => {
    render(<WordDecoder />);
    act(() => screen.getByRole('button', { name: /start/i }).click());

    const word = answerNow();
    const cells = transcribe(word);

    fireEvent.click(screen.getByRole('button', { name: /^hint/i }));
    expect(feedback()).toHaveTextContent(`Hint: cell 1 is ${cells[0].label}.`);
    expect(document.querySelectorAll('.wd-slot.is-revealed')).toHaveLength(1);
    expect(document.querySelector('.wd-slot.is-hint .wd-caption')).toHaveTextContent(cells[0].label);
    // The braille's accessible name still gives nothing away.
    expect(screen.getByRole('img', { name: /^Braille to decode:/ }).getAttribute('aria-label')).not.toContain(word);

    typeInFocused('zzz');
    pressEnter();
    expect(feedback()).toHaveTextContent(/Not quite/);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');

    typeInFocused('zzz');
    pressEnter();
    expect(feedback()).toHaveTextContent(/Good try\. It says/);
    expect(document.querySelectorAll('.wd-slot.is-revealed')).toHaveLength(cells.length);
    const captions = [...document.querySelectorAll('.wd-caption')].map((c) => c.textContent).join('');
    expect(captions).toBe(word);

    const items = loadProgress().items;
    expect(items['word:a-j']).toMatchObject({ seen: 1, correct: 0 });
    // The first letter was revealed by a hint, so it is not counted against the player.
    const firstLetter = word[0];
    if (!word.slice(1).includes(firstLetter)) expect(items[`letter:${firstLetter}`]).toBeUndefined();
  });
});
