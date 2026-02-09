import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [sessions, scheduledEmails, assignments] = await Promise.all([
      prisma.classSession.findMany({
        include: { section: { select: { label: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.scheduledEmail.findMany({
        where: { status: 'PENDING' },
        orderBy: { scheduledFor: 'asc' },
      }),
      prisma.assignment.findMany({
        where: { dueDate: { not: null } },
        include: { section: { select: { label: true } } },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        sectionId: s.sectionId,
        sectionLabel: s.section.label,
        title: s.title,
        date: s.date.toISOString(),
        sessionNum: s.sessionNum,
      })),
      scheduledEmails: scheduledEmails.map((e) => ({
        id: e.id,
        subject: e.subject,
        scheduledFor: e.scheduledFor.toISOString(),
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        sectionLabel: a.section.label,
        dueDate: a.dueDate!.toISOString(),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
