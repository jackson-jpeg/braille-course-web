import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  ANALYTICS_EVENT_TYPES,
  MAX_TARGET_LENGTH,
  MAX_META_LENGTH,
  isKnownTarget,
  type AnalyticsEventType,
} from '@/lib/learn-analytics';

/**
 * Public ingestion endpoint for anonymous free-course & game engagement events.
 * No auth by design (anonymous learners), but strictly validated: only known
 * event types, bounded string sizes, and a single small row per call.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`track:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { visitorId, eventType, target, meta } = body as {
      visitorId?: unknown;
      eventType?: unknown;
      target?: unknown;
      meta?: unknown;
    };

    if (typeof visitorId !== 'string' || !visitorId || visitorId.length > 64) {
      return NextResponse.json({ error: 'Invalid visitorId' }, { status: 400 });
    }
    if (typeof eventType !== 'string' || !ANALYTICS_EVENT_TYPES.includes(eventType as AnalyticsEventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }
    if (
      typeof target !== 'string' ||
      !target ||
      target.length > MAX_TARGET_LENGTH ||
      !isKnownTarget(eventType as AnalyticsEventType, target)
    ) {
      return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
    }

    // meta is optional; store as a bounded JSON string if present.
    let metaStr: string | null = null;
    if (meta != null) {
      const s = JSON.stringify(meta);
      if (s.length <= MAX_META_LENGTH) metaStr = s;
    }

    await prisma.analyticsEvent.create({
      data: { visitorId, eventType, target, meta: metaStr },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Track event error:', error);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
