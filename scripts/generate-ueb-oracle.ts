/**
 * Regenerates the UEB oracle from liblouis, the open-source braille translator used by
 * NVDA, JAWS, BrailleBlaster and most braille displays.
 *
 *   Requires: liblouis with Python bindings (Ubuntu/Debian: `apt-get install python3-louis`,
 *             macOS: `brew install liblouis` + `pip install louis`).
 *   Run:      npx tsx scripts/generate-ueb-oracle.ts
 *
 * Writes:
 *   __tests__/fixtures/ueb-oracle.json  — liblouis output for every test input and corpus string
 *   lib/data/ueb-contracted.json        — grade 2 braille for contracted strings used at runtime
 */

import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { ALPHABET, DIGIT_LETTER, CONTRACTIONS } from '../lib/ueb';
import { uncontractedCorpus, contractedCorpus } from '../lib/ueb-corpus';
import { PUNCTUATION_SAMPLES, GROUPSIGN_SAMPLES, TRANSCRIBE_SAMPLES } from '../__tests__/fixtures/ueb-oracle-inputs';

const g1 = Array.from(
  new Set([
    ...ALPHABET,
    ...Object.keys(DIGIT_LETTER),
    ...Object.values(PUNCTUATION_SAMPLES),
    ...TRANSCRIBE_SAMPLES,
    ...uncontractedCorpus(),
  ]),
).sort();

const standaloneWords = CONTRACTIONS.filter((c) => c.kind.endsWith('wordsign') || c.kind === 'strong-contraction').map(
  (c) => c.text,
);
const contracted = contractedCorpus();
const g2 = Array.from(
  new Set([...standaloneWords, ...Object.values(GROUPSIGN_SAMPLES).map((s) => s.word), ...contracted]),
).sort();

const py = `
import json, sys, louis
data = json.load(sys.stdin)
import glob
def nemeth_def(code):
  # The sign's dots as written in liblouis's Nemeth definitions table.
  path = (glob.glob('/usr/share/liblouis/tables/nemethdefs.cti') + glob.glob('/opt/homebrew/share/liblouis/tables/nemethdefs.cti') + glob.glob('/usr/local/share/liblouis/tables/nemethdefs.cti'))[0]
  for line in open(path, encoding='utf8'):
    parts = line.split()
    if parts[:2] == ['sign', code]:
      return parts[2]
G1 = ['unicode.dis', 'en-ueb-g1.ctb']
G2 = ['unicode.dis', 'en-ueb-g2.ctb']
print(json.dumps({
  'liblouis': louis.version(),
  'g1': {s: louis.translateString(G1, s) for s in data['g1']},
  'g2': {s: louis.translateString(G2, s) for s in data['g2']},
  'nemethDefs': {ch: nemeth_def(code) for ch, code in [('×', '\\\\x00D7'), ('÷', '\\\\x00F7')]},
  'nemeth': {s: louis.translateString(['unicode.dis', 'en-us-mathtext.ctb'], s) for s in data['nemeth']},
}, ensure_ascii=False, indent=1, sort_keys=True))
`;

const out = execFileSync('python3', ['-c', py], {
  input: JSON.stringify({ g1, g2, nemeth: [...'0123456789'.split(''), '4+5=9', '7-2=5', '3×4=12'] }),
  encoding: 'utf8',
});
const oracle = JSON.parse(out) as {
  liblouis: string;
  g1: Record<string, string>;
  g2: Record<string, string>;
  nemeth: Record<string, string>;
};

const root = path.join(__dirname, '..');
writeFileSync(path.join(root, '__tests__/fixtures/ueb-oracle.json'), JSON.stringify(oracle, null, 1) + '\n');

const runtime: Record<string, string> = {};
for (const s of contracted) runtime[s] = oracle.g2[s];
writeFileSync(
  path.join(root, 'lib/data/ueb-contracted.json'),
  JSON.stringify({ source: `liblouis ${oracle.liblouis} en-ueb-g2.ctb`, braille: runtime }, null, 1) + '\n',
);

console.log(`liblouis ${oracle.liblouis}: ${g1.length} uncontracted + ${g2.length} contracted strings`);
