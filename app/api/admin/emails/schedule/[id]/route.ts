import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorized } from '@/lib/admin-auth';

/* ── PATCH /api/admin/emails/schedule/[id] ── edit a PENDING scheduled email ── */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.scheduledEmail.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (existing.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only PENDING emails can be edited' }, { status: 400 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.to !== undefined) updates.to = Array.isArray(body.to) ? body.to : [body.to];
    if (body.subject !== undefined) updates.subject = body.subject;
    if (body.body !== undefined) updates.body = body.body;
    if (body.scheduledFor !== undefined) {
      const newDate = new Date(body.scheduledFor);
      if (newDate <= new Date()) {
        return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
      }
      updates.scheduledFor = newDate;
    }
    if (body.attachmentIds !== undefined) updates.attachmentIds = body.attachmentIds;

    const updated = await prisma.scheduledEmail.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      email: {
        id: updated.id,
        to: updated.to,
        subject: updated.subject,
        body: updated.body,
        scheduledFor: updated.scheduledFor.toISOString(),
        status: updated.status,
        sentAt: updated.sentAt?.toISOString() || null,
        resendId: updated.resendId,
        error: updated.error,
        attachmentIds: updated.attachmentIds,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ── DELETE /api/admin/emails/schedule/[id] ── cancel a scheduled email ── */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.scheduledEmail.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (existing.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only PENDING emails can be cancelled' }, { status: 400 });
    }

    await prisma.scheduledEmail.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
