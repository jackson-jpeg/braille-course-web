/**
 * Print → uncontracted (grade 1) Unified English Braille, cell by cell.
 *
 * This is the only way the site turns print into braille. It implements exactly the rules the
 * beginner track teaches and throws on anything else, so a game can never show a made-up cell.
 *
 * Rules implemented (ICEB Rules of UEB, 2024):
 *   - 2.5.5 / 5.11.1  uncontracted text uses no grade 1 indicators except where required for
 *                     other reasons (a lowercase a–j after a digit, a question mark in an
 *                     unusual position). In particular a letter standing alone ("b", "x") is
 *                     written as the plain letter. This is the site's uncontracted convention.
 *   - 8.3             a capital letter is dot 6 + the letter.
 *   - 8.4             the capitalized word indicator covers a letters-sequence; a non-letter
 *                     (apostrophe, hyphen, digit…) ends it (8.4.2), so DON'T → ⠠⠠⠙⠕⠝⠄⠠⠞.
 *   - 8.5 / 8.6       three or more capitalized symbols-sequences in a row take the capitalized
 *                     passage indicator and end with the capitals terminator; a capitalized run
 *                     followed by lowercase letters in the same word ends with the terminator
 *                     (ABCs → ⠠⠠⠁⠃⠉⠠⠄⠎).
 *   - 6.1–6.5         numeric indicator before a number; period and comma inside a number stay
 *                     in numeric mode; any other symbol or a space ends it; a lowercase a–j right
 *                     after a digit, period or comma needs the grade 1 indicator (3b → ⠼⠉⠰⠃).
 *   - 6.4             a period followed by a number precedes the numeric indicator unless it is
 *                     clearly a decimal point.
 *   - 7.1–7.6, 3.x    punctuation and symbols from lib/braille/ueb.ts.
 *   - 7.5.3 / 7.5.4   a question mark at the start of a symbols-sequence (or after a hyphen or
 *                     dash) takes the grade 1 indicator.
 *   - 7.6.5           straight double quotes are treated as directional (opening / closing).
 */

import {
  type Cell,
  type Sign,
  DIGIT_CELLS,
  INDICATORS,
  LETTER_CELLS,
  PUNCTUATION,
  SYMBOLS,
  cellsToUnicode,
} from './ueb';

export type TokenKind = 'letter' | 'digit' | 'indicator' | 'punctuation' | 'symbol' | 'space';

/** One piece of the braille output: a sign (one or more cells) and the print it came from. */
export interface BrailleToken {
  kind: TokenKind;
  /** Sign id from lib/braille/ueb.ts (e.g. "letter-a", "capitalWord", "period"), or "space". */
  signId: string;
  cells: Cell[];
  /** The print characters this token represents ("" for indicators). */
  print: string;
  /** Plain-language name, e.g. "capital letter indicator", "letter h", "digit 3". */
  name: string;
}

export class TranscriptionError extends Error {}

const BLANK: Cell = [];
const OPENERS = new Set(['(', '“', '‘', '"']);
const CLOSER_TO_OPENER: Readonly<Record<string, string>> = { ')': '(', '”': '“', '’': '‘', '"': '"' };
const LETTER_RE = /[A-Za-z]/;
const DIGIT_RE = /[0-9]/;
const LOWER_A_TO_J = /[a-j]/;

function signToken(sign: Sign, print: string): BrailleToken {
  return {
    kind: sign.kind as TokenKind,
    signId: sign.id,
    cells: [...sign.cells],
    print,
    name: sign.name,
  };
}

function letterToken(ch: string): BrailleToken {
  const lower = ch.toLowerCase();
  return {
    kind: 'letter',
    signId: `letter-${lower}`,
    cells: [LETTER_CELLS[lower]],
    print: ch,
    name: `letter ${lower}`,
  };
}

