/**
 * Inventory of every piece of braille the site shows, so it can be checked against liblouis.
 *
 * Each game and lesson module exports `brailleInventory()`, listing every print string it can
 * show as braille together with the cells it actually shows. lib/braille/site-inventory.ts
 * collects them all; scripts/braille/dump-site-braille.ts feeds the list to liblouis; and
 * __tests__/braille/liblouis-oracle.test.ts compares every entry cell by cell.
 */
import type { Cell } from './ueb';
import { transcribe } from './transcribe';

export type BrailleTable = 'g1' | 'g2';

export interface InventoryItem {
  /** Where it appears, e.g. "game:speedmatch" or "lesson:numbers". */
  where: string;
  /** The print it represents. */
  print: string;
  /** g1 = uncontracted UEB, g2 = contracted UEB. */
  table: BrailleTable;
  /** The cells the site shows for it. */
  cells: readonly Cell[];
}

/** Convenience: an uncontracted item whose cells come from the site transcriber. */
export function g1Item(where: string, print: string): InventoryItem {
  return { where, print, table: 'g1', cells: transcribe(print) };
}
