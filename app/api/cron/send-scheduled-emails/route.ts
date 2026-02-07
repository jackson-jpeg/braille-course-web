import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { customEmail } from '@/lib/email-templates';

export async function GET(req: NextRequest) {
  // Only allow Vercel Cron (or manual trigger with the secret)
  if (
    req.headers.get('authorization') !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find PENDING emails whose scheduled time has passed
    const due = await prisma.scheduledEmail.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    let sent = 0;
    let failed = 0;

    for (const email of due) {
      // Mark as SENDING to prevent duplicates
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { status: 'SENDING' },
      });

      try {
        const html = customEmail({ subject: email.subject, body: email.body });

        // Fetch attachments if any
        const emailAttachments: { filename: string; content: Buffer }[] = [];
        if (email.attachmentIds.length > 0) {
          const materials = await prisma.material.findMany({
            where: { id: { in: email.attachmentIds } },
          });

          for (const mat of materials) {
            try {
              const response = await fetch(mat.blobUrl);
              if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                emailAttachments.push({
                  filename: mat.filename,
                  content: Buffer.from(arrayBuffer),
                });
              }
            } catch {
              console.error(`Failed to fetch attachment ${mat.filename}`);
            }
          }
        }

        const result = await resend.emails.send({
          from: 'Delaney Costello <delaney@teachbraille.org>',
          to: email.to,
          subject: email.subject,
          html,
          ...(emailAttachments.length > 0 ? { attachments: emailAttachments } : {}),
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            resendId: result.data?.id || null,
          },
        });
        sent++;
      } catch (err) {
        console.error(`Failed to send scheduled email ${email.id}:`, (err as Error).message);
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            error: (err as Error).message,
          },
        });
        failed++;
      }
    }

    return NextResponse.json({ ok: true, processed: due.length, sent, failed });
  } catch (err) {
    console.error('Cron send-scheduled-emails failed:', (err as Error).message);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
