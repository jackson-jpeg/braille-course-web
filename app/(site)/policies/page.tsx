import type { Metadata } from 'next';
import Eyebrow from '@/components/ui/Eyebrow';
import Cell from '@/components/ui/Cell';
import { LETTERS } from '@/lib/ueb';
import { PRICING, formatPrice } from '@/lib/pricing';
import '@/styles/pages/policies.css';

export const metadata: Metadata = {
  title: 'Policies — Refunds, Privacy & Terms',
  description: 'Refund policy, privacy policy, and terms of service for TeachBraille.org summer braille courses.',
  alternates: { canonical: 'https://teachbraille.org/policies' },
  openGraph: {
    title: 'Policies | TeachBraille.org',
    description: 'Refund policy, privacy policy, and terms of service for TeachBraille.org summer braille courses.',
    url: 'https://teachbraille.org/policies',
  },
};

/* Table of contents. Anchor ids are linked from elsewhere (e.g. /policies#refunds, #terms): keep them stable. */
const TOC = [
  { id: 'refunds', label: 'Refund & cancellation', letter: 'r' },
  { id: 'privacy', label: 'Privacy policy', letter: 'p' },
  { id: 'game-progress', label: 'Privacy of game progress', letter: 'g' },
  { id: 'terms', label: 'Terms of service', letter: 't' },
];

export default function PoliciesPage() {
  return (
    <>
      <section className="page-hero lattice policies-hero" aria-labelledby="policies-title">
        <div className="wrap">
          <Eyebrow>Policies</Eyebrow>
          <h1 id="policies-title">Policies</h1>
          <p className="lead">Refund policy, privacy policy, and terms of service for TeachBraille.org.</p>
        </div>
      </section>

      <div className="wrap policies-layout">
        <nav className="policies-toc" aria-labelledby="toc-heading">
          <h2 id="toc-heading" className="policies-toc-heading">
            On this page
          </h2>
          <ol className="policies-toc-list" role="list">
            {TOC.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`}>
                  <Cell dots={LETTERS[t.letter]} size="xs" />
                  {t.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="policies-body">
          {/* Refund Policy */}
          <section id="refunds" className="policy-section prose" aria-labelledby="refunds-heading">
            <h2 id="refunds-heading">Refund &amp; Cancellation Policy</h2>

            <div className="policy-plans">
              <div className="policy-plan">
                <h3>
                  Deposit Plan ({formatPrice(PRICING.deposit)} deposit + {formatPrice(PRICING.balance)} balance)
                </h3>
                <ul>
                  <li>
                    <strong>Cancel before {PRICING.balanceDueDate}:</strong> Full {formatPrice(PRICING.deposit)} deposit
                    refunded.
                  </li>
                  <li>
                    <strong>After {PRICING.balanceDueDate}</strong> (once the {formatPrice(PRICING.balance)} balance is
                    charged): Non-refundable.
                  </li>
                </ul>
              </div>

              <div className="policy-plan">
                <h3>Pay-in-Full Plan ({formatPrice(PRICING.full)})</h3>
                <ul>
                  <li>
                    <strong>Cancel 30+ days before {PRICING.courseStartDate}:</strong> Full refund.
                  </li>
                  <li>
                    <strong>Within 30 days of {PRICING.courseStartDate}:</strong> Non-refundable.
                  </li>
                </ul>
              </div>
            </div>

            <h3>How to Request a Refund</h3>
            <p>
              Email <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a> with your name and enrollment
              details. Approved refunds are processed back to the original payment method within 5–10 business days.
            </p>
          </section>

          {/* Privacy Policy */}
          <section id="privacy" className="policy-section prose" aria-labelledby="privacy-heading">
            <h2 id="privacy-heading">Privacy Policy</h2>

            <h3>Data We Collect</h3>
            <p>
              When you enroll, we collect your email address through Stripe Checkout. We do <strong>not</strong> store
              credit card numbers or payment details on our servers — all payment processing is handled securely by
              Stripe.
            </p>

            <h3>Third-Party Services</h3>
            <ul>
              <li>
                <strong>Stripe</strong> — payment processing (
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                  Stripe Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
                </a>
                )
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery
              </li>
              <li>
                <strong>Vercel</strong> — hosting and anonymized analytics
              </li>
            </ul>

            <h3>How We Use Your Data</h3>
            <p>
              Your email address is used for enrollment confirmation, course communication, and schedule updates. We
              will never sell or share your personal information with third parties for marketing purposes.
            </p>

            <h3>Contact</h3>
            <p>
              For privacy questions or data deletion requests, email{' '}
              <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>.
            </p>
          </section>

          {/* Game + lesson progress (local storage) */}
          <section id="game-progress" className="policy-section prose" aria-labelledby="game-progress-heading">
            <h2 id="game-progress-heading">Privacy of game progress</h2>
            <p>
              Lesson and game progress is stored only in your browser&rsquo;s local storage on your device. It is never
              sent to our servers.
            </p>
          </section>

          {/* Terms of Service */}
          <section id="terms" className="policy-section prose" aria-labelledby="terms-heading">
            <h2 id="terms-heading">Terms of Service</h2>

            <ul>
              <li>Course instruction is delivered remotely via video call.</li>
              <li>Enrolled spots are non-transferable to other individuals.</li>
              <li>The instructor may modify the course schedule with reasonable notice to enrolled students.</li>
              <li>
                All course materials — including lesson plans, handouts, and resources — are the intellectual property
                of the instructor and may not be redistributed.
              </li>
              <li>Students are expected to maintain a respectful learning environment during all sessions.</li>
            </ul>

            <p>
              Questions about these terms? Email <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
