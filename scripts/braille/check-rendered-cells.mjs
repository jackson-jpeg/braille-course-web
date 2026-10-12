#!/usr/bin/env node
/**
 * Real-browser check that every drawn braille cell puts its dots in the right places (trap 6).
 *
 * Loads each public page in Chromium, scrolls so lazy games mount, and for every element with
 * data-braille-cell checks the on-screen geometry of its six [data-dot] children:
 *   - dots 1, 2, 3 share one column and run top to bottom; dots 4, 5, 6 share a column to the right,
 *   - dots 1/4, 2/5 and 3/6 sit on the same rows,
 *   - raised dots (per data-dots) look different from flat dots,
 *   - its caption (accessible name, or the visible text beside it) does not name an uppercase letter
 *     for a plain letter cell (lib/braille/labels.ts: a capital needs the capital letter indicator),
 *   - and no visible page text uses a superseded braille term (lib/braille/terminology.ts).
 * Every page is checked at 1280px, 390px and 320px wide.
 * Usage: npx tsx scripts/braille/check-rendered-cells.mjs http://localhost:3000
 */
import { chromium } from 'playwright';
import fs from 'fs';
// lib/braille is TypeScript (CommonJS under tsx): take the named exports from the module object.
import labels from '../../lib/braille/labels.ts';
import terminology from '../../lib/braille/terminology.ts';

const { cellLabelProblem } = labels;
const { OTHER_CODE_RE, SUPERSEDED_TERMS } = terminology;

const base = process.argv[2] ?? 'http://localhost:3000';
const curriculum = fs.readFileSync(new URL('../../lib/course-curriculum.ts', import.meta.url), 'utf8');
const slugs = [...curriculum.matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => m[1]);
const pages = ['/', '/games', '/learn', '/intro', '/this-page-does-not-exist', ...slugs.map((s) => `/learn/${s}`)];

const launch = { headless: true };
if (fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = undefined;
const browser = await chromium.launch(launch);
let problems = 0;
let checked = 0;

for (const width of [1280, 390, 320]) {
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
      const out = { checked: 0, problems: [], captions: [], text: document.body.innerText, overflow: null };
      // Nothing may stick out sideways (the page must not scroll horizontally).
      const vw = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > vw + 1) {
        const wide = [...document.querySelectorAll('body *')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.right > vw + 1 && getComputedStyle(e).position !== 'fixed';
          })
          .slice(-3)
          .map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`);
        out.overflow = `page is ${document.documentElement.scrollWidth}px wide (${wide.join(', ')})`;
      }
      for (const cell of document.querySelectorAll('[data-braille-cell]')) {
        // Captions, checked in Node with lib/braille/labels.ts (same rule as the jsdom tests).
        const captions = [];
        const aria = cell.getAttribute('aria-label');
        if (aria) captions.push(aria.split(',')[0]);
        let wrapper = cell;
        for (let i = 0; i < 3 && wrapper.parentElement; i++) {
          if (wrapper.parentElement.querySelectorAll('[data-braille-cell]').length > 1) break;
          wrapper = wrapper.parentElement;
        }
        if (wrapper !== cell) {
          const text = (wrapper.textContent ?? '').replace(cell.textContent ?? '', '').trim();
          if (text) captions.push(text);
        }
        const prev = cell.previousElementSibling?.hasAttribute('data-braille-cell')
          ? cell.previousElementSibling.getAttribute('data-dots')
          : undefined;
        if (captions.length) out.captions.push({ dots: cell.getAttribute('data-dots'), captions, prev });
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
    for (const c of result.captions)
      for (const caption of c.captions) {
        const problem = cellLabelProblem(c.dots, caption, c.prev ?? undefined);
        if (problem) result.problems.push(problem);
      }
    for (const t of SUPERSEDED_TERMS) {
      const m = result.text.match(new RegExp(t.re.source, 'i'));
      if (m) result.problems.push(`page text says "${m[0]}" (UEB: ${t.ueb})`);
    }
    const other = result.text.match(OTHER_CODE_RE);
    if (other) result.problems.push(`page text names another braille code: "${other[0]}"`);
    if (result.overflow) result.problems.push(result.overflow);
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
