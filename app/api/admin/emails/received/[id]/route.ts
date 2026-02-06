import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

function isAuthorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key');
  return !!process.env.ADMIN_PASSWORD && key === process.env.ADMIN_PASSWORD;
}

/* ── GET /api/admin/emails/received/[id]?key=...  ── get single received email ── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await resend.emails.receiving.get(id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ email: result.data });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch received email' },
      { status: 500 }
    );
  }
}
