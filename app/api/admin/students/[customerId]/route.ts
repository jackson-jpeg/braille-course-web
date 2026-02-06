import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { resend } from '@/lib/resend';

function isAuthorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key');
  return !!process.env.ADMIN_PASSWORD && key === process.env.ADMIN_PASSWORD;
}

/* ── GET /api/admin/students/[customerId]?key=... ── */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { customerId } = await params;

  try {
    const [customer, charges, invoices, emailResult] = await Promise.all([
      stripe.customers.retrieve(customerId, {
        expand: ['invoice_settings.default_payment_method'],
      }),
      stripe.charges.list({ customer: customerId, limit: 20 }),
      stripe.invoices.list({ customer: customerId, limit: 20 }),
      resend.emails.list().catch(() => ({ data: null, error: null })),
    ]);

    if (customer.deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Extract card info from default payment method
    let cardLabel: string | null = null;
    const pm = customer.invoice_settings?.default_payment_method;
    if (pm && typeof pm === 'object' && 'card' in pm && pm.card) {
      const card = pm.card as { brand?: string; last4?: string };
      const brand = card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card';
      cardLabel = `${brand} ending in ${card.last4 || '****'}`;
    }

    // Filter emails sent to this customer's email
    const customerEmail = customer.email?.toLowerCase();
    const allEmails = emailResult.data?.data ?? [];
    const studentEmails = customerEmail
      ? allEmails.filter((em: { to: string | string[] }) => {
          const recipients = Array.isArray(em.to) ? em.to : [em.to];
          return recipients.some((r: string) => r.toLowerCase() === customerEmail);
        })
      : [];

    const serializedCharges = charges.data.map((c) => ({
      id: c.id,
      amount: c.amount,
      currency: c.currency,
      status: c.status,
      created: c.created,
      receipt_url: c.receipt_url,
      customer: null,
      refunded: c.refunded,
      amount_refunded: c.amount_refunded,
    }));

    const serializedInvoices = invoices.data.map((inv) => {
      let statusLabel = inv.status || 'Unknown';
      if (inv.status === 'open') {
        statusLabel = inv.due_date && inv.due_date * 1000 > Date.now()
          ? `Due ${new Date(inv.due_date * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : 'Payment Due';
      } else if (inv.status === 'paid') {
        statusLabel = 'Paid';
      } else if (inv.status === 'draft') {
        statusLabel = inv.due_date
          ? `Scheduled for ${new Date(inv.due_date * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : 'Draft';
      }

      return {
        id: inv.id,
        amount_due: inv.amount_due,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        status_label: statusLabel,
        due_date: inv.due_date,
        created: inv.created,
        hosted_invoice_url: inv.hosted_invoice_url,
        customer: null,
      };
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        card: cardLabel,
      },
      charges: serializedCharges,
      invoices: serializedInvoices,
      emails: studentEmails.map((em: { id: string; to: string | string[]; subject: string; created_at: string; last_event?: string }) => ({
        id: em.id,
        to: em.to,
        subject: em.subject,
        created_at: em.created_at,
        last_event: em.last_event,
      })),
    });
  } catch (err) {
    console.error('Student detail API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch student details' },
      { status: 500 }
    );
  }
}
