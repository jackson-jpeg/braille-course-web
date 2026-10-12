/**
 * Braille in the site chrome and the admin preview: nav logo, favicon / Apple icon / Open Graph
 * data, 404 page, decorative icons, and the admin inline preview. Rendered cells are checked with
 * checkAllCells; image-route data is checked as data. Expected cells are liblouis en-ueb-g1 output.
 */
import { render, act } from '@testing-library/react';
import NavBar from '@/components/NavBar';
import NotFound from '@/app/not-found';
import AdminLogin from '@/components/AdminLogin';
import OnboardingModal from '@/components/OnboardingModal';
import BrailleInlinePreview, { inlinePreviewItems } from '@/components/admin/BrailleInlinePreview';
import {
  CHROME_PRINT,
  brailleInventory,
  cellColumns,
  chromeCells,
  iconCell,
  ogImageCells,
} from '@/lib/site-chrome-braille';
import { ALL_CELLS, cellKey, cellsKey, unicodeToCells } from '@/lib/braille/ueb';
import { transcribe } from '@/lib/braille/transcribe';
import { checkAllCells, readCells } from '../helpers/cells';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

/* liblouis en-ueb-g1 (unicode.dis) */
const LOUIS: Record<string, string> = {
  t: '⠞',
  b: '⠃',
  teach: '⠞⠑⠁⠉⠓',
  '404': '⠼⠙⠚⠙',
  Hello: '⠠⠓⠑⠇⠇⠕',
  USA: '⠠⠠⠥⠎⠁',
  '2024': '⠼⠃⠚⠃⠙',
  '3b': '⠼⠉⠰⠃',
  'Is it 5?': '⠠⠊⠎⠀⠊⠞⠀⠼⠑⠦',
};
const louis = (p: string) => cellsKey(unicodeToCells(LOUIS[p]));

describe('chrome braille data', () => {
  test('every chrome string is transcribed as liblouis does', () => {
    for (const p of Object.values(CHROME_PRINT)) expect(cellsKey(chromeCells(p))).toBe(louis(p));
  });

  test('404 is the numeric indicator, then d j d', () => {
    expect(cellsKey(chromeCells(CHROME_PRINT.notFound))).toBe(louis('404'));
  });

  test('the favicon / Apple icon cell is the letter t', () => {
    expect(cellsKey([iconCell()])).toBe(louis('t'));
  });

  test('the OG image spells "teach", one cell per letter, no capital indicators', () => {
    const cells = ogImageCells();
    expect(cells.map((c) => c.print).join('')).toBe('teach');
    expect(cellsKey(cells.map((c) => c.cell))).toBe(louis('teach'));
  });

  test.each(ALL_CELLS.map((c) => [cellKey(c) || 'blank', c]))(
    'cellColumns(%s): 1-2-3 left, 4-5-6 right, raised as the data says',
    (_k, cell) => {
      const [left, right] = cellColumns(cell);
      expect(left.map((s) => s.dot)).toEqual([1, 2, 3]);
      expect(right.map((s) => s.dot)).toEqual([4, 5, 6]);
      for (const s of [...left, ...right]) expect(s.raised).toBe(cell.includes(s.dot));
    },
  );

  test('inventory lists every chrome and admin string with the cells shown', () => {
    const inv = brailleInventory();
    expect(inv.map((i) => i.print).sort()).toEqual(['t', 't', 't', 'teach', '404', 'b', 'b', '3b'].sort());
    for (const item of inv) {
      expect(item.table).toBe('g1');
      expect(cellsKey(item.cells)).toBe(louis(item.print));
    }
  });
});

describe('NavBar logo', () => {
  test('draws the letter t with BrailleCell, decorative, dots in the right places', () => {
    const { container } = render(<NavBar />);
    const cells = readCells(container);
    expect(cells.map((c) => c.dots)).toEqual([cellKey(transcribe('t')[0])]);
    expect(cells[0].dots).toBe('2345');
    expect(cells[0].el.getAttribute('aria-hidden')).toBe('true');
    expect(cells[0].el.className).toBe('site-nav-logo-dots');
    expect(cells[0].el.querySelectorAll('.site-nav-logo-dot.filled')).toHaveLength(4);
    expect(checkAllCells(container)).toEqual([]);
  });
});

describe('404 page', () => {
  test('shows numeric indicator + d j d, hidden from screen readers', () => {
    const { container } = render(<NotFound />);
    const el = container.querySelector('.not-found-braille')!;
    expect(el.textContent).toBe(LOUIS['404']);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('decorative braille b icons', () => {
  test('admin login: the letter b, aria-hidden', () => {
    const { container } = render(<AdminLogin />);
    const el = container.querySelector('.admin-login-icon')!;
    expect(el.textContent).toBe(LOUIS.b);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  test('onboarding modal: the letter b, aria-hidden', async () => {
    localStorage.clear();
    let container!: HTMLElement;
    await act(async () => {
      container = render(<OnboardingModal />).container;
    });
    const el = container.querySelector('.onboarding-icon')!;
    expect(el).not.toBeNull();
    expect(el.textContent).toBe(LOUIS.b);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('admin inline preview', () => {
  test('letters and quoted contractions are drawn correctly and labelled with their dots', () => {
    const text = 'B and C. The wordsign "it" is the letter X; "as" is Z; "the" and "his".';
    const { container, getAllByRole } = render(<BrailleInlinePreview text={text} />);
    expect(checkAllCells(container)).toEqual([]);
    const items = inlinePreviewItems(text);
    // A plain letter cell is lowercase, so its label is the lowercase letter (never "B" on a b cell).
    expect(items.map((i) => i.label)).toEqual(['b', 'c', 'x', 'z', 'it', 'as', 'the', 'his']);
    const louisG2: Record<string, string> = { b: '⠃', c: '⠉', x: '⠭', z: '⠵', as: '⠵', his: '⠦', it: '⠭', the: '⠮' };
    for (const i of items) expect(cellsKey(i.cells)).toBe(cellsKey(unicodeToCells(louisG2[i.label])));
    expect(readCells(container).map((c) => c.dots)).toEqual(items.map((i) => cellKey(i.cells[0])));
    expect(getAllByRole('img').map((e) => e.getAttribute('aria-label'))).toContain('Contraction it, dots 1, 3, 4, 6');
  });

  test('nothing to show renders nothing', () => {
    const { container } = render(<BrailleInlinePreview text="no braille here" />);
    expect(container.innerHTML).toBe('');
  });
});
