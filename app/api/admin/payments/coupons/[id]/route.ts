import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* PUT /api/admin/payments/coupons/[id] — update coupon name */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const coupon = await stripe.coupons.update(id, { name });
    return NextResponse.json({ coupon });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* DELETE /api/admin/payments/coupons/[id] — delete coupon */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await stripe.coupons.del(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete coupon';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
