import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── POST /api/admin/waitlist/promote ── promote a waitlisted student to COMPLETED ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { enrollmentId } = await req.json();
    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { section: true },
      });

      if (!enrollment) throw new Error('Enrollment not found');
      if (enrollment.paymentStatus !== 'WAITLISTED') throw new Error('Enrollment is not waitlisted');

      // Re-check capacity inside transaction
      const section = await tx.section.findUnique({ where: { id: enrollment.sectionId } });
      if (!section) throw new Error('Section not found');
      if (section.enrolledCount >= section.maxCapacity) {
        throw new Error('Section is full — cannot promote');
      }

      // Promote: update enrollment status
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { paymentStatus: 'COMPLETED', waitlistPosition: null },
      });

      // Increment section count
      const newCount = section.enrolledCount + 1;
      await tx.section.update({
        where: { id: section.id },
        data: {
          enrolledCount: newCount,
          status: newCount >= section.maxCapacity ? 'FULL' : 'OPEN',
        },
      });

      // Re-number remaining waitlisted positions
      const remaining = await tx.enrollment.findMany({
        where: { sectionId: enrollment.sectionId, paymentStatus: 'WAITLISTED' },
        orderBy: [{ waitlistPosition: 'asc' }, { createdAt: 'asc' }],
      });

      for (let i = 0; i < remaining.length; i++) {
        await tx.enrollment.update({
          where: { id: remaining[i].id },
          data: { waitlistPosition: i + 1 },
        });
      }

      return { promoted: enrollment.email, newCount };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = (err as Error).message;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
