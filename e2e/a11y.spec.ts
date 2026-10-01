import { test, expect } from '@playwright/test';
import { ALL_PAGES } from './pages';
import { expectNoAxeViolations, expectNoHorizontalScroll, trackErrors } from './helpers';

/** Every page: WCAG 2.2 AA (axe), SEO basics, one h1, no sideways scroll, no JS errors. */
for (const path of ALL_PAGES) {
  test(`page ${path}`, async ({ page }) => {
    const errors = trackErrors(page);
    const res = await page.goto(path, { waitUntil: 'networkidle' });
    const isMissing = path === '/this-page-does-not-exist';
    expect(res?.status()).toBe(isMissing ? 404 : 200);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect((await page.title()).length).toBeGreaterThan(10);

    if (!isMissing && !path.startsWith('/summer')) {
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length ?? 0).toBeGreaterThan(50);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(`https://teachbraille.org${path === '/' ? '' : path}`);
    }

    await expectNoHorizontalScroll(page);
    await expectNoAxeViolations(page, path);

    // Skip link is the first Tab stop and jumps to the main content.
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    expect(errors).toEqual([]);
  });
}
