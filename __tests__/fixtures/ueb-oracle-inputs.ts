/**
 * Inputs sent to liblouis by scripts/generate-ueb-oracle.ts. The tests in __tests__/lib/ueb.test.ts
 * compare our cells against liblouis's translation of each of these strings.
 */

/** Punctuation id → a short print sample that exercises it (uncontracted). */
export const PUNCTUATION_SAMPLES: Record<string, string> = {
  period: 'a.',
  comma: 'a, b',
  question: 'a?',
  exclamation: 'a!',
  apostrophe: 'it’s',
  hyphen: 'a-b',
  colon: 'a: b',
  semicolon: 'a; b',
  openQuote: '“a',
  closeQuote: 'a”',
  dash: 'a–b',
  openParen: '(a',
  closeParen: 'a)',
  slash: 'a/b',
  ampersand: 'a & b',
};

/**
 * Groupsign samples: a word, split into the parts we expect liblouis (contracted, grade 2)
 * to produce. Each part is either a single letter or the contraction under test.
 * Key = `${kind}:${text}`.
 */
export const GROUPSIGN_SAMPLES: Record<string, { word: string; parts: string[] }> = {
  'strong-contraction:and': { word: 'sand', parts: ['s', 'and'] },
  'strong-contraction:for': { word: 'forget', parts: ['for', 'g', 'e', 't'] },
  'strong-contraction:of': { word: 'often', parts: ['of', 't', 'en'] },
  'strong-contraction:the': { word: 'them', parts: ['the', 'm'] },
  'strong-contraction:with': { word: 'withhold', parts: ['with', 'h', 'o', 'l', 'd'] },
  'strong-groupsign:ch': { word: 'rich', parts: ['r', 'i', 'ch'] },
  'strong-groupsign:gh': { word: 'ghost', parts: ['gh', 'o', 'st'] },
  'strong-groupsign:sh': { word: 'fish', parts: ['f', 'i', 'sh'] },
  'strong-groupsign:th': { word: 'math', parts: ['m', 'a', 'th'] },
  'strong-groupsign:wh': { word: 'whale', parts: ['wh', 'a', 'l', 'e'] },
  'strong-groupsign:ed': { word: 'red', parts: ['r', 'ed'] },
  'strong-groupsign:er': { word: 'her', parts: ['h', 'er'] },
  'strong-groupsign:ou': { word: 'loud', parts: ['l', 'ou', 'd'] },
  'strong-groupsign:ow': { word: 'cow', parts: ['c', 'ow'] },
  'strong-groupsign:st': { word: 'fast', parts: ['f', 'a', 'st'] },
  'strong-groupsign:ar': { word: 'car', parts: ['c', 'ar'] },
  'strong-groupsign:ing': { word: 'sing', parts: ['s', 'ing'] },
  'lower-groupsign:ea': { word: 'head', parts: ['h', 'ea', 'd'] },
  'lower-groupsign:bb': { word: 'rabbit', parts: ['r', 'a', 'bb', 'i', 't'] },
  'lower-groupsign:cc': { word: 'accept', parts: ['a', 'cc', 'e', 'p', 't'] },
  'lower-groupsign:ff': { word: 'muffin', parts: ['m', 'u', 'ff', 'in'] },
  'lower-groupsign:gg': { word: 'bigger', parts: ['b', 'i', 'gg', 'er'] },
  'lower-groupsign:be': { word: 'become', parts: ['be', 'c', 'o', 'm', 'e'] },
  'lower-groupsign:con': { word: 'concert', parts: ['con', 'c', 'er', 't'] },
  'lower-groupsign:dis': { word: 'dismay', parts: ['dis', 'm', 'a', 'y'] },
  'lower-groupsign:en': { word: 'tent', parts: ['t', 'en', 't'] },
  'lower-groupsign:in': { word: 'pint', parts: ['p', 'in', 't'] },
};

/** Mixed-text samples for the uncontracted transcriber (capitals, numbers, punctuation). */
export const TRANSCRIBE_SAMPLES: string[] = [
  'Hello, world!',
  'HELLO, world',
  'I am 7.',
  'Mom and Dad',
  'Is it red?',
  'We have 12 eggs.',
  'Room 4b',
  'Room 4B',
  '3.5',
  '1,000',
  '2024',
  '"Hi," she said.',
  '(yes)',
  'a/b',
  'well-known',
  'Go!',
  'wait: now; ok',
  'it’s',
  'one–two',
  'NASA',
  'USA today',
  'McDonald',
  'Zoe has 3 cats.',
  'The dog ran.',
  'Can you see me?',
  'Wow!',
];
