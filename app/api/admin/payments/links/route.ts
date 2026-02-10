import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { isAuthorized } from '@/lib/admin-auth';

/* GET /api/admin/payments/links — list payment links */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const links = await stripe.paymentLinks.list({ limit: 50 });

    const linksWithItems = await Promise.all(
      links.data.map(async (link) => {
        const lineItems = await stripe.paymentLinks.listLineItems(link.id, { limit: 10 });
        return {
          id: link.id,
          name: (link.metadata?.name as string) || null,
          url: link.url,
          active: link.active,
          metadata: link.metadata,
          line_items: lineItems.data.map((li) => ({
            description: li.description,
            amount_total: li.amount_total,
          })),
        };
      }),
    );

    return NextResponse.json({ links: linksWithItems });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payment links' }, { status: 500 });
  }
}

/* POST /api/admin/payments/links — create payment link with inline price */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, amount, allowPromotion } = await req.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const unitAmount = Math.round(parseFloat(amount) * 100);

    const price = await stripe.prices.create({
      unit_amount: unitAmount,
      currency: 'usd',
      product_data: {
        name,
        ...(description ? { description } : {}),
      },
    });

    const linkParams: Parameters<typeof stripe.paymentLinks.create>[0] = {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { name },
    };
    if (allowPromotion) {
      linkParams.allow_promotion_codes = true;
    }

    const link = await stripe.paymentLinks.create(linkParams);

    return NextResponse.json({ link });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create payment link';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
