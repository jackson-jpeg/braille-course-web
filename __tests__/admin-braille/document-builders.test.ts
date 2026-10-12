/**
 * @jest-environment node
 *
 * PDF teaching materials (lib/document-builders.ts) draw braille cells with pdfkit. These tests
 * check the dot geometry (1-2-3 down the left column, 4-5-6 down the right), that a drawn cell
 * raises exactly its dots (for all 64 cells, via a recording fake document), and which cells are
 * drawn for worksheet answers and words.
 */
import {
  answerCells,
  brailleCellGeometry,
  brailleWordCells,
  drawBrailleCell,
  drawBrailleWord,
} from '@/lib/document-builders';
import { type Cell, ALL_CELLS, cellKey, cellsKey, unicodeToCells } from '@/lib/braille/ueb';

const RAISED = '#1B2A4A';

/** A fake PDFKit document that records the circles filled in the raised colour. */
function recorder() {
  const raised: { x: number; y: number }[] = [];
  const all: { x: number; y: number }[] = [];
  const labels: string[] = [];
  let last: { x: number; y: number } | null = null;
  let color = '';
  const doc: Record<string, unknown> = {};
  const chain = () => doc;
  Object.assign(doc, {
    save: chain,
    restore: chain,
    roundedRect: chain,
    strokeColor: chain,
    lineWidth: chain,
    stroke: chain,
    fontSize: chain,
    font: chain,
    text: (t: string) => {
      labels.push(t);
      return doc;
    },
    circle: (x: number, y: number) => {
      last = { x, y };
      all.push(last);
      return doc;
    },
    fillColor: (c: string) => {
      color = c;
      return doc;
    },
    fill: () => {
      if (color === RAISED && last) raised.push(last);
      return doc;
    },
  });
  return { doc: doc as unknown as PDFKit.PDFDocument, raised, all, labels };
}

describe('brailleCellGeometry', () => {
  test.each(['small', 'medium'] as const)('%s: dots 1-2-3 left column, 4-5-6 right column, top to bottom', (size) => {
    const g = brailleCellGeometry(size);
    const at = (d: number) => g.dots.find((x) => x.dot === d)!;
    expect(g.dots.map((d) => d.dot).sort()).toEqual([1, 2, 3, 4, 5, 6]);
    // Same column
    expect(new Set([at(1).cx, at(2).cx, at(3).cx]).size).toBe(1);
    expect(new Set([at(4).cx, at(5).cx, at(6).cx]).size).toBe(1);
    expect(at(1).cx).toBeLessThan(at(4).cx);
    // Rows: top to bottom, aligned across columns
    expect(at(1).cy).toBeLessThan(at(2).cy);
    expect(at(2).cy).toBeLessThan(at(3).cy);
    for (const [a, b] of [
      [1, 4],
      [2, 5],
      [3, 6],
    ])
      expect(at(a).cy).toBe(at(b).cy);
    // Inside the cell box
    for (const d of g.dots) {
      expect(d.cx).toBeGreaterThan(0);
      expect(d.cx).toBeLessThan(g.width);
      expect(d.cy).toBeLessThan(g.height);
    }
  });
});

describe('drawBrailleCell', () => {
  test.each(ALL_CELLS.map((c) => [cellKey(c) || 'blank', c]))('cell %s raises exactly its dots', (_k, cell) => {
    const r = recorder();
    drawBrailleCell(r.doc, cell, 100, 200, { size: 'small' });
    const g = brailleCellGeometry('small');
    expect(r.all).toHaveLength(6);
    const expected = g.dots.filter((d) => cell.includes(d.dot)).map((d) => `${100 + d.cx},${200 + d.cy}`);
    expect(r.raised.map((p) => `${p.x},${p.y}`).sort()).toEqual(expected.sort());
  });

  test('the letter f (dots 1, 2, 4): two dots on the left top and middle, one on the right top', () => {
    const r = recorder();
    drawBrailleCell(r.doc, [1, 2, 4], 0, 0, { size: 'medium' });
    const xs = [...new Set(r.raised.map((p) => p.x))].sort((a, b) => a - b);
    const left = r.raised.filter((p) => p.x === xs[0]).map((p) => p.y);
    const right = r.raised.filter((p) => p.x === xs[1]).map((p) => p.y);
    expect(left).toHaveLength(2);
    expect(right).toHaveLength(1);
    expect(right[0]).toBe(Math.min(...left));
  });
});

/* Ground truth from liblouis en-ueb-g1 (unicode.dis). */
const U = (s: string): Cell[] => unicodeToCells(s);

describe('answerCells (worksheet answer key and practice-drill boxes)', () => {
  test.each([
    ['B', U('⠃')], // a letter named in an answer: the letter's cell
    ['b', U('⠃')],
    ['8', U('⠼⠓')], // a digit: numeric indicator + h (the old code drew h alone)
    ['404', U('⠼⠙⠚⠙')],
    ['dots 1, 2, 4', U('⠋')], // a dot description: the cells it describes (the old drill drew 4 boxes for "DOTS")
    ['dot 6, then dots 1, 2', U('⠠⠃')],
  ])('%s', (answer, cells) => {
    expect(cellsKey(answerCells(answer)!)).toBe(cellsKey(cells));
  });
  test('word answers are not drawn: their cells differ between uncontracted and contracted braille', () => {
    for (const w of ['and', 'but', 'Cat', 'the cat', 'it']) expect(answerCells(w)).toBeNull();
  });
  test('untranscribable text gives null', () => {
    expect(answerCells('emoji 🙂')).toBeNull();
  });
});

describe('brailleWordCells / drawBrailleWord', () => {
  test('capitals and numbers get their indicators (the old code drew A1 as two a cells)', () => {
    const cells = brailleWordCells('A1')!;
    expect(cellsKey(cells.map((c) => c!.cell))).toBe(cellsKey(U('⠠⠁⠼⠁')));
    expect(cells.map((c) => c!.print)).toEqual(['', 'A', '', '1']);
  });
  test('spaces are gaps', () => {
    expect(brailleWordCells('a b')!.map((c) => (c ? cellKey(c.cell) : null))).toEqual(['1', null, '12']);
  });
  test('drawBrailleWord draws every cell and labels the letters only', () => {
    const r = recorder();
    drawBrailleWord(r.doc, 'Hi', 0, 0);
    expect(r.all).toHaveLength(18);
    expect(r.labels).toEqual(['H', 'i']);
  });
});
