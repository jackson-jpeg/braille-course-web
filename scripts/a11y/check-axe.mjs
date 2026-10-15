#!/usr/bin/env node
/**
 * Automated accessibility check (axe-core in Chromium) of every lesson and game page.
 *
 * Loads the home page, the intro, the lesson index, every lesson (/learn/<slug>) and the games page,
 * scrolls so every lazily loaded game mounts, and runs axe with the WCAG 2.0/2.1/2.2 A and AA rules.
 * Every violation fails the run. Pages are checked at 1280px and 390px wide.
 * Usage: node scripts/a11y/check-axe.mjs http://localhost:3000
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';

const base = process.argv[2] ?? 'http://localhost:3000';
const curriculum = fs.readFileSync(new URL('../../lib/course-curriculum.ts', import.meta.url), 'utf8');
const slugs = [...curriculum.matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => m[1]);
const pages = ['/', '/intro', '/learn', '/games', '/summer', ...slugs.map((s) => `/learn/${s}`)];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const browser = await chromium.launch({ headless: true });
let violations = 0;

for (const width of [1280, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  for (const path of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.title.length > 0 && document.body.innerText.length > 0);
    const close = page.locator('.onboarding-close');
    if (await close.count()) await close.first().click();
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(60);
    }
    // Delayed content (e.g. the hero's hint fades in after 1.5 s) must be on screen when measured.
    await page.waitForTimeout(2500);
    // Let entrance animations finish so colours are measured at rest.
    await page.evaluate(() =>
      document.getAnimations().forEach((a) => {
        try {
          a.finish();
        } catch {
          // infinite (looping) animations cannot be finished; they are decorative
        }
      }),
    );
    // Measure from the top of the page: otherwise whatever happens to sit under the sticky nav at
    // the last scroll position is reported as an obscured target.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    for (const v of results.violations) {
      violations++;
      console.log(`FAIL ${width}px ${path}: [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} element(s))`);
      for (const n of v.nodes.slice(0, 5))
        console.log(`    ${n.target.join(' ')} :: ${n.failureSummary?.split('\n').slice(1).join(' ')}`);
    }
    console.log(`${width}px ${path}: ${results.violations.length} violation(s), ${results.passes.length} rules passed`);
  }
  await context.close();
}
await browser.close();
console.log(`${violations} accessibility violation(s)`);
process.exit(violations ? 1 : 0);
