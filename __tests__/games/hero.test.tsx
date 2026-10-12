import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import BrailleHero from '@/components/BrailleHero';
import { HERO_WORDS, brailleInventory, heroPrint, heroTokens, lessonHeroWords } from '@/lib/games/hero';
import { transcribe } from '@/lib/braille/transcribe';
import { INDICATORS, cellsKey } from '@/lib/braille/ueb';
import { checkAllCells, readCells } from '../helpers/cells';

const ROOT = path.resolve(__dirname, '..', '..');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

const ALL_WORDS = [...HERO_WORDS, ...lessonHeroWords()];

describe('Hero: what pages pass', () => {
  test('every literal <BrailleHero word="..."> on a page is listed in HERO_WORDS', () => {
    const uses = walk(path.join(ROOT, 'app')).flatMap((f) =>
      [...fs.readFileSync(f, 'utf8').matchAll(/<BrailleHero\b([^>]*)\/>/g)].map((m) => ({ f, attrs: m[1] })),
    );
    expect(uses.length).toBeGreaterThan(3);
    for (const { f, attrs } of uses) {
      const literal = attrs.match(/word="([^"]*)"/);
      if (literal) expect(HERO_WORDS).toContain(literal[1]);
      else if (/word=\{/.test(attrs)) expect(attrs).toMatch(/word=\{lesson\.title\.toUpperCase\(\)\}/);
      else expect(path.relative(ROOT, f)).toBe(path.join('app', 'page.tsx')); // default word
    }
  });
});

describe('Hero: braille for every word', () => {
  test.each(ALL_WORDS)('%s: tokens are exactly the uncontracted UEB of its print', (word) => {
    const print = heroPrint(word);
    const tokens = heroTokens(word);
    expect(cellsKey(tokens.flatMap((t) => t.cells))).toBe(cellsKey(transcribe(print)));
    // Letters are lowercase unless marked with ^, and a capital always has its indicator.
    const marked = (word.match(/\^/g) ?? []).length;
    expect((print.match(/[A-Z]/g) ?? []).length).toBe(marked);
    expect(tokens.filter((t) => t.signId === INDICATORS.capitalLetter.id)).toHaveLength(marked);
    // Nothing is silently dropped: every print character other than spaces has a token.
    expect(
      tokens
        .filter((t) => t.kind !== 'indicator')
        .map((t) => t.print)
        .join(''),
    ).toBe(print);
  });

  test('hero notation', () => {
    expect(heroPrint('^DELANEY ^COSTELLO')).toBe('Delaney Costello');
    expect(heroPrint('INTERACTIVE')).toBe('interactive');
    expect(heroPrint('SUMMER #2027')).toBe('summer 2027');
    expect(heroPrint('LETTERS A–J')).toBe('letters a–j');
  });

  test('inventory covers every word', () => {
    const prints = new Set(brailleInventory().map((i) => i.print));
    for (const w of ALL_WORDS) expect(prints.has(heroPrint(w))).toBe(true);
  });
});

describe('Hero renders correct cells', () => {
  test.each(ALL_WORDS)('%s', (word) => {
    const { container } = render(<BrailleHero word={word} easterEggs />);
    expect(checkAllCells(container)).toEqual([]);
    const drawn = readCells(container).map((c) => c.dots);
    const expected = heroTokens(word)
      .filter((t) => t.kind !== 'space')
      .flatMap((t) => t.cells.map((c) => c.join('')));
    expect(drawn).toEqual(expected);
  });

  test('the games page shows "interactive" as lowercase letters, captioned in lowercase', () => {
    const { container } = render(<BrailleHero word="INTERACTIVE" easterEggs />);
    const captions = [...container.querySelectorAll('.braille-letter-label')].map((e) => e.textContent);
    expect(captions.join('')).toBe('interactive');
    expect(container.firstElementChild!.getAttribute('aria-label')).toBe(
      'Interactive braille cells spelling interactive',
    );
  });

  test('the home page name is written with capital indicators', () => {
    const { container } = render(<BrailleHero />);
    const drawn = readCells(container).map((c) => c.dots);
    expect(drawn.join('|')).toBe(cellsKey(transcribe('Delaney Costello').filter((c) => c.length > 0)));
    expect(drawn[0]).toBe(INDICATORS.capitalLetter.cells[0].join(''));
  });
});
