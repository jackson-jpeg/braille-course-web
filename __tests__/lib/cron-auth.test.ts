/**
 * @jest-environment node
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. A secret stored with stray whitespace in
 * the Vercel dashboard must still authenticate, and anything else must not.
 */
import { verifyCronSecret } from '@/lib/cron-auth';

const original = process.env.CRON_SECRET;
afterEach(() => {
  process.env.CRON_SECRET = original;
});

describe('verifyCronSecret', () => {
  test.each(['s3cret', ' s3cret', 's3cret\n', '\t s3cret  '])('secret %j: the trimmed token is accepted', (stored) => {
    process.env.CRON_SECRET = stored;
    expect(verifyCronSecret('Bearer s3cret')).toBe(true);
    expect(verifyCronSecret(`Bearer ${stored}`)).toBe(true);
  });

  test('wrong, missing or malformed credentials are rejected', () => {
    process.env.CRON_SECRET = ' s3cret ';
    for (const h of [null, '', 'Bearer', 'Bearer ', 'Bearer s3cre', 'Bearer s3cret2', 's3cret', 'Basic s3cret'])
      expect(verifyCronSecret(h)).toBe(false);
  });

  test('an empty or whitespace-only secret never authenticates', () => {
    for (const s of [undefined, '', '   ']) {
      if (s === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = s;
      expect(verifyCronSecret('Bearer ')).toBe(false);
      expect(verifyCronSecret('Bearer x')).toBe(false);
    }
  });
});
