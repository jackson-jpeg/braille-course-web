/**
 * The BRAILLE REFERENCE DATA block sent to the AI model (lib/ai-braille-reference.ts, used by
 * app/api/admin/generate/route.ts). It names no dots at all: it lists sign ids and the tokens the
 * model writes instead. Every token it teaches is rendered and checked against independent
 * liblouis output (en-ueb-g1 / en-ueb-g2, pasted below).
 */
import {
  CONTRACTION_KINDS_BY_LEVEL,
  FACT_TOKENS,
  PROMPT_EXAMPLES,
  buildBrailleReference,
  buildPedagogicalPreamble,
  wordsignsNotFirstLetter,
  type Difficulty,
} from '@/lib/ai-braille-reference';
import { sanitizeText } from '@/lib/ai-content-sanitizer';
import { parseDotSpec } from '@/lib/braille-validator';
import { ALPHABET, CONTRACTIONS, INDICATORS, PUNCTUATION, SYMBOLS, cellsKey, unicodeToCells } from '@/lib/braille/ueb';

const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

/* Independent ground truth from liblouis (python3 louis.translateString, unicode.dis). */
const LOUIS_ALPHABET = '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵'; // en-ueb-g1 "abc…z"
const LOUIS_G1: Record<string, string> = { Hello: '⠠⠓⠑⠇⠇⠕', '2024': '⠼⠃⠚⠃⠙' };
const LOUIS_G2_WORDSIGN: Record<string, string> = { it: '⠭', as: '⠵', but: '⠃', his: '⠦', was: '⠴' };
const LOUIS_NUMERIC = '⠼';

/** Render a token through the sanitizer (as a document build does) and parse the dots back. */
function tokenCells(token: string, grade: 'uncontracted' | 'contracted' = 'contracted') {
  const out = sanitizeText(`It is ${token}.`, grade);
  expect(out).not.toBe('');
  return cellsKey(parseDotSpec(out.replace(/^It is /, '')));
}

describe.each(LEVELS)('reference block, %s', (level) => {
  const ref = buildBrailleReference(level);
  const preamble = buildPedagogicalPreamble(level);

  test('names no dots and contains no braille: the model is never shown a pattern to copy', () => {
    for (const text of [ref, preamble, JSON.stringify(PROMPT_EXAMPLES)]) {
      expect(text).not.toMatch(/\bdots?\s*[0-9]/i);
      expect(text).not.toMatch(/[⠀-⣿]/);
    }
    expect(ref).toContain('YOU NEVER WRITE BRAILLE');
    expect(preamble).toContain('NEVER write dot numbers or braille characters');
  });

  test('lists every indicator, punctuation mark and symbol by token id', () => {
    for (const s of [...Object.values(INDICATORS), ...Object.values(PUNCTUATION), ...Object.values(SYMBOLS)])
      expect(ref).toContain(`  ${s.id}: ${s.name}`);
  });

  test('contractions given match the level', () => {
    const kinds = CONTRACTION_KINDS_BY_LEVEL[level];
    for (const c of CONTRACTIONS) {
      const listed = ref.includes(`    "${c.text}"`);
      if (kinds.includes(c.kind)) expect({ c: c.text, listed }).toEqual({ c: c.text, listed: true });
    }
    if (kinds.length === 0) expect(ref).not.toMatch(/^ {4}"/m);
  });

  test('UEB only, with UEB terminology and the uncontracted convention', () => {
    expect(ref).toContain('Unified English Braille (UEB)');
    expect(ref).toContain('Third Edition 2024');
    expect(ref).toMatch(/\[ICEB 5\.11\.1\]/);
    expect(ref).toContain('a letter standing alone is written as just the letter, with no grade 1 indicator');
    expect(ref).not.toMatch(
      /(?<!capital )letter indicator|letter sign|number indicator|number sign|nemeth|\bEBAE\b|American Edition/i,
    );
  });

  test('uebdots (uncontracted, cell by cell) is offered only at the uncontracted level', () => {
    expect(ref.includes('{uebdots:TEXT}')).toBe(level === 'beginner');
  });
});

describe('every token the reference teaches renders to the braille liblouis gives', () => {
  test.each([...ALPHABET])('{letter:%s}', (l) => {
    expect(tokenCells(`{letter:${l}}`)).toBe(cellsKey(unicodeToCells(LOUIS_ALPHABET[ALPHABET.indexOf(l)])));
  });
  test('{dots:numeric} and the digits', () => {
    expect(tokenCells('{dots:numeric}')).toBe(cellsKey(unicodeToCells(LOUIS_NUMERIC)));
    expect(tokenCells('{dots:digit-2}')).toBe(cellsKey(unicodeToCells(LOUIS_G1['2024'].slice(0, 2))));
  });
  test('{uebdots:Hello} (uncontracted only)', () => {
    expect(tokenCells('{uebdots:Hello}', 'uncontracted')).toBe(cellsKey(unicodeToCells(LOUIS_G1.Hello)));
  });
  test.each(Object.entries(LOUIS_G2_WORDSIGN))('{dots:contraction:%s}', (word, louis) => {
    expect(tokenCells(`{dots:contraction:${word}}`)).toBe(cellsKey(unicodeToCells(louis)));
  });
  test('every fact name renders', () => {
    for (const f of Object.keys(FACT_TOKENS)) expect(sanitizeText(`Fact: {fact:${f}}.`, 'contracted')).not.toBe('');
  });
});

describe('alphabetic wordsigns: not always the first letter', () => {
  const ref = buildBrailleReference('intermediate');
  test('"it" is the letter x and "as" is the letter z', () => {
    expect(ref).toContain('"it" (the letter x)');
    expect(ref).toContain('"as" (the letter z)');
    expect(ref).toContain('"it" is the letter x, "as" is the letter z');
  });
  test('the exceptions are exactly it/x and as/z', () => {
    expect(wordsignsNotFirstLetter()).toEqual([
      { word: 'it', letter: 'x' },
      { word: 'as', letter: 'z' },
    ]);
  });
  test('the intermediate preamble warns about them', () => {
    expect(buildPedagogicalPreamble('intermediate')).toContain('"it" uses the letter x and "as" uses the letter z');
  });
});

describe('prompt examples', () => {
  test('braille worksheet examples carry print only', () => {
    for (const k of ['brailleToPrint', 'printToBraille', 'dotIdentification', 'practiceDrill'] as const) {
      const ex = JSON.parse(PROMPT_EXAMPLES[k]);
      expect(typeof ex.print).toBe('string');
      expect(ex.answer).toBeUndefined();
    }
  });
  test('the token sentence renders correctly', () => {
    expect(tokenCells('{letter:b}')).toBe(cellsKey(unicodeToCells(LOUIS_ALPHABET[1])));
    expect(sanitizeText(PROMPT_EXAMPLES.tokenSentence, 'uncontracted')).toMatch(/^The letter b is dots? /);
  });
});
