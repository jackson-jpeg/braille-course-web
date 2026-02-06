import type { Metadata } from 'next';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Policies — TeachBraille.org',
  description:
    'Refund policy, privacy policy, and terms of service for TeachBraille.org summer braille courses.',
};

export default function PoliciesPage() {
  return (
    <>
      <main className="policies-page" id="main-content">
        <div className="policies-hero">
          <h1>Policies</h1>
          <p>
            Refund policy, privacy policy, and terms of service for
            TeachBraille.org.
          </p>
        </div>

        <div className="policies-content">
          {/* Refund Policy */}
          <section id="refunds" className="policy-section">
            <h2>Refund &amp; Cancellation Policy</h2>

            <h3>Deposit Plan ($150 deposit + $350 balance)</h3>
            <ul>
              <li>
                <strong>Cancel before May 1:</strong> Full $150 deposit refunded.
              </li>
              <li>
                <strong>After May 1</strong> (once the $350 balance is charged):
                Non-refundable.
              </li>
            </ul>

            <h3>Pay-in-Full Plan ($500)</h3>
            <ul>
              <li>
                <strong>Cancel 30+ days before June 8:</strong> Full refund.
              </li>
              <li>
                <strong>Within 30 days of June 8:</strong> Non-refundable.
              </li>
            </ul>

            <h3>How to Request a Refund</h3>
            <p>
              Email{' '}
              <a href="mailto:Delaney@TeachBraille.org">
                Delaney@TeachBraille.org
              </a>{' '}
              with your name and enrollment details. Approved refunds are
              processed back to the original payment method within 5–10 business
              days.
            </p>
          </section>

          {/* Privacy Policy */}
          <section id="privacy" className="policy-section">
            <h2>Privacy Policy</h2>

            <h3>Data We Collect</h3>
            <p>
              When you enroll, we collect your email address through Stripe
              Checkout. We do <strong>not</strong> store credit card numbers or
              payment details on our servers — all payment processing is handled
              securely by Stripe.
            </p>

            <h3>Third-Party Services</h3>
            <ul>
              <li>
                <strong>Stripe</strong> — payment processing (
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe Privacy Policy
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
              Your email address is used for enrollment confirmation, course
              communication, and schedule updates. We will never sell or share
              your personal information with third parties for marketing
              purposes.
            </p>

            <h3>Contact</h3>
            <p>
              For privacy questions or data deletion requests, email{' '}
              <a href="mailto:Delaney@TeachBraille.org">
                Delaney@TeachBraille.org
              </a>
              .
            </p>
          </section>

          {/* Terms of Service */}
          <section id="terms" className="policy-section">
            <h2>Terms of Service</h2>

            <ul>
              <li>
                Course instruction is delivered remotely via video call.
              </li>
              <li>
                Enrolled spots are non-transferable to other individuals.
              </li>
              <li>
                The instructor may modify the course schedule with reasonable
                notice to enrolled students.
              </li>
              <li>
                All course materials — including lesson plans, handouts, and
                resources — are the intellectual property of the instructor and
                may not be redistributed.
              </li>
              <li>
                Students are expected to maintain a respectful learning
                environment during all sessions.
              </li>
            </ul>

            <p>
              Questions about these terms? Email{' '}
              <a href="mailto:Delaney@TeachBraille.org">
                Delaney@TeachBraille.org
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
