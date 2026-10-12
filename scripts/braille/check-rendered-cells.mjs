#!/usr/bin/env node
/**
 * Real-browser check that every drawn braille cell puts its dots in the right places (trap 6).
 *
 * Loads each public page in Chromium, scrolls so lazy games mount, and for every element with
 * data-braille-cell checks the on-screen geometry of its six [data-dot] children:
 *   - dots 1, 2, 3 share one column and run top to bottom; dots 4, 5, 6 share a column to the right,
 *   - dots 1/4, 2/5 and 3/6 sit on the same rows,
 *   - raised dots (per data-dots) look different from flat dots.
 * Usage: node scripts/braille/check-rendered-cells.mjs http://localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';

const base = process.argv[2] ?? 'http://localhost:3000';
const curriculum = fs.readFileSync(new URL('../../lib/course-curriculum.ts', import.meta.url), 'utf8');
const slugs = [...curriculum.matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => m[1]);
const pages = ['/', '/games', '/learn', '/intro', '/this-page-does-not-exist', ...slugs.map((s) => `/learn/${s}`)];

const launch = { headless: true };
if (fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = undefined;
const browser = await chromium.launch(launch);
let problems = 0;
let checked = 0;

for (const width of [1280, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const path of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    // Dismiss the first-visit onboarding dialog so it doesn't cover the page.
    const close = page.locator('.onboarding-close');
    if (await close.count()) await close.first().click();
    // Scroll through the page so dynamically imported games mount.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);
    if (path === '/games') {
      // Turn one Memory Match card face up so its braille face is checked too.
      const card = page.locator('.memorymatch-card').first();
      if (await card.count()) {
        await card.scrollIntoViewIfNeeded();
        await card.click();
        await page.waitForTimeout(700);
      }
    }
    const result = await page.evaluate(() => {
      const out = { checked: 0, problems: [] };
      for (const cell of document.querySelectorAll('[data-braille-cell]')) {
        const dots = [...cell.querySelectorAll(':scope > [data-dot]')];
        if (dots.length !== 6) {
          out.problems.push(`cell ${cell.getAttribute('data-dots')}: ${dots.length} dots`);
          continue;
        }
        const r = Object.fromEntries(dots.map((d) => [d.getAttribute('data-dot'), d.getBoundingClientRect()]));
        if (Object.values(r).every((b) => b.width === 0 && b.height === 0)) continue; // not displayed
        // Only check what a sighted user can actually see: skip cells hidden behind something
        // (e.g. the face-down side of a flipped card, which uses backface-visibility: hidden).
        cell.scrollIntoView({ block: 'center', behavior: 'instant' });
        const box = cell.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        if (!hit || !(cell === hit || cell.contains(hit) || hit.contains(cell))) {
          out.hidden = (out.hidden ?? 0) + 1;
          continue;
        }
        for (const d of dots) Object.assign(r, { [d.getAttribute('data-dot')]: d.getBoundingClientRect() });
        out.checked++;
        const cx = (b) => b.left + b.width / 2;
        const cy = (b) => b.top + b.height / 2;
        const tol = Math.max(2, r['1'].height * 0.25);
        const label = `cell "${cell.getAttribute('data-dots')}" (${cell.className})`;
        const near = (a, b) => Math.abs(a - b) <= tol;
        if (!(near(cx(r['1']), cx(r['2'])) && near(cx(r['2']), cx(r['3']))))
          out.problems.push(`${label}: dots 1-2-3 not in one column`);
        if (!(near(cx(r['4']), cx(r['5'])) && near(cx(r['5']), cx(r['6']))))
          out.problems.push(`${label}: dots 4-5-6 not in one column`);
        if (!(cx(r['4']) > cx(r['1']) + tol)) out.problems.push(`${label}: right column not right of left column`);
        if (!(cy(r['1']) < cy(r['2']) && cy(r['2']) < cy(r['3'])))
          out.problems.push(`${label}: dots 1-2-3 not top to bottom`);
        if (!(cy(r['4']) < cy(r['5']) && cy(r['5']) < cy(r['6'])))
          out.problems.push(`${label}: dots 4-5-6 not top to bottom`);
        for (const [a, b] of [
          ['1', '4'],
          ['2', '5'],
          ['3', '6'],
        ])
          if (!near(cy(r[a]), cy(r[b]))) out.problems.push(`${label}: dots ${a} and ${b} not on one row`);
        const raised = (cell.getAttribute('data-dots') ?? '').split('');
        const look = (d) => {
          const s = getComputedStyle(d);
          return `${s.backgroundColor}|${s.borderColor}|${s.boxShadow}|${s.opacity}`;
        };
        const raisedLooks = new Set(dots.filter((d) => raised.includes(d.getAttribute('data-dot'))).map(look));
        const flatLooks = new Set(dots.filter((d) => !raised.includes(d.getAttribute('data-dot'))).map(look));
        for (const l of raisedLooks)
          if (flatLooks.has(l)) out.problems.push(`${label}: a raised dot looks the same as a flat dot`);
      }
      return out;
    });
    checked += result.checked;
    for (const p of [...new Set(result.problems)]) {
      problems++;
      console.log(`FAIL ${width}px ${path}: ${p}`);
    }
    console.log(`${width}px ${path}: ${result.checked} cells checked (${result.hidden ?? 0} hidden, skipped)`);
  }
  await page.close();
}
await browser.close();
console.log(`${checked} drawn cells checked, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
