import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/admin-auth';
import TestCleanupClient from './TestCleanupClient';

export const metadata = {
  title: 'Test Payment Complete — Admin',
  robots: { index: false, follow: false },
};

export default async function TestCheckoutSuccessPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;

  if (!session || !verifySessionToken(session)) {
    redirect('/admin');
  }

  return (
    <div className="admin-page">
      <TestCleanupClient />
    </div>
  );
}
