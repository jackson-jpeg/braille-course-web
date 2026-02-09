/**
 * Braille Fidelity Guard
 *
 * Scans AI-generated text for "dots X Y Z" patterns and cross-references
 * against the canonical braille mappings. Corrects any incorrect dot patterns.
 */

import { brailleMap, dotDescription } from '@/lib/braille-map';
import { contractedBrailleEntries } from '@/lib/contracted-braille-map';

export interface CorrectionEntry {
  original: string;       // "dots 1 3"
  corrected: string;      // "dots 1 2"
  context: string;        // surrounding text snippet
  letterOrContraction: string; // "B"
}

/* ── Build reverse lookup: canonical dots string → letter/contraction label ── */

interface LookupEntry {
  label: string;
  dotsString: string; // "dots 1 2"
}

function buildReverseLookup(): Map<string, LookupEntry> {
  const map = new Map<string, LookupEntry>();

  // Letters A-Z
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const desc = dotDescription(letter);
    if (desc) {
      map.set(letter.toUpperCase(), { label: letter.toUpperCase(), dotsString: desc });
    }
  }

  // Contracted braille entries
  for (const entry of contractedBrailleEntries) {
    const dotNums = [1, 4, 2, 5, 3, 6];
    const raised = entry.pattern
      .map((v, i) => (v ? dotNums[i] : null))
      .filter(Boolean)
      .sort((a, b) => a! - b!);
    const desc = `dots ${raised.join(' ')}`;
    // Use label as key (may overwrite if same label, which is fine)
    map.set(entry.label.toLowerCase(), { label: entry.label, dotsString: desc });
  }

  return map;
}

const reverseLookup = buildReverseLookup();

// Build a quick lookup from dots string -> all labels that match
function buildDotsToLabels(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [, entry] of reverseLookup) {
    const existing = map.get(entry.dotsString) || [];
    existing.push(entry.label);
    map.set(entry.dotsString, existing);
  }
  return map;
}

const dotsToLabels = buildDotsToLabels();

/**
 * Normalize a dots pattern string: "dots 2, 1, 4" → "dots 1 2 4"
 */
function normalizeDots(dotsStr: string): string {
  const nums = dotsStr
    .replace(/^dots?\s*/i, '')
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => n >= 1 && n <= 6)
    .sort((a, b) => a - b);
  if (nums.length === 0) return '';
  return `dots ${nums.join(' ')}`;
}

/**
 * Validates and corrects braille dot patterns in a text string.
 *
 * Matches patterns like:
 *   "letter B is dots 1 3"
 *   "the letter B (dots 1 3)"
 *   "B: dots 1 3"
 *   "dots 1 3" near a letter reference
 */
export function validateBrailleText(text: string): {
  correctedText: string;
  corrections: CorrectionEntry[];
} {
  const corrections: CorrectionEntry[] = [];

  // Pattern: "letter X is dots Y Z" or "letter X (dots Y Z)" or "X: dots Y Z" or "X is dots Y Z"
  // Also matches contractions like "the contraction 'and' is dots 1 2 3 4 6"
  const letterDotsPattern = /(?:(?:letter|character|sign|symbol)\s+)?([A-Za-z]|'[a-z]+'|"[a-z]+")\s*(?:is|=|:|—|–|-|\()\s*dots?\s+([\d\s,]+)/gi;

  let correctedText = text;

  // Collect all matches first, then replace from end to avoid offset issues
  const matches: { fullMatch: string; label: string; claimedDots: string; index: number }[] = [];

  let match;
  while ((match = letterDotsPattern.exec(text)) !== null) {
    let label = match[1].replace(/['"]/g, '').trim();
    const claimedDots = match[2].trim();
    matches.push({ fullMatch: match[0], label, claimedDots, index: match.index });
  }

  // Process matches from end to start
  for (let i = matches.length - 1; i >= 0; i--) {
    const m = matches[i];
    const label = m.label;
    const claimed = normalizeDots(m.claimedDots);
    if (!claimed) continue;

    // Look up the canonical dots for this letter/contraction
    const canonical = reverseLookup.get(label.toUpperCase()) || reverseLookup.get(label.toLowerCase());
    if (!canonical) continue;

    if (claimed !== canonical.dotsString) {
      // Found an error — correct it
      const contextStart = Math.max(0, m.index - 20);
      const contextEnd = Math.min(text.length, m.index + m.fullMatch.length + 20);
      const context = text.slice(contextStart, contextEnd);

      corrections.push({
        original: claimed,
        corrected: canonical.dotsString,
        context,
        letterOrContraction: canonical.label,
      });

      // Replace in the corrected text
      const originalDotsInMatch = `dots ${m.claimedDots.trim()}`;
      const correctedDotsInMatch = canonical.dotsString;
      const newMatch = m.fullMatch.replace(originalDotsInMatch, correctedDotsInMatch)
        .replace(`dot ${m.claimedDots.trim()}`, correctedDotsInMatch);
      correctedText = correctedText.slice(0, m.index) + newMatch + correctedText.slice(m.index + m.fullMatch.length);
    }
  }

  return { correctedText, corrections };
}

/**
 * Validates and corrects braille content in a parsed JSON structure.
 * Recursively walks through all string values in the JSON.
 */
export function validateContentJson(parsed: unknown): {
  corrected: unknown;
  corrections: CorrectionEntry[];
  wasCorrected: boolean;
} {
  const allCorrections: CorrectionEntry[] = [];

  function walk(obj: unknown): unknown {
    if (typeof obj === 'string') {
      const { correctedText, corrections } = validateBrailleText(obj);
      allCorrections.push(...corrections);
      return correctedText;
    }
    if (Array.isArray(obj)) {
      return obj.map(walk);
    }
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = walk(value);
      }
      return result;
    }
    return obj;
  }

  const corrected = walk(parsed);
  return {
    corrected,
    corrections: allCorrections,
    wasCorrected: allCorrections.length > 0,
  };
}
