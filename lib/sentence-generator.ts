/**
 * Generate sentences using Grade 2 braille contractions for the Sentence Decoder game.
 */

import { contractedBrailleEntries, type ContractionEntry } from './contracted-braille-map';
import { brailleMap } from './braille-map';

export interface SentenceData {
  /** The plain English sentence */
  plainText: string;
  /** Array of tokens: each is either a ContractionEntry or a letter string */
  brailleTokens: BrailleToken[];
}

export interface BrailleToken {
  type: 'contraction' | 'letter' | 'space' | 'number-indicator';
  value: string;
  pattern: number[];
  /** The English text this represents */
  meaning: string;
}

// Simple sentence templates with slots for contractions
const TEMPLATES: { template: string; words: string[] }[] = [
  { template: '{the} cat is on {the} mat', words: ['the', 'the'] },
  { template: '{you} {can} {do} it', words: ['you', 'can', 'do'] },
  { template: 'I {have} {the} book', words: ['have', 'the'] },
  { template: '{the} dog {and} cat {are} friends', words: ['the', 'and'] },
  { template: 'we {will} {go} {for} a walk', words: ['will', 'go', 'for'] },
  { template: '{people} {like} {the} park', words: ['people', 'like', 'the'] },
  { template: 'she {can} sing {very} well', words: ['can', 'very'] },
  { template: '{the} sun is {very} hot', words: ['the', 'very'] },
  { template: 'I {just} got home {from} work', words: ['just', 'from'] },
  { template: '{that} is {not} {so} hard', words: ['that', 'not', 'so'] },
  { template: 'we {have} {more} time', words: ['have', 'more'] },
  { template: '{the} bird {with} {the} red wing', words: ['the', 'with', 'the'] },
  { template: '{you} {do} {not} {have} a pen', words: ['you', 'do', 'not', 'have'] },
  { template: 'I {will} {go} {for} it', words: ['will', 'go', 'for'] },
  { template: '{every} child {can} learn', words: ['every', 'can'] },
  { template: '{but} {the} game is fun', words: ['but', 'the'] },
  { template: 'I {like} {the} rain', words: ['like', 'the'] },
  { template: 'he ran {so} fast', words: ['so'] },
  { template: '{you} {and} I {will} {go}', words: ['you', 'and', 'will', 'go'] },
  { template: '{rather} {not} {go} now', words: ['rather', 'not', 'go'] },
];

// Build contraction lookup
const contractionLookup = new Map<string, ContractionEntry>();
for (const entry of contractedBrailleEntries) {
  contractionLookup.set(entry.label.toLowerCase(), entry);
}

/** Convert a sentence template to braille tokens */
function templateToTokens(template: string): BrailleToken[] {
  const tokens: BrailleToken[] = [];
  // Split by words
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
export function getRandomSentence(maxWords: number = 5, contractionDensity: number = 0.5): SentenceData {
  // Filter templates by word count
  const eligible = TEMPLATES.filter((t) => {
    const wordCount = t.template.split(' ').length;
    return wordCount <= maxWords;
  });

  if (eligible.length === 0) {
    // Fallback
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
