import Link from 'next/link';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getSchedule } from '@/lib/schedule';
import SuccessPoller from '@/components/SuccessPoller';
import { formatPrice } from '@/lib/pricing';
import { NEXT_COHORT } from '@/lib/cohort';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import { LETTERS } from '@/lib/ueb';
import '@/styles/pages/enroll.css';

export const metadata = {
  title: 'Registration Confirmed — Braille Course',
  robots: { index: false, follow: false },
};

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="success-page wrap-narrow">
      <div className="tile success-card">
        <Cell dots={[]} size="lg" framed flat="ghost" />
        <h1>{title}</h1>
        <p>{message}</p>
        <p className="muted">
          Questions? Email <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>.
        </p>
        <Link href="/courses" className="btn">
          Back to courses
        </Link>
      </div>
    </div>
  );
}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return <ErrorCard title="No Payment Found" message="We couldn\u2019t find a payment associated with this page." />;
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

  const paid = session.amount_total != null ? formatPrice(Math.round(session.amount_total / 100)) : null;

  // Enrollment found — show full details
  // Enrollment not found yet (webhook race) — show "details processing"
  return (
    <div className="success-page wrap-narrow">
      <div className="tile success-card">
        <BrailleText text="yes!" size="lg" pop label="yes! in braille" />
        <h1>{isDeposit ? 'Your deposit is confirmed' : 'You’re all set!'}</h1>
        <p className="lead center">
          {isDeposit
            ? `Thank you for reserving your spot${paid ? ` with your ${paid} deposit` : ''}.`
            : `${paid ? `${paid} payment confirmed — ` : ''}you’re fully enrolled.`}
        </p>

        {isDeposit && (
          <p className="notice">
            Your remaining balance will be charged automatically to the card you just used, on the date shown in your
            confirmation email.
          </p>
        )}

        <ul className="success-details">
          <li>
            <Cell dots={LETTERS.d} size="xs" />
            <span>
              {NEXT_COHORT ? `Course runs ${NEXT_COHORT.dates}` : 'Delaney will email your course dates and details.'}
            </span>
          </li>
          <SuccessPoller sessionId={session_id} initialSchedule={schedule} />
          <li>
            <Cell dots={LETTERS.e} size="xs" />
            <span>A confirmation email is on its way to your inbox.</span>
          </li>
        </ul>

        <p className="muted">
          Questions? Reach out anytime at <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>
        </p>

        <div className="cluster" style={{ justifyContent: 'center' }}>
          <Link href="/learn" className="btn">
            Start the free lessons
          </Link>
          <Link href="/courses" className="btn btn--paper">
            Back to courses
          </Link>
        </div>
      </div>
    </div>
  );
}
