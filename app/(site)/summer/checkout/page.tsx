import { Suspense } from 'react';
import CheckoutForm from '@/components/CheckoutForm';
import CellLoader from '@/components/ui/CellLoader';
import '@/styles/pages/enroll.css';

export const metadata = {
  title: 'Checkout — Braille Course',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="page-loading">
          <CellLoader label="Preparing checkout" />
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
