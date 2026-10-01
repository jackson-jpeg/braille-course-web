/**
 * Every practice game, in one list. Routes (/games/[slug]), the games hub, lesson links and
 * "what to practice next" are all driven from here.
 */

import type { GameId } from '@/lib/progress-types';

export type Skill = 'cell' | 'letters' | 'words' | 'numbers' | 'punctuation' | 'capitals' | 'contractions';

export const SKILL_LABELS: Record<Skill, string> = {
  cell: 'The cell',
  letters: 'Letters',
  words: 'Words',
  numbers: 'Numbers',
  punctuation: 'Punctuation',
  capitals: 'Capitals',
  contractions: 'Contractions',
};

export interface GameInfo {
  id: GameId;
  slug: string;
  title: string;
  /** One line for tiles. */
  tagline: string;
  /** Two or three sentences for the game page intro and meta description. */
  description: string;
  skills: Skill[];
  /** Who it's best for. */
  audience: 'everyone' | 'kids' | 'grown-ups';
  /** Lesson slugs this game practices (links both ways). */
  lessons: string[];
  /** Typical round length in minutes. */
  minutes: number;
  /** Four-letter word spelled in braille on its tile (decorative). */
  emblem: string;
  isNew?: boolean;
  /** Keyboard summary shown on the game page. */
  keys: string[];
}

