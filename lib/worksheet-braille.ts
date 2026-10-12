/**
 * Braille for AI-generated worksheets, quizzes and handouts: computed here from lib/braille, never
 * taken from the model.
 *
 * The model only writes print (a letter, number or word) and marks which items show braille. This
 * module turns that print into cells for the worksheet's grade:
 *   - uncontracted: the site transcriber (lib/braille/transcribe.ts);
 *   - contracted:   numbers via the transcriber (numeric mode is the same in both grades, ICEB 6);
 *                   a lowercase letter standing alone gets the grade 1 indicator when the letter is
 *                   also an alphabetic wordsign (ICEB 5.7.1, 10.1); words come only from lists whose
 *                   contracted form was verified with liblouis en-ueb-g2 (the Contraction Sprint words
 *                   and lib/braille/data/plain-contracted-words.json). Anything else returns null, and
 *                   the item is dropped rather than drawn in a form that might be wrong.
 * brailleInventory() lists every contracted form this module can produce, so the liblouis oracle
 * test checks all of them.
 */
import { type Cell, ALPHABETIC_WORDSIGNS, INDICATORS, LETTER_CELLS } from '@/lib/braille/ueb';
import { TranscriptionError, transcribe } from '@/lib/braille/transcribe';
import { contractionWords, standaloneWords } from '@/lib/contraction-words';
import type { InventoryItem } from '@/lib/braille/inventory';
import plainWords from '@/lib/braille/data/plain-contracted-words.json';

export type BrailleGrade = 'uncontracted' | 'contracted';

export const GRADE_LABEL: Readonly<Record<BrailleGrade, string>> = {
  uncontracted: 'uncontracted (grade 1)',
  contracted: 'contracted (grade 2)',
};

/** The admin "Difficulty / Grade Level" picker: beginner is grade 1 only; the others include contractions. */
export function gradeForDifficulty(difficulty: string | undefined): BrailleGrade {
  return difficulty === 'beginner' ? 'uncontracted' : 'contracted';
}

export function isBrailleGrade(x: unknown): x is BrailleGrade {
  return x === 'uncontracted' || x === 'contracted';
}

const WORDSIGN_LETTERS = new Set(ALPHABETIC_WORDSIGNS.map(([, l]) => l));

/** Contracted words verified against liblouis: Contraction Sprint words first (they use contractions). */
const CONTRACTED_LEXICON: ReadonlyMap<string, readonly Cell[]> = (() => {
  const m = new Map<string, readonly Cell[]>();
  for (const w of plainWords.words) m.set(w, transcribe(w));
  for (const w of [...standaloneWords, ...contractionWords]) m.set(w.word, w.cells);
  return m;
})();

const NUMBER_RE = /^[0-9]{1,9}(?:[.,][0-9]{1,9})*$/;

/**
 * Cells for a worksheet's print item in the given grade, or null when the site cannot vouch for
 * the braille (then the item is not shown).
 */
export function worksheetBraille(print: string, grade: BrailleGrade): Cell[] | null {
  const text = print.trim();
  if (!text || text.length > 40) return null;
  if (grade === 'uncontracted') {
    try {
      return transcribe(text);
    } catch (e) {
      if (e instanceof TranscriptionError) return null;
      throw e;
    }
  }
  if (NUMBER_RE.test(text)) return transcribe(text);
  // An initial capital adds the capital indicator before the letter (ICEB 8.3); the grade 1
  // indicator, when needed, comes first (ICEB 5.7.1).
  const capital = /^[A-Z][a-z]*$/.test(text) ? [...INDICATORS.capitalLetter.cells] : [];
  const lower = capital.length ? text.toLowerCase() : text;
  if (/^[a-z]$/.test(lower)) {
    const letter = LETTER_CELLS[lower];
    return WORDSIGN_LETTERS.has(lower) ? [...INDICATORS.grade1Symbol.cells, ...capital, letter] : [...capital, letter];
  }
  const word = CONTRACTED_LEXICON.get(lower);
  return word && (capital.length || lower === text) ? [...capital, ...word] : null;
}

/** Every contracted form this module can draw, for the liblouis oracle; plus number samples. */
export function brailleInventory(): InventoryItem[] {
  const items: InventoryItem[] = [];
  const where = 'admin:worksheet';
  for (const l of 'abcdefghijklmnopqrstuvwxyz')
    for (const p of [l, l.toUpperCase()])
      items.push({ where, print: p, table: 'g2', cells: worksheetBraille(p, 'contracted')! });
  for (const w of CONTRACTED_LEXICON.keys())
    for (const p of [w, w[0].toUpperCase() + w.slice(1)])
      items.push({ where, print: p, table: 'g2', cells: worksheetBraille(p, 'contracted')! });
  for (const n of ['0', '7', '42', '365', '1000', '1,000', '3.5', '12,345.67', '2026'])
    items.push({ where, print: n, table: 'g2', cells: worksheetBraille(n, 'contracted')! });
  return items;
}
