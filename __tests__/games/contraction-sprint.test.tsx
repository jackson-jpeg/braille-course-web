import { render, fireEvent, act } from '@testing-library/react';
import BrailleContractionSprint from '@/components/BrailleContractionSprint';
import {
  type SprintDifficulty,
  applicationSpecs,
  applicationWords,
  brailleInventory,
  isCorrect,
  nextQuestion,
  questionSpecs,
  recallSpecs,
  recognitionSpecs,
} from '@/lib/games/contraction-sprint';
import { contractionWords, standaloneWords } from '@/lib/contraction-words';
import { seededRandom } from '@/lib/games/quiz';
import { cellToUnicode, cellsToUnicode, type Cell } from '@/lib/braille/ueb';
import oracle from '../fixtures/liblouis-oracle.json';
import rulebook from '../fixtures/iceb-rulebook-signs.json';
import back from './fixtures/liblouis-backtranslations.json';
import { checkAllCells } from '../helpers/cells';

const LEVELS: SprintDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const louisG2 = (print: string) => (oracle.translations as Record<string, string>)[`g2\t${print}`];
const backG2 = (print: string) => (back.items as Record<string, { braille: string; back: string }>)[`g2\t${print}`];

/**
 * Independent judge: the ICEB rulebook's contraction tables (sections 10.1–10.6), extracted from
 * the PDF. braille → every contraction text written with it, and text → its braille.
 */
const BOOK_ENTRIES = rulebook.entries
  .filter((e) => /^10\.[1-6]$/.test(e.section))
  .map((e) => ({ text: e.text.replace(/ \(see .*\)$/, ''), braille: e.braille }));
const meaningsOf = (cell: Cell) =>
  new Set(BOOK_ENTRIES.filter((e) => e.braille === cellToUnicode(cell)).map((e) => e.text));
const brailleOfText = (text: string) => new Set(BOOK_ENTRIES.filter((e) => e.text === text).map((e) => e.braille));

/**
 * ICEB 2.2 shortforms (print words). A word that IS a shortform must not be offered as "letters +
 * groupsigns" even when the cells happen to coincide (e.g. "such", "much").
 */
const SHORTFORMS = `about above according across after afternoon afterward again against also almost already altogether
although always blind braille could declare declaring deceive deceiving either friend first good great him himself herself
immediate little letter myself much must necessary neither paid perceive perceiving perhaps quick receive receiving rejoice
rejoicing said such today together tomorrow tonight itself its your yourself yourselves themselves children should thyself
ourselves would because before behind below beneath beside between beyond conceive conceiving oneself`.split(/\s+/);

describe('Contraction Sprint word list', () => {
  test('every word is exactly what liblouis en-ueb-g2 writes, cell for cell', () => {
    for (const w of [...standaloneWords, ...contractionWords]) {
      expect({ word: w.word, braille: cellsToUnicode(w.cells) }).toEqual({ word: w.word, braille: louisG2(w.word) });
    }
  });

  test('liblouis reads every word back as the same word (one reading only)', () => {
    for (const w of [...standaloneWords, ...contractionWords]) {
      expect(backG2(w.word)).toEqual({ braille: cellsToUnicode(w.cells), back: w.word });
    }
  });

  test('no word is a shortform (ICEB 2.2 / 10.9)', () => {
    for (const w of contractionWords) expect(SHORTFORMS).not.toContain(w.word);
  });

  test('known-wrong forms from the old list are gone or corrected', () => {
    const byWord = new Map(contractionWords.map((w) => [w.word, w.pieces.map((p) => p.print)]));
    for (const gone of [
      'child',
      'which',
      'this',
      'mother',
      'father',
      'there',
      'where',
      'everything',
      'something',
      'together',
      'theirs',
      'such',
    ])
      expect(byWord.has(gone)).toBe(false);
    expect(byWord.get('then')).toEqual(['the', 'n']);
    expect(byWord.get('them')).toEqual(['the', 'm']);
    expect(byWord.get('weather')).toEqual(['w', 'ea', 'the', 'r']);
    expect(byWord.get('teaching')).toEqual(['t', 'ea', 'ch', 'ing']);
    expect(byWord.get('thousand')).toEqual(['th', 'ou', 's', 'and']);
    // child / which / this standing alone are one cell each
    for (const w of ['child', 'which', 'this'])
      expect(standaloneWords.find((s) => s.word === w)!.cells).toHaveLength(1);
  });

  test('every word is in the inventory checked by the liblouis oracle', () => {
    const inv = new Map(brailleInventory().map((i) => [i.print, cellsToUnicode(i.cells)]));
    for (const w of [...standaloneWords, ...contractionWords]) expect(inv.get(w.word)).toBe(cellsToUnicode(w.cells));
    expect(brailleInventory().every((i) => i.table === 'g2')).toBe(true);
  });
});

