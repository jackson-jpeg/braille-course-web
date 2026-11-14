import { readFileSync } from 'fs';
import path from 'path';
import { isAdminPath, keepUmamiPayload } from '@/lib/analytics-filter';

/** Umami's before-send hook drops admin pages: false cancels the hit. */
describe('keepUmamiPayload', () => {
  const payload = { website: '754bea88-a2bd-40d0-b36e-dbe468a48125', url: '/' };

  test.each(['/admin', '/admin/', '/admin/leads'])('drops %s', (p) =>
    expect(keepUmamiPayload(p, payload)).toBe(false),
  );

  test.each(['/', '/learn', '/policies', '/administrator-guide'])('keeps %s', (p) =>
    expect(keepUmamiPayload(p, payload)).toBe(payload),
  );
});

test('isAdminPath does not match /administrator-guide', () => {
  expect(isAdminPath('/admin')).toBe(true);
  expect(isAdminPath('/administrator-guide')).toBe(false);
});

/** Vercel Web Analytics is gone (2026-11-14): Umami is the only visitor count. */
describe('no Vercel Web Analytics', () => {
  const root = path.join(__dirname, '..', '..');
  const read = (f: string) => readFileSync(path.join(root, f), 'utf8');

  test('SiteAnalytics loads only Umami', () => {
    const src = read('components/SiteAnalytics.tsx');
    expect(src).not.toMatch(/@vercel\/analytics/);
    expect(src).toContain('https://a.unpossible.studio/a/sgj.js');
  });

  test('the package is not a dependency', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.dependencies?.['@vercel/analytics']).toBeUndefined();
  });

  test('Policies no longer mention Vercel Web Analytics', () => {
    const policies = read('app/policies/page.tsx');
    expect(policies).not.toMatch(/Vercel Web\s+Analytics/);
    expect(policies).not.toMatch(/anonymized analytics/);
    expect(policies).toContain('We count visits to this website with Umami');
  });
});
