/**
 * UEB accuracy suite. A wrong dot pattern on a braille teaching site is the worst possible bug,
 * so every cell in lib/ueb.ts is checked two independent ways:
 *
 *  1. Against the official UEB charts (BANA / ICEB), typed below as Unicode braille characters —
 *     a different encoding from the dot-number lists in lib/ueb.ts, so a typo in one cannot
 *     silently agree with the other.
 *  2. Against liblouis (the reference braille translator), via __tests__/fixtures/ueb-oracle.json.
 *     Regenerate with `npx tsx scripts/generate-ueb-oracle.ts` (needs liblouis installed).
 *
 * Do not loosen these tests to make them pass. Fix the data.
 */

import path from 'path';
import oracle from '../fixtures/ueb-oracle.json';
import runtimeContracted from '../../lib/data/ueb-contracted.json';
import { PUNCTUATION_SAMPLES, GROUPSIGN_SAMPLES, TRANSCRIBE_SAMPLES } from '../fixtures/ueb-oracle-inputs';
import {
  ALPHABET,
  CONTRACTIONS,
  DIGITS,
  DIGIT_LETTER,
  INDICATORS,
  LETTERS,
  PUNCTUATION,
  cellsToUnicode,
  fromGrid,
  fromUnicode,
  getContraction,
  toGrid,
  toUnicode,
  transcribe,
  transcribeToUnicode,
} from '../../lib/ueb';
import { uncontractedCorpus, contractedCorpus } from '../../lib/ueb-corpus';
import { ornamentCorpus } from '../../lib/ueb-ornaments';
import { CONTRACTION_EXAMPLES } from '../../lib/games/contracted-content';
import { contractionWords } from '../../lib/contraction-words';

const g1 = oracle.g1 as Record<string, string>;
const g2 = oracle.g2 as Record<string, string>;

/* ── 1. Official UEB chart, as Unicode braille ───────────────────────────── */

const OFFICIAL_LETTERS: Record<string, string> = {
  a: '⠁',
  b: '⠃',
  c: '⠉',
  d: '⠙',
  e: '⠑',
  f: '⠋',
  g: '⠛',
  h: '⠓',
  i: '⠊',
  j: '⠚',
  k: '⠅',
  l: '⠇',
  m: '⠍',
  n: '⠝',
  o: '⠕',
  p: '⠏',
  q: '⠟',
  r: '⠗',
  s: '⠎',
  t: '⠞',
  u: '⠥',
  v: '⠧',
  w: '⠺',
  x: '⠭',
  y: '⠽',
  z: '⠵',
};

const OFFICIAL_DIGITS: Record<string, string> = {
  '1': '⠼⠁',
  '2': '⠼⠃',
  '3': '⠼⠉',
  '4': '⠼⠙',
  '5': '⠼⠑',
  '6': '⠼⠋',
  '7': '⠼⠛',
  '8': '⠼⠓',
  '9': '⠼⠊',
  '0': '⠼⠚',
};

const OFFICIAL_INDICATORS: Record<string, string> = {
  capital: '⠠',
  capitalWord: '⠠⠠',
  capitalPassage: '⠠⠠⠠',
  capitalTerminator: '⠠⠄',
  numeric: '⠼',
  grade1: '⠰',
  grade1Word: '⠰⠰',
};

const OFFICIAL_PUNCTUATION: Record<string, string> = {
  period: '⠲',
  comma: '⠂',
  question: '⠦',
  exclamation: '⠖',
  apostrophe: '⠄',
  hyphen: '⠤',
  colon: '⠒',
  semicolon: '⠆',
  openQuote: '⠦',
  closeQuote: '⠴',
  dash: '⠠⠤',
  openParen: '⠐⠣',
  closeParen: '⠐⠜',
  slash: '⠸⠌',
  ampersand: '⠈⠯',
};

