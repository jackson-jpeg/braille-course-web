/**
 * The BRAILLE REFERENCE DATA block sent to the AI model (lib/ai-braille-reference.ts, used by
 * app/api/admin/generate/route.ts). Every line that names dots is parsed and checked against the
 * canonical data AND against independent liblouis output (en-ueb-g1 / en-ueb-g2, pasted below).
 */
import {
  CONTRACTION_KINDS_BY_LEVEL,
  PROMPT_EXAMPLES,
  REFERENCE_EXAMPLES,
  buildBrailleReference,
  buildPedagogicalPreamble,
  wordsignsNotFirstLetter,
  type Difficulty,
} from '@/lib/ai-braille-reference';
import { validateBrailleText } from '@/lib/braille-validator';
import {
  type Cell,
  ALL_SIGNS,
  ALPHABET,
  CONTRACTIONS,
  INDICATORS,
  PUNCTUATION,
  SYMBOLS,
  cellsKey,
  toCell,
  unicodeToCell,
  unicodeToCells,
} from '@/lib/braille/ueb';
import { transcribe } from '@/lib/braille/transcribe';

const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

/* Independent ground truth from liblouis (python3 louis.translateString, unicode.dis). */
const LOUIS_ALPHABET = '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵'; // en-ueb-g1 "abc…z"
const LOUIS_G1: Record<string, string> = {
  Hello: '⠠⠓⠑⠇⠇⠕',
  USA: '⠠⠠⠥⠎⠁',
  '2024': '⠼⠃⠚⠃⠙',
  '3b': '⠼⠉⠰⠃',
  'Is it 5?': '⠠⠊⠎⠀⠊⠞⠀⠼⠑⠦',
};
const LOUIS_G2_WORDSIGN: Record<string, string> = { it: '⠭', as: '⠵', but: '⠃', his: '⠦', was: '⠴' };
const LOUIS_NUMERIC = '⠼';

const letterCell = (l: string) => unicodeToCell(LOUIS_ALPHABET[ALPHABET.indexOf(l)]);

/** "dot 6, then dots 1, 2" → cells. */
function parseDesc(desc: string): Cell[] {
  return desc.split(', then ').map((part) => {
    if (part === 'blank cell') return [];
    const m = part.match(/^dots? ([1-6](?:, [1-6])*)$/);
    if (!m) throw new Error(`unparseable dot description "${part}"`);
    return toCell(m[1].split(', ').map(Number));
  });
}

const DESC = '((?:dots? [1-6](?:, [1-6])*|blank cell)(?:, then (?:dots? [1-6](?:, [1-6])*|blank cell))*)';

interface Checked {
  kind: string;
  key: string;
}

/** Check one line; returns what it was about, or throws if it names dots that do not match. */
function checkLine(line: string): Checked | null {
  if (!/\bdots? [1-6]|blank cell/.test(line)) return null;
  let m: RegExpMatchArray | null;

  if ((m = line.match(new RegExp(`^  Letter ([a-z]): ${DESC}$`)))) {
    expect(cellsKey(parseDesc(m[2]))).toBe(cellsKey([letterCell(m[1])]));
    return { kind: 'letter', key: m[1] };
  }
  if (
    (m = line.match(
      new RegExp(`^  Digit ([0-9]): ${DESC} \\(numeric indicator, then the cell of the letter ([a-j])\\)$`),
    ))
  ) {
    const expected = [unicodeToCell(LOUIS_NUMERIC), letterCell('jabcdefghi'[Number(m[1])])];
    expect(cellsKey(parseDesc(m[2]))).toBe(cellsKey(expected));
    expect(m[3]).toBe('jabcdefghi'[Number(m[1])]);
    return { kind: 'digit', key: m[1] };
  }
  if ((m = line.match(new RegExp(`^  Example "(.+)": ${DESC}$`)))) {
    expect(cellsKey(parseDesc(m[2]))).toBe(cellsKey(unicodeToCells(LOUIS_G1[m[1]])));
    return { kind: 'example', key: m[1] };
  }
  if ((m = line.match(new RegExp(`^    "([a-z]+)": ${DESC}(?: \\(the letter ([a-z])\\))? \\[ICEB [0-9.]+\\] — .+$`)))) {
    const text = m[1];
    const cells = parseDesc(m[2]);
    const candidates = CONTRACTIONS.filter((c) => c.text === text);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.some((c) => cellsKey(c.cells) === cellsKey(cells))).toBe(true);
    if (LOUIS_G2_WORDSIGN[text]) expect(cellsKey(cells)).toBe(cellsKey(unicodeToCells(LOUIS_G2_WORDSIGN[text])));
    if (m[3]) expect(cellsKey(cells)).toBe(cellsKey([letterCell(m[3])]));
    return { kind: 'contraction', key: `${text}:${cellsKey(cells)}` };
  }
  if ((m = line.match(new RegExp(`^  ([a-z0-9 ]+?)(?: \\((.{1,3})\\))?: ${DESC} \\[ICEB [0-9.]+\\](?: — .+)?$`)))) {
    const sign = ALL_SIGNS.find((s) => s.name === m![1]);
    expect(sign).toBeDefined();
    expect(cellsKey(parseDesc(m[3]))).toBe(cellsKey(sign!.cells));
    if (m[2]) expect(sign!.print).toBe(m[2]);
    return { kind: 'sign', key: sign!.id };
  }
  if ((m = line.match(new RegExp(`^  ${DESC}: (.+)$`)))) {
    // Shared-cell line: every sign / contraction named really has these cells.
    const cells = parseDesc(m[1]);
    const [signsPart, contractionPart] = m[2].split(' / contraction ');
    for (const name of signsPart.split(' / ')) {
      const sign = ALL_SIGNS.find((s) => s.name === name);
      expect(sign).toBeDefined();
      expect(cellsKey(sign!.cells)).toBe(cellsKey(cells));
    }
    for (const t of (contractionPart ?? '').split(', ').filter(Boolean)) {
      const text = t.replace(/"/g, '');
      expect(CONTRACTIONS.some((c) => c.text === text && cellsKey(c.cells) === cellsKey(cells))).toBe(true);
    }
    return { kind: 'shared', key: m[2] };
  }
  if (
    (m = line.match(new RegExp(`^Left column, top to bottom: ${DESC}\\. Right column, top to bottom: ${DESC}\\.$`)))
  ) {
    expect(parseDesc(m[1])).toEqual([[1, 2, 3]]);
    expect(parseDesc(m[2])).toEqual([[4, 5, 6]]);
    return { kind: 'layout', key: 'columns' };
  }
  if (line.startsWith('How to write dot numbers') || line.startsWith('"dot 6, then dot 3"')) {
    // Format examples; check they are real signs (h; capitals terminator).
    const d = line.match(/"(.+?)"/)![1];
    if (line.startsWith('How')) expect(parseDesc(d)).toEqual([letterCell('h')]);
    else expect(cellsKey(parseDesc(d))).toBe(cellsKey(INDICATORS.capitalsTerminator.cells));
    return { kind: 'format', key: line.slice(0, 10) };
  }
  throw new Error(`line names dots but is not in a checked format: ${line}`);
}

