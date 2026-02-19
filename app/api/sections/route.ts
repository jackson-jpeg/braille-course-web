import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`sections:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }
  try {
    const sections = await prisma.section.findMany({
      orderBy: { label: 'asc' },
      select: {
        id: true,
        label: true,
        maxCapacity: true,
        enrolledCount: true,
        status: true,
      },
    });

    return NextResponse.json(sections);
  } catch (err) {
    console.error('Failed to fetch sections:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}
