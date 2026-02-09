import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createSessionToken } from '@/lib/admin-auth';
import { checkRateLimit, clearRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed, retryAfter } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected || !password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    let match = false;
    try {
      match = timingSafeEqual(Buffer.from(password), Buffer.from(expected));
    } catch {
      match = false;
    }

    if (!match) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    clearRateLimit(ip);

    const token = createSessionToken();
    const res = NextResponse.json({ success: true });

    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
