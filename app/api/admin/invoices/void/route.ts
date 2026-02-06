import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

function isAuthorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key');
  return !!process.env.ADMIN_PASSWORD && key === process.env.ADMIN_PASSWORD;
}

/* ── POST /api/admin/invoices/void?key=... ── Void an invoice ── */
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

    if (invoice.status === 'paid' || invoice.status === 'void') {
      return NextResponse.json(
        { error: `Cannot void invoice with status: ${invoice.status}` },
        { status: 400 }
      );
    }

    await stripe.invoices.voidInvoice(invoiceId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Invoice void error:', err);
    const message = err instanceof Error ? err.message : 'Failed to void invoice';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
