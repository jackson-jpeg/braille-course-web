import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing RESEND_WEBHOOK_SECRET env var');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const svixId = req.headers.get('svix-id') ?? '';
  const svixTimestamp = req.headers.get('svix-timestamp') ?? '';
  const svixSignature = req.headers.get('svix-signature') ?? '';

  try {
    const payload = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    });

    // Log the event type for debugging
    const eventType = payload.type;
    console.log(`Resend webhook received: ${eventType}`);

    // Auto-capture inquiry emails as prospective leads
    if (eventType === 'email.received') {
      const data = (payload as unknown as { data: { subject?: string; from?: string } }).data;
      const subject = data.subject || '';
      if (subject.toLowerCase().includes('braille session inquiry')) {
        const fromRaw = data.from || '';
        // Parse "Jane Doe <jane@example.com>" or plain "jane@example.com"
        const nameMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
        const email = nameMatch ? nameMatch[2] : fromRaw.replace(/[<>]/g, '').trim();
        const name = nameMatch ? nameMatch[1].trim() : null;

        if (email) {
          try {
            await prisma.lead.upsert({
              where: { email },
              create: { email, name, subject },
              update: {},
            });
            console.log(`Lead auto-captured from inquiry: ${email}`);
          } catch (err) {
            console.error('Failed to upsert lead:', (err as Error).message);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(
      'Resend webhook verification failed:',
      (err as Error).message
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
