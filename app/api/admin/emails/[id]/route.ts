import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { isAuthorized } from '@/lib/admin-auth';

/* ── GET /api/admin/emails/[id] ── get single email detail ── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await resend.emails.get(id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ email: result.data });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch email' },
      { status: 500 }
    );
  }
}
