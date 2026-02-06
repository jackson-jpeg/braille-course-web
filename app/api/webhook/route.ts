import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { resend } from '@/lib/resend';
import { getSchedule } from '@/lib/schedule';

export async function POST(req: NextRequest) {
  // Env var validation
  if (!process.env.STRIPE_PRICE_BALANCE || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing required env var: STRIPE_PRICE_BALANCE or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(
      'Webhook signature verification failed:',
      (err as Error).message
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (!session.customer || !session.payment_intent) {
      return NextResponse.json({ received: true });
    }

    const sectionId = session.metadata?.sectionId;
    const plan = session.metadata?.plan;
    const stripeSessionId = session.id;
    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer.id;
    const email = session.customer_details?.email || undefined;

    try {
      // Enrollment + capacity update in a transaction
      if (sectionId) {
        await prisma.$transaction(async (tx) => {
          // Check idempotency — if enrollment already exists, skip
          const existing = await tx.enrollment.findUnique({
            where: { stripeSessionId },
          });
          if (existing) return;

          // Re-check capacity inside transaction
          const section = await tx.section.findUnique({
            where: { id: sectionId },
          });

          if (!section) {
            console.error(`Section ${sectionId} not found in webhook`);
            return;
          }

          if (section.enrolledCount >= section.maxCapacity) {
            // Race condition: section filled during payment
            await tx.enrollment.create({
              data: {
                email,
                sectionId,
                plan: (plan || 'FULL').toUpperCase(),
                stripeCustomerId,
                stripeSessionId,
                paymentStatus: 'WAITLISTED',
              },
            });
            console.log(
              `WAITLISTED enrollment for session ${stripeSessionId} — section ${sectionId} is full. Manual refund needed.`
            );
            return;
          }

          // Create enrollment and increment count
          await tx.enrollment.create({
            data: {
              email,
              sectionId,
              plan: (plan || 'FULL').toUpperCase(),
              stripeCustomerId,
              stripeSessionId,
              paymentStatus: 'COMPLETED',
            },
          });

          const newCount = section.enrolledCount + 1;
          await tx.section.update({
            where: { id: sectionId },
            data: {
              enrolledCount: newCount,
              status: newCount >= section.maxCapacity ? 'FULL' : 'OPEN',
            },
          });
        });
      }

      // Send confirmation email (fire-and-forget)
      if (email && sectionId) {
        try {
          const section = await prisma.section.findUnique({
            where: { id: sectionId },
          });
          const schedule = section ? getSchedule(section.label) : 'Check your inbox for schedule details';
          const isDeposit = plan === 'deposit';

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
            subject: isDeposit
              ? 'Your $150 Deposit Is Confirmed — Summer Braille Course'
              : "You're Enrolled — Summer Braille Course",
            html: `
              <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1B2A4A;">
                <h1 style="font-size: 24px; margin-bottom: 16px;">
                  ${isDeposit ? 'Your $150 Deposit Is Confirmed!' : "You're All Set!"}
                </h1>
                <p style="font-size: 16px; line-height: 1.6; color: #4A5568;">
                  ${isDeposit
                    ? 'Thank you for reserving your spot in the Summer Braille Course! Your $150 deposit has been received.'
                    : "Your $500 payment is confirmed — you're fully enrolled in the Summer Braille Course!"}
                </p>
                ${isDeposit
                  ? `<div style="background: #F7EDD5; border: 1px solid #F0DEB4; border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 15px; color: #1B2A4A;">
                        <strong>Remaining balance of $350</strong> will be charged automatically on <strong>May 1st</strong> to the card you used.
                      </p>
                    </div>`
                  : ''}
                <h2 style="font-size: 18px; margin-top: 28px; margin-bottom: 12px;">Course Details</h2>
                <table style="font-size: 15px; line-height: 1.8; color: #4A5568;">
                  <tr><td style="padding-right: 12px;"><strong>Schedule:</strong></td><td>${schedule}</td></tr>
                  <tr><td style="padding-right: 12px;"><strong>Dates:</strong></td><td>June 8 – July 27, 2026</td></tr>
                  <tr><td style="padding-right: 12px;"><strong>Sessions:</strong></td><td>16 total (twice per week, 1 hour each)</td></tr>
                  <tr><td style="padding-right: 12px;"><strong>Format:</strong></td><td>Fully remote via video call</td></tr>
                </table>
                <p style="font-size: 14px; color: #4A5568; margin-top: 28px; line-height: 1.6;">
                  Questions? Reach out anytime at
                  <a href="mailto:delaneycostello23@gmail.com" style="color: #D4A853;">delaneycostello23@gmail.com</a>
                </p>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', (emailErr as Error).message);
        }
      }

      // Retrieve PaymentIntent to check type
      const paymentIntent = await stripe.paymentIntents.retrieve(
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent.id
      );

      const paymentType = paymentIntent.metadata?.type;

      // Full payments: no invoice needed
      if (paymentType === 'full') {
        console.log(
          `Full payment completed for customer ${stripeCustomerId} — no invoice needed`
        );
        return NextResponse.json({ received: true });
      }

      // Deposit payments: save card + create draft $350 invoice
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method:
            typeof paymentIntent.payment_method === 'string'
              ? paymentIntent.payment_method
              : paymentIntent.payment_method?.id || '',
        },
      });

      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        price: process.env.STRIPE_PRICE_BALANCE,
      });

      const invoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: 'charge_automatically',
        auto_advance: false,
        metadata: {
          course: 'braille-summer-2026',
          type: 'balance',
          scheduled_date: '2026-05-01',
        },
      });

      console.log(
        `Draft invoice ${invoice.id} created for customer ${stripeCustomerId}`
      );
    } catch (err) {
      // Deposit already collected — log for manual follow-up, don't fail the webhook
      console.error('Webhook processing error:', (err as Error).message);
    }
  }

  return NextResponse.json({ received: true });
}
