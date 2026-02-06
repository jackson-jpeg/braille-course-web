import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

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
