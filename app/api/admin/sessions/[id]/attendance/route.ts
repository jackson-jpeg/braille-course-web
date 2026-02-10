import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── POST /api/admin/sessions/[id]/attendance ── bulk-set attendance records ── */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: classSessionId } = await params;

  try {
    const { records } = await req.json();

    if (!Array.isArray(records)) {
      return NextResponse.json({ error: 'records array is required' }, { status: 400 });
    }

    // Verify session exists
    const session = await prisma.classSession.findUnique({ where: { id: classSessionId } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Upsert each attendance record in a transaction
    await prisma.$transaction(async (tx) => {
      for (const record of records) {
        const { enrollmentId, status, note } = record;
        if (!enrollmentId || !status) continue;

        await tx.attendance.upsert({
          where: {
            classSessionId_enrollmentId: {
              classSessionId,
              enrollmentId,
            },
          },
          create: {
            classSessionId,
            enrollmentId,
            status,
            note: note || null,
          },
          update: {
            status,
            note: note || null,
          },
        });
      }
    });

    // Return updated attendance list
    const attendances = await prisma.attendance.findMany({
      where: { classSessionId },
      include: {
        enrollment: { select: { email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      attendances: attendances.map((a) => ({
        id: a.id,
        classSessionId: a.classSessionId,
        enrollmentId: a.enrollmentId,
        status: a.status,
        note: a.note,
        enrollment: { email: a.enrollment.email },
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
