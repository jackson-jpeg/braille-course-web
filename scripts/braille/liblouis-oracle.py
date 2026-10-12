#!/usr/bin/env python3
"""
liblouis oracle: forward-translate every piece of print the site shows as braille.

Reads a JSON list of {"print": str, "table": "g1" | "g2"} on stdin (produced by
scripts/braille/dump-site-braille.ts) and writes __tests__/fixtures/liblouis-oracle.json:

  { "liblouis": "3.29.0", "tables": {file: sha256}, "translations": {"g1\\t<print>": "<unicode braille>"} }

g1 = en-ueb-g1.ctb (uncontracted UEB), g2 = en-ueb-g2.ctb (contracted UEB).
The jest suite compares the site's cells against this file cell by cell; CI regenerates it with a
fresh liblouis install and fails if it changes.

Needs: python3-louis (apt install liblouis-bin python3-louis).
"""
import hashlib, json, os, sys
import louis

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "__tests__", "fixtures", "liblouis-oracle.json")
TABLES = {"g1": "en-ueb-g1.ctb", "g2": "en-ueb-g2.ctb"}
TABLE_FILES = ["en-ueb-g1.ctb", "en-ueb-g2.ctb", "en-ueb-chardefs.uti", "braille-patterns.cti", "latinLetterDef6Dots.uti", "unicode.dis"]


def table_dir():
    for d in ["/usr/share/liblouis/tables", "/usr/local/share/liblouis/tables"]:
        if os.path.exists(os.path.join(d, "en-ueb-g1.ctb")):
            return d
    sys.exit("liblouis tables not found")


def main():
    items = json.load(sys.stdin)
    d = table_dir()
    hashes = {}
    for f in TABLE_FILES:
        p = os.path.join(d, f)
        if os.path.exists(p):
            hashes[f] = hashlib.sha256(open(p, "rb").read()).hexdigest()
    translations = {}
    for it in items:
        key = f"{it['table']}\t{it['print']}"
        if key in translations:
            continue
        translations[key] = louis.translateString(["unicode.dis", TABLES[it["table"]]], it["print"])
    out = {
        "liblouis": louis.version(),
        "tables": hashes,
        "translations": dict(sorted(translations.items())),
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print(f"liblouis {louis.version()}: wrote {len(translations)} translations to {os.path.relpath(OUT, ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