/** key = `${kind}:${text}` */
const OFFICIAL_CONTRACTIONS: Record<string, string> = {
  'alphabetic-wordsign:but': '⠃',
  'alphabetic-wordsign:can': '⠉',
  'alphabetic-wordsign:do': '⠙',
  'alphabetic-wordsign:every': '⠑',
  'alphabetic-wordsign:from': '⠋',
  'alphabetic-wordsign:go': '⠛',
  'alphabetic-wordsign:have': '⠓',
  'alphabetic-wordsign:just': '⠚',
  'alphabetic-wordsign:knowledge': '⠅',
  'alphabetic-wordsign:like': '⠇',
  'alphabetic-wordsign:more': '⠍',
  'alphabetic-wordsign:not': '⠝',
  'alphabetic-wordsign:people': '⠏',
  'alphabetic-wordsign:quite': '⠟',
  'alphabetic-wordsign:rather': '⠗',
  'alphabetic-wordsign:so': '⠎',
  'alphabetic-wordsign:that': '⠞',
  'alphabetic-wordsign:us': '⠥',
  'alphabetic-wordsign:very': '⠧',
  'alphabetic-wordsign:will': '⠺',
  'alphabetic-wordsign:it': '⠭',
  'alphabetic-wordsign:you': '⠽',
  'alphabetic-wordsign:as': '⠵',
  'strong-contraction:and': '⠯',
  'strong-contraction:for': '⠿',
  'strong-contraction:of': '⠷',
  'strong-contraction:the': '⠮',
  'strong-contraction:with': '⠾',
  'strong-groupsign:ch': '⠡',
  'strong-groupsign:gh': '⠣',
  'strong-groupsign:sh': '⠩',
  'strong-groupsign:th': '⠹',
  'strong-groupsign:wh': '⠱',
  'strong-groupsign:ed': '⠫',
  'strong-groupsign:er': '⠻',
  'strong-groupsign:ou': '⠳',
  'strong-groupsign:ow': '⠪',
  'strong-groupsign:st': '⠌',
  'strong-groupsign:ar': '⠜',
  'strong-groupsign:ing': '⠬',
  'strong-wordsign:child': '⠡',
  'strong-wordsign:shall': '⠩',
  'strong-wordsign:this': '⠹',
  'strong-wordsign:which': '⠱',
  'strong-wordsign:out': '⠳',
  'strong-wordsign:still': '⠌',
  'lower-groupsign:ea': '⠂',
  'lower-groupsign:bb': '⠆',
  'lower-groupsign:cc': '⠒',
  'lower-groupsign:ff': '⠖',
  'lower-groupsign:gg': '⠶',
  'lower-groupsign:be': '⠆',
  'lower-groupsign:con': '⠒',
  'lower-groupsign:dis': '⠲',
  'lower-groupsign:en': '⠢',
  'lower-groupsign:in': '⠔',
  'lower-wordsign:be': '⠆',
  'lower-wordsign:enough': '⠢',
  'lower-wordsign:were': '⠶',
  'lower-wordsign:his': '⠦',
  'lower-wordsign:in': '⠔',
  'lower-wordsign:was': '⠴',
};

describe('UEB letters', () => {
  test('defines exactly a–z', () => {
    expect(Object.keys(LETTERS).sort()).toEqual(ALPHABET);
  });

  test.each(ALPHABET)('%s matches the official chart', (l) => {
    expect(toUnicode(LETTERS[l])).toBe(OFFICIAL_LETTERS[l]);
  });

  test.each(ALPHABET)('%s matches liblouis', (l) => {
    expect(toUnicode(LETTERS[l])).toBe(g1[l]);
  });

  test('no two letters share a cell', () => {
    const cells = ALPHABET.map((l) => toUnicode(LETTERS[l]));
    expect(new Set(cells).size).toBe(26);
  });

  test('dot lists are ascending, unique and within 1–6', () => {
    for (const l of ALPHABET) {
      const d = [...LETTERS[l]];
      expect(d).toEqual([...new Set(d)].sort((a, b) => a - b));
      expect(d.every((n) => n >= 1 && n <= 6)).toBe(true);
    }
  });

  test('k–t are a–j plus dot 3; u, v, x, y, z are a–e plus dots 3 and 6', () => {
    'klmnopqrst'.split('').forEach((l, i) => {
      expect([...LETTERS[l]]).toEqual([...LETTERS['abcdefghij'[i]], 3].sort());
    });
    'uvxyz'.split('').forEach((l, i) => {
      expect([...LETTERS[l]]).toEqual([...LETTERS['abcde'[i]], 3, 6].sort());
    });
  });
});

