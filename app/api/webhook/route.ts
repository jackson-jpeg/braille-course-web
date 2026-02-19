import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { resend } from '@/lib/resend';
import { getSchedule } from '@/lib/schedule';
import { enrollmentConfirmation } from '@/lib/email-templates';
import { getSettings, getSetting } from '@/lib/settings';
import { PRICING } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  // Env var validation
  if (!process.env.STRIPE_PRICE_BALANCE || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing required env var: STRIPE_PRICE_BALANCE or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Log expired checkout sessions for analytics
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    console.log(`Checkout session expired: ${session.id} (section: ${session.metadata?.sectionId}, plan: ${session.metadata?.plan})`);
    return NextResponse.json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (!session.customer || !session.payment_intent) {
      return NextResponse.json({ received: true });
    }

    const sectionId = session.metadata?.sectionId;
    const plan = session.metadata?.plan;
    const stripeSessionId = session.id;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
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
            const waitlistCount = await tx.enrollment.count({
              where: { sectionId, paymentStatus: 'WAITLISTED' },
            });
            await tx.enrollment.create({
              data: {
                email,
                sectionId,
                plan: (plan || 'FULL').toUpperCase(),
                stripeCustomerId,
                stripeSessionId,
                paymentStatus: 'WAITLISTED',
                waitlistPosition: waitlistCount + 1,
              },
            });
            console.log(
              `WAITLISTED enrollment for session ${stripeSessionId} — section ${sectionId} is full (position ${waitlistCount + 1}). Manual refund needed.`,
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

          const settings = await getSettings();
          const depositSubject = getSetting(
            settings,
            'email.depositSubject',
            `Your $${PRICING.deposit} Deposit Is Confirmed — Summer Braille Course`,
          );
          const fullSubject = getSetting(
            settings,
            'email.fullPaymentSubject',
            "You're Enrolled — Summer Braille Course",
          );

          await resend.emails.send({
            from: 'Delaney Costello <delaney@teachbraille.org>',
            to: email,
            subject: isDeposit ? depositSubject : fullSubject,
            html: enrollmentConfirmation({ isDeposit, schedule }),
          });
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', (emailErr as Error).message);
        }
      }

      // Retrieve PaymentIntent to check type
      const paymentIntent = await stripe.paymentIntents.retrieve(
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id,
      );

      const paymentType = paymentIntent.metadata?.type;

      // Full payments: no invoice needed
      if (paymentType === 'full') {
        console.log(`Full payment completed for customer ${stripeCustomerId} — no invoice needed`);
        return NextResponse.json({ received: true });
      }

      // Deposit payments: save card + create draft balance invoice
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

      // Re-use settings loaded above (or load if not in email branch)
      const invoiceSettings = await getSettings();
      const invoiceCourseName = getSetting(invoiceSettings, 'course.name', 'Summer Braille Course');
      const invoiceBalanceDueDate = getSetting(invoiceSettings, 'course.balanceDueDate', '2026-05-01');

      const invoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: 'charge_automatically',
        auto_advance: false,
        metadata: {
          course: invoiceCourseName,
          type: 'balance',
          scheduled_date: invoiceBalanceDueDate,
        },
      });

      console.log(`Draft invoice ${invoice.id} created for customer ${stripeCustomerId}`);
    } catch (err) {
      // Deposit already collected — log for manual follow-up, don't fail the webhook
      console.error('Webhook processing error:', (err as Error).message);
    }
  }

  return NextResponse.json({ received: true });
}
