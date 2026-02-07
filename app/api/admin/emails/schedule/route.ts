import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/emails/schedule ── list scheduled emails ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get('status') || undefined;

  try {
    const emails = await prisma.scheduledEmail.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { scheduledFor: 'asc' },
    });

    const serialized = emails.map((e) => ({
      id: e.id,
      to: e.to,
      subject: e.subject,
      body: e.body,
      scheduledFor: e.scheduledFor.toISOString(),
      status: e.status,
      sentAt: e.sentAt?.toISOString() || null,
      resendId: e.resendId,
      error: e.error,
      attachmentIds: e.attachmentIds,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ emails: serialized });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── POST /api/admin/emails/schedule ── create a scheduled email ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { to, subject, body, scheduledFor, attachmentIds } = await req.json();

    if (!to || !subject || !body || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body, scheduledFor' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    const email = await prisma.scheduledEmail.create({
      data: {
        to: recipients,
        subject,
        body,
        scheduledFor: scheduledDate,
        attachmentIds: attachmentIds || [],
      },
    });

    return NextResponse.json({
      success: true,
      email: {
        id: email.id,
        to: email.to,
        subject: email.subject,
        body: email.body,
        scheduledFor: email.scheduledFor.toISOString(),
        status: email.status,
        sentAt: null,
        resendId: null,
        error: null,
        attachmentIds: email.attachmentIds,
        createdAt: email.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