describe('UEB numbers', () => {
  test.each(Object.keys(DIGIT_LETTER))('%s matches the official chart and liblouis', (d) => {
    const cells = cellsToUnicode([INDICATORS.numeric.cells[0], DIGITS[d]]);
    expect(cells).toBe(OFFICIAL_DIGITS[d]);
    expect(cells).toBe(g1[d]);
    expect(transcribeToUnicode(d)).toBe(g1[d]);
  });
});

describe('UEB indicators', () => {
  test.each(Object.entries(INDICATORS))('%s matches the official chart', (id, sign) => {
    expect(cellsToUnicode(sign.cells)).toBe(OFFICIAL_INDICATORS[id]);
  });
});

describe('UEB punctuation', () => {
  test('every sign has an official chart entry and a liblouis sample', () => {
    expect(PUNCTUATION.map((p) => p.id).sort()).toEqual(Object.keys(OFFICIAL_PUNCTUATION).sort());
    expect(Object.keys(PUNCTUATION_SAMPLES).sort()).toEqual(Object.keys(OFFICIAL_PUNCTUATION).sort());
  });

  test.each(PUNCTUATION.map((p) => [p.id, p] as const))('%s matches the official chart', (id, sign) => {
    expect(cellsToUnicode(sign.cells)).toBe(OFFICIAL_PUNCTUATION[id]);
  });

  test.each(Object.entries(PUNCTUATION_SAMPLES))('%s in "%s" matches liblouis', (id, sample) => {
    const ours = transcribeToUnicode(sample);
    expect(ours).toBe(g1[sample]);
    expect(ours).toContain(OFFICIAL_PUNCTUATION[id]);
  });
});

describe('UEB contractions', () => {
  test('every contraction has an official chart entry, and vice versa', () => {
    const ours = CONTRACTIONS.map((c) => `${c.kind}:${c.text}`).sort();
    expect(ours).toEqual(Object.keys(OFFICIAL_CONTRACTIONS).sort());
    expect(new Set(ours).size).toBe(ours.length);
  });

  test.each(CONTRACTIONS.map((c) => [`${c.kind}:${c.text}`, c] as const))('%s matches the official chart', (key, c) => {
    expect(toUnicode(c.dots)).toBe(OFFICIAL_CONTRACTIONS[key]);
  });

  const standalone = CONTRACTIONS.filter((c) => c.kind.endsWith('wordsign') || c.kind === 'strong-contraction');
  test.each(standalone.map((c) => [c.text, c] as const))('"%s" standing alone matches liblouis', (text, c) => {
    expect(g2[text]).toBe(toUnicode(c.dots));
  });

  const groupsigns = CONTRACTIONS.filter((c) => c.kind.endsWith('groupsign') || c.kind === 'strong-contraction');
  test.each(groupsigns.map((c) => [`${c.kind}:${c.text}`, c] as const))('%s inside a word matches liblouis', (key) => {
    const sample = GROUPSIGN_SAMPLES[key];
    expect(sample).toBeDefined();
    const [kind, text] = key.split(':');
    const expected = sample.parts
      .map((part) =>
        part === text
          ? toUnicode(getContraction(text, kind as never).dots)
          : toUnicode(LETTERS[part] ?? getContraction(part).dots),
      )
      .join('');
    expect(g2[sample.word]).toBe(expected);
  });

  test.each(CONTRACTION_EXAMPLES.map((e) => [`${e.kind}:${e.contraction}`, e] as const))(
    'example for %s really uses it (per liblouis)',
    (_key, e) => {
      const c = getContraction(e.contraction, e.kind as never);
      expect(g2[e.sentence]).toContain(toUnicode(c.dots));
    },
  );
});

