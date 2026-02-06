import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* ── POST /api/admin/payments/refund?key=... ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { chargeId, amount, reason, confirm } = await req.json();

    if (!chargeId) {
      return NextResponse.json(
        { error: 'Missing required field: chargeId' },
        { status: 400 }
      );
    }

    if (confirm !== true) {
      return NextResponse.json(
        { error: 'Confirmation required. Set confirm: true to proceed.' },
        { status: 400 }
      );
    }

    const refundParams: { charge: string; reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'; amount?: number } = {
      charge: chargeId,
    };

    if (amount && typeof amount === 'number' && amount > 0) {
      refundParams.amount = Math.round(amount * 100);
    }

    if (reason === 'duplicate' || reason === 'fraudulent' || reason === 'requested_by_customer') {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        currency: refund.currency,
      },
    });
  } catch (err) {
    console.error('Refund API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to issue refund';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
