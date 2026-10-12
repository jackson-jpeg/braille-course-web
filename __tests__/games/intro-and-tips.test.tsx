import { render } from '@testing-library/react';
import IntroPage from '@/app/intro/page';
import { tips } from '@/lib/learning-tips';
import { getContraction, getSign, cellsToUnicode, LETTER_CELLS } from '@/lib/braille/ueb';
import { transcribe } from '@/lib/braille/transcribe';
import { describeCells } from '@/lib/braille/prose';
import oracle from '../fixtures/liblouis-oracle.json';
import { checkAllCells } from '../helpers/cells';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('learning tips', () => {
  const all = tips.map((t) => t.fact).join('\n');

  test('known false or outdated claims are gone', () => {
    expect(all).not.toMatch(/currency/i);
    expect(all).not.toMatch(/published in 2010 and adopted/i);
    expect(all).not.toMatch(/over 180/i);
    expect(all).not.toMatch(/number (indicator|sign)/i);
    expect(all).not.toMatch(/top four positions/i);
  });

  test('every braille character in a tip is the canonical cell for what the tip names', () => {
    const numeric = cellsToUnicode(getSign('numeric').cells);
    expect(all).toContain(`numeric indicator (${numeric}, ${describeCells(getSign('numeric').cells)})`);
    for (const w of ['and', 'for', 'the']) {
      const braille = cellsToUnicode(getContraction(w, 'strong-contraction').cells);
      expect(all).toContain(`“${w}” (${braille}`);
      // independent: liblouis contracted braille of the word standing alone
      expect((oracle.translations as Record<string, string>)[`g2\t${w}`]).toBe(braille);
    }
  });

  test('the a–j / k–t structure claims match the letter cells', () => {
    const aj = new Set('abcdefghij'.split('').flatMap((l) => LETTER_CELLS[l]));
    expect([...aj].sort()).toEqual([1, 2, 4, 5]);
    expect(all).toContain('use only dots 1, 2, 4, 5');
    expect(all).toContain('with dot 3 added');
  });
});

describe('intro page', () => {
  test('renders every cell as its data says; the grade 1 / grade 2 “the” and the contractions are canonical', () => {
    const { container } = render(<IntroPage />);
    expect(checkAllCells(container)).toEqual([]);
    const g1 = [...container.querySelectorAll('.intro-grades-card--g1 [data-braille-cell]')].map((e) =>
      e.getAttribute('data-dots'),
    );
    expect(g1).toEqual(transcribe('the').map((c) => c.join('')));
    const g2 = [...container.querySelectorAll('.intro-grades-card--g2 [data-braille-cell]')].map((e) =>
      e.getAttribute('data-dots'),
    );
    expect(g2).toEqual(getContraction('the', 'strong-contraction').cells.map((c) => c.join('')));
    const examples = [...container.querySelectorAll('.intro-grades-example')];
    expect(examples).toHaveLength(5);
    for (const ex of examples) {
      const word = ex.querySelector('.intro-grades-example-word')!.textContent!;
      const dots = ex.querySelector('[data-braille-cell]')!.getAttribute('data-dots');
      expect(dots).toBe(getContraction(word, 'strong-contraction').cells[0].join(''));
      const louis = (oracle.translations as Record<string, string>)[`g2\t${word}`];
      expect(cellsToUnicode(getContraction(word, 'strong-contraction').cells)).toBe(louis);
    }
    // The page's own text (BrailleNumbers / BrailleAlphabet / BrailleHero are checked by their own tests).
    const text = [
      container.querySelector('script[type="application/ld+json"]')!.textContent!,
      ...[...container.querySelectorAll('.intro-history-text, .intro-stat-detail, .intro-grades-card')].map(
        (e) => e.textContent!,
      ),
    ].join('\n');
    expect(text).not.toMatch(/number indicator/i);
    expect(text).toContain('numeric indicator');
    expect(text).not.toMatch(/180\+/);
  });
});
