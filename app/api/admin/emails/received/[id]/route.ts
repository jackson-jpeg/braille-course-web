import { NextRequest, NextResponse } from 'next/server';
import { getReceivedEmail } from '@/lib/icloud-mail';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/emails/received/[id]?key=...  ── get single received email via iCloud IMAP ── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const email = await getReceivedEmail(id);

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ email });
  } catch (err) {
    console.error('IMAP fetch failed:', (err as Error).message);
    return NextResponse.json(
      { error: 'Failed to fetch received email' },
      { status: 500 }
    );
  }
}
