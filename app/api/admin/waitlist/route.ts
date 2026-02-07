import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/waitlist ── list waitlisted enrollments grouped by section ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const waitlisted = await prisma.enrollment.findMany({
      where: { paymentStatus: 'WAITLISTED' },
      include: { section: true },
      orderBy: [{ sectionId: 'asc' }, { createdAt: 'asc' }],
    });

    // Backfill positions for any that are null (legacy records)
    const bySection: Record<string, typeof waitlisted> = {};
    for (const e of waitlisted) {
      if (!bySection[e.sectionId]) bySection[e.sectionId] = [];
      bySection[e.sectionId].push(e);
    }

    const updates: Promise<unknown>[] = [];
    for (const sectionEntries of Object.values(bySection)) {
      sectionEntries.sort((a, b) => {
        if (a.waitlistPosition != null && b.waitlistPosition != null)
          return a.waitlistPosition - b.waitlistPosition;
        if (a.waitlistPosition != null) return -1;
        if (b.waitlistPosition != null) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      for (let i = 0; i < sectionEntries.length; i++) {
        const expected = i + 1;
        if (sectionEntries[i].waitlistPosition !== expected) {
          sectionEntries[i].waitlistPosition = expected;
          updates.push(
            prisma.enrollment.update({
              where: { id: sectionEntries[i].id },
              data: { waitlistPosition: expected },
            })
          );
        }
      }
    }

    if (updates.length > 0) await Promise.all(updates);

    const serialized = waitlisted.map((e) => ({
      id: e.id,
      email: e.email,
      plan: e.plan,
      paymentStatus: e.paymentStatus,
      stripeCustomerId: e.stripeCustomerId,
      stripeSessionId: e.stripeSessionId,
      createdAt: e.createdAt.toISOString(),
      waitlistPosition: e.waitlistPosition,
      section: { label: e.section.label },
    }));

    return NextResponse.json({ waitlisted: serialized });
  } catch (err) {
    console.error('Failed to fetch waitlist:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}
