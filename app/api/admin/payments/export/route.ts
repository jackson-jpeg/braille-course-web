import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* GET /api/admin/payments/export — CSV export of charges */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const charges = await stripe.charges.list({ limit: 100, expand: ['data.customer'] });

    const headers = ['Date', 'Email', 'Name', 'Amount', 'Currency', 'Status', 'Refunded', 'Receipt URL'];
    const rows = charges.data.map((c) => {
      const customer = c.customer && typeof c.customer === 'object' && 'email' in c.customer ? c.customer : null;
      return [
        new Date(c.created * 1000).toISOString(),
        customer?.email || '',
        customer?.name || '',
        (c.amount / 100).toFixed(2),
        c.currency.toUpperCase(),
        c.status,
        c.refunded ? 'Yes' : 'No',
        c.receipt_url || '',
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to export payments' }, { status: 500 });
  }
}
