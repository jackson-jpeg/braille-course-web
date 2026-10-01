'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe-client';
import { PRICING, formatPrice } from '@/lib/pricing';
import { NEXT_COHORT } from '@/lib/cohort';
import Cell from '@/components/ui/Cell';
import { LETTERS } from '@/lib/ueb';

const VALID_PLANS = ['full', 'deposit'] as const;
type Plan = (typeof VALID_PLANS)[number];

const PLAN_INFO: Record<Plan, { label: string; price: string; note: string }> = {
  full: {
    label: 'Pay in Full',
    price: formatPrice(PRICING.full),
    note: 'One-time payment — no balance due',
  },
  deposit: {
    label: 'Reserve with Deposit',
    price: formatPrice(PRICING.deposit),
    note: `${formatPrice(PRICING.balance)} balance charged automatically on ${PRICING.balanceDueDate}`,
  },
};

export default function CheckoutForm() {
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('sectionId');
  const plan = searchParams.get('plan') as Plan | null;
  const [error, setError] = useState<string | null>(null);

  const isValidPlan = plan && VALID_PLANS.includes(plan);

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId, plan }),
    });

    if (res.status === 409) {
      setError('This section just filled up. Please go back and choose another.');
      throw new Error('Section full');
    }

    if (!res.ok) {
      let message = 'Something went wrong. Please try again.';
      try {
        const data = await res.json();
        if (data.error) message = data.error;
      } catch {
        // Non-JSON response (e.g. 502/504 HTML error page)
      }
      setError(message);
      throw new Error(message);
    }

    const data = await res.json();
    return data.clientSecret;
  }, [sectionId, plan]);

  if (!sectionId || !isValidPlan) {
    return (
      <div className="checkout-page wrap-narrow">
        <div className="tile checkout-card">
          <Cell dots={[]} size="lg" framed flat="ghost" />
          <h1>This checkout link is incomplete</h1>
          <p>It&rsquo;s missing some information. Please head back and choose your schedule and plan again.</p>
          <Link href="/courses" className="btn">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-page wrap-narrow">
        <div className="tile checkout-card" role="alert">
          <Cell dots={LETTERS.x} size="lg" framed />
          <h1>We couldn&rsquo;t start checkout</h1>
          <p>{error}</p>
          <Link href="/courses#enroll" className="btn">
            Back to enrollment
          </Link>
        </div>
      </div>
    );
  }

  const info = PLAN_INFO[plan];

  return (
    <div className="checkout-page wrap-narrow">
      <Link href="/courses#enroll" className="link-arrow checkout-back">
        Back to enrollment
      </Link>

      <section className="checkout-summary band-ink" aria-labelledby="checkout-title">
        <p className="checkout-brand">
          <Cell dots={LETTERS.t} size="xs" onInk tone="marigold" />
          TeachBraille
        </p>
        <h1 id="checkout-title">Braille course for parents &amp; loved ones</h1>
        <p className="checkout-schedule">
          {NEXT_COHORT ? `${NEXT_COHORT.name} · ${NEXT_COHORT.dates}` : 'Live, remote course'}
        </p>
        <div className="checkout-plan">
          <span>{info.label}</span>
          <span className="checkout-price">{info.price}</span>
        </div>
        <p className="checkout-note">{info.note}</p>
      </section>

      <div className="checkout-embed">
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>

      <p className="checkout-trust muted">
        Secure payment by Stripe · Fully refundable before {PRICING.balanceDueDate}
      </p>
    </div>
  );
}
