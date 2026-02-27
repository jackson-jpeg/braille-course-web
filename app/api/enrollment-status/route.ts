import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSchedule } from '@/lib/schedule';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`enrollment-status:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { stripeSessionId: sessionId },
      include: { section: true },
    });

    if (!enrollment) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      schedule: getSchedule(enrollment.section.label),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
