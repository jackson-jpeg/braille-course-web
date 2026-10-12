/**
 * Accuracy suite for the free braille course (lib/course-curriculum.ts).
 *
 * Every cell a lesson teaches must equal the canonical data (which is itself checked against the
 * ICEB rulebook, Unicode and liblouis in __tests__/braille/), every sentence must be fully
 * rendered from templates, and the structural claims the lessons make must hold for the data.
 * The liblouis oracle test separately checks every example and print drill item cell by cell.
 */
import {
  ALL_LESSONS,
  BATH,
  COURSE_MODULES,
  LESSON_SLUGS,
  TOTAL_LESSONS,
  getAdjacentLessons,
  getLessonBySlug,
} from '@/lib/course-curriculum';
import {
  CONTRACTIONS,
  INDICATORS,
  LETTER_CELLS,
  PUNCTUATION,
  cellsKey,
  dotPosition,
  type Cell,
} from '@/lib/braille/ueb';
import { transcribe } from '@/lib/braille/transcribe';
import oracle from '../fixtures/liblouis-oracle.json';
import type { GameId } from '@/lib/progress-types';

const VALID_GAME_IDS: GameId[] = [
  'wordgame',
  'explorer',
  'hangman',
  'speedmatch',
  'memorymatch',
  'contraction-sprint',
  'number-sense',
  'reflex-dots',
  'sequence',
  'sentence-decoder',
  'bingo',
  'rain',
  'capital-quest',
  'number-lock',
  'punctuation-detective',
  'brailler-challenge',
];

const allText = (l: (typeof ALL_LESSONS)[number]) => [
  l.title,
  l.summary,
  ...l.intro,
  l.tip ?? '',
  ...l.chars.map((c) => c.note ?? ''),
  ...(l.examples ?? []).flatMap((e) => [e.print, e.note ?? '']),
];

describe('course structure', () => {
  test('slugs are unique and every lesson is reachable', () => {
    expect(new Set(LESSON_SLUGS).size).toBe(LESSON_SLUGS.length);
    expect(TOTAL_LESSONS).toBe(ALL_LESSONS.length);
    for (const slug of LESSON_SLUGS) expect(getLessonBySlug(slug)?.slug).toBe(slug);
  });

  test('every lesson belongs to its module and links a real practice game', () => {
    for (const m of COURSE_MODULES)
      for (const l of m.lessons) {
        expect(l.moduleId).toBe(m.id);
        if (l.practiceGameId) expect(VALID_GAME_IDS).toContain(l.practiceGameId);
      }
  });

  test('prev/next navigation runs through the lessons in order', () => {
    expect(getAdjacentLessons(LESSON_SLUGS[0]).prev).toBeNull();
    expect(getAdjacentLessons(LESSON_SLUGS[LESSON_SLUGS.length - 1]).next).toBeNull();
    for (let i = 1; i < LESSON_SLUGS.length; i++)
      expect(getAdjacentLessons(LESSON_SLUGS[i]).prev?.slug).toBe(LESSON_SLUGS[i - 1]);
  });

  test('capitals, numbers and punctuation come after the alphabet and before contractions, in a logical order', () => {
    const order = [
      'reading-words',
      'capitals',
      'capital-words',
      'numbers',
      'numbers-in-text',
      'punctuation',
      'punctuation-more',
      'alphabet-wordsigns',
    ];
    const idx = order.map((s) => LESSON_SLUGS.indexOf(s));
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });
});

