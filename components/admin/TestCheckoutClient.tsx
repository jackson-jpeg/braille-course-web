'use client';

import { useCallback, useState } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe-client';

export default function TestCheckoutClient() {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/admin/test-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      let message = 'Failed to create test checkout session.';
      try {
        const data = await res.json();
        if (data.error) message = data.error;
      } catch {
        // Non-JSON response
      }
      setError(message);
      throw new Error(message);
    }

    const data = await res.json();
    return data.clientSecret;
  }, []);

  if (error) {
    return (
      <div className="test-checkout-page">
        <div className="test-checkout-card">
          <h2>Error</h2>
          <p>{error}</p>
          <a href="/admin" className="test-checkout-btn">Back to Admin</a>
        </div>
      </div>
    );
  }

  return (
    <div className="test-checkout-page">
      <div className="test-checkout-warning">
        <strong>Test Mode</strong> — This will create a real $1.00 charge. Use card{' '}
        <code>4242 4242 4242 4242</code> in test mode, or a real card in production.
        The charge is fully refundable from the success page.
      </div>

      <div className="test-checkout-embed">
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}
