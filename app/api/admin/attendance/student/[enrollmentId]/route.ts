import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/attendance/student/[enrollmentId] ── student attendance history + stats ── */
export async function GET(req: NextRequest, { params }: { params: Promise<{ enrollmentId: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { enrollmentId } = await params;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { sectionId: true },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Get all sessions for this section
    const totalSessions = await prisma.classSession.count({
      where: { sectionId: enrollment.sectionId },
    });

    // Get this student's attendance records with session info
    const attendances = await prisma.attendance.findMany({
      where: { enrollmentId },
      include: {
        classSession: {
          select: { sessionNum: true, date: true, title: true },
        },
      },
      orderBy: { classSession: { sessionNum: 'asc' } },
    });

    const attended = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;

    return NextResponse.json({
      stats: {
        attended,
        total: totalSessions,
        rate: totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0,
        records: attendances.map((a) => ({
          sessionNum: a.classSession.sessionNum,
          date: a.classSession.date.toISOString(),
          title: a.classSession.title,
          status: a.status,
          note: a.note,
        })),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
