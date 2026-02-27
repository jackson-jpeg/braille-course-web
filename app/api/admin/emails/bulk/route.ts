import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { customEmail } from '@/lib/email-templates';
import { resend } from '@/lib/resend';

/**
 * POST /api/admin/emails/bulk
 * Send personalized emails to multiple recipients with merge tag support.
 * Body: { recipients: { email, firstName?, courseName? }[], subject, body }
 *
 * Merge tags: {{firstName}}, {{courseName}}, {{email}}
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipients, subject, body } = await req.json();

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 });
    }
    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }
    if (recipients.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 recipients per bulk send' }, { status: 400 });
    }

    const results: { email: string; success: boolean; error?: string }[] = [];
    const defaultCourseName = 'Summer Braille Course';

    // Send individually to apply merge tags per recipient
    for (const recipient of recipients) {
      const email = recipient.email;
      if (!email) continue;

      const firstName = recipient.firstName || email.split('@')[0];
      const courseName = recipient.courseName || defaultCourseName;

      // Replace merge tags
      const personalizedSubject = subject
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{courseName\}\}/g, courseName)
        .replace(/\{\{email\}\}/g, email);

      const personalizedBody = body
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{courseName\}\}/g, courseName)
        .replace(/\{\{email\}\}/g, email);

      try {
        await resend.emails.send({
          from: 'Delaney Costello <delaney@teachbraille.org>',
          to: email,
          subject: personalizedSubject,
          html: customEmail({ subject: personalizedSubject, body: personalizedBody }),
        });
        results.push({ email, success: true });
      } catch (err) {
        results.push({ email, success: false, error: (err as Error).message });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({ sent, failed, results });
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json({ error: 'Failed to send bulk email' }, { status: 500 });
  }
}
