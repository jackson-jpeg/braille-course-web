import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── POST /api/admin/waitlist/remove ── remove a student from the waitlist ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { enrollmentId } = await req.json();
    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.paymentStatus !== 'WAITLISTED') {
      return NextResponse.json({ error: 'Enrollment is not waitlisted' }, { status: 400 });
    }

    // Delete the enrollment
    await prisma.enrollment.delete({ where: { id: enrollmentId } });

    // Re-number remaining waitlisted positions for the section
    const remaining = await prisma.enrollment.findMany({
      where: { sectionId: enrollment.sectionId, paymentStatus: 'WAITLISTED' },
      orderBy: [{ waitlistPosition: 'asc' }, { createdAt: 'asc' }],
    });

    for (let i = 0; i < remaining.length; i++) {
      await prisma.enrollment.update({
        where: { id: remaining[i].id },
        data: { waitlistPosition: i + 1 },
      });
    }

    return NextResponse.json({
      success: true,
      warning: 'This student already paid — consider issuing a refund via Stripe.',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
