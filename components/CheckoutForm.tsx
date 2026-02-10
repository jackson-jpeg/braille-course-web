'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe-client';

const VALID_PLANS = ['full', 'deposit'] as const;
type Plan = (typeof VALID_PLANS)[number];

const PLAN_LABELS: Record<Plan, string> = {
  full: '$500 — Pay in Full',
  deposit: '$150 Deposit',
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
      setError(
        'This section just filled up. Please go back and choose another.',
      );
      throw new Error('Section full');
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong. Please try again.');
      throw new Error(data.error || 'Checkout failed');
    }

    const data = await res.json();
    return data.clientSecret;
  }, [sectionId, plan]);

  if (!sectionId || !isValidPlan) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">
          <h1>Invalid Checkout Link</h1>
          <p>This checkout link is missing required information.</p>
          <Link href="/summer#cta" className="checkout-back">
            &larr; Back to enrollment
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">
          <h1>Unable to Check Out</h1>
          <p>{error}</p>
          <Link href="/summer#cta" className="checkout-back">
            &larr; Back to enrollment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <Link href="/summer#cta" className="checkout-back">
          &larr; Back to enrollment
        </Link>
        <h1>Complete Your Enrollment</h1>
        <p className="checkout-subtitle">{PLAN_LABELS[plan]}</p>
      </div>
      <div className="checkout-embed-wrapper">
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
      <div className="checkout-trust-row">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Secure checkout on TeachBraille.org
      </div>
    </div>
  );
}
