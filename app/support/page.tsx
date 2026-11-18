import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';

const SUPPORT_EMAIL = 'Delaney@TeachBraille.org';
const APP_STORE_URL = 'https://apps.apple.com/app/id6833681749';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Help with the free Teach Braille app for iPhone and iPad, the free braille practice on TeachBraille.org, and lessons with Delaney Costello.',
  alternates: { canonical: 'https://teachbraille.org/support' },
  openGraph: {
    title: 'Support | TeachBraille.org',
    description:
      'Help with the free Teach Braille app for iPhone and iPad, the free braille practice on TeachBraille.org, and lessons with Delaney Costello.',
  },
};

export default function SupportPage() {
  return (
    <>
      <div className="policies-page">
        <div className="policies-hero">
          <h1>Support</h1>
          <p>Help with the Teach Braille app, the free practice on this site, and lessons with Delaney.</p>
        </div>

        <div className="policies-content">
          <section id="contact" className="policy-section">
            <h2>Get help</h2>
            <p>
              Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with what you were doing and what went
              wrong. For the app, say which device you use (iPhone or iPad) and which stop or game you were on.
            </p>
          </section>

          <section id="app" className="policy-section">
            <h2>The iPhone and iPad app</h2>
            <p>
              Teach Braille is free on the{' '}
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                App Store
              </a>
              . It teaches the braille alphabet one cell at a time with the Six, the six dots of a braille cell, along a
              path of short stops and games.
            </p>
            <h3>Where is my progress kept?</h3>
            <p>
              On your device. The app has no accounts, so there is nothing to sign in to, and your progress is not sent
              anywhere.
            </p>
            <h3>Does the app collect my data?</h3>
            <p>
              No. It has no accounts, no analytics, no advertising and no tracking. The details are in the{' '}
              <Link href="/policies#app">privacy policy</Link>.
            </p>
            <h3>Does it work with VoiceOver and larger text?</h3>
            <p>
              Yes. Every part of the app is labelled for VoiceOver, and the app is checked at the largest text sizes. If
              something is hard to reach or read, please email us so we can fix it.
            </p>
          </section>

          <section id="website" className="policy-section">
            <h2>The free practice on this site</h2>
            <p>
              The <Link href="/games">games</Link> and <Link href="/learn">lessons</Link> need no account. Your game
              progress is saved in your browser on this device, so it does not follow you to another browser or device,
              and clearing your browser data clears it.
            </p>
          </section>

          <section id="lessons" className="policy-section">
            <h2>Lessons and courses</h2>
            <p>
              For one-on-one lessons and TVI services, see <Link href="/services">services</Link>. Payments, refunds and
              cancellations for courses are covered in the <Link href="/policies#refunds">refund policy</Link>.
            </p>
          </section>

          <section id="privacy" className="policy-section">
            <h2>Privacy</h2>
            <p>
              This site counts visits without cookies and does not follow you to other sites. Read the full{' '}
              <Link href="/policies#privacy">privacy policy</Link>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
