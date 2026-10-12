import { render, fireEvent, act } from '@testing-library/react';
import BrailleDotExplorer from '@/components/BrailleDotExplorer';
import { cellMeanings, headline, brailleInventory, type ExplorerMode } from '@/lib/games/explorer';
import {
  ALL_CELLS,
  ALL_SIGNS,
  CONTRACTIONS,
  DIGIT_CELLS,
  LETTER_CELLS,
  cellKey,
  cellToUnicode,
  type Cell,
} from '@/lib/braille/ueb';
import { describeCell } from '@/lib/braille/prose';
import rulebook from '../fixtures/iceb-rulebook-signs.json';
import { checkAllCells } from '../helpers/cells';

const MODES: ExplorerMode[] = ['alphabetic', 'contracted'];
const k = (c: Cell) => cellKey(c);

/** What the canonical data says a single cell means, computed directly from the tables. */
function expectedIds(cell: Cell, mode: ExplorerMode): string[] {
  if (cell.length === 0) return [];
  const ids: string[] = [];
  for (const s of ALL_SIGNS)
    if (s.cells.length === 1 && k(s.cells[0]) === k(cell) && s.kind !== 'digit') ids.push(s.id);
  for (const [d, c] of Object.entries(DIGIT_CELLS)) if (k(c) === k(cell)) ids.push(`digit-${d}`);
  for (const s of ALL_SIGNS)
    if (s.kind !== 'digit' && s.cells.length > 1 && k(s.cells[0]) === k(cell)) ids.push(`starts:${s.id}`);
  if (mode === 'contracted')
    for (const c of CONTRACTIONS) if (k(c.cells[0]) === k(cell)) ids.push(`contraction:${c.text}:${c.kind}`);
  return ids.sort();
}

describe('Dot Explorer: every one of the 64 cells, in both modes', () => {
  test.each(MODES)('%s: reported meanings equal the canonical data', (mode) => {
    expect(ALL_CELLS).toHaveLength(64);
    for (const cell of ALL_CELLS) {
      const got = cellMeanings(cell, mode)
        .map((m) => m.id)
        .sort();
      expect({ cell: k(cell), ids: got }).toEqual({ cell: k(cell), ids: expectedIds(cell, mode) });
    }
  });

  test('no meaning is lost: cells with several contractions list them all (the old Map kept only one)', () => {
    const ch = cellMeanings([1, 6], 'contracted')
      .filter((m) => m.kind === 'contraction')
      .map((m) => m.short);
    expect(ch.sort()).toEqual(['ch', 'child']);
    const be = cellMeanings([2, 3], 'contracted')
      .filter((m) => m.kind === 'contraction')
      .map((m) => m.id);
    expect(be.sort()).toEqual([
      'contraction:bb:lower-groupsign',
      'contraction:be:lower-groupsign',
      'contraction:be:lower-wordsign',
    ]);
  });

  test('independent check: the rulebook’s own examples of signs with several meanings (ICEB 2.4.2)', () => {
    const shorts = (cell: Cell) => cellMeanings(cell, 'contracted').map((m) => m.short);
    expect(shorts(LETTER_CELLS.f)).toEqual(expect.arrayContaining(['f', '6', 'from']));
    expect(shorts([1, 2, 5, 6])).toEqual(expect.arrayContaining(['ou', 'out']));
    expect(shorts([2, 3, 6])).toEqual(expect.arrayContaining(['?', '“', 'his']));
  });

  test('independent check: every contraction meaning matches the ICEB rulebook sign tables (10.1–10.6)', () => {
    const book = new Map<string, Set<string>>();
    for (const e of rulebook.entries.filter((x) => /^10\.[1-6]$/.test(x.section))) {
      const text = e.text.replace(/ \(see .*\)$/, '');
      book.set(e.braille, new Set([...(book.get(e.braille) ?? []), text]));
    }
    for (const cell of ALL_CELLS) {
      const texts = new Set(
        cellMeanings(cell, 'contracted')
          .filter((m) => m.kind === 'contraction')
          .map((m) => m.short),
      );
      expect([...texts].sort()).toEqual([...(book.get(cellToUnicode(cell)) ?? [])].sort());
    }
  });

  test('letters are shown in lowercase (a plain letter cell is a lowercase letter, ICEB 4.1, 8.3.1)', () => {
    for (const [l, cell] of Object.entries(LETTER_CELLS)) {
      expect(headline(cell, 'alphabetic')).toBe(l);
      expect(cellMeanings(cell, 'alphabetic')[0].title).toBe(`Letter ${l}`);
    }
  });

  test('the inventory is non-empty and only lists letters and standalone wordsigns', () => {
    const items = brailleInventory();
    expect(items.filter((i) => i.table === 'g1')).toHaveLength(26);
    for (const i of items) expect(i.cells).toHaveLength(1);
  });
});

describe('Dot Explorer component', () => {
  function press(key: string) {
    act(() => {
      fireEvent.keyDown(window, { key });
    });
  }

  test.each(MODES)('%s: keys 1–6 build every cell, C clears, and the result lists every meaning', (mode) => {
    const { container, getByRole } = render(<BrailleDotExplorer />);
    if (mode === 'contracted') fireEvent.click(getByRole('radio', { name: 'Contracted' }));
    const pad = container.querySelector('.explorer-cell')!;
    for (const cell of ALL_CELLS) {
      press('c');
      expect(pad.getAttribute('data-dots')).toBe('');
      for (const d of cell) press(String(d));
      expect(pad.getAttribute('data-dots')).toBe(k(cell));
      expect(checkAllCells(container)).toEqual([]);
      const result = container.querySelector('.explorer-result')!.textContent!;
      if (cell.length === 0) {
        expect(result).toContain('Tap dots to begin');
        continue;
      }
      expect(result.toLowerCase()).toContain(describeCell(cell));
      for (const m of cellMeanings(cell, mode)) expect(result).toContain(m.title);
    }
  });

  test('clicking a dot toggles it; the buttons say which dot and whether it is raised', () => {
    const { container, getByLabelText } = render(<BrailleDotExplorer />);
    fireEvent.click(getByLabelText('Dot 1'));
    fireEvent.click(getByLabelText('Dot 2'));
    fireEvent.click(getByLabelText('Dot 5'));
    expect(getByLabelText('Dot 5').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.explorer-letter')!.textContent).toBe('h');
    expect(checkAllCells(container)).toEqual([]);
  });
});
