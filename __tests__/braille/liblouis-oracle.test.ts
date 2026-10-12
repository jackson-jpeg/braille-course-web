/**
 * Every piece of braille the site can show, compared cell by cell with liblouis
 * (en-ueb-g1.ctb for uncontracted, en-ueb-g2.ctb for contracted).
 *
 * The fixture is produced by `npm run braille:oracle` (scripts/braille/liblouis-oracle.py) and
 * regenerated from a fresh liblouis install in CI (.github/workflows/braille-accuracy.yml), which
 * fails if it differs from the committed copy. A disagreement may only be accepted through
 * lib/braille/discrepancies.ts, with an ICEB rule and a verbatim rulebook example.
 */
import oracle from '../fixtures/liblouis-oracle.json';
import rulebookExamples from '../fixtures/iceb-rulebook-examples.json';
import { siteInventory } from '@/lib/braille/site-inventory';
import { DISCREPANCIES } from '@/lib/braille/discrepancies';
import { cellsToUnicode } from '@/lib/braille/ueb';
import { transcribeToUnicode } from '@/lib/braille/transcribe';

const translations = oracle.translations as Record<string, string>;
const inventory = siteInventory();
const discrepancyByKey = new Map(DISCREPANCIES.map((d) => [`${d.table}\t${d.print}`, d]));

describe('liblouis oracle', () => {
  test('fixture comes from liblouis with the UEB tables', () => {
    expect(oracle.liblouis).toMatch(/^3\.\d+\.\d+$/);
    expect(Object.keys(oracle.tables)).toEqual(expect.arrayContaining(['en-ueb-g1.ctb', 'en-ueb-g2.ctb']));
  });

  test('the inventory is non-trivial', () => {
    expect(inventory.length).toBeGreaterThan(80);
  });

  test('every piece of site braille has a liblouis translation in the fixture (run `npm run braille:oracle` if not)', () => {
    const missing = inventory.filter((i) => !(`${i.table}\t${i.print}` in translations));
    expect(missing.map((i) => `${i.where}: ${i.table} ${JSON.stringify(i.print)}`)).toEqual([]);
  });

  test('every piece of site braille matches liblouis cell for cell (or is a documented discrepancy)', () => {
    const mismatches: string[] = [];
    for (const item of inventory) {
      const key = `${item.table}\t${item.print}`;
      const site = cellsToUnicode(item.cells);
      const louis = translations[key];
      const d = discrepancyByKey.get(key);
      if (d) {
        if (louis !== d.liblouis || site !== d.site)
          mismatches.push(`${item.where}: discrepancy entry is stale for ${JSON.stringify(item.print)}`);
        continue;
      }
      if (site !== louis)
        mismatches.push(
          `${item.where}: ${item.table} ${JSON.stringify(item.print)}\n  site:     ${site}\n  liblouis: ${louis}`,
        );
    }
    expect(mismatches).toEqual([]);
  });
});

describe('documented discrepancies', () => {
  test.each(DISCREPANCIES.map((d) => [d.print, d]))('%s: site follows the cited rulebook example', (_p, d) => {
    expect(d.rule).toMatch(/^\d+\.\d+(\.\d+)?$/);
    expect(d.explanation.length).toBeGreaterThan(40);
    expect(translations[`${d.table}\t${d.print}`]).toBe(d.liblouis);
    expect(transcribeToUnicode(d.print)).toBe(d.site);
    expect(d.site).not.toBe(d.liblouis);
    // The structural point of the example (terminator before the closing quote) is in the site output.
    expect(d.rulebookExample.braille.endsWith('⠖⠠⠄⠴')).toBe(d.site.endsWith('⠖⠠⠄⠴'));
  });
});

describe('three-way agreement on rulebook examples', () => {
  test('liblouis agrees with every curated ICEB example (or the case is a documented discrepancy)', () => {
    const disagreements = rulebookExamples.examples
      .filter((e) => translations[`g1\t${e.print}`].replace(/⠀/g, ' ') !== e.braille)
      .map((e) => `${e.rule} ${e.print}: rulebook ${e.braille} liblouis ${translations[`g1\t${e.print}`]}`);
    expect(disagreements).toEqual([]);
  });
});
