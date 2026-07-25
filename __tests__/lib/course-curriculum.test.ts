/**
 * Accuracy suite for the free braille course.
 *
 * The course promises "100% accurate" braille. These tests encode the real
 * structural facts of Unified English Braille (UEB) *independently* of the app's
 * data maps, then assert the curriculum agrees with them. If any lesson ever
 * drifts from correct braille — or from the canonical maps the rest of the site
 * uses — this suite fails.
 */
import { brailleMap, dotDescription } from '@/lib/braille-map';
import { contractedBrailleEntries } from '@/lib/contracted-braille-map';
import {
  COURSE_MODULES,
  ALL_LESSONS,
  LESSON_SLUGS,
  TOTAL_LESSONS,
  describeDots,
  getLessonBySlug,
  getAdjacentLessons,
} from '@/lib/course-curriculum';
import type { GameId } from '@/lib/progress-types';

/** Grid order is [d1, d4, d2, d5, d3, d6]; convert to a set of dot numbers. */
const GRID_TO_DOT = [1, 4, 2, 5, 3, 6];
function dotsOf(pattern: number[]): Set<number> {
  const s = new Set<number>();
  pattern.forEach((v, i) => {
    if (v) s.add(GRID_TO_DOT[i]);
  });
  return s;
}
function setsEqual(a: Set<number>, b: Set<number>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}
const patternKey = (p: number[]) => p.join(',');

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
];

describe('UEB structural facts (independent ground truth)', () => {
  it('A–J use only the top four dots (1, 2, 4, 5)', () => {
    for (const ch of 'ABCDEFGHIJ') {
      const dots = dotsOf(brailleMap[ch]);
      [...dots].forEach((d) => expect([1, 2, 4, 5]).toContain(d));
    }
  });

  it('K–T are exactly A–J with dot 3 added', () => {
    const firstTen = 'ABCDEFGHIJ'.split('');
    const secondTen = 'KLMNOPQRST'.split('');
    firstTen.forEach((base, i) => {
      const expected = new Set(dotsOf(brailleMap[base]));
      expected.add(3);
      expect(setsEqual(dotsOf(brailleMap[secondTen[i]]), expected)).toBe(true);
    });
  });

  it('U, V, X, Y, Z are A, B, C, D, E with dots 3 and 6 added', () => {
    const pairs: [string, string][] = [
      ['U', 'A'],
      ['V', 'B'],
      ['X', 'C'],
      ['Y', 'D'],
      ['Z', 'E'],
    ];
    for (const [letter, base] of pairs) {
      const expected = new Set(dotsOf(brailleMap[base]));
      expected.add(3);
      expected.add(6);
      expect(setsEqual(dotsOf(brailleMap[letter]), expected)).toBe(true);
    }
  });

  it('W is the exception — dots 2, 4, 5, 6 (does not follow the U–Z pattern)', () => {
    expect(setsEqual(dotsOf(brailleMap.W), new Set([2, 4, 5, 6]))).toBe(true);
    // If W followed the sequence it would be J + {3,6}; confirm it does not.
    const asIfSequenced = new Set(dotsOf(brailleMap.J));
    asIfSequenced.add(3);
    asIfSequenced.add(6);
    expect(setsEqual(dotsOf(brailleMap.W), asIfSequenced)).toBe(false);
  });

  it('digits 1–9 and 0 reuse the shapes of A–I and J', () => {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const letters = 'ABCDEFGHIJ'.split('');
    digits.forEach((d, i) => {
      expect(patternKey(brailleMap[d])).toBe(patternKey(brailleMap[letters[i]]));
    });
  });

  it('the number sign is dots 3, 4, 5, 6 and the capital sign is dot 6', () => {
    expect(setsEqual(dotsOf(brailleMap['#']), new Set([3, 4, 5, 6]))).toBe(true);
    expect(setsEqual(dotsOf(brailleMap['^']), new Set([6]))).toBe(true);
  });
});

describe('describeDots matches the canonical dotDescription', () => {
  it('agrees with lib/braille-map for every letter A–Z', () => {
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(describeDots(brailleMap[ch])).toBe(dotDescription(ch));
    }
  });
});

describe('every character taught is drawn from the canonical maps', () => {
  const canonicalPatterns = new Set<string>([
    ...Object.values(brailleMap).map(patternKey),
    ...contractedBrailleEntries.map((e) => patternKey(e.pattern)),
  ]);

  it('has no lesson character with a hand-invented pattern', () => {
    for (const lesson of ALL_LESSONS) {
      for (const c of lesson.chars) {
        expect(c.pattern).toHaveLength(6);
        c.pattern.forEach((v) => expect(v === 0 || v === 1).toBe(true));
        expect(canonicalPatterns.has(patternKey(c.pattern))).toBe(true);
      }
    }
  });
});

describe('Grade 2 lessons match the canonical contraction map exactly', () => {
  const byLabel = new Map<string, number[]>();
  for (const e of contractedBrailleEntries) {
    byLabel.set(e.label, e.pattern);
    byLabel.set(e.label.split(' ')[0], e.pattern);
  }

  it('each contraction taught equals its canonical pattern', () => {
    const grade2 = COURSE_MODULES.find((m) => m.id === 'grade2');
    expect(grade2).toBeDefined();
    for (const lesson of grade2!.lessons) {
      for (const c of lesson.chars) {
        const canonical = byLabel.get(c.print);
        expect(canonical).toBeDefined();
        expect(patternKey(c.pattern)).toBe(patternKey(canonical!));
      }
    }
  });
});

describe('curriculum integrity', () => {
  it('loads without throwing and has lessons', () => {
    expect(TOTAL_LESSONS).toBeGreaterThan(0);
    expect(ALL_LESSONS).toHaveLength(TOTAL_LESSONS);
  });

  it('has unique, URL-safe lesson slugs', () => {
    expect(new Set(LESSON_SLUGS).size).toBe(LESSON_SLUGS.length);
    for (const slug of LESSON_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('references only real games and real modules', () => {
    for (const lesson of ALL_LESSONS) {
      if (lesson.practiceGameId) {
        expect(VALID_GAME_IDS).toContain(lesson.practiceGameId);
      }
      expect(COURSE_MODULES.some((m) => m.id === lesson.moduleId)).toBe(true);
    }
  });

  it('links lessons into a consistent prev/next chain', () => {
    ALL_LESSONS.forEach((lesson, i) => {
      const { prev, next } = getAdjacentLessons(lesson.slug);
      expect(prev?.slug ?? null).toBe(i > 0 ? ALL_LESSONS[i - 1].slug : null);
      expect(next?.slug ?? null).toBe(i < ALL_LESSONS.length - 1 ? ALL_LESSONS[i + 1].slug : null);
      expect(getLessonBySlug(lesson.slug)).toBe(lesson);
    });
  });
});
