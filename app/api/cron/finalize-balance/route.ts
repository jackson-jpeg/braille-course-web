import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { stripe } from '@/lib/stripe';

function verifyCronSecret(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!header || !secret) return false;
  const expected = `Bearer ${secret}`;
  if (header.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allInvoices = await stripe.invoices
      .list({
        status: 'draft',
        limit: 100,
      })
      .autoPagingToArray({ limit: 10000 });

    const today = new Date().toISOString().slice(0, 10);

    const balanceInvoices = allInvoices.filter(
      (inv) =>
        inv.metadata?.type === 'balance' &&
        inv.metadata?.scheduled_date != null &&
        inv.metadata.scheduled_date <= today,
    );

    let finalized = 0;
    let failed = 0;
    const failedIds: string[] = [];

    for (const invoice of balanceInvoices) {
      try {
        await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.pay(invoice.id);
        console.log(`Finalized and charged invoice ${invoice.id} for customer ${invoice.customer}`);
        finalized++;
      } catch (err) {
        console.error(`Failed to finalize invoice ${invoice.id}:`, (err as Error).message);
        failedIds.push(invoice.id);
        failed++;
      }
    }

    if (failedIds.length > 0) {
      console.error(`ACTION REQUIRED: ${failedIds.length} invoice(s) failed to finalize:`, failedIds.join(', '));
    }

    return NextResponse.json({
      ok: true,
      found: balanceInvoices.length,
      finalized,
      failed,
      failedIds,
    });
  } catch (err) {
    console.error('Cron finalize-balance failed:', (err as Error).message);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
