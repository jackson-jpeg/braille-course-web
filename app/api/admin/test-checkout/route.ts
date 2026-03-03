import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

const TEST_EMAIL = 'test@test.invalid';

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find first open section
    const section = await prisma.section.findFirst({
      where: { status: 'OPEN' },
      orderBy: { label: 'asc' },
    });

    if (!section) {
      return NextResponse.json({ error: 'No open sections available' }, { status: 409 });
    }

    const siteUrl = process.env.SITE_URL || 'https://teachbraille.org';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'embedded',
      customer_creation: 'always',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Purchase — Braille Course',
              description: 'Admin test charge. Will be refunded immediately.',
            },
            unit_amount: 100, // $1.00
          },
          quantity: 1,
        },
      ],
      metadata: {
        sectionId: section.id,
        plan: 'full',
        isTest: 'true',
        course: 'Test Purchase',
      },
      payment_intent_data: {
        metadata: {
          course: 'Test Purchase',
          type: 'full',
          sectionId: section.id,
          isTest: 'true',
        },
        description: 'Admin test purchase — $1.00',
      },
      return_url: `${siteUrl}/admin/test-checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('Test checkout session creation failed:', (err as Error).message);
    return NextResponse.json({ error: 'Unable to create test checkout session' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all test enrollments
    const testEnrollments = await prisma.enrollment.findMany({
      where: { email: TEST_EMAIL },
      include: { section: true },
    });

    if (testEnrollments.length === 0) {
      return NextResponse.json({ message: 'No test enrollments found' });
    }

    const results = [];

    for (const enrollment of testEnrollments) {
      try {
        // Refund via Stripe if we have a session ID
        if (enrollment.stripeSessionId) {
          const session = await stripe.checkout.sessions.retrieve(enrollment.stripeSessionId);
          if (session.payment_intent) {
            const piId =
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent.id;
            await stripe.refunds.create({ payment_intent: piId });
          }
        }

        // Delete enrollment and decrement section count in a transaction
        await prisma.$transaction(async (tx) => {
          await tx.enrollment.delete({ where: { id: enrollment.id } });

          if (enrollment.paymentStatus === 'COMPLETED') {
            const section = await tx.section.findUnique({
              where: { id: enrollment.sectionId },
            });
            if (section && section.enrolledCount > 0) {
              const newCount = section.enrolledCount - 1;
              await tx.section.update({
                where: { id: enrollment.sectionId },
                data: {
                  enrolledCount: newCount,
                  status: newCount < section.maxCapacity ? 'OPEN' : 'FULL',
                },
              });
            }
          }
        });

        results.push({ id: enrollment.id, status: 'cleaned' });
      } catch (err) {
        console.error(`Failed to clean up enrollment ${enrollment.id}:`, (err as Error).message);
        results.push({ id: enrollment.id, status: 'error', error: (err as Error).message });
      }
    }

    return NextResponse.json({ message: 'Test data cleaned up', results });
  } catch (err) {
    console.error('Test cleanup failed:', (err as Error).message);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
