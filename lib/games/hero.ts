/**
 * Hero banner braille: the interactive row of cells at the top of many pages.
 *
 * Pages pass a `word` in "hero notation", kept from the original component:
 *   - letters are shown as LOWERCASE letters, whatever case they are typed in ("INTERACTIVE"
 *     is shown as the braille for "interactive", captioned in lowercase);
 *   - a `^` before a letter makes that one letter a capital, written with the capital letter
 *     indicator (ICEB 8.3), e.g. "^DELANEY ^COSTELLO" → "Delaney Costello";
 *   - `#` is ignored: numbers get the numeric indicator automatically (ICEB 6.1).
 * The resulting print is transcribed by lib/braille/transcribe.ts, so punctuation such as the
 * dash in "Letters A–J" is shown too (it is never silently dropped).
 */
import type { InventoryItem } from '@/lib/braille/inventory';
import { type BrailleToken, transcribeTokens } from '@/lib/braille/transcribe';
import { ALL_LESSONS } from '@/lib/course-curriculum';

/** Every literal `word` a page passes to <BrailleHero> (checked by __tests__/games/hero.test.tsx). */
export const HERO_WORDS: readonly string[] = [
  '^DELANEY ^COSTELLO',
  'TVI SERVICES',
  'SUMMER #2027',
  'LEARN BRAILLE',
  'INTRO TO BRAILLE',
  'BOOK AN APPOINTMENT',
  'INTERACTIVE',
];

/** Words the lesson pages pass: each lesson title, upper-cased (app/learn/[lesson]/page.tsx). */
export function lessonHeroWords(): string[] {
  return ALL_LESSONS.map((l) => l.title.toUpperCase());
}

export const DEFAULT_HERO_WORD = HERO_WORDS[0];

/** Hero notation → the print it stands for. */
export function heroPrint(word: string): string {
  let out = '';
  let capitalNext = false;
  for (const ch of word) {
    if (ch === '^') {
      capitalNext = true;
      continue;
    }
    if (ch === '#') continue;
    if (/[A-Za-z]/.test(ch)) {
      out += capitalNext ? ch.toUpperCase() : ch.toLowerCase();
    } else {
      out += ch;
    }
    capitalNext = false;
  }
  return out;
}

/** The braille tokens the hero shows for a word (throws on print the site cannot transcribe). */
export function heroTokens(word: string): BrailleToken[] {
  return transcribeTokens(heroPrint(word));
}

/** Every piece of braille this game can show (checked against liblouis). */
export function brailleInventory(): InventoryItem[] {
  return [...HERO_WORDS, ...lessonHeroWords()].map((w) => ({
    where: 'hero',
    print: heroPrint(w),
    table: 'g1' as const,
    cells: heroTokens(w).flatMap((t) => t.cells),
  }));
}