export const GAMES: GameInfo[] = [
  {
    id: 'dot-quest',
    slug: 'dot-quest',
    title: 'Dot Quest',
    tagline: 'A kid-sized adventure: build cells, earn stars, collect stickers.',
    description:
      'Travel island to island and solve short braille puzzles to earn stars and collect a sticker for every letter. Built for kids, with big buttons and no timers.',
    skills: ['cell', 'letters', 'words'],
    audience: 'kids',
    lessons: ['the-braille-cell', 'letters-a-j', 'letters-k-t', 'letters-u-z'],
    minutes: 5,
    emblem: 'fun',
    isNew: true,
    keys: ['Tab and Enter to choose', 'Number keys 1–6 or F D S J K L to raise dots', 'Enter to check'],
  },
  {
    id: 'letter-race',
    slug: 'letter-race',
    title: 'Letter Race',
    tagline: 'See a cell, pick the letter — beat the clock.',
    description:
      'A cell appears; choose its letter from four options before time runs out. Pick a letter set to match your lesson, or race the whole alphabet. Relaxed mode turns the timer off.',
    skills: ['letters'],
    audience: 'everyone',
    lessons: ['letters-a-j', 'letters-k-t', 'letters-u-z'],
    minutes: 2,
    emblem: 'race',
    isNew: true,
    keys: ['1–4 to choose an answer', 'Or type the letter', 'Enter to start'],
  },
  {
    id: 'dot-builder',
    slug: 'dot-builder',
    title: 'Dot Builder',
    tagline: 'Tap the dots to build each letter or word.',
    description:
      'You see a letter or a short word; raise the right dots to write it, one cell at a time. Practise relaxed, or switch on the timer for a challenge.',
    skills: ['cell', 'letters', 'words'],
    audience: 'everyone',
    lessons: ['the-braille-cell', 'letters-a-j', 'letters-k-t', 'letters-u-z'],
    minutes: 3,
    emblem: 'make',
    isNew: true,
    keys: ['1–6 or F D S J K L toggle dots', 'Enter to check', 'Backspace clears', 'H for Show me after two tries'],
  },
  {
    id: 'word-decoder',
    slug: 'word-decoder',
    title: 'Word Decoder',
    tagline: 'Read real braille words, then numbers, capitals and punctuation.',
    description:
      'Read a short braille word or sentence and type what it says. Levels follow the lessons: letters A–J, the full alphabet, numbers with the number sign, punctuation and capitals.',
    skills: ['words', 'numbers', 'punctuation', 'capitals'],
    audience: 'everyone',
    lessons: ['letters-a-j', 'letters-k-t', 'letters-u-z', 'numbers', 'punctuation', 'capitals'],
    minutes: 4,
    emblem: 'read',
    isNew: true,
    keys: ['Type your answer', 'Enter to check', 'Hint button shows one cell at a time'],
  },
  {
    id: 'contraction-trainer',
    slug: 'contraction-trainer',
    title: 'Contraction Trainer',
    tagline: 'Learn the most common UEB contractions with smart review.',
    description:
      'Flashcard-style practice for the shortcuts that make braille fast: wordsigns like "but" and "can", plus and, for, of, the, with and more. Cards you miss come back sooner.',
    skills: ['contractions'],
    audience: 'grown-ups',
    lessons: ['first-contractions', 'more-contractions'],
    minutes: 4,
    emblem: 'the',
    isNew: true,
    keys: ['1–4 to choose an answer', 'Space or Enter for the next card'],
  },
  {
    id: 'explorer',
    slug: 'dot-explorer',
    title: 'Dot Explorer',
    tagline: 'Raise any dots and discover what they spell.',
    description:
      'A free-play cell: raise and lower dots and see which letter, number or contraction you have made. Perfect for curious first steps.',
    skills: ['cell', 'letters', 'contractions'],
    audience: 'everyone',
    lessons: ['the-braille-cell', 'letters-a-j'],
    minutes: 2,
    emblem: 'dots',
    keys: ['1–6 or F D S J K L toggle dots', 'Escape or Backspace clears', 'N for a letter challenge'],
  },
  {
    id: 'speedmatch',
    slug: 'speed-match',
    title: 'Speed Match',
    tagline: 'Match letters and cells as fast as you can.',
    description: 'Quick-fire matching between print letters and braille cells. Build streaks to raise your score.',
    skills: ['letters'],
    audience: 'everyone',
    lessons: ['letters-k-t'],
    minutes: 2,
    emblem: 'fast',
    keys: [
      'Enter to start',
      '1–4 (1–6 on Advanced) to choose',
      'Or type the letter',
      'Enter for the next question after a miss',
    ],
  },
  {
    id: 'memorymatch',
    slug: 'memory-match',
    title: 'Memory Match',
    tagline: 'Flip cards to pair each letter with its cell.',
    description: 'A classic memory game: find the print letter and its braille cell. Fewer moves earns a better score.',
    skills: ['letters'],
    audience: 'kids',
    lessons: ['letters-u-z'],
    minutes: 3,
    emblem: 'pair',
    keys: ['Enter to start', 'Arrow keys, Home and End to move', 'Enter or Space to flip'],
  },
  {
    id: 'wordgame',
    slug: 'word-game',
    title: 'Word Game',
    tagline: 'Guess the hidden four-letter word, braille style.',
    description:
      'Guess a four-letter word in six tries. Every guess shows in braille, with colours telling you which letters are right.',
    skills: ['words', 'letters'],
    audience: 'grown-ups',
    lessons: ['first-words'],
    minutes: 5,
    emblem: 'word',
    keys: ['Type letters', 'Enter to guess', 'Backspace to delete'],
  },
  {
    id: 'hangman',
    slug: 'hangman',
    title: 'Braille Hangman',
    tagline: 'Guess letters to reveal a braille word.',
    description:
      'Guess letters to fill in a hidden word shown in braille cells. Read the cells to spot the word early — you have a handful of lives, shown as raised dots.',
    skills: ['words', 'letters'],
    audience: 'everyone',
    lessons: ['first-words'],
    minutes: 4,
    emblem: 'word',
    keys: ['Enter to start', 'Type a letter to guess'],
  },
  {
    id: 'bingo',
    slug: 'bingo',
    title: 'Braille Bingo',
    tagline: 'Hear or see a letter, find its cell on your card.',
    description: 'Mark the braille cell that matches each called letter. Five in a row wins.',
    skills: ['letters'],
    audience: 'kids',
    lessons: ['letters-a-j', 'letters-k-t'],
    minutes: 4,
    emblem: 'bingo',
    keys: [
      'Enter to start',
      'Arrow keys to move around the card',
      'Enter or Space to mark',
      'N next letter · H hint · R repeat · P pause',
    ],
  },
  {
    id: 'rain',
    slug: 'braille-rain',
    title: 'Braille Rain',
    tagline: 'Catch falling cells by typing their letters.',
    description:
      'Braille cells drift down the screen. Type each letter before it lands, or switch to Relaxed and catch them at your own pace. Pause any time.',
    skills: ['letters'],
    audience: 'everyone',
    lessons: ['letters-u-z'],
    minutes: 3,
    emblem: 'rain',
    keys: ['Type the letter of each falling cell', 'Space or Esc to pause', 'Enter to start'],
  },
  {
    id: 'reflex-dots',
    slug: 'reflex-dots',
    title: 'Reflex Dots',
    tagline: 'Copy the pattern before it fades.',
    description:
      'A cell appears, then hides. Raise the same dots from memory. In Relaxed mode you choose when to hide it. Great for learning dot positions.',
    skills: ['cell'],
    audience: 'everyone',
    lessons: ['the-braille-cell'],
    minutes: 2,
    emblem: 'flash',
    keys: ['1–6 or F D S J K L toggle dots', 'Enter to check', 'Backspace clears'],
  },
  {
    id: 'sequence',
    slug: 'sequence',
    title: 'Sequence',
    tagline: 'Put braille letters back into alphabetical order.',
    description:
      'A handful of braille cells arrive jumbled. Read each one and swap them into a–z order. Cards are described by their dots, so it works by touch, sight or screen reader.',
    skills: ['letters'],
    audience: 'everyone',
    lessons: ['letters-a-j', 'letters-k-t'],
    minutes: 3,
    emblem: 'next',
    keys: ['Number keys pick a card, then another to swap', '← → move the picked card', 'Enter to check'],
  },
  {
    id: 'number-sense',
    slug: 'number-sense',
    title: 'Number Sense',
    tagline: 'Solve little sums written in Nemeth math braille.',
    description:
      'Read addition, subtraction and multiplication problems in Nemeth Code — the braille code many US students use for math — and pick the answer.',
    skills: ['numbers'],
    audience: 'grown-ups',
    lessons: ['numbers'],
    minutes: 3,
    emblem: 'math',
    keys: ['1–4 to choose an answer', 'Enter for the next problem'],
  },
  {
    id: 'contraction-sprint',
    slug: 'contraction-sprint',
    title: 'Contraction Sprint',
    tagline: 'Rapid-fire: name the contraction before time runs out.',
    description:
      'A fast-paced quiz on UEB contractions: correct answers add time, misses take it away. Prefer no clock? Relaxed mode gives you 20 questions at your own pace.',
    skills: ['contractions'],
    audience: 'grown-ups',
    lessons: ['first-contractions', 'more-contractions'],
    minutes: 2,
    emblem: 'zoom',
    keys: ['1–4 to choose', 'Enter to start, or for the next question in Relaxed'],
  },
  {
    id: 'sentence-decoder',
    slug: 'sentence-decoder',
    title: 'Sentence Decoder',
    tagline: 'Read whole sentences in contracted braille.',
    description: 'Read short sentences written in contracted (grade 2) UEB and type what they say.',
    skills: ['contractions', 'words'],
    audience: 'grown-ups',
    lessons: ['more-contractions'],
    minutes: 4,
    emblem: 'read',
    keys: ['Type your answer', 'Enter to check', 'H for a hint (outside the text box)'],
  },
];

export const GAME_BY_ID = new Map(GAMES.map((g) => [g.id, g]));
export const GAME_BY_SLUG = new Map(GAMES.map((g) => [g.slug, g]));

export function getGame(idOrSlug: string): GameInfo | undefined {
  return GAME_BY_SLUG.get(idOrSlug) ?? GAME_BY_ID.get(idOrSlug as GameId);
}

export function gameHref(id: GameId, params?: Record<string, string>): string {
  const g = GAME_BY_ID.get(id);
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  return `/games/${g?.slug ?? id}${qs}`;
}

/** Old single-page anchors (/games#wordgame) → new pages. */
export const LEGACY_GAME_ANCHORS: Record<string, string> = {
  wordgame: 'word-game',
  explorer: 'dot-explorer',
  hangman: 'hangman',
  speedmatch: 'speed-match',
  memorymatch: 'memory-match',
  'contraction-sprint': 'contraction-sprint',
  'number-sense': 'number-sense',
  'reflex-dots': 'reflex-dots',
  sequence: 'sequence',
  'sentence-decoder': 'sentence-decoder',
  bingo: 'bingo',
  rain: 'braille-rain',
};
