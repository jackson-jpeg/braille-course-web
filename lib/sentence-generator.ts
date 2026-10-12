/**
 * Turns the curated sentences of lib/sentence-bank.ts into braille tokens for the Sentence
 * Decoder. Nothing is generated at random: every sentence the game can show is in the bank.
 *
 * - Uncontracted sentences: transcribeTokens() from lib/braille/transcribe.ts.
 * - Contracted sentences: each word is built with contractedWord() from its listed pieces; a
 *   capitalized word gets the capital indicator for one letter (ICEB 8.3.1) or, for a whole word in
 *   capitals, the capitalized word indicator (8.4); punctuation comes from lib/braille/ueb.ts.
 */
import { type Cell, type Sign, INDICATORS, PUNCTUATION } from '@/lib/braille/ueb';
import { transcribeTokens } from '@/lib/braille/transcribe';
import { contractedWord } from '@/lib/braille/contracted';
import type { ContractedSentenceSpec } from './sentence-bank';

export type DecoderTokenKind = 'letter' | 'digit' | 'indicator' | 'punctuation' | 'symbol' | 'space' | 'contraction';

export interface DecoderToken {
  kind: DecoderTokenKind;
  cells: Cell[];
  /** Print this token stands for ("" for indicators). */
  print: string;
}

export interface DecoderSentence {
  /** The print sentence (the answer). */
  print: string;
  table: 'g1' | 'g2';
  tokens: DecoderToken[];
  cells: Cell[];
}

export function uncontractedSentence(print: string): DecoderSentence {
  const tokens: DecoderToken[] = transcribeTokens(print).map((t) => ({ kind: t.kind, cells: t.cells, print: t.print }));
  return { print, table: 'g1', tokens, cells: tokens.flatMap((t) => t.cells) };
}

const PUNCT: Readonly<Record<string, Sign>> = {
  '.': PUNCTUATION.period,
  ',': PUNCTUATION.comma,
  '?': PUNCTUATION.question,
  '!': PUNCTUATION.exclamation,
  '“': PUNCTUATION.openQuote,
  '”': PUNCTUATION.closeQuote,
  '(': PUNCTUATION.openParen,
  ')': PUNCTUATION.closeParen,
};

function punct(ch: string): DecoderToken {
  const sign = PUNCT[ch];
  if (!sign) throw new Error(`sentence-generator: no punctuation sign for "${ch}"`);
  return { kind: 'punctuation', cells: [...sign.cells], print: ch };
}

function pieceSpecs(spec: string): string[] {
  const parts = spec.trim().split(/\s+/);
  // Inside a longer word "be" and "in" are the lower groupsigns (ICEB 10.6); alone, the wordsigns (10.5).
  return parts.map((p) => (parts.length > 1 && (p === 'be' || p === 'in') ? `${p}/lower-groupsign` : p));
}

export function contractedSentence({ print, pieces }: ContractedSentenceSpec): DecoderSentence {
  const chunks = print.split(' ');
  const wordSpecs = pieces.split('|');
  if (chunks.length !== wordSpecs.length) {
    throw new Error(`sentence-generator: "${print}" has ${chunks.length} words but ${wordSpecs.length} piece lists`);
  }
  const tokens: DecoderToken[] = [];
  chunks.forEach((chunk, i) => {
    if (i > 0) tokens.push({ kind: 'space', cells: [[]], print: ' ' });
    const m = chunk.match(/^([“(]*)([A-Za-z]+)([.,?!”)]*)$/);
    if (!m) throw new Error(`sentence-generator: cannot split "${chunk}" in "${print}"`);
    const [, lead, letters, trail] = m;
    for (const ch of lead) tokens.push(punct(ch));

    const lower = letters.toLowerCase();
    if (letters.length > 1 && letters === letters.toUpperCase()) {
      tokens.push({ kind: 'indicator', cells: [...INDICATORS.capitalWord.cells], print: '' });
    } else if (letters[0] !== lower[0]) {
      if (letters.slice(1) !== lower.slice(1)) throw new Error(`sentence-generator: mixed capitals in "${chunk}"`);
      tokens.push({ kind: 'indicator', cells: [...INDICATORS.capitalLetter.cells], print: '' });
    }
    const w = contractedWord(lower, pieceSpecs(wordSpecs[i]));
    for (const p of w.pieces) {
      tokens.push({ kind: p.contraction ? 'contraction' : 'letter', cells: [...p.cells], print: p.print });
    }
    for (const ch of trail) tokens.push(punct(ch));
  });
  return { print, table: 'g2', tokens, cells: tokens.flatMap((t) => t.cells) };
}
