import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { customEmail } from '@/lib/email-templates';
import { isAuthorized } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/* ── GET /api/admin/emails ── list sent emails ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await resend.emails.list();

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ emails: result.data?.data ?? [] });
  } catch (err) {
    console.error('Failed to fetch emails:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

/* ── POST /api/admin/emails ── send an email ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { to, subject, body, attachmentIds } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    const recipients = Array.isArray(to) ? to : [to];
    const html = customEmail({ subject, body });

    // Build attachments array if material IDs provided
    const emailAttachments: { filename: string; content: Buffer }[] = [];
    if (attachmentIds && Array.isArray(attachmentIds) && attachmentIds.length > 0) {
      const materials = await prisma.material.findMany({
        where: { id: { in: attachmentIds } },
      });

      for (const mat of materials) {
        const response = await fetch(mat.blobUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          emailAttachments.push({
            filename: mat.filename,
            content: Buffer.from(arrayBuffer),
          });
        }
      }
    }

    const result = await resend.emails.send({
      from: 'Delaney Costello <delaney@teachbraille.org>',
      to: recipients,
      subject,
      html,
      ...(emailAttachments.length > 0 ? { attachments: emailAttachments } : {}),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err) {
    console.error('Failed to send email:', (err as Error).message);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
