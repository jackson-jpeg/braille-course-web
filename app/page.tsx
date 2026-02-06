import BrailleHero from '@/components/BrailleHero';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function HubPage() {
  return (
    <>
      {/* ========== HUB HERO ========== */}
      <section className="hub-hero" id="top">
        <div className="hub-hero-content" id="main-content">
          <BrailleHero />

          <h1>
            Learn <em>Braille</em> with
            <br />
            Delaney Costello
          </h1>

          <p className="hub-hero-subtitle">
            Teacher of the Visually Impaired
          </p>

          <p className="hub-hero-description">
            Remote braille instruction for parents, loved ones, and anyone who
            wants to connect with the visually impaired community. Summer courses,
            one-on-one sessions, and interactive games to build your skills.
          </p>
        </div>
      </section>

      {/* ========== ABOUT ========== */}
      <section className="hub-about" aria-labelledby="hub-about-heading">
        <div className="hub-about-inner reveal">
          <div className="section-label">About Delaney</div>
          <h2 id="hub-about-heading">Passionate About Teaching Braille</h2>
          <p>
            With <strong>9 years of teaching experience</strong> as a Teacher of
            the Visually Impaired, Delaney Costello brings dedication and expertise
            to every lesson. Whether through a structured summer course,
            personalized one-on-one sessions, or fun interactive games, her goal is
            to make braille accessible and enjoyable for everyone.
          </p>
        </div>
      </section>

      {/* ========== CARD GRID ========== */}
      <section className="hub-cards" aria-labelledby="hub-cards-heading">
        <div className="hub-cards-inner">
          <div className="hub-cards-header reveal">
            <div className="section-label">Explore</div>
            <h2 id="hub-cards-heading">How Would You Like to Learn?</h2>
          </div>

          <div className="hub-cards-grid reveal">
            <Link href="/summer" className="hub-card">
              <div className="hub-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>Summer Course</h3>
              <p>8-week remote course, Summer 2026. Live instruction with personalized feedback.</p>
              <span className="hub-card-cta">
                Learn more
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/appointments" className="hub-card">
              <div className="hub-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                </svg>
              </div>
              <h3>1-on-1 Appointments</h3>
              <p>Personalized braille instruction tailored to your pace and goals.</p>
              <span className="hub-card-cta">
                Book a session
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/games" className="hub-card">
              <div className="hub-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10,8 16,12 10,16" />
                </svg>
              </div>
              <h3>Interactive Practice</h3>
              <p>Practice braille with interactive activities — Word Game, Dot Explorer, Hangman, and more.</p>
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
