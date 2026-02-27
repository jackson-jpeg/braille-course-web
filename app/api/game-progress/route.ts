import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

// CUID format validation to prevent injection
const CUID_RE = /^c[a-z0-9]{20,30}$/;

/**
 * GET /api/game-progress?enrollmentId=xxx
 * Load cloud-saved game progress for a student.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`game-progress:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const enrollmentId = req.nextUrl.searchParams.get('enrollmentId');
  if (!enrollmentId || !CUID_RE.test(enrollmentId)) {
    return NextResponse.json({ error: 'enrollmentId required' }, { status: 400 });
  }

  try {
    // Verify enrollment exists and is completed
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { paymentStatus: true },
    });

    if (!enrollment || enrollment.paymentStatus !== 'COMPLETED') {
      return NextResponse.json({ error: 'Invalid enrollment' }, { status: 403 });
    }

    const progress = await prisma.gameProgress.findUnique({
      where: { enrollmentId },
    });

    if (!progress) {
      return NextResponse.json({ progress: null });
    }

    return NextResponse.json({
      progress: JSON.parse(progress.progressJson),
      lastSyncedAt: progress.lastSyncedAt,
    });
  } catch (err) {
    console.error('Game progress fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

/**
 * PUT /api/game-progress
 * Save game progress to cloud. Body: { enrollmentId, progress }
 */
export async function PUT(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`game-progress:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  let body: { enrollmentId?: string; progress?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { enrollmentId, progress } = body;
  if (!enrollmentId || !CUID_RE.test(enrollmentId) || !progress) {
    return NextResponse.json({ error: 'enrollmentId and progress required' }, { status: 400 });
  }

  try {
    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { paymentStatus: true },
    });

    if (!enrollment || enrollment.paymentStatus !== 'COMPLETED') {
      return NextResponse.json({ error: 'Invalid enrollment' }, { status: 403 });
    }

    const progressJson = JSON.stringify(progress);

    // Size limit: 500KB
    if (progressJson.length > 500_000) {
      return NextResponse.json({ error: 'Progress data too large' }, { status: 413 });
    }

    await prisma.gameProgress.upsert({
      where: { enrollmentId },
      create: {
        enrollmentId,
        progressJson,
        lastSyncedAt: new Date(),
      },
      update: {
        progressJson,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Game progress save error:', err);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