describe.each(LEVELS)('reference block, %s', (level) => {
  const ref = buildBrailleReference(level);
  const lines = ref.split('\n');
  const checked = lines.map(checkLine).filter((x): x is Checked => x !== null);
  const keys = (kind: string) => new Set(checked.filter((c) => c.kind === kind).map((c) => c.key));

  test('every line that names dots matches the data (and liblouis)', () => {
    expect(checked.length).toBeGreaterThan(60);
  });

  test('covers all letters, digits, indicators, punctuation and symbols', () => {
    expect([...keys('letter')].sort()).toEqual([...ALPHABET]);
    expect(keys('digit').size).toBe(10);
    const signs = keys('sign');
    for (const s of [...Object.values(INDICATORS), ...Object.values(PUNCTUATION), ...Object.values(SYMBOLS)]) {
      expect(signs.has(s.id)).toBe(true);
    }
    expect([...keys('example')].sort()).toEqual([...REFERENCE_EXAMPLES].sort());
  });

  test('contractions given match the level', () => {
    const kinds = CONTRACTION_KINDS_BY_LEVEL[level];
    const expected = CONTRACTIONS.filter((c) => kinds.includes(c.kind)).map((c) => `${c.text}:${cellsKey(c.cells)}`);
    expect([...keys('contraction')].sort()).toEqual([...new Set(expected)].sort());
  });

  test('the cell diagram puts 1-2-3 on the left and 4-5-6 on the right', () => {
    const i = lines.indexOf('The braille cell has six dots in two columns of three:');
    expect(lines.slice(i + 1, i + 4)).toEqual(['  1 4', '  2 5', '  3 6']);
  });

  test('UEB only, with UEB terminology and the uncontracted convention', () => {
    expect(ref).toContain('Unified English Braille (UEB)');
    expect(ref).toContain('Third Edition 2024');
    expect(ref).toMatch(/\[ICEB 5\.11\.1\]/);
    expect(ref).toContain('a letter standing alone is written as just the letter, with no grade 1 indicator');
    expect(ref).toContain('numeric indicator: dots 3, 4, 5, 6');
    expect(ref).toContain('grade 1 indicator: dots 5, 6');
    expect(ref).not.toMatch(/(?<!capital )letter indicator|letter sign|number indicator|nemeth|\bEBAE\b/i);
    expect(ref).not.toMatch(/[⠀-⣿]/);
  });

  test('the fidelity guard finds nothing to correct in the reference block', () => {
    expect(validateBrailleText(ref).corrections).toEqual([]);
  });
});

describe('alphabetic wordsigns: not always the first letter', () => {
  const ref = buildBrailleReference('intermediate');
  test('"it" is the letter x and "as" is the letter z', () => {
    expect(ref).toContain('"it": dots 1, 3, 4, 6 (the letter x)');
    expect(ref).toContain('"as": dots 1, 3, 5, 6 (the letter z)');
    expect(ref).toContain('"it" is the letter x, "as" is the letter z');
    expect(ref).not.toMatch(/same pattern as/i);
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

describe('pedagogical preamble and prompt examples', () => {
  test.each(LEVELS)('%s preamble: correct examples, UEB terms, nothing for the guard to fix', (level) => {
    const p = buildPedagogicalPreamble(level);
    expect(p).toContain('"The letter A is dot 1"');
    expect(p).toContain('"The letter B is dots 1, 2"');
    expect(p).not.toMatch(/(?<!capital )letter indicator|nemeth|\bEBAE\b/i);
    expect(validateBrailleText(p).corrections).toEqual([]);
  });
  test('format prompt examples use the right dots', () => {
    expect(PROMPT_EXAMPLES.brailleToPrint).toBe(
      '{ "prompt": "What letter is represented by dots 1, 2?", "answer": "B" }',
    );
    expect(PROMPT_EXAMPLES.printToBraille).toBe(
      '{ "prompt": "Write the dot numbers for the letter F.", "answer": "dots 1, 2, 4" }',
    );
    expect(JSON.parse(PROMPT_EXAMPLES.dotIdentification).answer).toBe('dots 1, 2');
    expect(cellsKey(transcribe('f'))).toBe(cellsKey([letterCell('f')]));
  });
});
