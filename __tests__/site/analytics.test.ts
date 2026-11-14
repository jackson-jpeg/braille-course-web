/** Vercel Analytics: admin pages are dropped, every other page is sent unchanged. */
import { dropAdminEvents, keepUmamiPayload } from '@/lib/analytics-filter';

const ev = (url: string) => ({ type: 'pageview' as const, url });

test.each([
  'https://teachbraille.org/admin',
  'https://teachbraille.org/admin/',
  'https://teachbraille.org/admin?tab=leads',
])('drops %s', (url) => expect(dropAdminEvents(ev(url))).toBeNull());

test.each([
  'https://teachbraille.org/',
  'https://teachbraille.org/learn',
  'https://teachbraille.org/administrator-guide',
])('keeps %s', (url) => expect(dropAdminEvents(ev(url))).toEqual(ev(url)));

/** Umami's before-send hook follows the same rule: false cancels the hit. */
describe('keepUmamiPayload', () => {
  const payload = { website: '754bea88-a2bd-40d0-b36e-dbe468a48125', url: '/' };

  test.each(['/admin', '/admin/', '/admin/leads'])('drops %s', (path) =>
    expect(keepUmamiPayload(path, payload)).toBe(false),
  );

  test.each(['/', '/learn', '/policies', '/administrator-guide'])('keeps %s', (path) =>
    expect(keepUmamiPayload(path, payload)).toBe(payload),
  );
});
