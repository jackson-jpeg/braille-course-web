import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { customEmail } from '@/lib/email-templates';

function isAuthorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key');
  return !!process.env.ADMIN_PASSWORD && key === process.env.ADMIN_PASSWORD;
}

/* ── GET /api/admin/emails?key=...  ── list sent emails ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await resend.emails.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ emails: result.data?.data ?? [] });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

/* ── POST /api/admin/emails?key=...  ── send an email ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    const html = customEmail({ subject, body });

    const result = await resend.emails.send({
      from: 'Delaney Costello <delaney@teachbraille.org>',
      to: recipients,
      subject,
      html,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch {
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
