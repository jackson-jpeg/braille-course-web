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

      {/* ========== MEET DELANEY ========== */}
      <section className="appointments-about" aria-labelledby="appt-about-heading">
        <div className="appointments-about-inner reveal">
          <div className="section-label">Meet Your Instructor</div>
          <h2 id="appt-about-heading">Delaney Costello</h2>
          <p className="appointments-about-text">
            Delaney is a <strong>Teacher of the Visually Impaired</strong> with{' '}
            <strong>9 years of teaching experience</strong> — 6 years in person
            and 3 years in a hybrid of in-person and remote services.
          </p>
          <p className="appointments-about-text">
            Whether you&apos;re a parent wanting to connect with your child, a
            family member hoping to read alongside a loved one, or a professional
            building braille skills, Delaney tailors every session to meet you
            where you are.
          </p>
        </div>
      </section>

      {/* ========== BENEFIT CALLOUT ========== */}
      <section className="benefit-callout" aria-labelledby="appt-benefit-heading">
        <div className="benefit-inner reveal">
          <div className="benefit-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 id="appt-benefit-heading">Why Learn Braille?</h2>
          <p>
            Learning Braille is a wonderful way to connect with a child, parent,
            spouse, sibling, or friend who is visually impaired. A strong knowledge
            of Braille allows you to write a note, assist with homework, or
            transcribe someone&apos;s written work — bridging the gap between the
            sighted and visually impaired worlds with understanding and love.
          </p>
        </div>
      </section>

      {/* ========== WHY PRIVATE SESSIONS ========== */}
      <section className="appointments-why" aria-labelledby="appt-why-heading">
        <div className="appointments-why-inner reveal">
          <h2 id="appt-why-heading">Why Choose Private Sessions?</h2>
          <div className="appointments-why-grid">
            <div className="appointments-why-item">
              <div className="appointments-why-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <h3>Learn at Your Own Pace</h3>
              <p>
                Every minute is focused on your progress — no need to keep up
                with a group or wait for others to catch up.
              </p>
            </div>
            <div className="appointments-why-item">
              <div className="appointments-why-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3>Curriculum Built Around You</h3>
              <p>
                Lessons are tailored to your specific goals — whether that&apos;s
                reading to your child, writing notes, or building professional
                skills.
              </p>
            </div>
            <div className="appointments-why-item">
              <div className="appointments-why-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>Flexible Commitment</h3>
              <p>
                No 8-week commitment required. Book sessions as you need them,
                on a schedule that works for you.
              </p>
            </div>
          </div>
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
