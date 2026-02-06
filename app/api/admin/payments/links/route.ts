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
          url: link.url,
          active: link.active,
          metadata: link.metadata,
          line_items: lineItems.data.map((li) => ({
            description: li.description,
            amount_total: li.amount_total,
          })),
        };
      })
    );

    return NextResponse.json({ links: linksWithItems });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch payment links' }, { status: 500 });
  }
}
