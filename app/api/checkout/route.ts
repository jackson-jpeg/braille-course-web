export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getSchedule } from '@/lib/schedule';
import { getSettings, getSetting } from '@/lib/settings';
import { PRICING } from '@/lib/pricing';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfter } = checkRateLimit(`checkout:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  try {
    const { sectionId, plan } = await req.json();

    // Validate inputs
    if (!sectionId || typeof sectionId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid sectionId' }, { status: 400 });
    }
    if (plan !== 'deposit' && plan !== 'full') {
      return NextResponse.json({ error: 'Invalid plan. Use "deposit" or "full"' }, { status: 400 });
    }

    // Env var validation
    if (plan === 'deposit' && !process.env.STRIPE_PRICE_DEPOSIT) {
      console.error('Missing STRIPE_PRICE_DEPOSIT env var');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    if (plan === 'full' && !process.env.STRIPE_PRICE_FULL) {
      console.error('Missing STRIPE_PRICE_FULL env var');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check section capacity
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    if (section.enrolledCount >= section.maxCapacity) {
      return NextResponse.json({ error: 'This section is full' }, { status: 409 });
    }

    // Load settings from DB for dynamic values
    const settings = await getSettings();

    // Check if enrollment is enabled
    if (getSetting(settings, 'enrollment.enabled', 'true') !== 'true') {
      return NextResponse.json({ error: 'Enrollment is currently closed' }, { status: 403 });
    }
    const courseName = getSetting(settings, 'course.name', 'Summer Braille Course');
    const balanceAmount = getSetting(settings, 'pricing.balance', String(PRICING.balance));
    const balanceDueDate = getSetting(settings, 'course.balanceDueDate', '2026-05-01');
    const dueDateFormatted = new Date(balanceDueDate + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });

    // Create Stripe Checkout Session
    const siteUrl = process.env.SITE_URL || 'https://teachbraille.org';
    const schedule = getSchedule(section.label);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      ui_mode: 'embedded',
      customer_creation: 'always',
      line_items: [
        {
          price: plan === 'deposit' ? process.env.STRIPE_PRICE_DEPOSIT! : process.env.STRIPE_PRICE_FULL!,
          quantity: 1,
        },
      ],
      metadata: {
        sectionId,
        plan,
        course: courseName,
        schedule,
      },
      payment_intent_data: {
        metadata: {
          course: courseName,
          type: plan,
          sectionId,
        },
        description: `${courseName} — ${schedule}`,
      },
      return_url: `${siteUrl}/summer/success?session_id={CHECKOUT_SESSION_ID}`,
    };

    // Deposit: save card for future balance charge, show balance reminder
    if (plan === 'deposit') {
      sessionParams.payment_intent_data!.setup_future_usage = 'off_session';
      sessionParams.custom_text = {
        submit: {
          message: `Your card will be saved securely. The remaining $${balanceAmount} balance will be charged automatically on ${dueDateFormatted}.`,
        },
      };
    }

    // Full: reassuring confirmation text
    if (plan === 'full') {
      sessionParams.custom_text = {
        submit: {
          message: 'You will receive a confirmation email with your schedule and course details shortly after payment.',
        },
      };
    }

    // Idempotency: 10-second bucket per IP prevents duplicate sessions from double-clicks
    const timeBucket = Math.floor(Date.now() / 10000);
    const idempotencyKey = `checkout_${ip}_${sectionId}_${plan}_${timeBucket}`;

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('Checkout session creation failed:', (err as Error).message);
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
}
