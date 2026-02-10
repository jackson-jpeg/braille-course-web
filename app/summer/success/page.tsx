import Link from 'next/link';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getSchedule } from '@/lib/schedule';
import SuccessPoller from '@/components/SuccessPoller';

export const metadata = {
  title: 'Registration Confirmed — Summer Braille Course',
  robots: { index: false, follow: false },
};

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="success-page">
      <div className="success-card">
        <div className="check-icon check-icon-error" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1>{title}</h1>
        <p className="success-amount">{message}</p>
        <Link href="/summer" className="home-button">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Course
        </Link>
      </div>
    </div>
  );
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <ErrorCard
        title="No Payment Found"
        message="We couldn\u2019t find a payment associated with this page."
      />
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    return (
      <ErrorCard
        title="No Payment Found"
        message="We couldn\u2019t verify your payment. Please contact us if you believe this is an error."
      />
    );
  }

  if (session.payment_status !== 'paid') {
    return (
      <ErrorCard
        title="Payment Not Completed"
        message="Your payment hasn\u2019t been processed yet. Please try again or contact us for help."
      />
    );
  }

  // Payment verified — look up enrollment for section details
  const plan = session.metadata?.plan || 'full';
  const isDeposit = plan === 'deposit';

  let schedule: string | null = null;
  const enrollment = await prisma.enrollment.findUnique({
    where: { stripeSessionId: session_id },
    include: { section: true },
  });

  if (enrollment) {
    schedule = getSchedule(enrollment.section.label);
  }

  // Enrollment found — show full details
  // Enrollment not found yet (webhook race) — show "details processing"
  return (
    <div className="success-page">
      <div className="success-card">
        <div className="check-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" pathLength="1" className="check-draw" />
          </svg>
        </div>

        <h1>
          {isDeposit
            ? 'Your $150 Deposit Is Confirmed'
            : "You're All Set!"}
        </h1>
        <p className="success-amount">
          {isDeposit
            ? 'Thank you for reserving your spot!'
            : "$500 payment confirmed — you're fully enrolled."}
        </p>

        {isDeposit && (
          <div className="balance-banner">
            <p>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                style={{ width: 16, height: 16, display: 'inline', verticalAlign: '-2px', marginRight: 6, opacity: 0.6 }}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Remaining balance of{' '}
              <span className="balance-amount">$350</span> will be charged
              automatically on <strong>May 1st</strong> to the card you just
              used.
            </p>
          </div>
        )}

        <div className="course-details">
          <div className="detail-row">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>
              Course runs <strong>June 8 – July 27, 2026</strong>
            </span>
          </div>
          <SuccessPoller sessionId={session_id} initialSchedule={schedule} />
          <div className="detail-row">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>
              A confirmation email has been sent to your inbox
            </span>
          </div>
        </div>

        <p className="contact-note">
          Questions? Reach out anytime at{' '}
          <a href="mailto:Delaney@TeachBraille.org">
            Delaney@TeachBraille.org
          </a>
        </p>

        <Link href="/summer" className="home-button">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Course
        </Link>
      </div>
    </div>
  );
}
