import { timingSafeEqual } from 'crypto';

/**
 * Check the `Authorization: Bearer <CRON_SECRET>` header Vercel Cron sends. Both sides are trimmed:
 * a CRON_SECRET pasted into the Vercel dashboard with stray leading/trailing whitespace must not
 * lock the cron jobs out (that whitespace is what broke the Preview deployments).
 */
export function verifyCronSecret(header: string | null): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!header || !secret) return false;
  const match = header.trim().match(/^Bearer\s+(.+)$/);
  if (!match) return false;
  const given = Buffer.from(match[1].trim());
  const expected = Buffer.from(secret);
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}
