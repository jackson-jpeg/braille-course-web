import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/emails/received?key=...  ── list received emails ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await resend.emails.receiving.list();

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      emails: result.data?.data ?? [],
      has_more: result.data?.has_more ?? false,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch received emails' },
      { status: 500 }
    );
  }
}
