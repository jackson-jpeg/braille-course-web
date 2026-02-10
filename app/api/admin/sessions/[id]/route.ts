import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/sessions/[id] ── get session with full attendance roster ── */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const session = await prisma.classSession.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            enrollment: { select: { email: true } },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: session.id,
        sectionId: session.sectionId,
        title: session.title,
        date: session.date.toISOString(),
        sessionNum: session.sessionNum,
      },
      attendances: session.attendances.map((a) => ({
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

/* ── PATCH /api/admin/sessions/[id] ── update session title/date ── */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.date !== undefined) updates.date = new Date(body.date);

    const session = await prisma.classSession.update({
      where: { id },
      data: updates,
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

/* ── DELETE /api/admin/sessions/[id] ── delete session (cascades attendance) ── */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.classSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
