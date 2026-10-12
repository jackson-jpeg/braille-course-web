/**
 * teachbraille.org is a family site: no word list may contain profanity, sexual content, violence,
 * drugs or alcohol, or words hurtful to children (lib/word-blocklist.ts). This checks every word
 * list a game or worksheet can draw from, and every word of every string the site shows in braille.
 */
import { WORD_BLOCKLIST, isBlockedWord } from '@/lib/word-blocklist';
import { answerWords, validGuesses } from '@/lib/game-words';
import { hangmanWords } from '@/lib/hangman-words';
import { contractionWords, standaloneWords } from '@/lib/contraction-words';
import { HERO_WORDS } from '@/lib/games/hero';
import { siteInventory } from '@/lib/braille/site-inventory';
import plainWords from '@/lib/braille/data/plain-contracted-words.json';

const LISTS: Record<string, readonly string[]> = {
  'Word Game answers': answerWords,
  'Word Game accepted guesses': [...validGuesses],
  'Hangman words': hangmanWords,
  'Contraction words': [...standaloneWords, ...contractionWords].map((w) => w.word),
  'Hero words': HERO_WORDS,
  'Worksheet plain contracted words': plainWords.words,
  'Every braille string on the site (by word)': siteInventory().flatMap((i) =>
    i.print
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter(Boolean),
  ),
};

describe('family-safe word lists', () => {
  test.each(Object.entries(LISTS))('%s: nothing on the blocklist', (_name, words) => {
    expect(words.length).toBeGreaterThan(0);
    expect([...new Set(words.filter(isBlockedWord))]).toEqual([]);
  });

  test('the words reported in the audit are blocked and gone', () => {
    for (const w of ['slave', 'bomb', 'drunk', 'jerk']) {
      expect(WORD_BLOCKLIST).toContain(w);
      for (const [name, words] of Object.entries(LISTS))
        expect({ name, has: words.includes(w) }).toEqual({ name, has: false });
    }
  });

  test('inflections of a blocked word are caught, ordinary words are not', () => {
    for (const w of ['kills', 'killed', 'bombs', 'hated', 'stabbed', 'drugs']) expect(isBlockedWord(w)).toBe(true);
    for (const w of ['class', 'glass', 'skill', 'ward', 'grape', 'hello', 'better', 'assets', 'warm', 'diet'])
      expect(isBlockedWord(w)).toBe(false);
  });

  test('the blocklist itself is lowercase single words without duplicates', () => {
    for (const w of WORD_BLOCKLIST) expect(w).toMatch(/^[a-z]+$/);
    expect(new Set(WORD_BLOCKLIST).size).toBe(WORD_BLOCKLIST.length);
  });
});