function digitToken(ch: string): BrailleToken {
  return { kind: 'digit', signId: `digit-${ch}`, cells: [DIGIT_CELLS[ch]], print: ch, name: `digit ${ch}` };
}

/** Print characters that map straight to one punctuation mark or symbol. */
const SIMPLE: Readonly<Record<string, Sign>> = {
  ',': PUNCTUATION.comma,
  ';': PUNCTUATION.semicolon,
  ':': PUNCTUATION.colon,
  '!': PUNCTUATION.exclamation,
  '-': PUNCTUATION.hyphen,
  '–': PUNCTUATION.dash,
  '—': PUNCTUATION.dash,
  '(': PUNCTUATION.openParen,
  ')': PUNCTUATION.closeParen,
  '/': PUNCTUATION.slash,
  '“': PUNCTUATION.openQuote,
  '”': PUNCTUATION.closeQuote,
  '‘': PUNCTUATION.openSingleQuote,
  '…': PUNCTUATION.ellipsis,
  '&': SYMBOLS.ampersand,
  '@': SYMBOLS.at,
  $: SYMBOLS.dollar,
  '%': SYMBOLS.percent,
  '+': SYMBOLS.plus,
  '−': SYMBOLS.minus,
  '×': SYMBOLS.times,
  '÷': SYMBOLS.divide,
  '=': SYMBOLS.equals,
};

/** A symbols-sequence is "capitalized" when it has letters and none of them are lowercase. */
function isCapitalized(seq: string): boolean {
  return LETTER_RE.test(seq) && seq === seq.toUpperCase();
}

function hasLetters(seq: string): boolean {
  return LETTER_RE.test(seq);
}

/**
 * Find capitalized passages: maximal runs of symbols-sequences that are capitalized (or have no
 * letters, like "1975"), containing at least three capitalized sequences, starting and ending on
 * a capitalized one. Returns [firstWordIndex, lastWordIndex] pairs over the word list.
 */
function findPassages(words: string[]): [number, number][] {
  const passages: [number, number][] = [];
  let i = 0;
  while (i < words.length) {
    if (!isCapitalized(words[i])) {
      i++;
      continue;
    }
    let j = i;
    let lastCap = i;
    let capCount = 0;
    while (j < words.length && (isCapitalized(words[j]) || !hasLetters(words[j]))) {
      if (isCapitalized(words[j])) {
        capCount++;
        lastCap = j;
      }
      j++;
    }
    if (capCount >= 3) passages.push([i, lastCap]);
    i = lastCap + 1;
  }
  return passages;
}

