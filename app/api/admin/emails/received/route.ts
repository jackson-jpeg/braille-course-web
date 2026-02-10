import { NextRequest, NextResponse } from 'next/server';
import { listReceivedEmails } from '@/lib/icloud-mail';
import { isAuthorized } from '@/lib/admin-auth';

export const maxDuration = 60;

/* ── GET /api/admin/emails/received?key=...  ── list received emails via iCloud IMAP ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const emails = await listReceivedEmails(50);

    return NextResponse.json({
      emails,
      has_more: false,
    });
  } catch (err) {
    const e = err as Error & { responseStatus?: string; responseText?: string };
    console.error('IMAP fetch failed:', {
      message: e.message,
      responseStatus: e.responseStatus,
      responseText: e.responseText,
    });
    return NextResponse.json({ error: `Failed to fetch received emails: ${e.message}` }, { status: 500 });
  }
}
