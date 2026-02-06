import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import BrailleHero from '@/components/BrailleHero';

export const metadata: Metadata = {
  title: 'Book an Appointment — TeachBraille.org',
  description:
    'Schedule a 1-on-1 braille instruction session with Delaney Costello, Teacher of the Visually Impaired. Personalized lessons at your own pace.',
  openGraph: {
    title: 'Book a Braille Appointment — TeachBraille.org',
    description:
      'Personalized 1-on-1 braille instruction with a certified TVI.',
  },
};

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;

export default function AppointmentsPage() {
  return (
    <>
      {/* ========== HERO ========== */}
      <section className="appointments-hero" id="top">
        <div className="appointments-hero-content" id="main-content">
          <BrailleHero />
          <div className="section-label">1-on-1 Instruction</div>
          <h1>
            Book an <em>Appointment</em>
          </h1>
          <p className="appointments-hero-sub">
            Personalized braille instruction tailored to your pace, your goals,
            and your schedule.
          </p>
        </div>
      </section>

      {/* ========== INFO ========== */}
      <section className="appointments-info" aria-labelledby="appt-info-heading">
        <div className="appointments-info-inner reveal">
          <h2 id="appt-info-heading">What to Expect</h2>

          <div className="appointments-features">
            <div className="appointments-feature">
              <div className="appointments-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <h3>Individualized Lessons</h3>
              <p>
                Each session is built around your current level and learning goals —
                whether you&apos;re just starting or building on existing knowledge.
              </p>
            </div>

            <div className="appointments-feature">
              <div className="appointments-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <h3>Flexible Scheduling</h3>
              <p>
                Choose a time that works for you. Sessions are conducted remotely
                via video call, so you can learn from anywhere.
              </p>
            </div>

            <div className="appointments-feature">
              <div className="appointments-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3>All Skill Levels</h3>
              <p>
                From learning your first braille letters to mastering contractions
                and numbers — sessions are designed for beginners and beyond.
              </p>
            </div>
          </div>

          <div className="appointments-who reveal">
            <h3>Who Are Sessions For?</h3>
            <p>
              Parents, family members, educators, paraprofessionals, and anyone
              interested in learning Unified English Braille. No prior experience
              needed.
            </p>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="appointments-how" aria-labelledby="how-heading">
        <div className="appointments-how-inner reveal">
          <h2 id="how-heading">How It Works</h2>
          <div className="appointments-steps">
            <div className="appointments-step">
              <div className="appointments-step-number" aria-hidden="true">1</div>
              <h3>Reach Out</h3>
              <p>
                Send an email with your name, experience level, and goals.
              </p>
            </div>
            <div className="appointments-step">
              <div className="appointments-step-number" aria-hidden="true">2</div>
              <h3>Plan Your Sessions</h3>
              <p>
                Delaney will follow up to discuss scheduling and a plan tailored to you.
              </p>
            </div>
            <div className="appointments-step">
              <div className="appointments-step-number" aria-hidden="true">3</div>
              <h3>Start Learning</h3>
              <p>
                Meet via video call and begin building your braille skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BOOKING / CTA ========== */}
      <section className="appointments-booking" aria-labelledby="booking-heading">
        <div className="appointments-booking-inner reveal">
          <h2 id="booking-heading">Schedule a Session</h2>
          {CALENDLY_URL ? (
            <div className="calendly-embed">
              <iframe
                src={CALENDLY_URL}
                width="100%"
                height="700"
                style={{ border: 0 }}
                title="Schedule an appointment"
              />
            </div>
          ) : (
            <div className="appointments-cta-block">
              <a
                href="mailto:Delaney@TeachBraille.org?subject=Braille%20Session%20Inquiry"
                className="appointments-email-cta"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
                Email Delaney to Get Started
              </a>
              <p className="appointments-email-sub">
                Include your name, experience level, and preferred schedule
              </p>
              <p className="appointments-response-note">
                Delaney typically responds within 24 hours
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ========== CROSS-LINK ========== */}
      <section className="appointments-crosslink">
        <div className="appointments-crosslink-inner reveal">
          <p>
            Looking for a group course?{' '}
            <Link href="/summer">View the Summer Braille Course &rarr;</Link>
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
