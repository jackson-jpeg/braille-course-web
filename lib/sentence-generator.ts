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
import { frames, type SentenceFrame, type SlotRef, type Word } from './sentence-bank';

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

// Build contraction lookup
const contractionLookup = new Map<string, ContractionEntry>();
for (const entry of contractedBrailleEntries) {
  contractionLookup.set(entry.label.toLowerCase(), entry);
}

// ── Deduplication ──

const usedSentences = new Set<string>();

/** Clear sentence history (call when starting a new game session) */
export function resetSentenceHistory(): void {
  usedSentences.clear();
}

// ── Frame-based generation ──

function isSlotRef(slot: SlotRef | Word): slot is SlotRef {
  return 'list' in slot;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a template string from a sentence frame */
function generateFromFrame(frame: SentenceFrame): string {
  const words: string[] = [];
  for (const slot of frame.slots) {
    let word: Word;
    if (isSlotRef(slot)) {
      const candidates = slot.filter ? slot.list.filter(slot.filter) : slot.list;
      word = pickRandom(candidates);
    } else {
      word = slot;
    }
    const text = word.text === 'I' ? 'I' : word.text.toLowerCase();
    words.push(word.contraction ? `{${text}}` : text);
  }
  // Capitalize first character (handle possible leading brace)
  const result = words.join(' ');
  return result.replace(/^(\{?)(\w)/, (_m, brace, ch) => brace + ch.toUpperCase());
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
  // Filter frames by word count
  const eligible = frames.filter((f) => f.wordCount <= maxWords);

  if (eligible.length === 0) {
    // Fallback: use the smallest frame
    const fallback = frames.reduce((a, b) => (a.wordCount < b.wordCount ? a : b));
    const template = generateFromFrame(fallback);
    return {
      plainText: template.replace(/[{}]/g, ''),
      brailleTokens: templateToTokens(template),
    };
  }

  // Try to generate a non-duplicate sentence (max 10 attempts)
  for (let attempt = 0; attempt < 10; attempt++) {
    const frame = pickRandom(eligible);
    const template = generateFromFrame(frame);
    const plain = template.replace(/[{}]/g, '');

    if (!usedSentences.has(plain) || attempt === 9) {
      usedSentences.add(plain);
      return {
        plainText: plain,
        brailleTokens: templateToTokens(template),
      };
    }
  }

  // Unreachable, but TypeScript needs it
  const frame = pickRandom(eligible);
  const template = generateFromFrame(frame);
  return {
    plainText: template.replace(/[{}]/g, ''),
    brailleTokens: templateToTokens(template),
  };
}