describe('every taught cell comes from the canonical data', () => {
  test.each(ALL_LESSONS.flatMap((l) => l.chars.map((c) => [l.slug, c.print, c] as const)))(
    '%s: %s',
    (_slug, _print, c) => {
      expect(c.cells.length).toBeGreaterThan(0);
      expect(c.cellNames).toHaveLength(c.cells.length);
      switch (c.source) {
        case 'letter':
          expect(c.cells).toEqual([LETTER_CELLS[c.print]]);
          expect(c.print).toBe(c.print.toLowerCase()); // a plain letter cell is a lowercase letter (ICEB 4.1)
          break;
        case 'print':
          expect(cellsKey(c.cells)).toBe(cellsKey(transcribe(c.print)));
          break;
        case 'sign': {
          const sign = [...Object.values(INDICATORS), ...Object.values(PUNCTUATION)].find((s) => s.name === c.print);
          expect(sign).toBeDefined();
          expect(c.cells).toEqual(sign!.cells);
          break;
        }
        case 'contraction': {
          const found = CONTRACTIONS.find((x) => x.text === c.print && x.kind === c.contractionKind);
          expect(found).toBeDefined();
          expect(c.cells).toEqual(found!.cells);
          break;
        }
      }
    },
  );

  test('digits are taught with their numeric indicator, never as a bare letter cell', () => {
    for (const l of ALL_LESSONS)
      for (const c of l.chars) if (/^[0-9]/.test(c.print)) expect(c.cells[0]).toEqual(INDICATORS.numeric.cells[0]);
  });

  test('capital letters are taught with the capital letter indicator', () => {
    for (const l of ALL_LESSONS)
      for (const c of l.chars)
        if (/^[A-Z]$/.test(c.print))
          expect(c.cells).toEqual([INDICATORS.capitalLetter.cells[0], LETTER_CELLS[c.print.toLowerCase()]]);
  });
});

describe('every sentence is rendered from data, and the claims are true', () => {
  test('no template token is left unrendered', () => {
    for (const l of ALL_LESSONS) for (const t of allText(l)) expect(t).not.toMatch(/\{\w+:[^}]*\}/);
  });

  const cellWith = (pred: (d: 1 | 2 | 3 | 4 | 5 | 6) => boolean): Cell => ([1, 2, 3, 4, 5, 6] as const).filter(pred);

  test('“a is a single dot in the top left”', () => {
    expect(LETTER_CELLS.a).toHaveLength(1);
    expect(dotPosition(LETTER_CELLS.a[0])).toEqual({ column: 1, row: 1 });
  });

  test('“c is the whole top row” and “l is the whole left column”', () => {
    expect(LETTER_CELLS.c).toEqual(cellWith((d) => dotPosition(d).row === 1));
    expect(LETTER_CELLS.l).toEqual(cellWith((d) => dotPosition(d).column === 1));
  });

  test('“lower groupsigns never use the top row”', () => {
    for (const c of CONTRACTIONS.filter((x) => x.kind === 'lower-groupsign'))
      expect(c.cells[0].some((d) => dotPosition(d).row === 1)).toBe(false);
  });

  test('“bath is b, a, then the th groupsign” matches contracted UEB (liblouis g2)', () => {
    expect(BATH.cells.length).toBe(3);
    const louis = (oracle.translations as Record<string, string>)['g2\tbath'];
    expect(louis).toBe(
      BATH.cells.map((c) => String.fromCharCode(0x2800 + c.reduce((a, d) => a | (1 << (d - 1)), 0))).join(''),
    );
  });

  test('no lesson says “this” is spelled with the th groupsign plus i and s (it is one cell standing alone)', () => {
    for (const l of ALL_LESSONS) for (const t of allText(l)) expect(t).not.toMatch(/“this” uses the “th” groupsign/);
  });

  test('the uncontracted convention is stated in the course (trap 5)', () => {
    const text = ALL_LESSONS.flatMap(allText).join(' ');
    expect(text).toContain('A single letter on its own');
    expect(text).toContain('uncontracted');
  });

  test('UEB terminology: numeric indicator, not “number sign”; no EBAE “letter sign”', () => {
    const text = ALL_LESSONS.flatMap(allText).join(' ');
    expect(text).not.toMatch(/number sign|letter sign|Nemeth/i);
  });
});
