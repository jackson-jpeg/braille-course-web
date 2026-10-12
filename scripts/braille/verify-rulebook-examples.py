#!/usr/bin/env python3
"""
Check that every example in __tests__/fixtures/iceb-rulebook-examples.json appears verbatim in the
ICEB rulebook PDF (print and braille on the same line, or the braille on the following line).
Usage: python3 scripts/braille/verify-rulebook-examples.py [rules.pdf]
"""
import hashlib, json, os, re, subprocess, sys, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
URL = "https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf"
SHA256 = "bf742499ee2eb3cbdf4914d97bbf0b2857bd3e91621f04a4990091b64e5a105e"


def norm(s):
    # PDF text uses curly apostrophes in places; the rulebook treats ' and ’ alike (7.6 note).
    return s.replace("’", "'").replace("‘", "'")


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else None
    if path is None:
        fd, path = tempfile.mkstemp(suffix=".pdf"); os.close(fd)
        urllib.request.urlretrieve(URL, path)
    if hashlib.sha256(open(path, "rb").read()).hexdigest() != SHA256:
        sys.exit("rulebook PDF hash mismatch")
    text = subprocess.run(["pdftotext", "-layout", path, "-"], check=True, capture_output=True).stdout.decode()
    lines = [norm(l) for l in text.splitlines()]
    data = json.load(open(os.path.join(ROOT, "__tests__", "fixtures", "iceb-rulebook-examples.json")))
    ex = data["examples"] + data.get("citations", [])
    bad = 0
    for e in ex:
        p, b = norm(e["print"]), e["braille"]
        ok = False
        for i, l in enumerate(lines):
            cols = re.split(r"\s{2,}", l.strip())
            for j, c in enumerate(cols):
                if c == p:
                    following = " ".join(cols[j + 1:j + 2]) if j + 1 < len(cols) else ""
                    nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
                    if following == b or nxt == b or nxt.startswith(b + " ") or re.split(r"\s{2,}", nxt)[0] == b:
                        ok = True
        print(("OK   " if ok else "MISS ") + e["rule"] + "  " + e["print"] + "  " + b)
        bad += not ok
    if bad:
        sys.exit(f"{bad} example(s) not found verbatim in the rulebook")
    print(f"all {len(ex)} examples found verbatim")


if __name__ == "__main__":
    main()
