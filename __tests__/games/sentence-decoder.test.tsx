import { render, fireEvent, act } from '@testing-library/react';
import BrailleSentenceDecoder from '@/components/BrailleSentenceDecoder';
import {
  type DecoderDifficulty,
  brailleInventory,
  cellWords,
  describeSentence,
  isCorrect,
  normalizeAnswer,
  pickSentences,
  sentencesFor,
} from '@/lib/games/sentence-decoder';
import { seededRandom } from '@/lib/games/quiz';
import { transcribe } from '@/lib/braille/transcribe';
import { ALPHABETIC_WORDSIGNS, CONTRACTIONS, INDICATORS, cellsToUnicode, sameCell } from '@/lib/braille/ueb';
import { describeCells } from '@/lib/braille/prose';
import oracle from '../fixtures/liblouis-oracle.json';
import back from './fixtures/liblouis-backtranslations.json';
import { checkAllCells } from '../helpers/cells';

const LEVELS: DecoderDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const louis = (table: string, print: string) => (oracle.translations as Record<string, string>)[`${table}\t${print}`];
const backItem = (table: string, print: string) =>
  (back.items as Record<string, { braille: string; back: string }>)[`${table}\t${print}`];

describe.each(LEVELS)('Sentence Decoder, %s: every sentence', (level) => {
  const sentences = sentencesFor(level);

  test('there are enough sentences for a game without repeats', () => {
    expect(sentences.length).toBeGreaterThanOrEqual(12);
    expect(new Set(sentences.map((s) => s.print)).size).toBe(sentences.length);
  });

  test('the braille shown is exactly liblouis (g1 uncontracted for beginner/intermediate, g2 contracted for advanced)', () => {
    for (const s of sentences) {
      expect(s.table).toBe(level === 'advanced' ? 'g2' : 'g1');
      expect({ print: s.print, braille: cellsToUnicode(s.cells) }).toEqual({
        print: s.print,
        braille: louis(s.table, s.print),
      });
      if (s.table === 'g1') expect(cellsToUnicode(s.cells)).toBe(cellsToUnicode(transcribe(s.print)));
    }
  });

  test('one reading only: liblouis reads the braille back as the same sentence', () => {
    for (const s of sentences) {
      const item = backItem(s.table, s.print);
      expect(item.braille).toBe(cellsToUnicode(s.cells));
      expect(normalizeAnswer(item.back)).toBe(normalizeAnswer(s.print));
      // …and the game accepts that reading.
      expect(isCorrect(s, item.back)).toBe(true);
    }
  });

  test('the capitalised first letter has a capital indicator', () => {
    for (const s of sentences) {
      const first = s.tokens.find((t) => t.kind !== 'punctuation');
      expect(first?.kind).toBe('indicator');
      expect(sameCell(first!.cells[0], INDICATORS.capitalLetter.cells[0])).toBe(true);
    }
  });

  test('the correct answer is accepted however it is capitalised, punctuated or spaced', () => {
    for (const s of sentences) {
      expect(isCorrect(s, s.print)).toBe(true);
      expect(isCorrect(s, s.print.toLowerCase())).toBe(true);
      expect(isCorrect(s, s.print.toUpperCase())).toBe(true);
      expect(isCorrect(s, `  ${s.print.replace(/[.,?!“”()](?!\d)/g, '').replace(/ /g, '   ')}  `)).toBe(true);
      expect(isCorrect(s, s.print.replace(/’/g, "'"))).toBe(true);
    }
  });

  test('wrong answers are rejected: other sentences, a missing word, a changed letter or number', () => {
    for (const s of sentences) {
      for (const other of sentences) if (other !== s) expect(isCorrect(s, other.print)).toBe(false);
      const words = s.print.split(' ');
      expect(isCorrect(s, words.slice(1).join(' '))).toBe(false);
      expect(
        isCorrect(
          s,
          s.print.replace(/[a-y]/i, (c) => String.fromCharCode(c.charCodeAt(0) + 1)),
        ),
      ).toBe(false);
      if (/\d/.test(s.print))
        expect(
          isCorrect(
            s,
            s.print.replace(/\d/, (d) => String((Number(d) + 1) % 10)),
          ),
        ).toBe(false);
    }
  });

  if (level === 'advanced') {
    test('contracted: reading an alphabetic wordsign as its bare letter is rejected', () => {
      const letterOf = new Map(ALPHABETIC_WORDSIGNS.map(([w, l]) => [w, l]));
      let checked = 0;
      for (const s of sentences) {
        const misread = s.print.replace(/[A-Za-z]+/g, (w) => {
          const l = letterOf.get(w.toLowerCase());
          return l ?? w;
        });
        if (misread !== s.print) {
          checked++;
          expect(isCorrect(s, misread)).toBe(false);
        }
      }
      expect(checked).toBeGreaterThan(10);
    });

    test('contracted: every contraction used is one the site teaches, and each word is spelled by its pieces', () => {
      const taught = new Set(CONTRACTIONS.map((c) => cellsToUnicode(c.cells)));
      for (const s of sentences) {
        for (const t of s.tokens.filter((x) => x.kind === 'contraction'))
          expect(taught.has(cellsToUnicode(t.cells))).toBe(true);
        const letters = s.tokens
          .filter((t) => t.kind === 'letter' || t.kind === 'contraction' || t.kind === 'space')
          .map((t) => t.print)
          .join('');
        expect(letters).toBe(s.print.toLowerCase().replace(/[^a-z ]/g, ''));
      }
    });
  } else {
    test('uncontracted: the level exercises what it should', () => {
      const all = sentences.map((s) => s.print).join(' ');
      if (level === 'beginner') {
        expect(all).toMatch(/[?]/);
        expect(all).toMatch(/!/);
        expect(all).toMatch(/’/);
        expect(all).toMatch(/\b[A-Z]{2,}\b/);
      } else {
        expect(all).toMatch(/\d,\d/); // digit-group comma
        expect(all).toMatch(/\d\.\d/); // decimal
        expect(all).toMatch(/\d[a-j]\b/); // grade 1 indicator after a number
        expect(all).toMatch(/[“”]/);
        expect(all).toMatch(/[()]/);
        expect(all).toMatch(/-/);
        const g1 = INDICATORS.grade1Symbol.cells[0];
        expect(sentences.some((s) => s.cells.some((c) => sameCell(c, g1)))).toBe(true);
      }
    });
  }

  test('the cell description reads dot numbers word by word, not the words themselves', () => {
    for (const s of sentences) {
      const d = describeSentence(s);
      const words = cellWords(s);
      expect(words).toHaveLength(s.print.split(' ').length);
      words.forEach((cells) => expect(d).toContain(describeCells(cells)));
      expect(d.toLowerCase()).not.toContain(
        s.print
          .toLowerCase()
          .replace(/[^a-z ]/g, '')
          .split(' ')
          .filter((w) => w.length > 3)[0] ?? '\u0000',
      );
    }
  });

  test('a game picks 5 different sentences', () => {
    const rnd = seededRandom(3);
    for (let i = 0; i < 50; i++) {
      const picked = pickSentences(level, 5, rnd);
      expect(new Set(picked.map((p) => p.print)).size).toBe(5);
    }
  });
});

