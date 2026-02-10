import { NextRequest } from 'next/server';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SECRET = process.env.ADMIN_PASSWORD!;
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export function createSessionToken(): string {
  const nonce = randomBytes(32).toString('hex');
  const ts = Date.now().toString();
  const payload = `${ts}:${nonce}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): boolean {
  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return false;

  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);

  const [ts, nonce] = payload.split(':');
  if (!ts || !nonce || !sig) return false;
  if (Date.now() - parseInt(ts) > MAX_AGE) return false;

  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
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
