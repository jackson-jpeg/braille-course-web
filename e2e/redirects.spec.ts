import { test, expect } from '@playwright/test';
import { LEGACY_LESSON_REDIRECTS } from '../lib/course-curriculum';
import { LEGACY_GAME_ANCHORS } from '../lib/games/registry';

test('/summer moves permanently to /courses', async ({ request }) => {
  const res = await request.get('/summer', { maxRedirects: 0 });
  expect([301, 308]).toContain(res.status());
  expect(res.headers()['location']).toMatch(/\/courses$/);
});

for (const [from, to] of Object.entries(LEGACY_LESSON_REDIRECTS)) {
  test(`old lesson /learn/${from} → /learn/${to}`, async ({ request }) => {
    const res = await request.get(`/learn/${from}`, { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()['location']).toMatch(new RegExp(`/learn/${to}$`));
  });
}

for (const [anchor, slug] of Object.entries(LEGACY_GAME_ANCHORS)) {
  test(`old anchor /games#${anchor} → /games/${slug}`, async ({ page }) => {
    await page.goto(`/games#${anchor}`);
    await expect(page).toHaveURL(new RegExp(`/games/${slug}$`));
  });
}

test('sitemap lists every lesson and game and no removed URLs', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain('https://teachbraille.org/learn/what-is-braille');
  expect(xml).toContain('https://teachbraille.org/games/dot-quest');
  expect(xml).toContain('https://teachbraille.org/courses');
  expect(xml).not.toContain('/summer');
  expect(xml).not.toContain('/learn/wrap-up');
});

test('robots.txt still blocks private routes', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Disallow: /admin');
  expect(txt).toContain('Disallow: /summer/checkout');
});
