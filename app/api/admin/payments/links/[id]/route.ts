import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* PATCH /api/admin/payments/links/[id] — toggle active status */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { active } = await req.json();
    if (typeof active !== 'boolean') {
      return NextResponse.json({ error: 'active (boolean) is required' }, { status: 400 });
    }

    const link = await stripe.paymentLinks.update(id, { active });
    return NextResponse.json({ link });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update payment link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
