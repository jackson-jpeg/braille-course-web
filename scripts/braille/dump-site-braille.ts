/**
 * Print every {print, table} pair the site shows as braille, as JSON, for the liblouis oracle.
 * Usage: npx tsx scripts/braille/dump-site-braille.ts | python3 scripts/braille/liblouis-oracle.py
 */
import { siteInventory } from '../../lib/braille/site-inventory';

const seen = new Set<string>();
const out: { print: string; table: string }[] = [];
for (const item of siteInventory()) {
  const key = `${item.table}\t${item.print}`;
  if (seen.has(key)) continue;
  seen.add(key);
  out.push({ print: item.print, table: item.table });
}
process.stdout.write(JSON.stringify(out));
