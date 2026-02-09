import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getSchedule } from '@/lib/schedule';

export async function POST(req: NextRequest) {
  try {
    const { sectionId, plan } = await req.json();

    // Validate inputs
    if (!sectionId || typeof sectionId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid sectionId' },
        { status: 400 }
      );
    }
    if (plan !== 'deposit' && plan !== 'full') {
      return NextResponse.json(
        { error: 'Invalid plan. Use "deposit" or "full"' },
        { status: 400 }
      );
    }

    // Env var validation
    if (plan === 'deposit' && !process.env.STRIPE_PRICE_DEPOSIT) {
      console.error('Missing STRIPE_PRICE_DEPOSIT env var');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    if (plan === 'full' && !process.env.STRIPE_PRICE_FULL) {
      console.error('Missing STRIPE_PRICE_FULL env var');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check section capacity
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    if (section.enrolledCount >= section.maxCapacity) {
      return NextResponse.json(
        { error: 'This section is full' },
        { status: 409 }
      );
    }

    // Create Stripe Checkout Session
    const siteUrl = process.env.SITE_URL || 'https://braille-course-web.vercel.app';
    const schedule = getSchedule(section.label);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer_creation: 'always',
      payment_method_types: ['card'],
      line_items: [
        {
          price:
            plan === 'deposit'
              ? process.env.STRIPE_PRICE_DEPOSIT!
              : process.env.STRIPE_PRICE_FULL!,
          quantity: 1,
        },
      ],
      metadata: {
        sectionId,
        plan,
        course: 'braille-summer-2026',
        schedule,
      },
      payment_intent_data: {
        metadata: {
          course: 'braille-summer-2026',
          type: plan,
          sectionId,
        },
        description: `Summer Braille Course 2026 — ${schedule}`,
      },
      success_url: `${siteUrl}/summer/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/summer`,
    };

    // Deposit: save card for future $350 charge, show balance reminder
    if (plan === 'deposit') {
      sessionParams.payment_intent_data!.setup_future_usage = 'off_session';
      sessionParams.custom_text = {
        submit: {
          message:
            'Your card will be saved securely. The remaining $350 balance will be charged automatically on May 1st.',
        },
      };
    }

    // Full: reassuring confirmation text
    if (plan === 'full') {
      sessionParams.custom_text = {
        submit: {
          message:
            'You will receive a confirmation email with your schedule and course details shortly after payment.',
        },
      };
    }

    // Idempotency: 10-second bucket prevents duplicate sessions from double-clicks
    const timeBucket = Math.floor(Date.now() / 10000);
    const idempotencyKey = `checkout_${sectionId}_${plan}_${timeBucket}`;

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session creation failed:', (err as Error).message);
    return NextResponse.json(
      { error: 'Unable to create checkout session' },
      { status: 500 }
    );
  }
}