describe.each(LEVELS)('Contraction Sprint, %s: every question', (level) => {
  test('recognition: the answer names every contraction of the cell; no distractor shares it', () => {
    const specs = recognitionSpecs(level);
    expect(specs.length).toBeGreaterThan(3);
    for (const spec of specs) {
      const cell = spec.prompt.cell!;
      expect(isCorrect(spec, spec.answer)).toBe(true);
      expect(new Set(spec.answer.label.split(' / '))).toEqual(meaningsOf(cell));
      const keys = new Set([spec.answer.key]);
      for (const d of spec.distractorPool) {
        expect(isCorrect(spec, d)).toBe(false);
        for (const t of d.label.split(' / ')) expect(brailleOfText(t).has(cellToUnicode(cell))).toBe(false);
        keys.add(d.key);
      }
      expect(keys.size).toBe(spec.distractorPool.length + 1);
      expect(spec.distractorPool.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('recall: the answer is the rulebook cell; every distractor cell is something else', () => {
    for (const spec of recallSpecs(level)) {
      const text = spec.prompt.text!;
      expect(isCorrect(spec, spec.answer)).toBe(true);
      expect(brailleOfText(text)).toEqual(new Set([cellToUnicode(spec.answer.cell!)]));
      const seen = new Set([cellToUnicode(spec.answer.cell!)]);
      for (const d of spec.distractorPool) {
        expect(isCorrect(spec, d)).toBe(false);
        expect(meaningsOf(d.cell!).has(text)).toBe(false);
        seen.add(cellToUnicode(d.cell!));
        // A recall choice is announced by its dots, never by the contraction it stands for.
        expect(d.label).toMatch(/^dots? [1-6]/);
      }
      expect(seen.size).toBe(spec.distractorPool.length + 1);
    }
  });

  test('application: the answer is in the liblouis braille of the word; no distractor occurs in the word', () => {
    const specs = applicationSpecs(level);
    if (level === 'beginner') {
      expect(specs).toEqual([]);
      return;
    }
    expect(specs.length).toBeGreaterThan(20);
    for (const spec of specs) {
      const word = spec.prompt.text!;
      const louis = louisG2(word);
      expect(isCorrect(spec, spec.answer)).toBe(true);
      expect(word).toContain(spec.answer.label);
      expect([...brailleOfText(spec.answer.label)].some((b) => louis.includes(b))).toBe(true);
      const texts = new Set([spec.answer.label]);
      for (const d of spec.distractorPool) {
        expect(isCorrect(spec, d)).toBe(false);
        expect(word.includes(d.label)).toBe(false);
        texts.add(d.label);
      }
      expect(texts.size).toBe(spec.distractorPool.length + 1);
      expect(spec.distractorPool.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('the level only practises its own families', () => {
    const allowed: Record<SprintDifficulty, RegExp> = {
      beginner: /^alphabetic-wordsign$/,
      intermediate: /^(alphabetic-wordsign|strong-.*)$/,
      advanced: /./,
    };
    for (const w of applicationWords(level))
      for (const p of w.pieces) if (p.contraction) expect(p.contraction.kind).toMatch(allowed[level]);
  });

  test('random rounds always show 4 different choices with exactly one right answer', () => {
    const rnd = seededRandom(7);
    const ids = new Set(questionSpecs(level).map((s) => s.id));
    for (let i = 0; i < 1500; i++) {
      const q = nextQuestion(level, [], rnd);
      expect(ids.has(q.spec.id)).toBe(true);
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices.map((c) => c.key)).size).toBe(4);
      expect(q.choices.filter((c) => isCorrect(q.spec, c))).toEqual([q.choices[q.correctIndex]]);
    }
  });
});

describe('Contraction Sprint component', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test.each(LEVELS)(
    '%s: cells are drawn as their data says, and recall choices do not give the answer away',
    (level) => {
      window.localStorage.clear();
      const { container, getByText, queryByText } = render(<BrailleContractionSprint />);
      const levelButton = [...container.querySelectorAll('button')].find((b) =>
        b.textContent?.toLowerCase().includes(level),
      );
      if (levelButton && !levelButton.hasAttribute('disabled')) fireEvent.click(levelButton);
      fireEvent.click(getByText('Start Sprint'));
      for (let i = 0; i < 40 && !queryByText('Play Again'); i++) {
        expect(checkAllCells(container)).toEqual([]);
        const prompt = container.querySelector('.csprint-prompt-text')?.textContent;
        for (const b of container.querySelectorAll('.csprint-choice')) {
          const label = b.getAttribute('aria-label')!;
          if (b.querySelector('[data-braille-cell]')) {
            expect(label).toMatch(/^Choice \d: dots? [1-6]/);
            if (prompt) expect(label.replace(/^Choice \d: /, '')).not.toBe(prompt);
          }
        }
        const promptCell = container.querySelector('.csprint-prompt [data-braille-cell]');
        if (promptCell) expect(promptCell.getAttribute('aria-label')).toMatch(/^Contraction cell, dots? [1-6]/);
        fireEvent.click(container.querySelector('.csprint-choice')!);
        expect(checkAllCells(container)).toEqual([]);
        act(() => {
          jest.advanceTimersByTime(900);
        });
      }
    },
  );
});