describe('Contraction Sprint word list', () => {
  const pieceCell = (piece: string) => {
    if (/^[A-Z]$/.test(piece)) return toUnicode(LETTERS[piece.toLowerCase()]);
    const c = CONTRACTIONS.find((x) => x.text === piece);
    if (!c) throw new Error(`unknown piece ${piece}`);
    return toUnicode(c.dots);
  };
  test('every word is built the way liblouis contracts it', () => {
    const wrong = contractionWords
      .map((w) => [w.word, w.pieces.map(pieceCell).join(''), g2[w.word.toLowerCase()]])
      .filter(([, ours, theirs]) => ours !== theirs);
    expect(wrong).toEqual([]);
  });
});

describe('uncontracted transcription', () => {
  test.each(TRANSCRIBE_SAMPLES)('"%s" matches liblouis', (s) => {
    expect(transcribeToUnicode(s)).toBe(g1[s]);
  });

  test('every uncontracted string shown on the site matches liblouis', () => {
    const corpus = uncontractedCorpus();
    expect(corpus.length).toBeGreaterThan(100);
    const missing = corpus.filter((s) => !(s in g1));
    expect({ missingFromOracle_runGenerateUebOracle: missing }).toEqual({ missingFromOracle_runGenerateUebOracle: [] });
    const wrong = corpus.filter((s) => transcribeToUnicode(s) !== g1[s]).map((s) => [s, transcribeToUnicode(s), g1[s]]);
    expect(wrong).toEqual([]);
  });

  test('every decorative braille word in the source (eyebrows, emblems, footer) matches liblouis', () => {
    const ornaments = ornamentCorpus(path.join(__dirname, '../..'));
    expect(ornaments.length).toBeGreaterThan(10);
    const missing = ornaments.filter((s) => !(s in g1));
    expect({ missingFromOracle_runGenerateUebOracle: missing }).toEqual({ missingFromOracle_runGenerateUebOracle: [] });
    const wrong = ornaments
      .filter((s) => transcribeToUnicode(s) !== g1[s])
      .map((s) => [s, transcribeToUnicode(s), g1[s]]);
    expect(wrong).toEqual([]);
  });

  test('refuses characters it has no braille for', () => {
    expect(() => transcribe('a€b')).toThrow();
  });
});

describe('contracted text shown at runtime', () => {
  test('every contracted string has liblouis braille stored, identical to the oracle', () => {
    const stored = runtimeContracted.braille as Record<string, string>;
    for (const s of contractedCorpus()) {
      expect([s, stored[s]]).toEqual([s, g2[s]]);
      expect(stored[s]).toBeTruthy();
    }
  });
});

describe('conversions', () => {
  test('Unicode round-trips for all 64 cells', () => {
    for (let code = 0; code < 64; code++) {
      const ch = String.fromCharCode(0x2800 + code);
      expect(toUnicode(fromUnicode(ch))).toBe(ch);
    }
  });

  test('grid order is [1, 4, 2, 5, 3, 6] and round-trips', () => {
    expect(toGrid([1])).toEqual([1, 0, 0, 0, 0, 0]);
    expect(toGrid([4])).toEqual([0, 1, 0, 0, 0, 0]);
    expect(toGrid([6])).toEqual([0, 0, 0, 0, 0, 1]);
    for (const l of ALPHABET) expect(fromGrid(toGrid(LETTERS[l]))).toEqual([...LETTERS[l]]);
  });
});
