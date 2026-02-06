import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  // Only allow Vercel Cron (or manual trigger with the secret)
  if (
    req.headers.get('authorization') !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invoices = await stripe.invoices.list({
      status: 'draft',
      limit: 100,
    });

    const balanceInvoices = invoices.data.filter(
      (inv) =>
        inv.metadata?.type === 'balance' &&
        inv.metadata?.course === 'braille-summer-2026'
    );

    let finalized = 0;
    for (const invoice of balanceInvoices) {
      await stripe.invoices.finalizeInvoice(invoice.id);
      console.log(
        `Finalized invoice ${invoice.id} for customer ${invoice.customer}`
      );
      finalized++;
    }

    return NextResponse.json({ ok: true, finalized });
  } catch (err) {
    console.error('Cron finalize-balance failed:', (err as Error).message);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
