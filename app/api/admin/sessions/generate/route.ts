import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── POST /api/admin/sessions/generate ── auto-generate 16 sessions for a section ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sectionId } = await req.json();
    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
    }

    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Idempotency: check if sessions already exist
    const existingCount = await prisma.classSession.count({ where: { sectionId } });
    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Sessions already exist (${existingCount} found). Skipping generation.`,
        created: 0,
      });
    }

    // Determine schedule based on section label
    // Section A = Mon & Wed starting June 8, 2026
    // Section B = Tue & Thu starting June 9, 2026
    const isA = section.label.includes('A');
    const startDate = isA ? new Date('2026-06-08') : new Date('2026-06-09');
    const days = isA ? [1, 3] : [2, 4]; // Mon=1, Wed=3, Tue=2, Thu=4
    const totalSessions = 16;

    // Generate session dates by iterating from start
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (dates.length < totalSessions) {
      if (days.includes(current.getDay())) {
        // Set time: Section A = 1 PM ET, Section B = 4 PM ET
        const sessionDate = new Date(current);
        sessionDate.setUTCHours(isA ? 17 : 20, 0, 0, 0); // ET = UTC-4 in summer
        dates.push(sessionDate);
      }
      current.setDate(current.getDate() + 1);
    }

    // Create all sessions
    const sessions = await prisma.$transaction(
      dates.map((date, i) =>
        prisma.classSession.create({
          data: {
            sectionId,
            title: `Class ${i + 1}`,
            date,
            sessionNum: i + 1,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      created: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        sectionId: s.sectionId,
        title: s.title,
        date: s.date.toISOString(),
        sessionNum: s.sessionNum,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
