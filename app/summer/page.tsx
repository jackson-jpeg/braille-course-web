import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BrailleHero from '@/components/BrailleHero';
import FloatingCta from '@/components/FloatingCta';
import EnrollmentForm from '@/components/EnrollmentForm';
import { SpotsProvider } from '@/lib/spots-context';
import SpotsBadge from '@/components/SpotsBadge';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Summer Braille Course 2026 — Delaney Costello, TVI',
  description:
    'An 8-week introductory remote Braille course for parents and loved ones of visually impaired individuals. Taught by Delaney Costello, Teacher of the Visually Impaired. Only 10 spots available — Summer 2026.',
  openGraph: {
    title: 'Learn Braille This Summer — Remote Course for Parents',
    description:
      'An 8-week introductory remote Braille course for parents and loved ones. Only 10 spots available. Starts June 8.',
    type: 'website',
  },
};

export default async function SummerPage() {
  let sections: { id: string; label: string; maxCapacity: number; enrolledCount: number; status: string }[] = [];
  try {
    sections = await prisma.section.findMany({
      orderBy: { label: 'asc' },
    });
  } catch {
    // DB not available yet — render with empty sections
  }

  return (
    <SpotsProvider initialSections={sections}>
      <FloatingCta />

      {/* ========== HERO ========== */}
      <section className="hero" id="top">
        <div className="hero-content" id="main-content">
          <BrailleHero />

          <div className="hero-badge">Summer 2026 · Remote Course</div>

          <h1>
            Learn <em>Braille</em>
            <br />
            This Summer
          </h1>

          <p className="hero-subtitle">
            An introductory course for parents &amp; loved ones
          </p>

          <p className="hero-description">
            Connect with your visually impaired child, family member, or friend
            in a whole new way. This 8-week remote course will give you a strong
            foundation in the Unified English Braille Code.
          </p>

          <div className="hero-meta" role="list" aria-label="Course quick facts">
            <span className="meta-chip" role="listitem">
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
              June 8 – July 27
            </span>
            <span className="meta-chip" role="listitem">
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
              16 Sessions
            </span>
            <span className="meta-chip" role="listitem">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <SpotsBadge variant="hero-chip" />
            </span>
            <span className="meta-chip" role="listitem">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Fully Remote
            </span>
          </div>
        </div>

      </section>

      {/* ========== ABOUT ========== */}
      <section className="about-section" aria-labelledby="about-heading">
        <div className="about-inner reveal">
          <div className="section-label">Meet Your Instructor</div>
          <h2 id="about-heading">Hi, I&apos;m Delaney Costello</h2>
          <p className="about-text">
            I am a <strong>Teacher of the Visually Impaired</strong> with 9 years
            of teaching experience — 6 years in person and 3 years in a hybrid of
            in-person and remote services. Last summer, a former student&apos;s
            mother reached out hoping to learn Braille. It was the first time a
            parent had ever asked me, and I quickly agreed.
          </p>

          <blockquote className="pullquote reveal">
            <p>
              A summer Braille course for parents is one of the best ways I can
              think to spend <em>my summer.</em>
            </p>
          </blockquote>

          <p className="about-text">
            Over several weeks at the library, her home, and on virtual calls, she
            built a strong foundation — learning half the alphabet and gaining
            confidence in reading and writing Braille. Her curiosity and
            determination inspired me to offer this opportunity to other families.
          </p>
        </div>
      </section>

      {/* ========== BENEFIT CALLOUT ========== */}
      <section className="benefit-callout" aria-labelledby="benefit-heading">
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
          <h2 id="benefit-heading">Why Learn Braille?</h2>
          <p>
            Learning Braille is a wonderful way to connect with a child, parent,
            spouse, sibling, or friend who is visually impaired. A strong knowledge
            of Braille allows you to write a note, assist with homework, or
            transcribe someone&apos;s written work — bridging the gap between the
            sighted and visually impaired worlds with understanding and love.
          </p>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="details-section" aria-labelledby="faq-heading">
        <div className="details-inner">
          <div className="details-header reveal">
            <div className="section-label">Everything You Need to Know</div>
            <h2 id="faq-heading">Course Details</h2>
          </div>

          <div className="faq-grid">
            <div className="faq-item reveal">
              <div className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                Do I need this course to learn Braille?
              </div>
              <p className="faq-answer">
                Absolutely not! There are several free, self-paced Braille programs
                available. This course offers the benefit of live instruction,
                personalized feedback, and structured pacing to keep you on track.
              </p>
            </div>

            <div className="faq-item reveal">
              <div className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                How long is this course?
              </div>
              <p className="faq-answer">
                The course runs for <strong>8 weeks</strong>, beginning the week of{' '}
                <strong>June 8th</strong> and ending the week of{' '}
                <strong>July 27th</strong>.
              </p>
            </div>

            <div className="faq-item reveal">
              <div className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                How often will we meet?
              </div>
              <p className="faq-answer">
                You&apos;ll meet{' '}
                <strong>twice per week for one hour each session</strong>. Over the
                8-week course, that comes out to <strong>16 sessions total</strong>.
                Two time slots are available — pick the one that works best for you:
              </p>
              <ul className="faq-answer" style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                <li>Monday &amp; Wednesday, 1–2 PM ET</li>
                <li>Tuesday &amp; Thursday, 4–5 PM ET</li>
              </ul>
            </div>

            <div className="faq-item reveal">
              <div className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                How many spots are available?
              </div>
              <p className="faq-answer">
                To ensure personalized attention for every learner, enrollment is
                limited to <strong>10 total spots</strong> — 5 per class.
                Participants will be chosen on a first-come, first-served basis.
              </p>
            </div>

            <div className="faq-item reveal">
              <div className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                What will I learn?
              </div>
              <p className="faq-answer">
                This course is an introduction to the{' '}
                <strong>Unified English Braille Code (UEB)</strong>. You&apos;ll
                learn the full alphabet, numbers 0–9, and some commonly used
                contractions.
              </p>
            </div>

            <div className="faq-item reveal">
              <div className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                What does this course cost?
              </div>
              <p className="faq-answer">
                The total cost for 8 weeks of instruction (16 sessions) is{' '}
                <strong>$500 per learner</strong>. You can pay in full upfront, or
                reserve your spot with a <strong>$150 deposit</strong> — the
                remaining <strong>$350</strong> will be charged automatically on{' '}
                <strong>May 1st</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== AT A GLANCE ========== */}
      <section className="glance-section" aria-labelledby="glance-heading">
        <div className="glance-inner">
          <div className="glance-header reveal">
            <div className="section-label">At a Glance</div>
            <h2 id="glance-heading">Course Overview</h2>
          </div>

          <div className="glance-grid reveal" role="list">
            <div className="glance-card" role="listitem">
              <div className="glance-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="label">Duration</div>
              <div className="value">8 Weeks</div>
              <div className="sub">June 8 – July 27</div>
            </div>

            <div className="glance-card" role="listitem">
              <div className="glance-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <div className="label">Sessions</div>
              <div className="value">16 Total</div>
              <div className="sub">Mon/Wed 1–2 PM or Tue/Thu 4–5 PM ET</div>
            </div>

            <div className="glance-card" role="listitem">
              <div className="glance-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="label">Class Size</div>
              <div className="value">5 Per Class</div>
              <div className="sub">10 total spots</div>
            </div>

            <div className="glance-card" role="listitem">
              <div className="glance-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="label">Investment</div>
              <div className="value">$500</div>
              <div className="sub">Due by May 1st</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHAT'S INCLUDED ========== */}
      <section className="includes-section" aria-labelledby="includes-heading">
        <div className="includes-inner">
          <div className="includes-header reveal">
            <div className="section-label">What You&apos;ll Receive</div>
            <h2 id="includes-heading">Included With Your Enrollment</h2>
          </div>

          <div className="includes-list reveal" role="list">
            <div className="include-item" role="listitem">
              <div className="include-check" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p>
                A copy of all <strong>Google Slides</strong> used during every
                session for reference and review
              </p>
            </div>
            <div className="include-item" role="listitem">
              <div className="include-check" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p>
                <strong>One-on-one individualized braille reading practice</strong>{' '}
                tailored to your progress
              </p>
            </div>
            <div className="include-item" role="listitem">
              <div className="include-check" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p>
                <strong>Graded writing practice</strong> with personalized feedback
                to build your skills
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MATERIALS ========== */}
      <section className="materials-section" aria-labelledby="materials-heading">
        <div className="materials-inner reveal">
          <h3 id="materials-heading">Materials Needed to Participate</h3>
          <div className="materials-tags" role="list">
            <span className="mat-tag" role="listitem">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Computer
            </span>
            <span className="mat-tag" role="listitem">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <circle cx="12" cy="20" r="1" />
              </svg>
              WiFi
            </span>
            <span className="mat-tag" role="listitem">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              Webcam
            </span>
          </div>
          <p className="materials-note">
            A <strong>brailler</strong> is optional but highly recommended. If you
            have access to one, it will greatly enhance your learning experience.
            Don&apos;t have one? No worries — we can discuss options before the
            course begins.
          </p>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="cta-section" id="cta" aria-labelledby="cta-heading">
        <div className="cta-inner reveal">
          <h2 id="cta-heading">
            Ready to Learn
            <br />
            <em>Braille?</em>
          </h2>

          <div className="spots-badge">
            <SpotsBadge variant="cta-badge" />
          </div>

          <p className="cta-sub">
            Spots are limited and filled on a first-come, first-served basis.
            Reserve your place in this summer&apos;s introductory Braille course
            today.
          </p>

          <EnrollmentForm />

          <p className="cta-note">
            Pay in full today, or put down a $150 deposit with the remaining $350
            charged on May 1st.
          </p>

          <div
            className="stripe-badge"
            aria-label="Secure checkout powered by Stripe"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure checkout powered by Stripe
          </div>

          <div className="cta-divider" aria-hidden="true"></div>

          <p className="cta-email">
            Questions? Reach out at{' '}
            <a href="mailto:Delaney@TeachBraille.org">
              Delaney@TeachBraille.org
            </a>
          </p>
        </div>
      </section>

      {/* ========== GAMES LINK ========== */}
      <section className="games-link-section">
        <div className="games-link-inner reveal">
          <h3>Want to practice your Braille?</h3>
          <p>Try our interactive braille activities — Word Game, Dot Explorer, Hangman, and more.</p>
          <Link href="/games" className="games-link-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" />
            </svg>
            Try Interactive Practice
          </Link>
        </div>
      </section>

      <Footer />
    </SpotsProvider>
  );
}
