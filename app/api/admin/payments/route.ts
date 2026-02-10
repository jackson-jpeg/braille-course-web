import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';
import { translateInvoiceStatus } from '@/lib/stripe-utils';

/* ── GET /api/admin/payments?key=... ── */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chargesAfter = req.nextUrl.searchParams.get('charges_after') || undefined;
    const invoicesAfter = req.nextUrl.searchParams.get('invoices_after') || undefined;

    const [balance, charges, invoices, refunds, transactions] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.charges.list({
        limit: 50,
        expand: ['data.customer'],
        ...(chargesAfter ? { starting_after: chargesAfter } : {}),
      }),
      stripe.invoices.list({
        limit: 50,
        expand: ['data.customer'],
        ...(invoicesAfter ? { starting_after: invoicesAfter } : {}),
      }),
      stripe.refunds.list({ limit: 20 }),
      stripe.balanceTransactions.list({ limit: 100, type: 'charge' }),
    ]);

    // Compute fees from balance transactions
    const totalFees = transactions.data.reduce((sum, tx) => sum + tx.fee, 0);
    const totalCollected = charges.data.filter((c) => c.status === 'succeeded').reduce((sum, c) => sum + c.amount, 0);
    const pendingInvoiceTotal = invoices.data
      .filter((inv) => inv.status === 'open' || inv.status === 'draft')
      .reduce((sum, inv) => sum + inv.amount_due, 0);

    const serializedCharges = charges.data.map((c) => ({
      id: c.id,
      amount: c.amount,
      currency: c.currency,
      status: c.status,
      created: c.created,
      receipt_url: c.receipt_url,
      customer:
        c.customer && typeof c.customer === 'object' && 'email' in c.customer
          ? { id: c.customer.id, email: c.customer.email, name: c.customer.name }
          : null,
      refunded: c.refunded,
      amount_refunded: c.amount_refunded,
    }));

    const serializedInvoices = invoices.data.map((inv) => ({
      id: inv.id,
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      status_label: translateInvoiceStatus(inv.status, inv.due_date),
      due_date: inv.due_date,
      created: inv.created,
      hosted_invoice_url: inv.hosted_invoice_url,
      customer:
        inv.customer && typeof inv.customer === 'object' && 'email' in inv.customer
          ? { id: inv.customer.id, email: inv.customer.email, name: inv.customer.name }
          : null,
    }));

    const serializedRefunds = refunds.data.map((r) => ({
      id: r.id,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      created: r.created,
      charge: typeof r.charge === 'string' ? r.charge : (r.charge?.id ?? ''),
      reason: r.reason,
    }));

    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0);

    return NextResponse.json({
      summary: {
        totalCollected: totalCollected / 100,
        pendingInvoices: pendingInvoiceTotal / 100,
        stripeFees: totalFees / 100,
        netRevenue: (totalCollected - totalFees) / 100,
      },
      charges: serializedCharges,
      invoices: serializedInvoices,
      refunds: serializedRefunds,
      balance: {
        available: availableBalance / 100,
        pending: pendingBalance / 100,
      },
      pagination: {
        hasMoreCharges: charges.has_more,
        hasMoreInvoices: invoices.has_more,
        lastChargeId: charges.data.length > 0 ? charges.data[charges.data.length - 1].id : undefined,
        lastInvoiceId: invoices.data.length > 0 ? invoices.data[invoices.data.length - 1].id : undefined,
      },
    });
  } catch (err) {
    console.error('Payments API error:', err);
    return NextResponse.json({ error: 'Failed to fetch payment data' }, { status: 500 });
  }
}
