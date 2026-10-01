/**
 * The beginner track: structure, links, and braille accuracy. Every cell a lesson shows must
 * come from lib/ueb.ts (checked against the official chart and liblouis in ueb.test.ts), and
 * every example word must match liblouis.
 */
import oracle from '../fixtures/ueb-oracle.json';
import runtime from '../../lib/data/ueb-contracted.json';
import {
  ALL_LESSONS,
  COURSE_MODULES,
  LEGACY_LESSON_REDIRECTS,
  LESSON_SLUGS,
  TOTAL_LESSONS,
  getAdjacentLessons,
  type CharItem,
} from '@/lib/course-curriculum';
import {
  LETTERS,
  CONTRACTIONS,
  PUNCTUATION,
  INDICATORS,
  DIGITS,
  transcribeToUnicode,
  cellsToUnicode,
  toUnicode,
} from '@/lib/ueb';
import { GAME_BY_ID } from '@/lib/games/registry';

const REQUIRED_ORDER = [
  'what-is-braille',
  'the-braille-cell',
  'letters-a-j',
  'letters-k-t',
  'letters-u-z',
  'first-words',
  'numbers',
  'punctuation',
  'capitals',
  'first-contractions',
  'more-contractions',
  'next-steps',
];

function allChars(): CharItem[] {
  return ALL_LESSONS.flatMap((l) =>
    l.blocks.flatMap((b) =>
      b.type === 'cells' || b.type === 'write' ? b.items : b.type === 'read' ? [...b.items, ...b.pool] : [],
    ),
  );
}

describe('track structure', () => {
  test('lessons follow the beginner order', () => {
    expect(LESSON_SLUGS).toEqual(REQUIRED_ORDER);
    expect(TOTAL_LESSONS).toBe(12);
  });

  test('slugs are unique and URL-safe', () => {
    expect(new Set(LESSON_SLUGS).size).toBe(LESSON_SLUGS.length);
    for (const s of LESSON_SLUGS) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  test('every lesson links to a real game, and that game links back', () => {
    for (const l of ALL_LESSONS) {
      const g = GAME_BY_ID.get(l.practiceGameId);
      expect([l.slug, !!g]).toEqual([l.slug, true]);
      for (const extra of l.alsoTry ?? [])
        expect([l.slug, extra, GAME_BY_ID.has(extra)]).toEqual([l.slug, extra, true]);
    }
    for (const g of GAME_BY_ID.values())
      for (const slug of g.lessons) expect([g.id, LESSON_SLUGS.includes(slug)]).toEqual([g.id, true]);
  });

  test('the last lesson points to the courses', () => {
    const last = ALL_LESSONS[ALL_LESSONS.length - 1];
    expect(last.slug).toBe('next-steps');
  });

  test('prev/next navigation is a chain', () => {
    expect(getAdjacentLessons(LESSON_SLUGS[0]).prev).toBeNull();
    expect(getAdjacentLessons(LESSON_SLUGS[11]).next).toBeNull();
    for (let i = 1; i < 12; i++) expect(getAdjacentLessons(LESSON_SLUGS[i]).prev?.slug).toBe(LESSON_SLUGS[i - 1]);
  });

  test('legacy lesson URLs all redirect to real lessons', () => {
    for (const [from, to] of Object.entries(LEGACY_LESSON_REDIRECTS)) {
      expect(LESSON_SLUGS).not.toContain(from);
      expect(LESSON_SLUGS).toContain(to);
    }
  });

  test('every module has lessons and every lesson has goals and a quiz or practice', () => {
    for (const m of COURSE_MODULES) expect(m.lessons.length).toBeGreaterThan(0);
    for (const l of ALL_LESSONS) {
      expect(l.goals.length).toBeGreaterThan(0);
      expect(l.summary.length).toBeGreaterThan(20);
    }
  });

  test('quiz answers are in range', () => {
    for (const l of ALL_LESSONS)
      for (const b of l.blocks)
        if (b.type === 'quiz')
          for (const q of b.questions) {
            expect(q.answer).toBeGreaterThanOrEqual(0);
            expect(q.answer).toBeLessThan(q.options.length);
          }
  });
});

describe('lesson braille accuracy', () => {
  const known = new Set<string>([
    ...Object.values(LETTERS).map((d) => toUnicode(d)),
    ...Object.values(DIGITS).map((d) => toUnicode(d)),
    ...CONTRACTIONS.map((c) => toUnicode(c.dots)),
    ...PUNCTUATION.flatMap((p) => p.cells.map(toUnicode)),
    ...Object.values(INDICATORS).flatMap((i) => i.cells.map(toUnicode)),
    ...[1, 2, 3, 4, 5, 6].map((n) => toUnicode([n])),
  ]);

  test('every taught cell is a defined UEB cell', () => {
    for (const c of allChars())
      for (const cell of c.cells) expect([c.print, known.has(toUnicode(cell))]).toEqual([c.print, true]);
  });

  test('letters, digits and punctuation in lessons match their UEB definitions', () => {
    for (const c of allChars()) {
      const [kind, id] = c.key.split(':');
      if (kind === 'letter') expect(cellsToUnicode(c.cells)).toBe((oracle.g1 as Record<string, string>)[id]);
      if (kind === 'digit') expect(cellsToUnicode(c.cells)).toBe((oracle.g1 as Record<string, string>)[id]);
      if (kind === 'punct')
        expect(cellsToUnicode(c.cells)).toBe(cellsToUnicode(PUNCTUATION.find((p) => p.id === id)!.cells));
    }
  });

  test('uncontracted examples match liblouis', () => {
    for (const l of ALL_LESSONS)
      for (const b of l.blocks)
        if (b.type === 'example' && !b.contracted)
          expect([b.text, transcribeToUnicode(b.text)]).toEqual([
            b.text,
            (oracle.g1 as Record<string, string>)[b.text],
          ]);
  });

  test('contracted examples have liblouis braille stored', () => {
    for (const l of ALL_LESSONS)
      for (const b of l.blocks)
        if (b.type === 'example' && b.contracted) {
          const stored = (runtime.braille as Record<string, string>)[b.text];
          expect([b.text, stored]).toEqual([b.text, (oracle.g2 as Record<string, string>)[b.text]]);
        }
  });

  test('quiz cells are defined UEB cells', () => {
    for (const l of ALL_LESSONS)
      for (const b of l.blocks)
        if (b.type === 'quiz')
          for (const q of b.questions) for (const cell of q.cells ?? []) expect(known.has(toUnicode(cell))).toBe(true);
  });
});
