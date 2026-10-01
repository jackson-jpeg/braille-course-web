/**
 * Free braille course — curriculum definition (single source of truth).
 *
 * IMPORTANT (accuracy guarantee): lessons never hardcode dot patterns. Every
 * character's pattern is pulled from the canonical maps — `brailleMap`
 * (lib/braille-map.ts) and `contractedBrailleEntries` (lib/contracted-braille-map.ts) —
 * so what the course teaches and checks is always in sync with the rest of the site.
 */

import { brailleMap } from './braille-map';
import { contractedBrailleEntries, ContractionEntry } from './contracted-braille-map';
import type { GameId } from './progress-types';
import { describe, fromGrid } from './ueb';

/** A single character (letter, digit, indicator, or contraction) taught in a lesson. */
export interface CharItem {
  /** Print label shown to the learner, e.g. "A", "1", "the", "ch". */
  print: string;
  /** 6-dot pattern in grid order [d1, d4, d2, d5, d3, d6], from a canonical map. */
  pattern: number[];
  /** Optional short teaching note. */
  note?: string;
}

export interface Lesson {
  slug: string;
  title: string;
  moduleId: string;
  /** One-line summary for the lesson list. */
  summary: string;
  /** Teaching intro paragraph(s). */
  intro: string[];
  /** Characters this lesson teaches — drives the cells and the Brailler drill. */
  chars: CharItem[];
  /** Existing game embedded whole as the deeper-practice step. */
  practiceGameId?: GameId;
  /** Human label for the embedded practice game. */
  practiceGameLabel?: string;
  /** Optional encouragement/tip shown near the end of the lesson. */
  tip?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  blurb: string;
  lessons: Lesson[];
}

/* ── Pattern lookups (all from canonical maps) ─────────────────────────────── */

function letter(ch: string, note?: string): CharItem {
  const pattern = brailleMap[ch.toUpperCase()];
  if (!pattern) throw new Error(`course-curriculum: unknown letter "${ch}"`);
  return { print: ch.toUpperCase(), pattern, note };
}

function symbol(key: string, print: string, note?: string): CharItem {
  const pattern = brailleMap[key];
  if (!pattern) throw new Error(`course-curriculum: unknown symbol "${key}"`);
  return { print, pattern, note };
}

const contractionByKey = new Map<string, ContractionEntry>();
for (const entry of contractedBrailleEntries) {
  contractionByKey.set(entry.label, entry);
  contractionByKey.set(entry.label.split(' ')[0], entry); // also index first word (e.g. "en")
}

function contraction(key: string, print?: string, note?: string): CharItem {
  const entry = contractionByKey.get(key);
  if (!entry) throw new Error(`course-curriculum: unknown contraction "${key}"`);
  return { print: print ?? entry.label, pattern: entry.pattern, note };
}

/**
 * Describe which dots are raised in a pattern, e.g. "dots 1 2".
 * Works for any pattern (letters, digits, indicators, contractions) — a
 * pattern-based companion to `dotDescription()` in lib/braille-map.ts.
 */
export function describeDots(pattern: number[]): string {
  return describe(fromGrid(pattern));
}

