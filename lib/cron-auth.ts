import { timingSafeEqual } from 'crypto';

export function verifyCronSecret(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!header || !secret) return false;
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}
