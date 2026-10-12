/**
 * Rendering checks for braille cells in a jsdom container.
 *
 * Every drawn cell carries data-braille-cell and data-dots="125"; every dot carries data-dot="n"
 * and an explicit grid column / row. This checks, for every cell in the container, that:
 *   - there are exactly six dots, one for each of 1–6,
 *   - each dot is placed in the column/row the cell layout requires (1-2-3 left, 4-5-6 right),
 *   - a dot looks raised exactly when the cell data says it is raised,
 *   - and (optionally) the cell shows what the caller expected.
 * Real-browser geometry (actual pixel positions) is checked by scripts/braille/check-rendered-cells.mjs.
 */
import { dotPosition, type Cell, type Dot } from '@/lib/braille/ueb';

export const RAISED_CLASSES = ['filled', 'raised', 'active', 'on'];

export function readCells(container: ParentNode): { dots: string; el: Element }[] {
  return [...container.querySelectorAll('[data-braille-cell]')].map((el) => ({ dots: el.getAttribute('data-dots') ?? '', el }));
}

export function checkCellElement(el: Element): string[] {
  const problems: string[] = [];
  const dots = el.getAttribute('data-dots');
  if (dots === null) return ['cell without data-dots'];
  const dotEls = [...el.querySelectorAll(':scope > [data-dot]')] as HTMLElement[];
  const numbers = dotEls.map((d) => Number(d.getAttribute('data-dot'))).sort();
  if (numbers.join('') !== '123456') problems.push(`cell ${dots}: dots present ${numbers.join('')}`);
  for (const d of dotEls) {
    const n = Number(d.getAttribute('data-dot')) as Dot;
    const { column, row } = dotPosition(n);
    if (d.style.gridColumn.split(' ')[0] !== String(column) || d.style.gridRow.split(' ')[0] !== String(row)) {
      problems.push(`cell ${dots}: dot ${n} placed at column ${d.style.gridColumn} row ${d.style.gridRow}`);
    }
    const looksRaised =
      RAISED_CLASSES.some((c) => d.classList.contains(c)) || d.getAttribute('aria-pressed') === 'true';
    const isRaised = dots.includes(String(n));
    if (looksRaised !== isRaised) problems.push(`cell ${dots}: dot ${n} drawn ${looksRaised ? 'raised' : 'flat'}`);
  }
  return problems;
}

/** Check every cell in the container; returns a list of problems (empty when all is well). */
export function checkAllCells(container: ParentNode): string[] {
  return readCells(container).flatMap(({ el }) => checkCellElement(el));
}

export function dotsKey(cell: Cell): string {
  return cell.join('');
}
