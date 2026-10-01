import fs from 'fs';
import path from 'path';

/**
 * Decorative braille written directly in page/component source: <BrailleText text="…">,
 * <Eyebrow>…</Eyebrow> (spelled in lowercase) and <Eyebrow braille="…">. Node-only (reads files);
 * used by the oracle generator and tests so ornaments are checked too.
 */
export function ornamentCorpus(rootDir: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx$/.test(entry.name)) {
        const src = fs.readFileSync(full, 'utf8');
        for (const m of src.matchAll(/<BrailleText[^>]*?\stext="([^"]+)"/g)) found.push(m[1]);
        for (const m of src.matchAll(/<Eyebrow[^>]*?\sbraille="([^"]+)"/g)) found.push(m[1]);
        for (const m of src.matchAll(/<Eyebrow(?:\s+className="[^"]*")?>([^<{]+)<\/Eyebrow>/g))
          found.push(m[1].replace(/&amp;/g, '&').trim().toLowerCase());
      }
    }
  };
  for (const d of ['app', 'components']) walk(path.join(rootDir, d));
  return Array.from(new Set(found)).sort();
}
