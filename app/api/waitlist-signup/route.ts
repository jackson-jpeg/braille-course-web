import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`waitlist:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    await prisma.lead.upsert({
      where: { email: email.toLowerCase().trim() },
      update: { subject: 'Waitlist Request', status: 'NEW' },
      create: {
        email: email.toLowerCase().trim(),
        subject: 'Waitlist Request',
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Waitlist signup failed:', (err as Error).message);
    return NextResponse.json({ error: 'Unable to join waitlist. Please try again.' }, { status: 500 });
  }
}
