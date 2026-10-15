/**
 * No em dashes in any text a person reads on teachbraille.org: every page, component, email,
 * toast and admin screen. Scans every string, template and JSX text in app/, components/, lib/
 * and hooks/ (comments are skipped), so a new route is covered the moment it is added.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { COPY_ROOTS, findEmDashes } from '../helpers/copy-scan';

/**
 * Not copy: the print em dash is braille *input* here. The transcriber and spelling game map it
 * to the UEB dash, and the validator's pattern matches it in AI text. Each entry is the exact literal.
 */
const DATA_NOT_COPY = new Map<string, string[]>([
  ['lib/braille/transcribe.ts', ["'—'", "'—'"]],
  ['lib/games/spell.ts', ["'—'"]],
  ['lib/braille-validator.ts', ['}*|[:=—–]${']],
]);

test('the scanner sees raw, escaped and entity em dashes, and skips comments', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'em-dash-scan-'));
  try {
    for (const root of COPY_ROOTS) fs.mkdirSync(path.join(dir, root));
    fs.writeFileSync(
      path.join(dir, 'app', 'page.tsx'),
      [
        '// a comment \u2014 is fine',
        "export const a = 'raw \u2014 dash';",
        "export const b = 'escaped \\u2014 dash';",
        'export const C = () => <p>entity &mdash; dash, numeric &#8212; too</p>;',
        "export const html = '<p>email &mdash; html</p>';",
        "export const d = 'clean: no dash';",
      ].join('\n'),
    );
    expect(findEmDashes(dir).map((h) => h.line)).toEqual([2, 3, 4, 5]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('scans every route and shared module', () => {
  expect(COPY_ROOTS).toEqual(['app', 'components', 'lib', 'hooks']);
});

test('no em dash in user-facing copy anywhere on the site', () => {
  const hits = findEmDashes(path.join(__dirname, '../..'));
  const copy = hits.filter((h) => !DATA_NOT_COPY.has(h.file));
  expect(copy.map((h) => `${h.file}:${h.line} ${h.text}`)).toEqual([]);

  // The allowed data literals stay exactly what they are, so this list can't hide new copy.
  const data = new Map<string, string[]>();
  for (const h of hits.filter((x) => DATA_NOT_COPY.has(x.file)))
    data.set(h.file, [...(data.get(h.file) ?? []), h.text]);
  expect(Object.fromEntries(data)).toEqual(Object.fromEntries(DATA_NOT_COPY));
});
