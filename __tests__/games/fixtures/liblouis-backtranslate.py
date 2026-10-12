#!/usr/bin/env python3
"""
Independent "one reading only" check for the reading games (Sentence Decoder, Contraction Sprint).

Collects every {print, table} item the two games list in brailleInventory() (via npx tsx),
forward-translates each with liblouis
(en-ueb-g1.ctb / en-ueb-g2.ctb) and back-translates the braille with the same table, writing
__tests__/games/fixtures/liblouis-backtranslations.json. The game tests check that the braille the
game shows equals the forward translation and that liblouis reads it back as the same words.

Regenerate (liblouis with python bindings installed), from the repository root:
  python3 __tests__/games/fixtures/liblouis-backtranslate.py
"""
import json, os, subprocess, sys
import louis

TABLES = {"g1": "en-ueb-g1.ctb", "g2": "en-ueb-g2.ctb"}
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
OUT = os.path.join(HERE, "liblouis-backtranslations.json")
DUMP = """
import { brailleInventory as decoder } from './lib/games/sentence-decoder';
import { brailleInventory as sprint } from './lib/games/contraction-sprint';
const seen = new Set<string>();
const out: { print: string; table: string }[] = [];
for (const i of [...decoder(), ...sprint()]) {
  const k = i.table + '\\t' + i.print;
  if (!seen.has(k)) { seen.add(k); out.push({ print: i.print, table: i.table }); }
}
process.stdout.write(JSON.stringify(out));
"""

items = json.loads(subprocess.run(["npx", "tsx", "-e", DUMP], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
out = {}
for it in items:
    t = ["unicode.dis", TABLES[it["table"]]]
    braille = louis.translateString(t, it["print"])
    out[f"{it['table']}\t{it['print']}"] = {"braille": braille, "back": louis.backTranslateString(t, braille)}
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump({"liblouis": louis.version(), "items": dict(sorted(out.items()))}, fh, ensure_ascii=False, indent=1)
    fh.write("\n")
print(f"wrote {len(out)} items to {OUT}", file=sys.stderr)
