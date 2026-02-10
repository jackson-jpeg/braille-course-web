/**
 * Generate sentences using Grade 2 braille contractions for the Sentence Decoder game.
 *
 * Contractions in {braces} are rendered as single-cell contracted braille.
 * Everything else is spelled letter-by-letter.
 *
 * UEB rules: wordsigns and strong contractions used only as standalone words.
 */

import { contractedBrailleEntries, type ContractionEntry } from './contracted-braille-map';
import { brailleMap } from './braille-map';

export interface SentenceData {
  /** The plain English sentence */
  plainText: string;
  /** Array of tokens: each is a braille cell or space */
  brailleTokens: BrailleToken[];
}

export interface BrailleToken {
  type: 'contraction' | 'letter' | 'space' | 'number-indicator';
  value: string;
  pattern: number[];
  /** The English text this represents */
  meaning: string;
}

// ── Sentence templates ──
// Words in {braces} are standalone wordsigns / strong contractions.
// Other words are spelled letter-by-letter.
const TEMPLATES: { template: string; words: string[] }[] = [
  // 3-word sentences (beginner)
  { template: '{the} cat sat', words: ['the'] },
  { template: '{you} {can} run', words: ['you', 'can'] },
  { template: 'I {have} fun', words: ['have'] },
  { template: '{the} dog ran', words: ['the'] },
  { template: '{not} {so} bad', words: ['not', 'so'] },
  { template: 'I {go} home', words: ['go'] },
  { template: '{but} I stay', words: ['but'] },
  { template: '{the} sun set', words: ['the'] },
  { template: 'he {can} sing', words: ['can'] },
  { template: 'I {like} pie', words: ['like'] },
  { template: '{that} is fun', words: ['that'] },
  { template: '{just} be kind', words: ['just'] },

  // 4-word sentences
  { template: '{the} cat is big', words: ['the'] },
  { template: '{you} {can} {do} {it}', words: ['you', 'can', 'do', 'it'] },
  { template: 'I {have} a pen', words: ['have'] },
  { template: '{the} bird {can} fly', words: ['the', 'can'] },
  { template: 'we {like} {the} park', words: ['like', 'the'] },
  { template: '{the} sun is hot', words: ['the'] },
  { template: 'she {will} be fine', words: ['will'] },
  { template: '{people} {like} {the} rain', words: ['people', 'like', 'the'] },
  { template: 'I {just} got home', words: ['just'] },
  { template: 'he ran {so} fast', words: ['so'] },
  { template: 'I {do} {not} know', words: ['do', 'not'] },
  { template: '{the} cat got out', words: ['the'] },
  { template: '{but} {the} dog sat', words: ['but', 'the'] },
  { template: 'we {go} {for} walks', words: ['go', 'for'] },
  { template: '{every} day I run', words: ['every'] },
  { template: '{have} a nice day', words: ['have'] },

  // 5-word sentences
  { template: '{the} cat is on {the} mat', words: ['the', 'the'] },
  { template: '{the} dog {and} cat play', words: ['the', 'and'] },
  { template: 'we {will} {go} {for} {it}', words: ['will', 'go', 'for', 'it'] },
  { template: 'she {can} sing {very} well', words: ['can', 'very'] },
  { template: '{that} is {not} {so} hard', words: ['that', 'not', 'so'] },
  { template: 'we {have} {more} time now', words: ['have', 'more'] },
  { template: 'I {just} got {from} work', words: ['just', 'from'] },
  { template: '{the} rain {will} stop soon', words: ['the', 'will'] },
  { template: '{you} {do} {not} know yet', words: ['you', 'do', 'not'] },
  { template: 'I {like} {the} red hat', words: ['like', 'the'] },
  { template: '{every} kid {can} read well', words: ['every', 'can'] },
  { template: '{people} {go} {for} a walk', words: ['people', 'go', 'for'] },
  { template: '{the} ball went {so} far', words: ['the', 'so'] },

  // 6-word sentences
  { template: '{the} bird {with} {the} red wing', words: ['the', 'with', 'the'] },
  { template: '{you} {do} {not} {have} a pen', words: ['you', 'do', 'not', 'have'] },
  { template: '{every} child {can} learn {from} {us}', words: ['every', 'can', 'from', 'us'] },
  { template: 'I {will} {go} {with} {you} now', words: ['will', 'go', 'with', 'you'] },
  { template: '{but} {the} game is {so} fun', words: ['but', 'the', 'so'] },
  { template: '{the} fish swim {for} {the} food', words: ['the', 'for', 'the'] },
  { template: '{you} {and} I {can} play ball', words: ['you', 'and', 'can'] },
  { template: 'she {will} {rather} stay {with} {us}', words: ['will', 'rather', 'with', 'us'] },
  { template: '{that} cup {of} tea is nice', words: ['that', 'of'] },

  // 7-word sentences
  { template: '{you} {and} I {will} {go} {for} {it}', words: ['you', 'and', 'will', 'go', 'for', 'it'] },
  { template: 'cat {and} dog play in {the} yard', words: ['and', 'the'] },
  { template: '{people} {like} {the} park {but} {not} rain', words: ['people', 'like', 'the', 'but', 'not'] },
  { template: 'I {have} {just} {the} thing {for} {you}', words: ['have', 'just', 'the', 'for', 'you'] },
  { template: 'she is {very} good {with} {every} child here', words: ['very', 'with', 'every'] },
  { template: '{rather} {not} {go} now {but} I {will}', words: ['rather', 'not', 'go', 'but', 'will'] },
];

// Build contraction lookup
const contractionLookup = new Map<string, ContractionEntry>();
for (const entry of contractedBrailleEntries) {
  contractionLookup.set(entry.label.toLowerCase(), entry);
}

/** Convert a sentence template to braille tokens */
function templateToTokens(template: string): BrailleToken[] {
  const tokens: BrailleToken[] = [];
  const parts = template.split(' ');

  for (let i = 0; i < parts.length; i++) {
    if (i > 0) {
      tokens.push({ type: 'space', value: ' ', pattern: [], meaning: ' ' });
    }

    const part = parts[i];
    // Check if this is a contraction marker
    const match = part.match(/^\{(.+)\}$/);
    if (match) {
      const word = match[1].toLowerCase();
      const entry = contractionLookup.get(word);
      if (entry) {
        tokens.push({
          type: 'contraction',
          value: entry.label,
          pattern: entry.pattern,
          meaning: word,
        });
        continue;
      }
    }

    // Regular word — spell out letter by letter
    const cleanWord = part.replace(/[{}]/g, '');
    for (let j = 0; j < cleanWord.length; j++) {
      const ch = cleanWord[j].toUpperCase();
      const pattern = brailleMap[ch] || [0, 0, 0, 0, 0, 0];
      tokens.push({
        type: 'letter',
        value: ch,
        pattern,
        meaning: cleanWord[j],
      });
    }
  }

  return tokens;
}

/** Get a random sentence for the given difficulty */
export function getRandomSentence(maxWords: number = 5): SentenceData {
  // Filter templates by word count
  const eligible = TEMPLATES.filter((t) => {
    const wordCount = t.template.split(' ').length;
    return wordCount <= maxWords;
  });

  if (eligible.length === 0) {
    const t = TEMPLATES[0];
    return {
      plainText: t.template.replace(/[{}]/g, ''),
      brailleTokens: templateToTokens(t.template),
    };
  }

  const chosen = eligible[Math.floor(Math.random() * eligible.length)];
  return {
    plainText: chosen.template.replace(/[{}]/g, ''),
    brailleTokens: templateToTokens(chosen.template),
  };
}
