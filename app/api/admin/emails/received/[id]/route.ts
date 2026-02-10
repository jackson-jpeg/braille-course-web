import { NextRequest, NextResponse } from 'next/server';
import { getReceivedEmail } from '@/lib/icloud-mail';
import { isAuthorized } from '@/lib/admin-auth';

export const maxDuration = 60;

/* ── GET /api/admin/emails/received/[id]?key=...  ── get single received email via iCloud IMAP ── */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const email = await getReceivedEmail(id);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch (err) {
    const e = err as Error & { responseStatus?: string; responseText?: string };
    console.error('IMAP fetch failed:', {
      message: e.message,
      responseStatus: e.responseStatus,
      responseText: e.responseText,
    });
    return NextResponse.json({ error: `Failed to fetch received email: ${e.message}` }, { status: 500 });
  }
}
