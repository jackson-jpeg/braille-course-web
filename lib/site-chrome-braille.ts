/**
 * Braille shown by the site chrome: the nav logo, the favicon and Apple touch icon, the Open
 * Graph image, the 404 page and the decorative icon on the admin login and onboarding modal.
 *
 * Plain data (no React), so the next/og image routes can import it too. Every cell comes from
 * lib/braille's transcriber (uncontracted UEB); every dot position from `dotPosition`.
 */
import { type Cell, type Dot, ALL_DOTS, cellsToUnicode, dotPosition, unicodeToCells } from '@/lib/braille/ueb';
import { transcribe } from '@/lib/braille/transcribe';
import { type InventoryItem, g1Item } from '@/lib/braille/inventory';
import { REFERENCE_EXAMPLES } from '@/lib/ai-braille-reference';

/**
 * Print strings the chrome shows as braille. All lowercase on purpose: each is drawn without a
 * capital indicator, so the print it represents is lowercase (see docs/accuracy/audit/admin-and-chrome.md).
 */
export const CHROME_PRINT = {
  /** Nav bar logo, favicon, Apple touch icon: the letter t (for TeachBraille). */
  logo: 't',
  /** Open Graph image: the word "teach", uncontracted. */
  ogWord: 'teach',
  /** 404 page: the number 404 (numeric indicator, then d j d). */
  notFound: '404',
  /** Decorative icon on the admin login and the onboarding modal: the letter b (for braille). */
  icon: 'b',
} as const;

/** Uncontracted UEB cells for a chrome string. */
export function chromeCells(print: string): Cell[] {
  return transcribe(print);
}

/** Unicode braille for a chrome string (for text-only places like the 404 page). */
export function chromeUnicode(print: string): string {
  return cellsToUnicode(chromeCells(print));
}

export interface DotSlot {
  dot: Dot;
  raised: boolean;
}

/**
 * A cell as two columns of three dots, for renderers that stack flex columns (next/og images):
 * columns[0] holds the dots of the left column, top to bottom, and columns[1] those of the right
 * column. Positions come from `dotPosition`.
 */
export function cellColumns(cell: Cell): [DotSlot[], DotSlot[]] {
  const column = (c: 1 | 2) =>
    ALL_DOTS.filter((d) => dotPosition(d).column === c)
      .sort((a, b) => dotPosition(a).row - dotPosition(b).row)
      .map((dot) => ({ dot, raised: cell.includes(dot) }));
  return [column(1), column(2)];
}

/** What the OG image draws: one entry per cell of the OG word, with its dot columns. */
export function ogImageCells(): { print: string; cell: Cell; columns: [DotSlot[], DotSlot[]] }[] {
  const prints = [...CHROME_PRINT.ogWord];
  const cells = chromeCells(CHROME_PRINT.ogWord);
  if (cells.length !== prints.length) throw new Error('site chrome: OG word must be one cell per letter');
  return cells.map((cell, i) => ({ print: prints[i], cell, columns: cellColumns(cell) }));
}

/** The favicon / Apple icon cell: the logo letter. */
export function iconCell(): Cell {
  const cells = chromeCells(CHROME_PRINT.logo);
  if (cells.length !== 1) throw new Error('site chrome: logo must be a single cell');
  return cells[0];
}

/** Print strings the admin presets spell out in dots (components/admin/AdminCreateTab.tsx). */
export const ADMIN_PRESET_EXAMPLES: readonly string[] = ['3b'];

/**
 * Every print string this area shows as braille (site chrome) or spells out in dots (admin AI
 * reference block and presets), with the cells shown.
 */
function chrome(where: string, print: string, cells: Cell[]): InventoryItem {
  return { where, print, table: 'g1', cells };
}

export function brailleInventory(): InventoryItem[] {
  return [
    ...REFERENCE_EXAMPLES.map((p) => g1Item('admin:ai-reference', p)),
    ...ADMIN_PRESET_EXAMPLES.map((p) => g1Item('admin:presets', p)),
    // The cells each place actually draws, so liblouis checks the real render path.
    chrome('chrome:navbar-logo', CHROME_PRINT.logo, chromeCells(CHROME_PRINT.logo)),
    chrome('chrome:icon', CHROME_PRINT.logo, [iconCell()]),
    chrome('chrome:apple-icon', CHROME_PRINT.logo, [iconCell()]),
    chrome(
      'chrome:opengraph-image',
      CHROME_PRINT.ogWord,
      ogImageCells().map((c) => c.cell),
    ),
    chrome('chrome:not-found', CHROME_PRINT.notFound, unicodeToCells(chromeUnicode(CHROME_PRINT.notFound))),
    chrome('chrome:admin-login-icon', CHROME_PRINT.icon, unicodeToCells(chromeUnicode(CHROME_PRINT.icon))),
    chrome('chrome:onboarding-icon', CHROME_PRINT.icon, unicodeToCells(chromeUnicode(CHROME_PRINT.icon))),
  ];
}
