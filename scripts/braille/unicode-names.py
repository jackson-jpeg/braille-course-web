#!/usr/bin/env python3
"""Write __tests__/fixtures/unicode-braille-names.json: the Unicode Character Database name of
every six-dot braille pattern U+2800–U+283F (e.g. "BRAILLE PATTERN DOTS-125"), as an independent
check on the site's dot→codepoint conversion."""
import json, os, unicodedata
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out = {"unicodeVersion": unicodedata.unidata_version,
       "names": {f"U+{cp:04X}": unicodedata.name(chr(cp)) for cp in range(0x2800, 0x2840)}}
with open(os.path.join(ROOT, "__tests__", "fixtures", "unicode-braille-names.json"), "w") as f:
    json.dump(out, f, indent=1); f.write("\n")
