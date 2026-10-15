/** Vercel Analytics: admin pages are dropped, every other page is sent unchanged. */
import { dropAdminEvents } from '@/lib/analytics-filter';

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
