/**
 * The free beginner track: twelve short, self-paced lessons for sighted grown-ups (and older
 * kids) learning Unified English Braille, from "what is braille?" to first contractions.
 *
 * ACCURACY: lessons never type dot patterns. Every cell comes from lib/ueb.ts, every braille
 * word is transcribed by lib/ueb.ts or taken from liblouis output (lib/data/ueb-contracted.json),
 * and all of it is tested in __tests__/lib/ueb.test.ts and __tests__/lib/course-curriculum.test.ts.
 *
 * VOICE: warm, plain, encouraging. Short sentences. Assume the reader is a nervous parent who
 * has never seen braille up close and has ten minutes after bedtime.
 */

import {
  LETTERS,
  DIGITS,
  INDICATORS,
  getPunctuation,
  getContraction,
  describe,
  fromGrid,
  type Dots,
  type ContractionKind,
} from './ueb';
import type { GameId } from './progress-types';

/* ── Model ─────────────────────────────────────────────────────────────────── */

/** One character taught in a lesson: what it looks like in print and which dots are raised. */
export interface CharItem {
  /** Label shown to the learner: "a", "7", "the", "period". */
  print: string;
  /** One or more cells (numbers and capitals take an indicator cell first). */
  cells: Dots[];
  /** Short memory hook. */
  note?: string;
  /** Key for skill tracking, e.g. "letter:a". */
  key: string;
}

export type LessonBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'cells'; title?: string; items: CharItem[] }
  | { type: 'example'; text: string; contracted?: boolean; caption: string }
  | { type: 'callout'; tone: 'tip' | 'parent' | 'fact' | 'kid'; title: string; text: string }
  | { type: 'write'; title: string; items: CharItem[] }
  | { type: 'read'; title: string; items: CharItem[]; pool: CharItem[] }
  | { type: 'quiz'; questions: QuizQuestion[] };

export interface QuizQuestion {
  prompt: string;
  /** Optional braille shown with the question. */
  cells?: Dots[];
  options: string[];
  answer: number;
  explain: string;
}

export interface Lesson {
  slug: string;
  title: string;
  /** One-line summary for lists and meta descriptions. */
  summary: string;
  minutes: number;
  /** "By the end you'll be able to…" */
  goals: string[];
  blocks: LessonBlock[];
  practiceGameId: GameId;
  practiceLabel: string;
  /** Query parameters that set the game up for this lesson. */
  practiceParams?: Record<string, string>;
  /** Extra games worth a try after this lesson. */
  alsoTry?: GameId[];
}

export interface CourseModule {
  id: string;
  title: string;
  blurb: string;
  lessons: Lesson[];
}

/* ── Builders (all patterns come from lib/ueb.ts) ─────────────────────────── */

function letter(l: string, note?: string): CharItem {
  const dots = LETTERS[l];
  if (!dots) throw new Error(`curriculum: unknown letter ${l}`);
  return { print: l, cells: [dots], note, key: `letter:${l}` };
}
const letters = (s: string) => s.split('').map((l) => letter(l));

function digit(d: string, note?: string): CharItem {
  return { print: d, cells: [INDICATORS.numeric.cells[0], DIGITS[d]], note, key: `digit:${d}` };
}

function punct(id: string, note?: string): CharItem {
  const p = getPunctuation(id);
  return { print: p.name.toLowerCase(), cells: [...p.cells], note, key: `punct:${id}` };
}

function contraction(text: string, kind?: ContractionKind, note?: string): CharItem {
  const c = getContraction(text, kind);
  return { print: c.text, cells: [c.dots], note: note ?? c.usage, key: `contraction:${c.text}` };
}

function indicator(id: keyof typeof INDICATORS, print: string, note?: string): CharItem {
  return { print, cells: [...INDICATORS[id].cells], note, key: `indicator:${id}` };
}

