/**
 * Single source of truth, enforced: outside lib/braille/ no source file may spell out braille.
 *
 *  - no Unicode braille characters (U+2800–U+28FF),
 *  - no six-slot 0/1 dot arrays,
 *  - no hand-typed dot numbers in prose ("dots 1 2 5", "dot 6"): use lib/braille/prose.ts,
 *  - no legacy braille maps, no Nemeth, no EBAE terminology,
 *  - only BrailleCell / BrailleDotPad lay out dots,
 *  - and no skipped or focused tests anywhere in the suite.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks'];
const ALLOWED_BRAILLE_DIR = path.join(ROOT, 'lib', 'braille') + path.sep;

function walk(dir: string, exts: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name.startsWith('.') ? [] : walk(p, exts);
    return exts.some((x) => p.endsWith(x)) ? [p] : [];
  });
}

const sourceFiles = SOURCE_DIRS.flatMap((d) => walk(path.join(ROOT, d), ['.ts', '.tsx'])).filter(
  (f) => !f.startsWith(ALLOWED_BRAILLE_DIR),
);

function offenders(re: RegExp, files = sourceFiles, allow: (file: string, line: string) => boolean = () => false) {
  const out: string[] = [];
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
      re.lastIndex = 0;
      if (re.test(line) && !allow(f, line)) out.push(`${path.relative(ROOT, f)}:${i + 1}: ${line.trim().slice(0, 140)}`);
    });
  }
  return out;
}

describe('no braille outside lib/braille', () => {
  test('there are source files to check', () => {
    expect(sourceFiles.length).toBeGreaterThan(50);
  });

  test('no Unicode braille characters', () => {
    expect(offenders(/[⠀-⣿]/u)).toEqual([]);
  });

  test('no six-slot 0/1 dot arrays', () => {
    expect(offenders(/\[\s*[01]\s*,\s*[01]\s*,\s*[01]\s*,\s*[01]\s*,\s*[01]\s*,\s*[01]\s*\]/)).toEqual([]);
  });

  test('no literal cell arrays of dot numbers passed as braille', () => {
    // e.g. cells: [[2, 5, 6]] or cell={[1, 2]} — cells must come from lib/braille.
    expect(offenders(/\bcells?\s*[:=]\s*\{?\s*\[\s*\[?\s*[1-6]\s*[,\]]/)).toEqual([]);
  });

  test('no hand-typed dot numbers in prose ("dots 1 2 5", "dot 6", "dots 3-4-5-6")', () => {
    expect(offenders(/\bdots?\s*[1-6](?:[\s,\-–and]+[1-6])*\b/i)).toEqual([]);
  });

  test('no legacy braille maps or Nemeth code', () => {
    expect(offenders(/braille-map|nemeth-map|contracted-braille-map|nemeth/i)).toEqual([]);
  });

  test('no EBAE-only terminology ("letter sign", "letter indicator", "English Braille American Edition" as the taught code)', () => {
    expect(offenders(/letter sign|letter indicator|\bEBAE\b/i)).toEqual([]);
  });

  test('only BrailleCell and BrailleDotPad lay out dots (GRID_ORDER / grid adapters)', () => {
    const allowed = new Set(['components/BrailleCell.tsx', 'components/BrailleDotPad.tsx'].map((p) => path.join(ROOT, p)));
    expect(offenders(/\bGRID_ORDER\b|\bcellToGrid\b|\bgridToCell\b|\[1, 4, 2, 5, 3, 6\]/, sourceFiles, (f) => allowed.has(f))).toEqual([]);
  });
});

describe('the accuracy suite cannot be silently weakened', () => {
  const testFiles = walk(path.join(ROOT, '__tests__'), ['.ts', '.tsx']);
  test('no skipped, focused or todo tests', () => {
    expect(
      offenders(/\b(?:it|test|describe)\.(?:skip|only|todo)\b|\bx(?:it|test|describe)\s*\(|\bf(?:it|describe)\s*\(/, testFiles, (f) =>
        f.endsWith('no-hardcoded-braille.test.ts'),
      ),
    ).toEqual([]);
  });
});
