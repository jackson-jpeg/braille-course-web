import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/sessions?sectionId=... ── list sessions for a section ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sectionId = req.nextUrl.searchParams.get('sectionId');
  if (!sectionId) {
    return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
  }

  try {
    const sessions = await prisma.classSession.findMany({
      where: { sectionId },
      include: {
        _count: { select: { attendances: true } },
      },
      orderBy: { sessionNum: 'asc' },
    });

    // Get total enrolled (COMPLETED) for this section for attendance ratio
    const totalEnrolled = await prisma.enrollment.count({
      where: { sectionId, paymentStatus: 'COMPLETED' },
    });

    const serialized = sessions.map((s) => ({
      id: s.id,
      sectionId: s.sectionId,
      title: s.title,
      date: s.date.toISOString(),
      sessionNum: s.sessionNum,
      attendanceCount: s._count.attendances,
      totalEnrolled,
    }));

    return NextResponse.json({ sessions: serialized });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── POST /api/admin/sessions ── create a single session ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sectionId, title, date, sessionNum } = await req.json();

    if (!sectionId || !title || !date || !sessionNum) {
      return NextResponse.json(
        { error: 'Missing required fields: sectionId, title, date, sessionNum' },
        { status: 400 }
      );
    }

    const session = await prisma.classSession.create({
      data: {
        sectionId,
        title,
        date: new Date(date),
        sessionNum,
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sectionId: session.sectionId,
        title: session.title,
        date: session.date.toISOString(),
        sessionNum: session.sessionNum,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
