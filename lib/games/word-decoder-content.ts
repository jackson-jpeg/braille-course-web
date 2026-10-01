/**
 * Word Decoder levels — short print items shown in uncontracted braille, in the order the
 * beginner track teaches them. Every item is checked against liblouis via lib/ueb-corpus.ts.
 */

export interface DecoderItem {
  /** Exact print text; the braille is transcribed from this. */
  text: string;
  /** Optional friendly hint shown after a wrong guess. */
  hint?: string;
}

export interface DecoderLevel {
  id: string;
  title: string;
  /** What the learner needs to know first (lesson slug). */
  lesson: string;
  blurb: string;
  items: DecoderItem[];
}

export const WORD_DECODER_LEVELS: DecoderLevel[] = [
  {
    id: 'a-j',
    title: 'Words from A to J',
    lesson: 'letters-a-j',
    blurb: 'Every word here uses only the first ten letters.',
    items: [
      'bad',
      'bag',
      'bed',
      'beef',
      'cab',
      'cafe',
      'cage',
      'dad',
      'deaf',
      'egg',
      'face',
      'fade',
      'fed',
      'fig',
      'hide',
      'jab',
      'jig',
      'ice',
      'aged',
      'badge',
      'beach',
      'chief',
      'head',
      'idea',
    ].map((text) => ({ text })),
  },
  {
    id: 'a-t',
    title: 'Words from A to T',
    lesson: 'letters-k-t',
    blurb: 'Now dot 3 joins in: K through T.',
    items: [
      'kite',
      'lamp',
      'milk',
      'nest',
      'pond',
      'rock',
      'sock',
      'tent',
      'kitten',
      'lemon',
      'melt',
      'pig',
      'ring',
      'star',
      'frog',
      'book',
      'tomato',
      'garden',
      'pencil',
      'rabbit',
    ].map((text) => ({ text })),
  },
  {
    id: 'a-z',
    title: 'The whole alphabet',
    lesson: 'letters-u-z',
    blurb: 'Every letter is fair game, including the famous W.',
    items: [
      'sun',
      'van',
      'web',
      'fox',
      'yes',
      'zoo',
      'quiz',
      'jump',
      'wave',
      'yellow',
      'zebra',
      'puzzle',
      'window',
      'cozy',
      'buzz',
      'luck',
      'very',
      'wax',
      'yarn',
      'zip',
    ].map((text) => ({ text })),
  },
  {
    id: 'numbers',
    title: 'Numbers',
    lesson: 'numbers',
    blurb: 'Look for the number sign, then read A to J as 1 to 0.',
    items: ['1', '3', '5', '7', '9', '10', '12', '20', '25', '42', '50', '100', '365', '808', '1,000'].map((text) => ({
      text,
      hint: 'After the number sign, a = 1, b = 2 … j = 0.',
    })),
  },
  {
    id: 'punctuation',
    title: 'Punctuation',
    lesson: 'punctuation',
    blurb: 'Periods, commas, question marks and friends.',
    items: ['hi!', 'yes.', 'why?', 'wow!', 'oh, ok.', 'it’s', 'well-done', 'ready? go!', 'stop.', 'red, blue'].map(
      (text) => ({ text }),
    ),
  },
  {
    id: 'capitals',
    title: 'Capitals',
    lesson: 'capitals',
    blurb: 'A capital sign makes the next letter a capital. Two make the whole word capitals.',
    items: ['Mom', 'Dad', 'Sam', 'Ava', 'Zoe', 'Max', 'Leo', 'I', 'Ohio', 'Texas', 'OK', 'USA', 'NASA', 'Ben'].map(
      (text) => ({ text }),
    ),
  },
  {
    id: 'sentences',
    title: 'Little sentences',
    lesson: 'capitals',
    blurb: 'Put it all together: capitals, numbers and punctuation.',
    items: [
      'I am 7.',
      'Zoe has 3 cats.',
      'We have 12 eggs.',
      'Is it red?',
      'The dog ran.',
      'Can you see me?',
      'Max is 10!',
      'Hi, Mom!',
      'I like jam.',
      'Go, Leo, go!',
    ].map((text) => ({ text })),
  },
];
