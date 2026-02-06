import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* GET /api/admin/payments/payouts — list payouts + balance */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [payouts, balance] = await Promise.all([
      stripe.payouts.list({ limit: 50 }),
      stripe.balance.retrieve(),
    ]);

    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0);

    return NextResponse.json({
      payouts: payouts.data.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        arrival_date: p.arrival_date,
        created: p.created,
      })),
      balance: {
        available: availableBalance / 100,
        pending: pendingBalance / 100,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}
