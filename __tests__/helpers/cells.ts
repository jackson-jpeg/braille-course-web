/**
 * Rendering checks for braille cells in a jsdom container.
 *
 * Every drawn cell carries data-braille-cell and data-dots="125"; every dot carries data-dot="n"
 * and an explicit grid column / row. This checks, for every cell in the container, that:
 *   - there are exactly six dots, one for each of 1–6,
 *   - each dot is placed in the column/row the cell layout requires (1-2-3 left, 4-5-6 right),
 *   - a dot looks raised exactly when the cell data says it is raised,
 *   - its caption (accessible name or the visible text beside it) does not name an uppercase letter
 *     for a plain letter cell (lib/braille/labels.ts),
 *   - and (optionally) the cell shows what the caller expected.
 * Real-browser geometry (actual pixel positions) is checked by scripts/braille/check-rendered-cells.mjs.
 */
import { dotPosition, type Cell, type Dot } from '@/lib/braille/ueb';
import { cellLabelProblem } from '@/lib/braille/labels';

export const RAISED_CLASSES = ['filled', 'raised', 'active', 'on'];

export function readCells(container: ParentNode): { dots: string; el: Element }[] {
  return [...container.querySelectorAll('[data-braille-cell]')].map((el) => ({
    dots: el.getAttribute('data-dots') ?? '',
    el,
  }));
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

/** The captions of a cell: its accessible name, and the text of the smallest wrapper around it alone. */
export function cellCaptions(el: Element): string[] {
  const captions: string[] = [];
  const aria = el.getAttribute('aria-label');
  if (aria) captions.push(aria.split(',')[0]);
  let wrapper: Element = el;
  for (let i = 0; i < 3 && wrapper.parentElement; i++) {
    if (wrapper.parentElement.querySelectorAll('[data-braille-cell]').length > 1) break;
    wrapper = wrapper.parentElement;
  }
  if (wrapper !== el) {
    const text = (wrapper.textContent ?? '').replace(el.textContent ?? '', '').trim();
    if (text) captions.push(text);
  }
  return captions;
}

/** Caption problems (lib/braille/labels.ts) for one cell. */
export function checkCellLabel(el: Element): string[] {
  const dots = el.getAttribute('data-dots') ?? '';
  const prev = el.previousElementSibling?.hasAttribute('data-braille-cell')
    ? (el.previousElementSibling.getAttribute('data-dots') ?? undefined)
    : undefined;
  return cellCaptions(el)
    .map((c) => cellLabelProblem(dots, c, prev))
    .filter((p): p is string => p !== null);
}

/** Check every cell in the container; returns a list of problems (empty when all is well). */
export function checkAllCells(container: ParentNode): string[] {
  return readCells(container).flatMap(({ el }) => [...checkCellElement(el), ...checkCellLabel(el)]);
}

export function dotsKey(cell: Cell): string {
  return cell.join('');
}
