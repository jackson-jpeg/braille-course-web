import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/admin-auth';
import TestCheckoutClient from '@/components/admin/TestCheckoutClient';

export const metadata = {
  title: 'Test Checkout — Admin',
  robots: { index: false, follow: false },
};

export default async function TestCheckoutPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;

  if (!session || !verifySessionToken(session)) {
    redirect('/admin');
  }

  return (
    <div className="admin-page">
      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
        <a href="/admin" style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: '0.9rem' }}>
          &larr; Back to Dashboard
        </a>
        <h1 style={{ margin: '16px 0 8px', fontSize: '1.5rem' }}>Test Stripe Checkout</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Verify the full checkout &rarr; webhook &rarr; enrollment flow with a $1.00 charge.
        </p>
        <TestCheckoutClient />
      </div>
    </div>
  );
}
