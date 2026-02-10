import BrailleHero from '@/components/BrailleHero';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function HubPage() {
  return (
    <>
      {/* ========== HUB HERO ========== */}
      <section className="hub-hero" id="top">
        <div className="hub-hero-content">
          <BrailleHero />

          <h1>
            <em>Delaney Costello</em>
            <br />
            Teacher of the Visually Impaired
          </h1>

          <p className="hub-hero-subtitle">Specialized TVI Services, Including Braille</p>

          <p className="hub-hero-description">
            Personalized support for students who are visually impaired and their families. From braille instruction and
            assistive technology to compensatory skills and educational team consultation — all available remotely.
          </p>
        </div>
      </section>

      {/* ========== ABOUT ========== */}
      <section className="hub-about" aria-labelledby="hub-about-heading">
        <div className="hub-about-inner reveal">
          <div className="section-label">About Delaney</div>
          <h2 id="hub-about-heading">Hi, I&apos;m Delaney Costello</h2>
          <p className="hub-about-text">
            I am a <strong>Teacher of the Visually Impaired</strong> with <strong>9 years of experience</strong> helping
            students and families navigate the world of visual impairment. My services include braille instruction,
            assistive technology, compensatory and daily living skills, visual efficiency, and educational team
            collaboration.
          </p>
          <p className="hub-about-text">
            Whether I&apos;m teaching a student to read braille, helping a family get started with assistive technology,
            or consulting with a school team on accommodations — my focus is always on empowering students and the
            people who support them.
          </p>

          <blockquote className="pullquote reveal">
            <p>
              &ldquo;Every student and family I work with has a unique story. Being part of that journey is the most
              rewarding work I can imagine.&rdquo;
            </p>
          </blockquote>

          <p className="hub-about-text">
            I offer services both remotely and in person, including structured courses, one-on-one sessions, and free
            braille practice tools right here on this site.
          </p>
        </div>
      </section>

      {/* ========== BENEFIT CALLOUT ========== */}
      <section className="benefit-callout" aria-labelledby="hub-benefit-heading">
        <div className="benefit-inner reveal">
          <div className="benefit-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 id="hub-benefit-heading">Why Work with a TVI?</h2>
          <p>
            A Teacher of the Visually Impaired provides specialized instruction for students with visual impairments —
            including braille, assistive technology, and daily living skills. Working with a TVI ensures that a
            student&apos;s education is shaped around how they learn best.
          </p>
        </div>
      </section>

      {/* ========== CARD GRID ========== */}
      <section className="hub-cards" aria-labelledby="hub-cards-heading">
        <div className="hub-cards-inner">
          <div className="hub-cards-header reveal">
            <div className="section-label">Services &amp; Resources</div>
            <h2 id="hub-cards-heading">How Can Delaney Help?</h2>
          </div>

          <div className="hub-cards-grid reveal-stagger">
            <Link href="/intro" className="hub-card reveal">
              <div className="hub-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <h3>Braille Introduction</h3>
              <p>
                Braille is a core part of TVI instruction. Explore what it is, its history, and the full A–Z alphabet.
              </p>
              <span className="hub-card-cta">
                Start learning
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/summer" className="hub-card reveal">
              <div className="hub-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>Summer Braille Course</h3>
              <p>8-week remote braille course, Summer 2026. Live instruction with personalized feedback.</p>
              <span className="hub-card-cta">
                Learn more
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/appointments" className="hub-card reveal">
              <div className="hub-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                </svg>
              </div>
              <h3>1-on-1 Sessions</h3>
              <p>
                Personalized support in braille, assistive technology, compensatory skills, and more — tailored to your
                pace and goals.
              </p>
              <span className="hub-card-cta">
                Book a session
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/games" className="hub-card reveal">
              <div className="hub-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10,8 16,12 10,16" />
                </svg>
              </div>
              <h3>Interactive Braille Practice</h3>
              <p>Free braille practice with interactive activities — Word Game, Dot Explorer, Hangman, and more.</p>
              <span className="hub-card-cta">
                Start practicing
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
