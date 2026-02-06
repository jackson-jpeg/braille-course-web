import Link from 'next/link';

export const metadata = {
  title: 'Registration Confirmed — Summer Braille Course',
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const isDeposit = plan === 'deposit';

  return (
    <div className="success-page">
      <div className="success-card" role="main">
        <div className="check-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
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
              Remaining balance of{' '}
              <span className="balance-amount">$350</span> will be charged
              automatically on <strong>May 1st</strong> to the card you just
              used.
            </p>
          </div>
        )}

        <div className="course-details">
          <h3>What&apos;s Next</h3>
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
          <div className="detail-row">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            <span>
              <strong>16 sessions</strong> — twice per week, 1 hour each
            </span>
          </div>
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
              You&apos;ll receive scheduling details via <strong>email</strong>{' '}
              soon
            </span>
          </div>
        </div>

        <p className="contact-note">
          Questions? Reach out anytime at{' '}
          <a href="mailto:delaneycostello23@gmail.com">
            delaneycostello23@gmail.com
          </a>
        </p>

        <Link href="/" className="home-button">
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
          Back to Home
        </Link>
      </div>
    </div>
  );
}
