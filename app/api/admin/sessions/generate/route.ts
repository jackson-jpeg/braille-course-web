import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';
import { getSettings, getSetting } from '@/lib/settings';

/* ── POST /api/admin/sessions/generate ── auto-generate sessions for a section ── */
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

    // Read schedule settings from DB
    const settings = await getSettings();
    const isA = section.label.includes('A');
    const sectionKey = isA ? 'A' : 'B';

    const startDateStr = getSetting(settings, 'course.startDate', '2026-06-08');
    const daysStr = getSetting(settings, `section.${sectionKey}.days`, isA ? '1,3' : '2,4');
    const timeStr = getSetting(settings, `section.${sectionKey}.time`, isA ? '13:00' : '16:00');
    const totalSessions = parseInt(getSetting(settings, 'course.sessionCount', '16'), 10);

    const days = daysStr.split(',').map((d) => parseInt(d.trim(), 10));
    const [hours, minutes] = timeStr.split(':').map(Number);

    // For Section B, if start date is a day not in schedule, advance to the first matching day
    const startDate = new Date(startDateStr);
    if (!days.includes(startDate.getDay())) {
      // Advance to the first day that matches
      while (!days.includes(startDate.getDay())) {
        startDate.setDate(startDate.getDate() + 1);
      }
    }

    // Convert local ET time to UTC (ET = UTC-4 in summer)
    const utcHours = hours + 4;

    // Generate session dates by iterating from start
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (dates.length < totalSessions) {
      if (days.includes(current.getDay())) {
        const sessionDate = new Date(current);
        sessionDate.setUTCHours(utcHours, minutes, 0, 0);
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
        }),
      ),
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
