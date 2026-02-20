import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import BrailleHero from '@/components/BrailleHero';
import FloatingCta from '@/components/FloatingCta';
import EnrollmentForm from '@/components/EnrollmentForm';
import { SpotsProvider } from '@/lib/spots-context';
import SpotsBadge from '@/components/SpotsBadge';
import Footer from '@/components/Footer';
import { PRICING, formatPrice } from '@/lib/pricing';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Summer Braille Course 2026 — Learn Braille This Summer',
  description:
    'Learn to read and write braille this summer. Remote course for parents and loved ones of visually impaired individuals. Taught by Delaney Costello, certified TVI. Only 10 spots — Summer 2026.',
  alternates: { canonical: 'https://teachbraille.org/summer' },
  openGraph: {
    title: 'Summer Braille Course 2026 — Learn Braille This Summer | TeachBraille.org',
    description:
      'A remote braille course for parents and loved ones. Live instruction from a certified TVI. Only 10 spots available.',
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

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'Summer Braille Course 2026',
    description:
      'An 8-week introductory remote Braille course for parents and loved ones of visually impaired individuals.',
    provider: {
      '@type': 'Person',
      name: 'Delaney Costello',
      url: 'https://teachbraille.org',
    },
    url: 'https://teachbraille.org/summer',
    courseMode: 'online',
    datePublished: '2026-01-01',
    offers: {
      '@type': 'Offer',
      price: String(PRICING.full),
      priceCurrency: 'USD',
      availability: 'https://schema.org/LimitedAvailability',
      url: 'https://teachbraille.org/summer',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      startDate: '2026-06-01',
      endDate: '2026-07-21',
      instructor: {
        '@type': 'Person',
        name: 'Delaney Costello',
        jobTitle: 'Teacher of the Visually Impaired',
      },
    },
  };

  return (
    <SpotsProvider initialSections={sections}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <FloatingCta />

      {/* ========== HERO ========== */}
      <section className="hero" id="top">
        <div className="hero-content">
          <BrailleHero word="SUMMER #2026" />

          <div className="hero-badge">Summer 2026 · Remote Course</div>

          <h1>
            Learn <em>Braille</em>
            <br />
            This Summer
          </h1>

          <p className="hero-subtitle">An introductory course for parents &amp; loved ones</p>

          <p className="hero-description">
            Connect with your visually impaired child, family member, or friend in a whole new way. This {PRICING.courseDuration} remote
            course will give you a strong foundation in the Unified English Braille Code.
          </p>

          <div className="hero-meta" role="list" aria-label="Course quick facts">
            <span className="meta-chip" role="listitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {PRICING.courseDates.replace(/, \d{4}$/, '')}
            </span>
            <span className="meta-chip" role="listitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              {PRICING.totalSessions} Sessions
            </span>
            <span className="meta-chip" role="listitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <SpotsBadge variant="hero-chip" />
            </span>
            <span className="meta-chip" role="listitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Fully Remote
            </span>
          </div>
        </div>
      </section>

      {/* ========== WHY THIS COURSE EXISTS ========== */}
      <section className="about-section" aria-labelledby="about-heading">
        <div className="about-inner reveal">
          <div className="section-label">Why This Course Exists</div>
          <h2 id="about-heading">Built From a Parent&apos;s Request</h2>
          <p className="about-text">
            Last summer, a former student&apos;s mother reached out hoping to learn Braille — the first time a parent
            had ever asked. Over several weeks at the library, her home, and on virtual calls, she learned half the
            alphabet and gained real confidence in reading and writing Braille. Her curiosity and determination inspired
            this course, so more families can share that same experience.
          </p>

          <blockquote className="pullquote reveal">
            <p>
              A summer Braille course for parents is one of the best ways I can think to spend <em>my summer.</em>
            </p>
          </blockquote>
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
            <details className="faq-item reveal" open>
              <summary className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                Do I need this course to learn Braille?
              </summary>
              <p className="faq-answer">
                Absolutely not! There are several free, self-paced Braille programs available. This course offers the
                benefit of live instruction, personalized feedback, and structured pacing to keep you on track.
              </p>
            </details>

            <details className="faq-item reveal">
              <summary className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                How long is this course?
              </summary>
              <p className="faq-answer">
                The course is <strong>{PRICING.courseDuration}s</strong>, beginning <strong>{PRICING.courseStartDate}</strong> and ending
                the week of <strong>July 21st</strong>. The final week is one class short — Section A meets only Monday, July 20th, and Section B meets only Tuesday, July 21st.
              </p>
            </details>

            <details className="faq-item reveal">
              <summary className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                How often will we meet?
              </summary>
              <p className="faq-answer">
                You&apos;ll meet <strong>twice per week for one hour each session</strong>. Over the {PRICING.courseDuration} course, that
                comes out to <strong>{PRICING.totalSessions} sessions total</strong>. Two time slots are available — pick the one that works
                best for you:
              </p>
              <ul className="faq-answer" style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                <li>Monday &amp; Wednesday, 1–2 PM ET</li>
                <li>Tuesday &amp; Thursday, 4–5 PM ET</li>
              </ul>
            </details>

            <details className="faq-item reveal">
              <summary className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                How many spots are available?
              </summary>
              <p className="faq-answer">
                To ensure personalized attention for every learner, enrollment is limited to{' '}
                <strong>10 total spots</strong> — 5 per class. Participants will be chosen on a first-come, first-served
                basis.
              </p>
            </details>

            <details className="faq-item reveal">
              <summary className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                What will I learn?
              </summary>
              <p className="faq-answer">
                This course is an introduction to the <strong>Unified English Braille Code (UEB)</strong>. You&apos;ll
                learn the full alphabet, numbers 0–9, and some commonly used contractions.
              </p>
            </details>

            <details className="faq-item reveal">
              <summary className="faq-question">
                <span className="faq-q-mark" aria-hidden="true">
                  Q
                </span>
                What does this course cost?
              </summary>
              <p className="faq-answer">
                The total cost for the {PRICING.courseDuration} course ({PRICING.totalSessions} sessions) is <strong>{formatPrice(PRICING.full)} per learner</strong>. You can
                pay in full upfront, or reserve your spot with a <strong>{formatPrice(PRICING.deposit)} deposit</strong> — the remaining{' '}
                <strong>{formatPrice(PRICING.balance)}</strong> will be charged automatically on <strong>{PRICING.balanceDueDate}</strong>.
              </p>
            </details>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p>
                A copy of all <strong>Google Slides</strong> used during every session for reference and review
              </p>
            </div>
            <div className="include-item" role="listitem">
              <div className="include-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p>
                <strong>One-on-one individualized braille reading practice</strong> tailored to your progress
              </p>
            </div>
            <div className="include-item" role="listitem">
              <div className="include-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p>
                <strong>Graded writing practice</strong> with personalized feedback to build your skills
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Computer
            </span>
            <span className="mat-tag" role="listitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <circle cx="12" cy="20" r="1" />
              </svg>
              WiFi
            </span>
            <span className="mat-tag" role="listitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              Webcam
            </span>
          </div>
          <p className="materials-note">
            A <strong>brailler</strong> is optional but highly recommended. If you have access to one, it will greatly
            enhance your learning experience. Don&apos;t have one? No worries — we can discuss options before the course
            begins.
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
            Spots are limited and filled on a first-come, first-served basis. Reserve your place in this summer&apos;s
            introductory Braille course today.
          </p>

          <EnrollmentForm />

          <p className="cta-note">
            Pay in full today, or put down a {formatPrice(PRICING.deposit)} deposit with the remaining {formatPrice(PRICING.balance)} charged on {PRICING.balanceDueDate}.
          </p>

          <div className="stripe-badge" aria-label="Secure checkout powered by Stripe">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure checkout powered by Stripe
          </div>

          <div className="cta-divider" aria-hidden="true"></div>

          <p className="cta-email">
            Questions? Reach out at <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>
          </p>
        </div>
      </section>

      <Footer />
    </SpotsProvider>
  );
}
