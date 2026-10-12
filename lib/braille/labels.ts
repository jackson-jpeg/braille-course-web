/**
 * Captions next to drawn cells must say what the cell actually is.
 *
 * A plain letter cell is a lowercase letter. A capital needs the capital letter indicator in front
 * of it (ICEB 8.3), so labelling the cell for a with "A" (or a digit chart with "1(A)") teaches
 * that the cell means the capital letter, which it does not. This check is shared by the jsdom
 * rendering tests (__tests__/helpers/cells.ts) and the real-browser check
 * (scripts/braille/check-rendered-cells.mjs), which run it on every drawn cell.
 */
import { ALPHABET, INDICATORS, LETTER_CELLS } from './ueb';

const CAPITAL = INDICATORS.capitalLetter.cells[0].join('');
const LETTER_BY_DOTS = new Map(ALPHABET.map((l) => [LETTER_CELLS[l].join(''), l]));

/** Uppercase letters in a caption that are presented as the name of the cell. */
function uppercaseNames(caption: string): string[] {
  const t = caption.replace(/\s+/g, ' ').trim();
  const out: string[] = [];
  // "A", "(A)", "letter A", "Letter A", "1(A)", "1 = A", "A:"
  const whole = t.match(/^(?:letter )?\(?([A-Z])\)?:?$/i);
  if (whole && /[A-Z]/.test(whole[1])) out.push(whole[1]);
  for (const m of t.matchAll(/\b[0-9]\s*(?:\(\s*([A-Z])\s*\)|=\s*([A-Z])\b)/g)) out.push(m[1] ?? m[2]);
  return out;
}

/**
 * Problem with a cell's caption, or null. `dots` is the cell's raised dots ("12"), `previous` the
 * dots of the cell drawn just before it in the same word (to see a capital indicator).
 */
export function cellLabelProblem(dots: string, caption: string, previous?: string): string | null {
  const letter = LETTER_BY_DOTS.get(dots);
  if (!letter) return null;
  for (const name of uppercaseNames(caption)) {
    if (name.toLowerCase() === letter && previous !== CAPITAL)
      return `the plain cell for "${letter}" is captioned "${caption.trim()}": an uppercase letter needs the capital letter indicator`;
  }
  return null;
}
