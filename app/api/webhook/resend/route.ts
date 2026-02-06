import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

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

    // For email.received events, Resend stores the email regardless.
    // Future: could add DB storage, notifications, etc.

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(
      'Resend webhook verification failed:',
      (err as Error).message
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}