/* ── The curriculum ────────────────────────────────────────────────────────── */

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 'orientation',
    title: 'Orientation',
    blurb: 'Meet the braille cell and learn how its six dots are numbered.',
    lessons: [
      {
        slug: 'the-braille-cell',
        title: 'The Braille Cell',
        moduleId: 'orientation',
        summary: 'How the six-dot cell is arranged and numbered.',
        intro: [
          'Every braille character lives inside one “cell” — six dot positions arranged in two columns of three.',
          'The left column holds dots 1, 2, 3 (top to bottom); the right column holds dots 4, 5, 6. Raising different dots creates every letter, number, and symbol. Let’s write a few to feel how position works.',
        ],
        chars: [
          letter('A', 'A single top-left dot — dot 1.'),
          letter('C', 'The whole top row — dots 1 and 4.'),
          letter('L', 'The whole left column — dots 1, 2, 3.'),
        ],
        practiceGameId: 'explorer',
        practiceGameLabel: 'Dot Explorer',
        tip: 'There’s no need to memorize everything now — you’ll build the cell up letter by letter.',
      },
    ],
  },
  {
    id: 'grade1-letters',
    title: 'Grade 1 · The Alphabet',
    blurb: 'Learn all 26 letters in the order braille was designed to be learned.',
    lessons: [
      {
        slug: 'letters-a-j',
        title: 'Letters A–J',
        moduleId: 'grade1-letters',
        summary: 'The first ten letters — the foundation of the whole system.',
        intro: [
          'Braille’s first ten letters use only the top four dots: 1, 2, 4, and 5. Master these and you’ve learned the pattern the entire alphabet is built from.',
          'Write each letter below by raising its dots.',
        ],
        chars: 'ABCDEFGHIJ'.split('').map((c) => letter(c)),
        practiceGameId: 'explorer',
        practiceGameLabel: 'Dot Explorer',
        tip: 'Notice how E, I, and J are just the same shapes shifted — braille is wonderfully logical.',
      },
      {
        slug: 'letters-k-t',
        title: 'Letters K–T',
        moduleId: 'grade1-letters',
        summary: 'A–J again, plus dot 3 in the lower-left.',
        intro: [
          'Here’s the elegant trick: K through T are exactly A through J with dot 3 added underneath. K is A + dot 3, L is B + dot 3, and so on.',
          'If you know the first ten letters, you already know these — just add the bottom-left dot.',
        ],
        chars: 'KLMNOPQRST'.split('').map((c) => letter(c)),
        practiceGameId: 'speedmatch',
        practiceGameLabel: 'Speed Match',
        tip: 'Try covering the labels and reading the cells by their dot numbers alone.',
      },
      {
        slug: 'letters-u-z',
        title: 'Letters U–Z',
        moduleId: 'grade1-letters',
        summary: 'The final letters — and W, the famous exception.',
        intro: [
          'U, V, X, Y, and Z add dots 3 and 6 to the first shapes. W is the odd one out: French had no W when Louis Braille designed the code, so it was added separately.',
          'Finish the alphabet by writing each of these.',
        ],
        chars: [
          letter('U'),
          letter('V'),
          letter('X'),
          letter('Y'),
          letter('Z'),
          letter('W', 'The exception — added later.'),
        ],
        practiceGameId: 'memorymatch',
        practiceGameLabel: 'Memory Match',
        tip: 'That’s the whole alphabet! From here, it’s all about reading speed.',
      },
      {
        slug: 'reading-words',
        title: 'Reading Your First Words',
        moduleId: 'grade1-letters',
        summary: 'Put letters together and read whole words.',
        intro: [
          'Individual letters become words when you read them left to right, one cell at a time. Warm up by writing the letters in a few short words, then head to the Word Game to read whole words under gentle pressure.',
        ],
        chars: [letter('C'), letter('A'), letter('T'), letter('D'), letter('O'), letter('G')],
        practiceGameId: 'wordgame',
        practiceGameLabel: 'Word Game',
        tip: 'Reading braille is a skill of recognition — the more words you meet, the faster it clicks.',
      },
    ],
  },
  {
    id: 'numbers-indicators',
    title: 'Numbers & Indicators',
    blurb: 'How braille signals numbers and capital letters.',
    lessons: [
      {
        slug: 'numbers',
        title: 'Numbers',
        moduleId: 'numbers-indicators',
        summary: 'The number sign, and how digits reuse A–J.',
        intro: [
          'Braille reuses the first ten letters for digits. A number sign (dots 3, 4, 5, 6) tells the reader “what follows is a number,” and then A–J stand in for 1–0.',
          'So “1” is the number sign followed by A, “2” is the number sign followed by B, and so on. Write the number sign and a few digits below.',
        ],
        chars: [
          symbol('#', 'Number sign', 'Placed before digits — dots 3, 4, 5, 6.'),
          symbol('1', '1', 'Same cell as A.'),
          symbol('2', '2', 'Same cell as B.'),
          symbol('3', '3', 'Same cell as C.'),
          symbol('0', '0', 'Same cell as J.'),
        ],
        practiceGameId: 'number-sense',
        practiceGameLabel: 'Number Sense',
        tip: 'One number sign covers a whole run of digits — you don’t repeat it before every digit.',
      },
      {
        slug: 'capitals',
        title: 'Capital Letters',
        moduleId: 'numbers-indicators',
        summary: 'The capital indicator and how it works.',
        intro: [
          'There are no separate capital shapes in braille. Instead, a capital indicator (dot 6) placed just before a letter makes it uppercase.',
          'One capital indicator capitalizes one letter; doubling it capitalizes a whole word. Write the capital indicator below to feel where dot 6 sits.',
        ],
        chars: [
          symbol('^', 'Capital sign', 'Placed before a letter — dot 6.'),
          letter('A', 'With a capital sign in front, this reads as a capital A.'),
        ],
        practiceGameId: 'reflex-dots',
        practiceGameLabel: 'Reflex Dots',
        tip: 'Capital and number signs are “indicators” — they change how the next cell is read.',
      },
    ],
  },
  {
    id: 'grade2',
    title: 'Grade 2 · Contractions',
    blurb: 'The shortcuts that make braille fast to read and write.',
    lessons: [
      {
        slug: 'alphabet-wordsigns',
        title: 'Alphabet Wordsigns',
        moduleId: 'grade2',
        summary: 'Single letters that stand for whole words.',
        intro: [
          'Grade 2 braille adds contractions — shortcuts that save space and speed up reading. The simplest are alphabet wordsigns: a single letter, standing alone, that means a whole word.',
          'B means “but,” C means “can,” D means “do.” The cell is identical to the letter; only its standing-alone use changes the meaning.',
        ],
        chars: [
          contraction('but'),
          contraction('can'),
          contraction('do'),
          contraction('every'),
          contraction('from'),
          contraction('go'),
        ],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'There are 23 alphabet wordsigns in all — you’ve just met the first handful.',
      },
      {
        slug: 'strong-contractions',
        title: 'Strong Contractions',
        moduleId: 'grade2',
        summary: 'One-cell shortcuts for the most common words.',
        intro: [
          'Some of the most common words in English get their own unique one-cell contraction: and, for, of, the, and with. These patterns don’t match any letter — they’re shapes of their own.',
          'Because these words appear so often, learning them gives an immediate reading-speed boost.',
        ],
        chars: [contraction('and'), contraction('for'), contraction('of'), contraction('the'), contraction('with')],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'These five words alone make up a big share of everyday text.',
      },
      {
        slug: 'strong-groupsigns',
        title: 'Strong Groupsigns',
        moduleId: 'grade2',
        summary: 'Single cells for common letter groups like CH and TH.',
        intro: [
          'Groupsigns stand for letter combinations that appear inside words. One cell can represent “ch,” “sh,” “th,” “wh,” “er,” or “ing” — wherever those letters occur.',
          'So “the” uses a contraction, and “this” uses the “th” groupsign followed by i and s.',
        ],
        chars: [
          contraction('ch'),
          contraction('sh'),
          contraction('th'),
          contraction('wh'),
          contraction('er'),
          contraction('ing'),
        ],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'Groupsigns can sit at the start, middle, or end of a word.',
      },
      {
        slug: 'lower-groupsigns',
        title: 'Lower Groupsigns',
        moduleId: 'grade2',
        summary: 'Contractions written in the lower part of the cell.',
        intro: [
          'Lower groupsigns sit in the lower part of the cell (dots 2, 3, 5, 6). “Be,” “con,” and “dis” stand for those letters at the start of a word; “en” and “in” can appear anywhere in a word.',
          'Because they use only lower dots, they’re easy to tell apart from the letter shapes you already know.',
        ],
        chars: [contraction('be'), contraction('con'), contraction('dis'), contraction('en', 'en'), contraction('in')],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'Lower-cell shapes are the same as some punctuation — context tells the reader which is meant.',
      },
      {
        slug: 'lower-wordsigns',
        title: 'Lower Wordsigns',
        moduleId: 'grade2',
        summary: 'Standalone words written in the lower cell.',
        intro: [
          'A few whole words are written entirely in the lower cell: his, was, and were. Standing alone, each is a single cell.',
          'These round out the core contractions you need to start reading real Grade 2 text.',
        ],
        chars: [contraction('his'), contraction('was'), contraction('were')],
        practiceGameId: 'contraction-sprint',
        practiceGameLabel: 'Contraction Sprint',
        tip: 'You now know contractions from every major family — wordsigns, groupsigns, upper and lower.',
      },
    ],
  },
  {
    id: 'bring-it-together',
    title: 'Bring It Together',
    blurb: 'Read real sentences and plan your next steps.',
    lessons: [
      {
        slug: 'reading-sentences',
        title: 'Reading Contracted Sentences',
        moduleId: 'bring-it-together',
        summary: 'Combine letters and contractions into full sentences.',
        intro: [
          'Real braille mixes letters and contractions together. Refresh three of the most common contractions below, then move to the Sentence Decoder to read complete sentences the way a braille reader does.',
        ],
        chars: [contraction('the'), contraction('and'), contraction('of')],
        practiceGameId: 'sentence-decoder',
        practiceGameLabel: 'Sentence Decoder',
        tip: 'Reading fluency comes from meeting the same patterns again and again — keep going!',
      },
      {
        slug: 'wrap-up',
        title: 'Wrap-Up & Next Steps',
        moduleId: 'bring-it-together',
        summary: 'Celebrate, and choose where to go next.',
        intro: [
          'You’ve gone from a blank cell to reading contracted braille — that’s the whole foundation of Grade 2. From here, fluency is a matter of practice.',
          'Keep the twelve practice games in rotation, and when you’re ready for personalized instruction, the summer course and 1-on-1 sessions are here for you.',
        ],
        chars: [],
        practiceGameId: 'bingo',
        practiceGameLabel: 'Braille Bingo',
        tip: 'Consistency beats intensity — even a few minutes a day builds lasting recognition.',
      },
    ],
  },
];

/* ── Derived helpers ───────────────────────────────────────────────────────── */

export const ALL_LESSONS: Lesson[] = COURSE_MODULES.flatMap((m) => m.lessons);

export const LESSON_SLUGS: string[] = ALL_LESSONS.map((l) => l.slug);

export const TOTAL_LESSONS = ALL_LESSONS.length;

export function getLessonBySlug(slug: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.slug === slug);
}

export function getLessonIndex(slug: string): number {
  return ALL_LESSONS.findIndex((l) => l.slug === slug);
}

export function getModuleForLesson(lesson: Lesson): CourseModule | undefined {
  return COURSE_MODULES.find((m) => m.id === lesson.moduleId);
}

/** Previous / next lesson slugs for in-lesson navigation (null at the ends). */
export function getAdjacentLessons(slug: string): { prev: Lesson | null; next: Lesson | null } {
  const idx = getLessonIndex(slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ALL_LESSONS[idx - 1] : null,
    next: idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null,
  };
}

/** Print text the lessons render as braille (checked against liblouis via lib/ueb-corpus.ts). */
export const LESSON_BRAILLE_TEXT: { uncontracted: string[]; contracted: string[] } = {
  uncontracted: [],
  contracted: [],
};