/* ── The track ─────────────────────────────────────────────────────────────── */

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 'start',
    title: 'Getting started',
    blurb: 'What braille is, and the six-dot cell everything is built from.',
    lessons: [
      {
        slug: 'what-is-braille',
        title: 'What is braille?',
        summary: 'A gentle first look at braille: what it is, who uses it, and how this course works.',
        minutes: 5,
        goals: [
          'Explain what braille is in one sentence',
          'Know which braille code this course teaches (UEB)',
          'Know how the lessons and games fit together',
        ],
        blocks: [
          {
            type: 'p',
            text: 'Welcome. If you have never seen braille up close, you are in exactly the right place. Braille is a way of writing with raised dots so that words can be read by touch. It is not a language of its own: braille spells out the same English you are reading right now, just in a different form.',
          },
          {
            type: 'p',
            text: 'Each braille character fits inside a small rectangle called a cell, about the size of a fingertip. A reader glides their fingers along a line of cells and feels which dots are raised. Experienced braille readers read quickly and comfortably, and many read for pleasure every day.',
          },
          { type: 'example', text: 'hello', caption: 'The word “hello” in braille. Five letters, five cells.' },
          { type: 'h', text: 'Where braille came from' },
          {
            type: 'p',
            text: 'Braille is named after Louis Braille, a French boy who lost his sight after an accident when he was three. As a teenager at a school for blind students in Paris, he reworked a clunky military dot code into the neat six-dot system we still use today. He published it in 1829, when he was just twenty.',
          },
          {
            type: 'callout',
            tone: 'fact',
            title: 'Did you know?',
            text: 'Braille is used for much more than books: elevator buttons, medicine boxes, board games, music, math and computer code all have braille forms. Many braille readers also use refreshable braille displays, where little pins pop up and down under the fingers.',
          },
          { type: 'h', text: 'The braille you will learn here' },
          {
            type: 'p',
            text: 'Since 2016, schools in the United States have used Unified English Braille, or UEB. It is the same code used across much of the English-speaking world, and it is what children learn in school today. Every cell on this site is UEB, checked automatically against the official tables.',
          },
          {
            type: 'p',
            text: 'Braille comes in two styles. Uncontracted braille spells every word letter by letter. Contracted braille adds shortcuts, so common words like “the” and “and” take a single cell. Most books use contracted braille. You will start letter by letter, then meet your first shortcuts near the end of the track.',
          },
          {
            type: 'callout',
            tone: 'parent',
            title: 'For parents and family',
            text: 'You do not need to become an expert to make a difference. Knowing the alphabet lets you label toys and drawers, read your child’s early work, and leave little notes. Most of all, it shows your child that braille matters to the people they love.',
          },
          { type: 'h', text: 'How this course works' },
          {
            type: 'list',
            items: [
              'Twelve short lessons, about five to ten minutes each.',
              'You will write cells yourself by tapping dots on screen, or with your keyboard.',
              'Each lesson ends with a matching practice game.',
              'Your progress saves on this device. There is no account and nothing to sign up for.',
              'Learning by sight first is completely normal for sighted adults. Your eyes will do the reading for now.',
            ],
          },
          {
            type: 'quiz',
            questions: [
              {
                prompt: 'Braille is…',
                options: ['A separate language', 'A way of writing words with raised dots', 'A kind of sign language'],
                answer: 1,
                explain: 'Braille writes the same words as print, using raised dots read by touch.',
              },
              {
                prompt: 'Which braille code do US schools use today?',
                options: ['Unified English Braille (UEB)', 'Morse code', 'American Sign Language'],
                answer: 0,
                explain: 'UEB has been the standard in the United States since 2016.',
              },
            ],
          },
        ],
        practiceGameId: 'explorer',
        practiceLabel: 'Play with the dots in Dot Explorer',
        alsoTry: ['dot-quest'],
      },
      {
        slug: 'the-braille-cell',
        title: 'The braille cell',
        summary: 'Meet the six-dot cell and learn how its dots are numbered.',
        minutes: 6,
        goals: ['Number all six dots from memory', 'Raise any dot by its number', 'Write your first three letters'],
        blocks: [
          {
            type: 'p',
            text: 'Every braille character lives in a cell: six dot positions arranged in two columns of three, like the six on a domino. Some dots are raised and some are flat. Which ones are raised tells you the character.',
          },
          {
            type: 'p',
            text: 'The dots have numbers, and they never change. Down the left column are dots 1, 2 and 3, top to bottom. Down the right column are dots 4, 5 and 6. Everyone who knows braille describes characters this way, so “dots 1 and 2” always means the same thing.',
          },
          {
            type: 'cells',
            title: 'One dot at a time',
            items: [1, 2, 3, 4, 5, 6].map((n) => ({
              print: `dot ${n}`,
              cells: [[n]],
              key: `dot:${n}`,
              note: n <= 3 ? 'left column' : 'right column',
            })),
          },
          {
            type: 'callout',
            tone: 'tip',
            title: 'A handy way to remember',
            text: 'Count down the left side (1, 2, 3), then hop over and count down the right side (4, 5, 6). Like reading two short columns in a newspaper.',
          },
          {
            type: 'p',
            text: 'Position is everything. A single raised dot in the top-left corner (dot 1) is the letter a. A single dot in the middle-left (dot 2) is a comma. Same dot, different place, different meaning.',
          },
          {
            type: 'write',
            title: 'Try it: raise the dots',
            items: [
              letter('a', 'Just dot 1, top left.'),
              letter('c', 'The whole top row: dots 1 and 4.'),
              letter('l', 'The whole left column: dots 1, 2 and 3.'),
            ],
          },
          {
            type: 'callout',
            tone: 'fact',
            title: 'Writing braille by hand',
            text: 'People write braille on a Perkins Brailler, a sturdy typewriter with one key per dot, or with a slate and stylus, pressing dots in from the back of the paper. With a slate, you write from right to left so the dots read left to right when you flip the page over. On this site, the keys F, D, S and J, K, L work like a Perkins: F D S are dots 1 2 3, and J K L are dots 4 5 6.',
          },
          {
            type: 'callout',
            tone: 'parent',
            title: 'Doing this with your child',
            text: 'An egg carton cut down to six cups makes a perfect giant cell. Drop in pom-poms or ping-pong balls to “raise” dots and quiz each other: “Can you make dot 5?”',
          },
          {
            type: 'quiz',
            questions: [
              {
                prompt: 'Which dot is at the top of the right-hand column?',
                options: ['Dot 2', 'Dot 3', 'Dot 4', 'Dot 6'],
                answer: 2,
                explain: 'The right column is 4, 5, 6 from top to bottom, so dot 4 is at the top.',
              },
              {
                prompt: 'What does this cell show?',
                cells: [[3, 6]],
                options: ['Dots 3 and 6', 'Dots 1 and 4', 'Dots 2 and 5'],
                answer: 0,
                explain: 'Both raised dots are on the bottom row: dot 3 on the left and dot 6 on the right.',
              },
            ],
          },
        ],
        practiceGameId: 'dot-builder',
        practiceLabel: 'Build cells in Dot Builder',
        practiceParams: { set: 'dots' },
        alsoTry: ['reflex-dots', 'explorer'],
      },
    ],
  },
  {
    id: 'alphabet',
    title: 'The alphabet',
    blurb: 'All twenty-six letters in three easy steps, then your first words.',
    lessons: [
      {
        slug: 'letters-a-j',
        title: 'Letters a to j',
        summary: 'The first ten letters, which use only the top four dots.',
        minutes: 8,
        goals: ['Recognize a through j', 'Write a through j', 'Spot the shapes that repeat'],
        blocks: [
          {
            type: 'p',
            text: 'Here is the good news: once you know these ten letters, the rest of the alphabet follows a pattern. Letters a through j use only the top four dots of the cell (dots 1, 2, 4 and 5). The bottom row stays empty.',
          },
          {
            type: 'cells',
            title: 'Letters a to j',
            items: [
              letter('a', 'One dot, top left.'),
              letter('b', 'Two dots straight down.'),
              letter('c', 'Two dots straight across.'),
              letter('d', 'c, plus the dot below on the right.'),
              letter('e', 'A little diagonal, top left to middle right.'),
              letter('f', 'c, plus the dot below on the left.'),
              letter('g', 'All four top dots: a square.'),
              letter('h', 'b, plus the middle-right dot.'),
              letter('i', 'The other diagonal, starting on dot 2.'),
              letter('j', 'i, plus the middle-right dot.'),
            ],
          },
          {
            type: 'callout',
            tone: 'tip',
            title: 'Look for the shapes',
            text: 'd, f, h and j are the same three-dot corner, turned four different ways. e and i are mirror-image diagonals. Seeing these families makes the letters much easier to tell apart.',
          },
          {
            type: 'p',
            text: 'Notice that i and j are the only letters here without dot 1. If a top-four cell has no dot in the top-left corner, it is almost certainly i or j.',
          },
          { type: 'write', title: 'Try it: write each letter', items: letters('abcdefghij') },
          { type: 'read', title: 'Now read them', items: letters('bdfgehjcai'), pool: letters('abcdefghij') },
          { type: 'example', text: 'bad', caption: 'You can already read real words: “bad”.' },
          { type: 'example', text: 'face', caption: '“face”, four cells.' },
          {
            type: 'callout',
            tone: 'parent',
            title: 'Doing this with your child',
            text: 'Pick one letter a day and hunt for it together: on a cereal box, a street sign, in their name. Then make it in braille with stickers, buttons, or dots of glue.',
          },
        ],
        practiceGameId: 'letter-race',
        practiceLabel: 'Race through a to j in Letter Race',
        practiceParams: { set: 'a-j' },
        alsoTry: ['dot-builder', 'bingo'],
      },
      {
        slug: 'letters-k-t',
        title: 'Letters k to t',
        summary: 'The next ten letters: a to j again, plus one extra dot.',
        minutes: 7,
        goals: ['Explain how k to t relate to a to j', 'Recognize and write k through t'],
        blocks: [
          {
            type: 'p',
            text: 'This is the clever part of Louis Braille’s design. The letters k through t are exactly a through j, with dot 3 added in the bottom-left corner. k is a plus dot 3. l is b plus dot 3. All the way to t, which is j plus dot 3.',
          },
          {
            type: 'cells',
            title: 'Letters k to t (each is the letter above it plus dot 3)',
            items: [
              letter('k', 'a + dot 3'),
              letter('l', 'b + dot 3'),
              letter('m', 'c + dot 3'),
              letter('n', 'd + dot 3'),
              letter('o', 'e + dot 3'),
              letter('p', 'f + dot 3'),
              letter('q', 'g + dot 3'),
              letter('r', 'h + dot 3'),
              letter('s', 'i + dot 3'),
              letter('t', 'j + dot 3'),
            ],
          },
          {
            type: 'callout',
            tone: 'tip',
            title: 'A quick trick for reading',
            text: 'Cover the bottom row with your finger. Whatever letter the top four dots make, count ten letters on: a becomes k, e becomes o, j becomes t.',
          },
          { type: 'write', title: 'Try it: write each letter', items: letters('klmnopqrst') },
          { type: 'read', title: 'Now read them', items: letters('mopsktrnql'), pool: letters('abcdefghijklmnopqrst') },
          { type: 'example', text: 'milk', caption: '“milk”' },
          { type: 'example', text: 'garden', caption: '“garden”, using letters from both groups.' },
        ],
        practiceGameId: 'letter-race',
        practiceLabel: 'Race through k to t in Letter Race',
        practiceParams: { set: 'k-t' },
        alsoTry: ['speedmatch', 'sequence'],
      },
      {
        slug: 'letters-u-z',
        title: 'Letters u to z',
        summary: 'The last six letters, and why w is the odd one out.',
        minutes: 6,
        goals: ['Recognize and write u, v, w, x, y and z', 'Remember why w is different'],
        blocks: [
          {
            type: 'p',
            text: 'The pattern continues one more step. u, v, x, y and z are a, b, c, d and e with both bottom dots added: dot 3 and dot 6.',
          },
          {
            type: 'cells',
            title: 'Letters u to z',
            items: [
              letter('u', 'a + dots 3 and 6'),
              letter('v', 'b + dots 3 and 6'),
              letter('x', 'c + dots 3 and 6'),
              letter('y', 'd + dots 3 and 6'),
              letter('z', 'e + dots 3 and 6'),
              letter('w', 'The exception: j + dot 6'),
            ],
          },
          {
            type: 'p',
            text: 'And w? The letter w was not used in French when Louis Braille designed his code, so it was not part of the original pattern. It was added later and simply fills a gap. Think of it as j with dot 6 added.',
          },
          { type: 'write', title: 'Try it: write each letter', items: letters('uvwxyz') },
          {
            type: 'read',
            title: 'Read the whole alphabet',
            items: letters('wyzuvx'),
            pool: letters('abcdefghijklmnopqrstuvwxyz'),
          },
          { type: 'example', text: 'zebra', caption: '“zebra”' },
          {
            type: 'callout',
            tone: 'kid',
            title: 'You know the whole alphabet!',
            text: 'That is all twenty-six letters. Celebrate with a round of Letter Race, or write your name in braille.',
          },
        ],
        practiceGameId: 'letter-race',
        practiceLabel: 'Race the whole alphabet',
        practiceParams: { set: 'a-z' },
        alsoTry: ['memorymatch', 'rain', 'dot-quest'],
      },
      {
        slug: 'first-words',
        title: 'Reading your first words',
        summary: 'Put letters together and read real words, one cell at a time.',
        minutes: 6,
        goals: ['Read short words left to right', 'Know what a space looks like in braille'],
        blocks: [
          {
            type: 'p',
            text: 'Braille words are read just like print: left to right, one cell after another. A space between words is simply an empty cell. Start each word by finding its first letter, then move along.',
          },
          { type: 'example', text: 'cat', caption: '“cat”' },
          { type: 'example', text: 'red fox', caption: '“red fox”: the gap in the middle is an empty cell, a space.' },
          {
            type: 'callout',
            tone: 'tip',
            title: 'How braille readers do it',
            text: 'Fluent readers keep both hands on the line, gliding lightly. They do not press hard or rub up and down. For now you are reading by sight, and that is fine. Try covering the print and sounding out each cell.',
          },
          {
            type: 'p',
            text: 'A heads-up for later: in most real books, very common words are shortened. “can” is often written as just the letter c. You will learn these shortcuts in lesson 10. For now, every word is spelled out in full.',
          },
          {
            type: 'quiz',
            questions: [
              {
                prompt: 'What does this word say?',
                cells: [LETTERS.d, LETTERS.o, LETTERS.g],
                options: ['dig', 'dog', 'log', 'fog'],
                answer: 1,
                explain: 'd (dots 1 4 5), o (dots 1 3 5), g (dots 1 2 4 5).',
              },
              {
                prompt: 'What does this word say?',
                cells: [LETTERS.s, LETTERS.u, LETTERS.n],
                options: ['sun', 'sum', 'run', 'fun'],
                answer: 0,
                explain: 's (dots 2 3 4), u (dots 1 3 6), n (dots 1 3 4 5).',
              },
            ],
          },
          {
            type: 'callout',
            tone: 'parent',
            title: 'Doing this with your child',
            text: 'Write your child’s name in braille and stick it on their door or cubby. Names are the most exciting first words there are.',
          },
        ],
        practiceGameId: 'word-decoder',
        practiceLabel: 'Read words in Word Decoder',
        practiceParams: { level: 'a-z' },
        alsoTry: ['hangman', 'wordgame'],
      },
    ],
  },
  {
    id: 'signs',
    title: 'Numbers, punctuation and capitals',
    blurb: 'The little signals that turn letters into numbers, sentences and names.',
    lessons: [
      {
        slug: 'numbers',
        title: 'Numbers',
        summary: 'The number sign, and how the letters a to j double as digits.',
        minutes: 7,
        goals: ['Recognize the number sign', 'Read and write the digits 0 to 9', 'Read numbers with several digits'],
        blocks: [
          {
            type: 'p',
            text: 'Braille does not have separate shapes for digits. Instead it borrows the first ten letters and puts a number sign in front. The number sign (dots 3, 4, 5 and 6) says: “the next cells are numbers.” Then a means 1, b means 2, and so on, with j meaning 0.',
          },
          { type: 'cells', title: 'The number sign', items: [indicator('numeric', 'number sign', 'Dots 3, 4, 5, 6')] },
          {
            type: 'cells',
            title: 'Digits (each shown with its number sign)',
            items: [
              digit('1', 'like a'),
              digit('2', 'like b'),
              digit('3', 'like c'),
              digit('4', 'like d'),
              digit('5', 'like e'),
              digit('6', 'like f'),
              digit('7', 'like g'),
              digit('8', 'like h'),
              digit('9', 'like i'),
              digit('0', 'like j'),
            ],
          },
          {
            type: 'p',
            text: 'One number sign covers a whole number, however many digits it has. So 25 is the number sign, then b, then e. You do not repeat the sign before every digit.',
          },
          { type: 'example', text: '25', caption: '25: number sign, b, e.' },
          { type: 'example', text: '100', caption: '100: number sign, a, j, j.' },
          { type: 'write', title: 'Try it: write these numbers', items: [digit('3'), digit('7'), digit('0')] },
          {
            type: 'callout',
            tone: 'fact',
            title: 'A note about math',
            text: 'For math, many US students also learn Nemeth Code, where digits are written lower in the cell. You do not need it for everyday reading. If you are curious, the Number Sense game uses Nemeth.',
          },
          {
            type: 'quiz',
            questions: [
              {
                prompt: 'What number is this?',
                cells: [INDICATORS.numeric.cells[0], LETTERS.d, LETTERS.b],
                options: ['42', '24', '45', 'db'],
                answer: 0,
                explain: 'Number sign, then d (4) and b (2): 42.',
              },
            ],
          },
        ],
        practiceGameId: 'word-decoder',
        practiceLabel: 'Read numbers in Word Decoder',
        practiceParams: { level: 'numbers' },
        alsoTry: ['number-sense'],
      },
      {
        slug: 'punctuation',
        title: 'Punctuation',
        summary: 'Periods, commas, question marks and more, mostly low in the cell.',
        minutes: 7,
        goals: ['Recognize the six most common punctuation marks', 'Read a short sentence with punctuation'],
        blocks: [
          {
            type: 'p',
            text: 'Most punctuation marks live in the lower part of the cell, below where the top dots of the letters sit. That makes them easy to tell apart from letters once you know where to look.',
          },
          {
            type: 'cells',
            title: 'The everyday marks',
            items: [
              punct('period', 'Dots 2 5 6'),
              punct('comma', 'Just dot 2'),
              punct('question', 'Dots 2 3 6'),
              punct('exclamation', 'Dots 2 3 5'),
              punct('apostrophe', 'Just dot 3'),
              punct('hyphen', 'Dots 3 6'),
            ],
          },
          { type: 'example', text: 'yes.', caption: '“yes.” with a period at the end.' },
          { type: 'example', text: 'why?', caption: '“why?”' },
          { type: 'example', text: 'it’s', caption: '“it’s”: the apostrophe is a single dot 3.' },
          {
            type: 'cells',
            title: 'Quotation marks',
            items: [punct('openQuote', 'Same cell as the question mark'), punct('closeQuote', 'Dots 3 5 6')],
          },
          {
            type: 'callout',
            tone: 'tip',
            title: 'Same cell, two jobs',
            text: 'The opening quotation mark and the question mark share a cell. Where it sits tells you which it is: before a word, it opens a quote; after a word, it asks a question.',
          },
          {
            type: 'write',
            title: 'Try it: write these marks',
            items: [punct('period'), punct('comma'), punct('question')],
          },
        ],
        practiceGameId: 'word-decoder',
        practiceLabel: 'Read punctuation in Word Decoder',
        practiceParams: { level: 'punctuation' },
      },
      {
        slug: 'capitals',
        title: 'Capital letters',
        summary: 'How one small dot turns a letter, or a whole word, into capitals.',
        minutes: 6,
        goals: ['Recognize the capital sign', 'Read capitalized names', 'Read a word in all capitals'],
        blocks: [
          {
            type: 'p',
            text: 'Braille has no separate capital shapes. Instead, a capital sign (just dot 6) goes in front of a letter to make it a capital. So “Mom” is the capital sign, then m, o, m.',
          },
          {
            type: 'cells',
            title: 'The capital signs',
            items: [
              indicator('capital', 'capital letter', 'Dot 6'),
              indicator('capitalWord', 'whole word in capitals', 'Dot 6, twice'),
            ],
          },
          { type: 'example', text: 'Mom', caption: '“Mom”: capital sign, then m o m.' },
          { type: 'example', text: 'USA', caption: '“USA”: two capital signs make the whole word capitals.' },
          {
            type: 'example',
            text: 'Zoe has 3 cats.',
            caption: 'Putting it together: a capital, a number and a period.',
          },
          {
            type: 'callout',
            tone: 'parent',
            title: 'Doing this with your child',
            text: 'Write family names on index cards with a capital sign at the start. Mix them up and take turns finding whose card is whose.',
          },
          {
            type: 'quiz',
            questions: [
              {
                prompt: 'What does this say?',
                cells: [INDICATORS.capital.cells[0], LETTERS.s, LETTERS.a, LETTERS.m],
                options: ['sam', 'Sam', 'SAM', 'Pam'],
                answer: 1,
                explain: 'One capital sign capitalizes only the next letter: Sam.',
              },
            ],
          },
        ],
        practiceGameId: 'word-decoder',
        practiceLabel: 'Read names and sentences in Word Decoder',
        practiceParams: { level: 'capitals' },
      },
    ],
  },
  {
    id: 'contractions',
    title: 'Contractions',
    blurb: 'The shortcuts that make real-world braille fast to read.',
    lessons: [
      {
        slug: 'first-contractions',
        title: 'Your first contractions',
        summary: 'One-cell shortcuts for everyday words like but, can, and, the and with.',
        minutes: 9,
        goals: ['Explain what a contraction is', 'Read the alphabet wordsigns', 'Read and, for, of, the and with'],
        blocks: [
          {
            type: 'p',
            text: 'Contractions are braille’s shortcuts. Common words and letter groups get a shorter form, which saves space (braille takes up a lot of paper) and makes reading faster. Most books, menus and signs use them, so they are worth learning early.',
          },
          { type: 'h', text: 'Letters that stand for whole words' },
          {
            type: 'p',
            text: 'The simplest shortcuts are called alphabetic wordsigns. When a letter stands all by itself, with a space on each side, it means a whole word. b alone means “but.” c alone means “can.” Inside a longer word, the letters go back to being plain letters.',
          },
          {
            type: 'cells',
            title: 'A few to start with',
            items: [
              contraction('but', 'alphabetic-wordsign', 'b standing alone'),
              contraction('can', 'alphabetic-wordsign', 'c standing alone'),
              contraction('do', 'alphabetic-wordsign', 'd standing alone'),
              contraction('go', 'alphabetic-wordsign', 'g standing alone'),
              contraction('have', 'alphabetic-wordsign', 'h standing alone'),
              contraction('like', 'alphabetic-wordsign', 'l standing alone'),
              contraction('you', 'alphabetic-wordsign', 'y standing alone'),
              contraction('it', 'alphabetic-wordsign', 'x standing alone'),
            ],
          },
          {
            type: 'example',
            text: 'you can do it',
            contracted: true,
            caption: '“you can do it” in contracted braille: four cells.',
          },
          {
            type: 'callout',
            tone: 'tip',
            title: 'Most are easy to guess',
            text: 'Most wordsigns start with their letter: b for but, c for can. A few are surprises worth memorizing: x means “it,” and z means “as.”',
          },
          { type: 'h', text: 'Five words with cells of their own' },
          {
            type: 'p',
            text: 'Five very common words get a special cell that is not a letter at all: and, for, of, the and with. These can be whole words, and they also appear inside longer words. “them” is the cell for “the” followed by m.',
          },
          {
            type: 'cells',
            title: 'The strong contractions',
            items: [contraction('and'), contraction('for'), contraction('of'), contraction('the'), contraction('with')],
          },
          { type: 'example', text: 'the cat and the dog', contracted: true, caption: '“the cat and the dog”' },
          {
            type: 'write',
            title: 'Try it: write these shortcuts',
            items: [contraction('the'), contraction('and'), contraction('for')],
          },
          {
            type: 'quiz',
            questions: [
              {
                prompt: 'Standing alone, what does this cell mean?',
                cells: [LETTERS.b],
                options: ['b', 'but', 'be', 'by'],
                answer: 1,
                explain: 'A letter standing alone is a wordsign. b alone means “but.”',
              },
              {
                prompt: 'Which word has its own special cell?',
                options: ['cat', 'the', 'run', 'big'],
                answer: 1,
                explain: '“the” is one of the five strong contractions: and, for, of, the, with.',
              },
            ],
          },
        ],
        practiceGameId: 'contraction-trainer',
        practiceLabel: 'Practise in the Contraction Trainer',
        practiceParams: { deck: 'first' },
        alsoTry: ['contraction-sprint'],
      },
      {
        slug: 'more-contractions',
        title: 'More shortcuts',
        summary: 'Letter groups like ch, sh, th and ing, plus words like his, was and were.',
        minutes: 9,
        goals: ['Read the most common groupsigns', 'Read a few lower wordsigns', 'Know how much more there is'],
        blocks: [
          {
            type: 'p',
            text: 'Some cells stand for groups of letters that turn up inside lots of words. These are called groupsigns, and they work anywhere in a word. “fish” is f, i, then a single cell for “sh.”',
          },
          {
            type: 'cells',
            title: 'Common groupsigns',
            items: [
              contraction('ch', 'strong-groupsign', 'as in “lunch”'),
              contraction('sh', 'strong-groupsign', 'as in “fish”'),
              contraction('th', 'strong-groupsign', 'as in “bath”'),
              contraction('wh', 'strong-groupsign', 'as in “whale”'),
              contraction('ou', 'strong-groupsign', 'as in “loud”'),
              contraction('st', 'strong-groupsign', 'as in “fast”'),
              contraction('ar', 'strong-groupsign', 'as in “car”'),
              contraction('er', 'strong-groupsign', 'as in “her”'),
              contraction('ing', 'strong-groupsign', 'as in “sing” (never at the start of a word)'),
            ],
          },
          { type: 'example', text: 'fish', contracted: true, caption: '“fish”: f, i, then the sh sign.' },
          {
            type: 'p',
            text: 'Several groupsigns double as whole words when they stand alone, just like the letter wordsigns. The ch sign alone means “child,” sh means “shall,” th means “this,” and wh means “which.”',
          },
          { type: 'example', text: 'this child can sing', contracted: true, caption: '“this child can sing”' },
          { type: 'h', text: 'Words written low in the cell' },
          {
            type: 'p',
            text: 'A handful of words use only the lower part of the cell. These are called lower wordsigns, and they only mean the word when they stand alone.',
          },
          {
            type: 'cells',
            title: 'Lower wordsigns',
            items: [
              contraction('his', 'lower-wordsign'),
              contraction('was', 'lower-wordsign'),
              contraction('were', 'lower-wordsign'),
              contraction('in', 'lower-wordsign'),
              contraction('be', 'lower-wordsign'),
              contraction('enough', 'lower-wordsign'),
            ],
          },
          { type: 'example', text: 'we were out in the rain', contracted: true, caption: '“we were out in the rain”' },
          {
            type: 'callout',
            tone: 'fact',
            title: 'How much more is there?',
            text: 'UEB has around 180 contractions and short forms in all, along with rules about when each one may be used. Nobody learns them in a week. Children usually pick them up over several years of school, a few at a time, and so can you.',
          },
          {
            type: 'write',
            title: 'Try it: write these groupsigns',
            items: [contraction('sh', 'strong-groupsign'), contraction('th', 'strong-groupsign'), contraction('ing')],
          },
        ],
        practiceGameId: 'contraction-trainer',
        practiceLabel: 'Practise in the Contraction Trainer',
        practiceParams: { deck: 'more' },
        alsoTry: ['sentence-decoder', 'contraction-sprint'],
      },
      {
        slug: 'next-steps',
        title: 'Where to go from here',
        summary: 'Celebrate what you have learned and choose your next step.',
        minutes: 4,
        goals: ['Know how to keep practising', 'Know your options for learning with a teacher'],
        blocks: [
          {
            type: 'p',
            text: 'Look how far you have come. You know how the cell works, the whole alphabet, numbers, punctuation, capitals, and your first contractions. That is the real foundation of braille, and it is more than most people ever learn.',
          },
          { type: 'example', text: 'well done!', caption: '“well done!”' },
          { type: 'h', text: 'Keep it fresh' },
          {
            type: 'list',
            items: [
              'A few minutes a day beats an hour once a week. Your streak on the games page will help.',
              'Word Decoder and the Contraction Trainer grow with you, from letters to real sentences.',
              'Label things at home: drawers, light switches, your child’s favorite cup.',
              'Ask your child’s Teacher of the Visually Impaired (TVI) which contractions they are working on, and learn those next.',
            ],
          },
          { type: 'h', text: 'Learn with Delaney' },
          {
            type: 'p',
            text: 'This site was made by Delaney Costello, a Teacher of the Visually Impaired with nine years of experience. Her remote courses give families live lessons, one-on-one reading practice and personal feedback on your writing. She also offers one-on-one sessions for braille, assistive technology and more.',
          },
          {
            type: 'callout',
            tone: 'parent',
            title: 'A note from Delaney',
            text: 'Every family I work with has its own story. Learning braille alongside your child is one of the most powerful things you can do, and you have already started.',
          },
        ],
        practiceGameId: 'word-decoder',
        practiceLabel: 'Read little sentences in Word Decoder',
        practiceParams: { level: 'sentences' },
        alsoTry: ['dot-quest', 'sentence-decoder'],
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
  return COURSE_MODULES.find((m) => m.lessons.includes(lesson));
}

export function getAdjacentLessons(slug: string): { prev: Lesson | null; next: Lesson | null } {
  const idx = getLessonIndex(slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ALL_LESSONS[idx - 1] : null,
    next: idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null,
  };
}

/** Old lesson URLs (before the October 2026 redesign) → new slugs. Used for 301 redirects. */
export const LEGACY_LESSON_REDIRECTS: Record<string, string> = {
  'reading-words': 'first-words',
  'alphabet-wordsigns': 'first-contractions',
  'strong-contractions': 'first-contractions',
  'strong-groupsigns': 'more-contractions',
  'lower-groupsigns': 'more-contractions',
  'lower-wordsigns': 'more-contractions',
  'reading-sentences': 'more-contractions',
  'wrap-up': 'next-steps',
};

/** "dots 1 2" for a legacy grid pattern (kept for older components). */
export function describeDots(pattern: number[]): string {
  return describe(fromGrid(pattern));
}

/** Print text the lessons render as braille (checked against liblouis via lib/ueb-corpus.ts). */
export const LESSON_BRAILLE_TEXT: { uncontracted: string[]; contracted: string[] } = {
  uncontracted: ALL_LESSONS.flatMap((l) =>
    l.blocks.flatMap((b) => (b.type === 'example' && !b.contracted ? [b.text] : [])),
  ),
  contracted: ALL_LESSONS.flatMap((l) =>
    l.blocks.flatMap((b) => (b.type === 'example' && b.contracted ? [b.text] : [])),
  ),
};
