/**
 * Spell print out for screen readers so capitals and punctuation are heard:
 * "Sam" → "capital S, a, m"; "3.5" → "3, period, 5".
 */
import { PUNCTUATION, SYMBOLS } from '@/lib/braille/ueb';

const NAMES = new Map<string, string>([
  ...Object.values(PUNCTUATION).map((p) => [p.print, p.name] as [string, string]),
  ...Object.values(SYMBOLS).map((p) => [p.print, p.name] as [string, string]),
  ["'", 'apostrophe'],
  ['"', 'quotation mark'],
  ['—', 'dash'],
  [' ', 'space'],
]);
NAMES.set('’', 'apostrophe');

export function spellOut(print: string): string {
  return [...print]
    .map((ch) => {
      if (/[A-Z]/.test(ch)) return `capital ${ch}`;
      if (/[a-z0-9]/.test(ch)) return ch;
      return NAMES.get(ch) ?? ch;
    })
    .join(', ');
}
