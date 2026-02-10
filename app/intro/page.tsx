import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import BrailleHero from '@/components/BrailleHero';
import BrailleAlphabet from '@/components/BrailleAlphabet';

export const metadata: Metadata = {
  title: 'Intro to Braille — TeachBraille.org',
  description:
    'Learn what braille is, explore its history, and discover the full A–Z alphabet with an interactive dot explorer.',
  openGraph: {
    title: 'Intro to Braille — TeachBraille.org',
    description:
      'A beginner-friendly introduction to braille — history, the braille cell, and an interactive A–Z alphabet.',
  },
};

export default function IntroPage() {
  return (
    <>
      {/* ========== HERO ========== */}
      <section className="intro-hero" id="top">
        <div className="intro-hero-content">
          <BrailleHero word="INTRO TO BRAILLE" />
          <div className="section-label">Learn the Basics</div>
          <h1>
            Intro to <em>Braille</em>
          </h1>
          <p className="intro-hero-sub">
            Braille is a tactile reading system that opens doors to literacy for millions. In 5&nbsp;minutes,
            you&rsquo;ll understand the history, explore the 6-dot cell, and interact with the full A&ndash;Z alphabet.
          </p>
          <div className="scroll-hint">
            <span>Scroll to explore</span>
            <div className="scroll-line" />
          </div>
        </div>
      </section>

      {/* ========== HISTORY / WHAT IS BRAILLE ========== */}
      <section className="intro-history" aria-labelledby="intro-history-heading">
        <div className="intro-history-inner">
          <div className="section-label">Background</div>
          <h2 id="intro-history-heading">What Is Braille?</h2>

          <div className="intro-history-grid reveal">
            <p className="intro-history-text">
              Braille is a tactile writing system used by people who are blind or visually impaired. It was created by{' '}
              <strong>Louis Braille in 1824</strong> when he was just 15 years old, while studying at the Royal
              Institute for Blind Youth in Paris. Louis lost his sight at age 3 after an accident in his father&apos;s
              workshop.
            </p>
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">15</span>
              <span className="intro-stat-label">Years Old</span>
              <span className="intro-stat-detail">Louis Braille&apos;s age when he invented the system</span>
            </div>
          </div>

          <div className="intro-history-highlight reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p>
              <strong>1824:</strong> Louis adapted Charles Barbier&apos;s military &ldquo;night writing&rdquo; system
              into the elegant 6-dot code we know today.
            </p>
          </div>

          <div className="intro-history-grid intro-history-grid--reversed reveal">
            <p className="intro-history-text">
              Each braille character is formed within a <strong>cell of 6 dots</strong> arranged in a 3-row, 2-column
              matrix &mdash; giving <strong>64 possible combinations</strong> including the blank cell. This compact
              system can represent letters, numbers, punctuation, and even music notation.
            </p>
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">64</span>
              <span className="intro-stat-label">Combinations</span>
              <span className="intro-stat-detail">Possible patterns from a single 6-dot cell</span>
            </div>
          </div>
        </div>
      </section>

      <div className="divider-dots" aria-hidden="true">
        <span className="divider-dot" />
        <span className="divider-dot" />
        <span className="divider-dot" />
      </div>

      {/* ========== THE BRAILLE CELL ========== */}
      <section className="intro-cell" aria-labelledby="intro-cell-heading">
        <div className="intro-cell-inner reveal">
          <div className="section-label">Structure</div>
          <h2 id="intro-cell-heading">The Braille Cell</h2>
          <p className="intro-history-text">
            Every braille character lives inside a cell of six dot positions. The left column holds dots{' '}
            <strong>1, 2, 3</strong> (top to bottom) and the right column holds dots <strong>4, 5, 6</strong>. Different
            combinations of raised dots form each letter, number, or symbol.
          </p>
          <div
            className="intro-cell-diagram"
            role="img"
            aria-label="Braille cell diagram showing dot positions: dot 1 top-left, dot 4 top-right, dot 2 middle-left, dot 5 middle-right, dot 3 bottom-left, dot 6 bottom-right"
          >
            <div className="intro-cell-grid">
              {[1, 4, 2, 5, 3, 6].map((num, idx) => (
                <span key={num} className="intro-cell-dot" style={{ animationDelay: `${idx * 0.1}s` }}>
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="divider-dots" aria-hidden="true">
        <span className="divider-dot" />
        <span className="divider-dot" />
        <span className="divider-dot" />
      </div>

      {/* ========== INTERACTIVE ALPHABET ========== */}
      <section className="intro-alphabet" aria-labelledby="intro-alpha-heading">
        <div className="intro-alphabet-inner reveal">
          <div className="section-label">Explore</div>
          <h2 id="intro-alpha-heading">The A–Z Alphabet</h2>
          <p className="intro-history-text">Tap any letter to see its braille dot pattern up close.</p>
          <BrailleAlphabet />
        </div>
      </section>

      {/* ========== NEXT STEPS CTA ========== */}
      <section className="intro-next-steps">
        <div className="intro-next-steps-inner">
          <div className="section-label" style={{ color: 'rgba(240,222,180,0.7)' }}>
            What&rsquo;s Next?
          </div>
          <h2 className="intro-next-steps-heading">Keep Going</h2>
          <div className="intro-cta-grid reveal">
            <Link href="/games" className="intro-cta-card">
              <div className="intro-cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10,8 16,12 10,16" />
                </svg>
              </div>
              <h3>Practice with Games</h3>
              <p>Free interactive activities &mdash; Word Game, Dot Explorer, Hangman, and more. No account needed.</p>
              <span className="intro-cta-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/summer" className="intro-cta-card">
              <div className="intro-cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3>Take the Course</h3>
              <p>8-week remote braille course, Summer 2026. Live instruction with personalized feedback.</p>
              <span className="intro-cta-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
