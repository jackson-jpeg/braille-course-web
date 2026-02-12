import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* ── POST /api/admin/invoices?key=... ── Create an invoice ── */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, name, description, amount, dueInDays, memo, sendNow } = await req.json();

    if (!email || !description || !amount) {
      return NextResponse.json({ error: 'Missing required fields: email, description, amount' }, { status: 400 });
    }

    const cents = Math.round(Number(amount) * 100);
    if (cents <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    // Find or create Stripe customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;

    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        ...(name ? { name } : {}),
      });
      customerId = customer.id;
    }

    // Create invoice item
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: cents,
      currency: 'usd',
      description,
    });

    // Create invoice
    const daysUntilDue = dueInDays != null ? Number(dueInDays) : 30;
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue,
      ...(memo ? { description: memo } : {}),
      metadata: { type: 'appointment' },
    });

    // Optionally finalize + send
    if (sendNow) {
      await stripe.invoices.finalizeInvoice(invoice.id);
      await stripe.invoices.sendInvoice(invoice.id);
    }

    // Retrieve the updated invoice
    const final = await stripe.invoices.retrieve(invoice.id);

    return NextResponse.json({
      success: true,
      invoice: {
        id: final.id,
        amount_due: final.amount_due,
        status: final.status,
        hosted_invoice_url: final.hosted_invoice_url,
        created: final.created,
      },
    });
  } catch (err) {
    console.error('Invoice create error:', err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
