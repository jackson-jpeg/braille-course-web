import { Suspense } from 'react';
import CheckoutForm from '@/components/CheckoutForm';

export const metadata = {
  title: 'Checkout — Summer Braille Course',
  robots: { index: false, follow: false },
};

function CheckoutLoading() {
  return (
    <div className="checkout-page">
      <div className="checkout-summary" style={{ borderRadius: '16px 16px 0 0' }}>
        <div className="checkout-summary-brand">
          <span className="checkout-summary-name">TeachBraille</span>
        </div>
        <h1 className="checkout-summary-title">Summer Braille Course</h1>
        <p className="checkout-summary-schedule">Preparing checkout&hellip;</p>
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
