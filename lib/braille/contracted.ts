/**
 * Contracted (grade 2) words for the contraction lessons and games.
 *
 * A word is written as the list of pieces a reader sees: single letters, or contractions named by
 * their print text (optionally "text/kind" to pick one kind, e.g. "be/lower-groupsign"). The
 * cells are built from lib/braille/ueb.ts and every word is checked cell by cell against
 * liblouis en-ueb-g2.ctb (tests/fixtures/liblouis-oracle.json). A word whose real contracted form
 * uses a contraction this site does not teach fails that test, so it cannot slip in.
 */
import { type Cell, type Contraction, type ContractionKind, CONTRACTIONS, LETTER_CELLS, getContraction } from './ueb';

export interface ContractedPiece {
  /** Print letters this piece covers. */
  print: string;
  cells: readonly Cell[];
  /** The contraction used, or undefined for a plain letter. */
  contraction?: Contraction;
}

export function piece(spec: string): ContractedPiece {
  const [text, kind] = spec.split('/') as [string, ContractionKind | undefined];
  if (text.length === 1 && !kind && LETTER_CELLS[text]) return { print: text, cells: [LETTER_CELLS[text]] };
  const c = getContraction(text, kind);
  return { print: c.text, cells: c.cells, contraction: c };
}

export interface ContractedWord {
  word: string;
  pieces: ContractedPiece[];
  cells: Cell[];
}

/** Build a contracted word from piece specs; the pieces must spell the word. */
export function contractedWord(word: string, specs: string[]): ContractedWord {
  const pieces = specs.map(piece);
  const spelled = pieces.map((p) => p.print).join('');
  if (spelled !== word) throw new Error(`contracted: pieces spell "${spelled}", not "${word}"`);
  return { word, pieces, cells: pieces.flatMap((p) => [...p.cells]) };
}

export { CONTRACTIONS };