export function transcribeTokens(text: string): BrailleToken[] {
  if (text !== text.normalize('NFC')) text = text.normalize('NFC');
  const out: BrailleToken[] = [];
  const words = text.split(' ');
  const passages = findPassages(words);
  const passageStart = new Map(passages.map(([s, e]) => [s, e]));
  let passageEnd = -1; // index of the last word of the passage we are in, or -1

  let doubleQuoteOpen = false;
  let singleQuoteOpen = false;

  words.forEach((word, wi) => {
    if (wi > 0) out.push({ kind: 'space', signId: 'space', cells: [BLANK], print: ' ', name: 'space' });
    if (word === '') return; // consecutive spaces: one blank cell each

    let inPassage = passageEnd >= wi;
    let passageStartsHere = false;
    if (passageStart.has(wi)) {
      passageEnd = passageStart.get(wi)!;
      inPassage = true;
      passageStartsHere = true;
    }
    const passageEndsHere = inPassage && passageEnd === wi;

    // Letters-sequences in this word, and where each capital run begins.
    const chars = [...word];
    const capPrefix = new Map<number, BrailleToken[]>(); // index → indicator tokens before it
    const terminatorAfter = new Set<number>(); // index → capitals terminator after it
    if (!inPassage) {
      let k = 0;
      while (k < chars.length) {
        if (!LETTER_RE.test(chars[k])) {
          k++;
          continue;
        }
        let end = k;
        while (end < chars.length && LETTER_RE.test(chars[end])) end++;
        // Split the letters-sequence [k, end) into case runs.
        let r = k;
        while (r < end) {
          const upper = chars[r] !== chars[r].toLowerCase();
          let rEnd = r;
          while (rEnd < end && (chars[rEnd] !== chars[rEnd].toLowerCase()) === upper) rEnd++;
          if (upper) {
            const runLength = rEnd - r;
            if (runLength >= 2) {
              capPrefix.set(r, [signToken(INDICATORS.capitalWord, '')]);
              if (rEnd < end) terminatorAfter.add(rEnd - 1);
            } else {
              capPrefix.set(r, [signToken(INDICATORS.capitalLetter, '')]);
            }
          }
          r = rEnd;
        }
        k = end;
      }
    } else {
      for (const ch of chars) {
        if (LETTER_RE.test(ch) && ch === ch.toLowerCase()) {
          throw new TranscriptionError(`lowercase letter inside a capitalized passage: "${text}"`);
        }
      }
    }

    // Where the passage indicator / terminator go within this word.
    const firstLetter = chars.findIndex((c) => LETTER_RE.test(c));
    let lastLetter = -1;
    for (let k = chars.length - 1; k >= 0; k--) {
      if (LETTER_RE.test(chars[k])) {
        lastLetter = k;
        break;
      }
    }
    // Terminator (8.6.1, 8.6.2): after trailing punctuation, but closing marks whose opening mark
    // came before the passage stay outside it (nesting), as in ⠦⠠⠠⠠⠊ ⠺ ⠝⠖⠠⠄⠴.
    let terminatorIndex = -1;
    if (passageEndsHere) {
      const [s] = passages.find(([, e]) => e === wi)!;
      const first = [...words[s]];
      const passageText = [
        first.slice(first.findIndex((c) => LETTER_RE.test(c))).join(''),
        ...words.slice(s + 1, wi + 1),
      ].join(' ');
      terminatorIndex = chars.length - 1;
      while (terminatorIndex > lastLetter) {
        const closer = chars[terminatorIndex];
        const opener = CLOSER_TO_OPENER[closer];
        if (!opener) break;
        const openedInside =
          closer === '"'
            ? (passageText.split('"').length - 1) % 2 === 0
            : passageText.slice(0, passageText.length - (chars.length - terminatorIndex)).includes(opener);
        if (openedInside) break;
        terminatorIndex--;
      }
    }

    let numeric = false; // numeric mode (6.1–6.3)
    let afterNumericSymbol = false; // previous symbol was a digit, or . / , inside a number

    for (let k = 0; k < chars.length; k++) {
      const ch = chars[k];
      const next = chars[k + 1] ?? '';
      const prev = chars[k - 1] ?? '';

      if (passageStartsHere && k === firstLetter) out.push(signToken(INDICATORS.capitalPassage, ''));

      if (DIGIT_RE.test(ch)) {
        if (!numeric) out.push(signToken(INDICATORS.numeric, ''));
        numeric = true;
        afterNumericSymbol = true;
        out.push(digitToken(ch));
      } else if (LETTER_RE.test(ch)) {
        if (afterNumericSymbol && LOWER_A_TO_J.test(ch)) out.push(signToken(INDICATORS.grade1Symbol, ''));
        numeric = false;
        afterNumericSymbol = false;
        out.push(...(capPrefix.get(k) ?? []));
        out.push(letterToken(ch));
        if (terminatorAfter.has(k)) out.push(signToken(INDICATORS.capitalsTerminator, ''));
      } else if ((ch === '.' || ch === ',') && numeric && DIGIT_RE.test(next)) {
        // Decimal point or digit-group comma: stays in numeric mode (6.2.1).
        out.push(signToken(ch === '.' ? PUNCTUATION.period : PUNCTUATION.comma, ch));
        afterNumericSymbol = true;
      } else if (ch === '.' && !numeric && DIGIT_RE.test(next) && !LETTER_RE.test(prev)) {
        // A number that starts with a decimal point, like .7 (6.2.1 example ⠼⠲⠛).
        out.push(signToken(INDICATORS.numeric, ''));
        out.push(signToken(PUNCTUATION.period, ch));
        numeric = true;
        afterNumericSymbol = true;
      } else if (ch === '.' && next === '.' && chars[k + 2] === '.') {
        out.push(signToken(PUNCTUATION.ellipsis, '...'));
        k += 2;
        numeric = false;
        afterNumericSymbol = false;
      } else {
        const wasNumericSymbol = (ch === '.' || ch === ',') && numeric;
        numeric = false;
        afterNumericSymbol = wasNumericSymbol;
        out.push(punctuationToken(ch, prev, next, k, chars));
      }

      if (k === terminatorIndex) out.push(signToken(INDICATORS.capitalsTerminator, ''));
    }

    if (passageEndsHere) passageEnd = -1;
  });

  return out;

  function punctuationToken(ch: string, prev: string, next: string, k: number, chars: string[]): BrailleToken {
    if (ch === '.') return signToken(PUNCTUATION.period, ch);
    if (ch === '?') {
      // 7.5.3 / 7.5.4: a question mark at the start of a sequence (after only opening marks).
      const before = chars.slice(0, k);
      const unusual = before.every((c) => OPENERS.has(c)) || prev === '-' || prev === '–' || prev === '—';
      if (unusual) {
        const t = signToken(PUNCTUATION.question, ch);
        return {
          ...t,
          cells: [...INDICATORS.grade1Symbol.cells, ...t.cells],
          name: 'grade 1 indicator + question mark',
        };
      }
      return signToken(PUNCTUATION.question, ch);
    }
    if (ch === '"') {
      const opening = !doubleQuoteOpen;
      doubleQuoteOpen = !doubleQuoteOpen;
      return signToken(opening ? PUNCTUATION.openQuote : PUNCTUATION.closeQuote, ch);
    }
    if (ch === '“' || ch === '‘') {
      // 7.6.7: a one-cell opening quote is only read as a quote at the start of a word; elsewhere
      // the rulebook requires a different (two-cell) form, which the site never shows.
      if (!chars.slice(0, k).every((c) => OPENERS.has(c)))
        throw new TranscriptionError(`opening quotation mark inside a word is not supported (ICEB 7.6.7): "${text}"`);
    }
    if (ch === '”' && (k === 0 || chars.slice(0, k).every((c) => OPENERS.has(c))))
      // 7.6.8: a closing quote standing alone would be read as the wordsign "was".
      throw new TranscriptionError(
        `closing quotation mark at the start of a word is not supported (ICEB 7.6.8): "${text}"`,
      );
    if (ch === '“') doubleQuoteOpen = true;
    if (ch === '”') doubleQuoteOpen = false;
    if (ch === '‘') singleQuoteOpen = true;
    if (ch === '’' || ch === "'") {
      // Apostrophe unless it closes an open single quote at the end of a word (7.6.15).
      if (singleQuoteOpen && !LETTER_RE.test(next)) {
        singleQuoteOpen = false;
        return signToken(PUNCTUATION.closeSingleQuote, ch);
      }
      return signToken(PUNCTUATION.apostrophe, ch);
    }
    const sign = SIMPLE[ch];
    if (!sign) throw new TranscriptionError(`no braille sign for "${ch}" in "${text}"`);
    return signToken(sign, ch);
  }
}

/** Print → cells (uncontracted UEB). Throws TranscriptionError on unsupported input. */
export function transcribe(text: string): Cell[] {
  return transcribeTokens(text).flatMap((t) => t.cells);
}

/** Print → Unicode braille string (uncontracted UEB). */
export function transcribeToUnicode(text: string): string {
  return cellsToUnicode(transcribe(text));
}
