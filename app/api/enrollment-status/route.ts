import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSchedule } from '@/lib/schedule';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

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
}
