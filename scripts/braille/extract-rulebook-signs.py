#!/usr/bin/env python3
"""
Extract the symbol tables and section headings from the ICEB "Rules of Unified English Braille"
(Third Edition 2024) into __tests__/fixtures/iceb-rulebook-signs.json.

The PDF is downloaded from iceb.org and its SHA-256 is checked, so the fixture is reproducible.
Only the factual symbol listings are kept (braille, print, name, section), not the rule text.

Usage: python3 scripts/braille/extract-rulebook-signs.py [path/to/rules.pdf]
Needs: pdftotext (poppler-utils).
"""
import hashlib, json, os, re, subprocess, sys, tempfile, urllib.request

URL = "https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf"
SHA256 = "bf742499ee2eb3cbdf4914d97bbf0b2857bd3e91621f04a4990091b64e5a105e"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "__tests__", "fixtures", "iceb-rulebook-signs.json")

BR = "⠀-⣿"
SECTION_RE = re.compile(r"^\s*Section (\d+): ")
HEADING_RE = re.compile(r"^(\d+\.\d+)\s{2,}(\S.*)$")
RULE_RE = re.compile(r"^(\d+\.\d+\.\d+)\s")
TABLE_RE = re.compile(rf"^\s+([{BR}]+(?: to [{BR}]+)?)\s{{2,}}(\S.*?)\s*$")
# Section 4 lists two columns per line: "⠁ letter a     ⠠⠁ capital letter A"
TWO_COL_RE = re.compile(rf"^\s+([{BR}]+)\s+(letter \w)\s+([{BR}]+)\s+(capital letter \w)\s*$")


def load_pdf(path):
    if path is None:
        fd, path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        urllib.request.urlretrieve(URL, path)
    data = open(path, "rb").read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != SHA256:
        sys.exit(f"rulebook PDF hash mismatch: {digest} (expected {SHA256})")
    return subprocess.run(["pdftotext", "-layout", path, "-"], check=True, capture_output=True).stdout.decode()


def main():
    text = load_pdf(sys.argv[1] if len(sys.argv) > 1 else None)
    lines = text.splitlines()
    # Skip the table of contents: start at the first real "Section 1:" heading after it.
    start = next(i for i, l in enumerate(lines) if re.match(r"^\s+Section 1: Introduction\s*$", l))
    section = None  # e.g. "7" or "7.5"
    in_table = False
    entries, headings = [], []
    for raw in lines[start:]:
        line = raw.rstrip()
        if "Third Edition 2024" in line or line.startswith("Rules of Unified English Braille"):
            continue
        m = SECTION_RE.match(line)
        if m:
            section, in_table = m.group(1), True
            continue
        m = HEADING_RE.match(line)
        if m and not RULE_RE.match(line):
            section, in_table = m.group(1), True
            title = m.group(2)
            braille = re.findall(rf"[{BR}]+", title)
            headings.append({"section": section, "title": re.sub(rf"\s*[{BR}]+", "", title).strip(), "braille": braille})
            continue
        if RULE_RE.match(line) or line.strip().startswith(("Example", "Note:", "Refer to:")):
            in_table = False
            continue
        if not in_table or section is None:
            continue
        m = TWO_COL_RE.match(line)
        if m:
            entries.append({"section": section, "braille": m.group(1), "text": m.group(2)})
            entries.append({"section": section, "braille": m.group(3), "text": m.group(4)})
            continue
        m = TABLE_RE.match(line)
        if m:
            braille, rest = m.group(1), m.group(2)
            # Section 10 tables spell the word in braille before the print word: keep the print.
            rest_parts = re.split(r"\s{2,}", rest)
            entry = {"section": section, "braille": braille, "text": rest_parts[-1]}
            if len(rest_parts) > 1:
                entry["print"] = rest_parts[0]
            see = re.search(r"\(see (\d+(?:\.\d+)*)", rest)
            if see:
                entry["see"] = see.group(1)
            entries.append(entry)
    out = {
        "source": {"title": "Rules of Unified English Braille", "edition": "Third Edition 2024", "url": URL, "sha256": SHA256},
        "headings": headings,
        "entries": entries,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"wrote {len(entries)} table entries and {len(headings)} headings to {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
