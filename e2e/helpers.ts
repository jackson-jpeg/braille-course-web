import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Run axe (WCAG 2.2 AA) and fail with a readable list of violations. */
export async function expectNoAxeViolations(page: Page, context = '') {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes
      .slice(0, 5)
      .map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary ?? '').split('\n').slice(0, 2).join(' ')),
  }));
  expect(summary, `axe violations ${context}`).toEqual([]);
}

/** Collect console errors and page errors for the lifetime of the page. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Expected without production secrets/DB in the test environment.
    if (/Failed to load resource: the server responded with a status of (404|500)/.test(text)) return;
    if (/va\.vercel-scripts|_vercel\/insights/.test(text)) return;
    // The cloud test container reaches the internet through a TLS-inspecting proxy that Chromium
    // doesn't trust, so third-party scripts (js.stripe.com) fail to load here but not in production.
    if (/ERR_CERT_AUTHORITY_INVALID/.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page should not scroll sideways').toBeLessThanOrEqual(1);
}

/** Clear localStorage so each test starts as a brand-new visitor. */
export async function freshVisitor(page: Page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('__e2e_cleared')) {
      localStorage.clear();
      sessionStorage.setItem('__e2e_cleared', '1');
    }
  });
}
