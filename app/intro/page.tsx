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
        <div className="intro-hero-content" id="main-content">
          <BrailleHero word="INTRO TO BRAILLE" />
          <div className="section-label">Learn the Basics</div>
          <h1>
            Intro to <em>Braille</em>
          </h1>
          <p className="intro-hero-sub">
            Braille is a tactile writing system that opens the door to literacy
            for millions of people worldwide. Start here to learn how it works.
          </p>
        </div>
      </section>

      {/* ========== HISTORY / WHAT IS BRAILLE ========== */}
      <section className="intro-history" aria-labelledby="intro-history-heading">
        <div className="intro-history-inner reveal">
          <div className="section-label">Background</div>
          <h2 id="intro-history-heading">What Is Braille?</h2>
          <p className="intro-history-text">
            Braille is a tactile writing system used by people who are blind or
            visually impaired. It was created by{' '}
            <strong>Louis Braille in 1824</strong> when he was just 15 years old,
            while studying at the Royal Institute for Blind Youth in Paris. Louis
            lost his sight at age 3 after an accident in his father&apos;s
            workshop, and later adapted Charles Barbier&apos;s military
            &ldquo;night writing&rdquo; system into the elegant 6-dot code we
            know today.
          </p>
          <p className="intro-history-text">
            Each braille character is formed within a <strong>cell of 6
            dots</strong> arranged in a 3-row, 2-column matrix — giving{' '}
            <strong>64 possible combinations</strong> including the blank cell.
            This compact system can represent letters, numbers, punctuation, and
            even music notation. Braille was officially adopted in the United
            States in 1916 and in the United Kingdom in 1932, and today it
            remains the foundation of tactile literacy around the world.
          </p>
        </div>
      </section>

      {/* ========== THE BRAILLE CELL ========== */}
      <section className="intro-cell" aria-labelledby="intro-cell-heading">
        <div className="intro-cell-inner reveal">
          <h2 id="intro-cell-heading">The Braille Cell</h2>
          <p className="intro-history-text">
            Every braille character lives inside a cell of six dot positions.
            The left column holds dots <strong>1, 2, 3</strong> (top to bottom)
            and the right column holds dots <strong>4, 5, 6</strong>. Different
            combinations of raised dots form each letter, number, or symbol.
          </p>
          <div
            className="intro-cell-diagram"
            role="img"
            aria-label="Braille cell diagram showing dot positions: dot 1 top-left, dot 4 top-right, dot 2 middle-left, dot 5 middle-right, dot 3 bottom-left, dot 6 bottom-right"
          >
            <div className="intro-cell-grid">
              {[1, 4, 2, 5, 3, 6].map((num) => (
                <span key={num} className="intro-cell-dot">{num}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== INTERACTIVE ALPHABET ========== */}
      <section className="intro-alphabet" aria-labelledby="intro-alpha-heading">
        <div className="intro-alphabet-inner reveal">
          <div className="section-label">Explore</div>
          <h2 id="intro-alpha-heading">The A–Z Alphabet</h2>
          <p className="intro-history-text">
            Tap any letter to see its braille dot pattern up close.
          </p>
          <BrailleAlphabet />
        </div>
      </section>

      {/* ========== CROSS-LINKS ========== */}
      <section className="intro-crosslinks">
        <div className="intro-crosslinks-inner reveal">
          <p>
            Ready to practice?{' '}
            <Link href="/games">Try the Interactive Games &rarr;</Link>
          </p>
          <p>
            Want structured lessons?{' '}
            <Link href="/summer">View the Summer Braille Course &rarr;</Link>
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
