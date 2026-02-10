'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe-client';

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
          <div className="checkout-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1>Invalid Checkout Link</h1>
          <p>This checkout link is missing required information.</p>
          <Link href="/summer#cta" className="home-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Enrollment
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-page">
        <div className="checkout-card">
          <div className="checkout-card-icon checkout-card-icon--error" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1>Unable to Check Out</h1>
          <p>{error}</p>
          <Link href="/summer#cta" className="home-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Enrollment
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
          stripe={getStripe()}
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
