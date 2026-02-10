import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/school-activities?schoolInquiryId=... — list activities for a school ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const schoolInquiryId = req.nextUrl.searchParams.get('schoolInquiryId');
    if (!schoolInquiryId) {
      return NextResponse.json({ error: 'schoolInquiryId is required' }, { status: 400 });
    }

    const activities = await prisma.schoolActivity.findMany({
      where: { schoolInquiryId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      activities: activities.map((a) => ({
        ...a,
        date: a.date.toISOString(),
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

/* ── POST /api/admin/school-activities — create a new activity ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { schoolInquiryId, date, type, content } = body as {
      schoolInquiryId?: string;
      date?: string;
      type?: string;
      content?: string;
    };

    if (!schoolInquiryId || !type || !content) {
      return NextResponse.json({ error: 'schoolInquiryId, type, and content are required' }, { status: 400 });
    }

    const validTypes = ['SESSION_NOTE', 'PHONE_CALL', 'EMAIL', 'MEETING', 'OTHER'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    if (content.trim().length < 1 || content.trim().length > 5000) {
      return NextResponse.json({ error: 'Content must be 1-5000 characters' }, { status: 400 });
    }

    const activity = await prisma.schoolActivity.create({
      data: {
        schoolInquiryId,
        date: date ? new Date(date) : new Date(),
        type,
        content: content.trim(),
      },
    });

    return NextResponse.json({
      activity: {
        ...activity,
        date: activity.date.toISOString(),
        createdAt: activity.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

/* ── DELETE /api/admin/school-activities?id=... — delete an activity ── */
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.schoolActivity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}
