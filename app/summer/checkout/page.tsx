import { Suspense } from 'react';
import CheckoutForm from '@/components/CheckoutForm';

export const metadata = {
  title: 'Checkout — Summer Braille Course',
  robots: { index: false, follow: false },
};

function CheckoutLoading() {
  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Complete Your Enrollment</h1>
        <p className="checkout-subtitle">Preparing checkout&hellip;</p>
      </div>
      <div className="checkout-embed-wrapper">
        <div className="checkout-loading-shimmer" />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutForm />
    </Suspense>
  );
}