describe('Sentence Decoder answer normalisation', () => {
  test.each([
    ['It’s fun.', 'its fun'],
    ['We have 1,000 beads.', 'we have 1000 beads'],
    ['Is it 3.5 or 4?', 'is it 3.5 or 4'],
    ['It’s a well-known song.', 'its a well known song'],
    ['Kim (my sister) is 12.', 'kim my sister is 12'],
  ])('%s → %s', (input, out) => expect(normalizeAnswer(input)).toBe(out));

  test('a decimal point is not ignored (3.5 is not 35)', () => {
    expect(normalizeAnswer('3.5')).not.toBe(normalizeAnswer('35'));
  });

  test('every sentence is in the liblouis inventory', () => {
    const inv = new Set(brailleInventory().map((i) => `${i.table}\t${i.print}`));
    for (const l of LEVELS) for (const s of sentencesFor(l)) expect(inv.has(`${s.table}\t${s.print}`)).toBe(true);
  });
});

describe('Sentence Decoder component', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('renders correct cells, describes them on request, and checks answers with the game checker', () => {
    window.localStorage.clear();
    const { container, getByText, getByLabelText } = render(<BrailleSentenceDecoder />);
    act(() => {
      jest.advanceTimersByTime(200);
    });
    const shown = () =>
      [...container.querySelectorAll('.decoder-sentence [data-braille-cell]')].map((e) => e.getAttribute('data-dots'));
    for (let round = 0; round < 5; round++) {
      expect(checkAllCells(container)).toEqual([]);
      const dots = shown();
      const s = sentencesFor('beginner').find(
        (x) =>
          x.cells
            .filter((c) => c.length > 0)
            .map((c) => c.join(''))
            .join() === dots.join(),
      )!;
      expect(s).toBeDefined();
      // The sentence's accessible name does not give the answer away.
      const label = container.querySelector('.decoder-sentence')!.getAttribute('aria-label')!;
      expect(label.toLowerCase()).not.toContain(s.print.toLowerCase());
      fireEvent.click(getByText('Describe the cells'));
      expect(container.textContent).toContain(describeSentence(s));
      fireEvent.change(getByLabelText('Type the decoded sentence'), { target: { value: s.print.toLowerCase() } });
      fireEvent.click(getByText('Check'));
      expect(container.querySelector('.decoder-feedback')!.textContent).toBe('Correct!');
      act(() => {
        jest.advanceTimersByTime(1200);
      });
    }
    expect(container.querySelector('.decoder-result-score')!.textContent).toContain('5 / 5');
  });
});
