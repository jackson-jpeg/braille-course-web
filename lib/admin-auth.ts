import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.ADMIN_PASSWORD!;
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export function createSessionToken(): string {
  const ts = Date.now().toString();
  const sig = createHmac('sha256', SECRET).update(ts).digest('hex');
  return `${ts}.${sig}`;
}

export function verifySessionToken(token: string): boolean {
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  if (Date.now() - parseInt(ts) > MAX_AGE) return false;
  const expected = createHmac('sha256', SECRET).update(ts).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  return !!cookie && verifySessionToken(cookie);
}
