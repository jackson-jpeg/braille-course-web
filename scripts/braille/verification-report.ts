/**
 * Generate docs/accuracy/VERIFICATION-RESULTS.md from a real test run.
 *
 * Usage: npx tsx scripts/braille/verification-report.ts [geometry-log]
 * Runs the whole jest suite with --json and summarises it, together with the size of each
 * verification source. If a log of scripts/braille/check-rendered-cells.mjs is given, its totals
 * are included.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { siteInventory } from '../../lib/braille/site-inventory';
import { DISCREPANCIES } from '../../lib/braille/discrepancies';
import { ALL_SIGNS, CONTRACTIONS } from '../../lib/braille/ueb';

const ROOT = path.resolve(__dirname, '..', '..');
const out = path.join(ROOT, 'docs', 'accuracy', 'VERIFICATION-RESULTS.md');

interface JestResult {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  testResults: { name: string; assertionResults: { status: string }[] }[];
}

let raw = '';
try {
  raw = execFileSync('npx', ['jest', '--ci', '--json', '--silent'], {
    cwd: ROOT,
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString();
} catch (e) {
  raw = (e as { stdout: Buffer }).stdout.toString();
}
const jest = JSON.parse(raw) as JestResult;

const oracle = JSON.parse(fs.readFileSync(path.join(ROOT, '__tests__/fixtures/liblouis-oracle.json'), 'utf8'));
const rulebook = JSON.parse(fs.readFileSync(path.join(ROOT, '__tests__/fixtures/iceb-rulebook-signs.json'), 'utf8'));
const examples = JSON.parse(fs.readFileSync(path.join(ROOT, '__tests__/fixtures/iceb-rulebook-examples.json'), 'utf8'));
const inventory = siteInventory();
const keys = new Set(inventory.map((i) => `${i.table}\t${i.print}`));
const g1 = [...keys].filter((k) => k.startsWith('g1')).length;
const g2 = keys.size - g1;
const byWhere = new Map<string, number>();
for (const i of inventory) {
  const area = i.where.split(':')[0] === 'game' || i.where.split(':')[0] === 'lesson' ? i.where : i.where.split(':')[0];
  byWhere.set(area, (byWhere.get(area) ?? 0) + 1);
}

let geometry = '';
const geoLog = process.argv[2];
if (geoLog && fs.existsSync(geoLog)) {
  const last = fs.readFileSync(geoLog, 'utf8').trim().split('\n').pop() ?? '';
  geometry = last;
}

const files = jest.testResults
  .map((t) => ({
    file: path.relative(ROOT, t.name),
    passed: t.assertionResults.filter((a) => a.status === 'passed').length,
    failed: t.assertionResults.filter((a) => a.status === 'failed').length,
    skipped: t.assertionResults.filter((a) => a.status !== 'passed' && a.status !== 'failed').length,
  }))
  .sort((a, b) => a.file.localeCompare(b.file));

const lines = [
  '# Verification results (generated)',
  '',
  `Generated ${new Date().toISOString()} by \`scripts/braille/verification-report.ts\` from a real run of the whole test suite. Do not edit by hand.`,
  '',
  '## Totals',
  '',
  `- Tests: **${jest.numPassedTests} passed**, ${jest.numFailedTests} failed, ${jest.numPendingTests + jest.numTodoTests} skipped/todo, ${jest.numTotalTests} total, in ${files.length} files.`,
  `- liblouis oracle: liblouis ${oracle.liblouis}, ${Object.keys(oracle.translations).length} translations in the fixture; the site shows **${keys.size}** distinct print strings as braille (${g1} uncontracted via en-ueb-g1.ctb, ${g2} contracted via en-ueb-g2.ctb), every one compared cell by cell.`,
  `- Documented source disagreements: ${DISCREPANCIES.length} (see DISCREPANCIES.md).`,
  `- ICEB rulebook: ${rulebook.entries.length} symbol-table entries and ${rulebook.headings.length} section headings extracted from the PDF (sha256 ${rulebook.source.sha256.slice(0, 12)}…); ${examples.examples.length} verbatim worked examples reproduced exactly.`,
  `- Canonical data: ${ALL_SIGNS.length} signs (letters, digits, indicators, punctuation, symbols) and ${CONTRACTIONS.length} contraction entries, each matched to the rulebook tables; all 64 cells round-tripped through Unicode and checked against Unicode character names.`,
  geometry
    ? `- Real-browser geometry (Chromium, 1280px and 390px): ${geometry}`
    : '- Real-browser geometry: run `node scripts/braille/check-rendered-cells.mjs <url>` (also run in CI).',
  '',
  '## Braille inventory by area',
  '',
  '| Area | Items |',
  '| --- | --- |',
  ...[...byWhere.entries()].sort().map(([w, n]) => `| ${w} | ${n} |`),
  '',
  '## Tests by file',
  '',
  '| File | Passed | Failed | Skipped |',
  '| --- | --- | --- | --- |',
  ...files.map((f) => `| ${f.file} | ${f.passed} | ${f.failed} | ${f.skipped} |`),
  '',
];
fs.writeFileSync(out, lines.join('\n'));
console.log(`wrote ${path.relative(ROOT, out)}: ${jest.numPassedTests}/${jest.numTotalTests} passed`);
if (jest.numFailedTests || jest.numPendingTests || jest.numTodoTests) process.exit(1);
