import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* ── POST /api/admin/invoices/send?key=... ── Send a draft invoice ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing required field: invoiceId' }, { status: 400 });
    }

    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: `Invoice is not in draft status (current: ${invoice.status})` },
        { status: 400 },
      );
    }

    await stripe.invoices.finalizeInvoice(invoiceId);
    await stripe.invoices.sendInvoice(invoiceId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Invoice send error:', err);
    const message = err instanceof Error ? err.message : 'Failed to send invoice';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
