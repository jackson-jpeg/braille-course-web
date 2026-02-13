import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import BrailleHero from '@/components/BrailleHero';
import BrailleAlphabet from '@/components/BrailleAlphabet';
import BrailleNumbers from '@/components/BrailleNumbers';
import { brailleMap } from '@/lib/braille-map';

export const metadata: Metadata = {
  title: 'Intro to Braille — What Is Braille & How to Read It',
  description:
    'Learn braille from the beginning: what it is, how the 6-dot cell works, the A–Z alphabet, grades of braille, how numbers work, and why braille matters. Free interactive guide from a certified TVI.',
  alternates: { canonical: 'https://teachbraille.org/intro' },
  openGraph: {
    title: 'Intro to Braille — What Is Braille & How to Read It | TeachBraille.org',
    description:
      'A free, beginner-friendly guide to braille — history, the braille cell, interactive A–Z alphabet, grades, numbers, and why braille matters.',
  },
};

const CONTRACTIONS: { word: string; pattern: number[] }[] = [
  { word: 'AND', pattern: [1, 1, 1, 0, 1, 1] },
  { word: 'FOR', pattern: [1, 1, 1, 1, 1, 1] },
  { word: 'OF', pattern: [1, 0, 1, 1, 1, 1] },
  { word: 'THE', pattern: [0, 1, 1, 0, 1, 1] },
  { word: 'WITH', pattern: [0, 1, 1, 1, 1, 1] },
];

function BrailleCell({ pattern, label }: { pattern: number[]; label: string }) {
  return (
    <div className="intro-bcell">
      <div className="intro-bcell-dots" aria-hidden="true">
        {pattern.map((f, i) => (
          <span key={i} className={`intro-bcell-dot${f ? ' raised' : ''}`} />
        ))}
      </div>
      <span className="intro-bcell-lbl">{label}</span>
    </div>
  );
}

const introJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Intro to Braille — What Is Braille & How to Read It',
      description:
        'A beginner-friendly introduction to braille — history, the braille cell, grades of braille, numbers, and an interactive A–Z alphabet.',
      author: {
        '@type': 'Person',
        name: 'Delaney Costello',
        jobTitle: 'Teacher of the Visually Impaired',
      },
      url: 'https://teachbraille.org/intro',
      mainEntityOfPage: 'https://teachbraille.org/intro',
      about: { '@type': 'Thing', name: 'Braille' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is braille?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Braille is a tactile writing system used by people who are blind or visually impaired. Created by Louis Braille in 1824, each character is formed within a cell of 6 dots arranged in a 3-row, 2-column matrix, giving 64 possible combinations including letters, numbers, punctuation, and music notation.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the braille cell work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Every braille character lives inside a cell of six dot positions. The left column holds dots 1, 2, 3 (top to bottom) and the right column holds dots 4, 5, 6. Different combinations of raised dots form each letter, number, or symbol.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are the grades of braille?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'There are two main grades: Grade 1 (uncontracted) spells out every word letter by letter, while Grade 2 (contracted) uses over 180 abbreviations and contractions to save space and increase reading speed. Grade 2 is the standard for published braille materials.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do numbers work in braille?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Braille uses a number indicator (dots 3, 4, 5, 6) placed before letter patterns to represent numbers. Numbers 1 through 9 reuse the same dot patterns as letters A through I, and 0 uses the pattern for J.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why does braille matter?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Braille is essential for literacy and independence. Over 39 million blind people worldwide rely on braille. Research shows that 90% of braille-literate adults are employed, compared to roughly 30% of non-readers. Braille has been adapted for 133 languages worldwide.',
          },
        },
      ],
    },
  ],
};

export default function IntroPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(introJsonLd) }} />

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
        </div>
      </section>

      {/* ========== HISTORY / WHAT IS BRAILLE ========== */}
      <section className="intro-history" aria-labelledby="intro-history-heading">
        <div className="intro-history-inner">
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

      {/* ========== WHY BRAILLE MATTERS ========== */}
      <section className="intro-impact" aria-labelledby="intro-impact-heading">
        <div className="intro-impact-inner">
          <h2 id="intro-impact-heading">Why Braille Matters</h2>
          <p className="intro-history-text">
            Braille is far more than a code &mdash; it&rsquo;s a gateway to literacy, independence, and opportunity for
            millions of people around the world.
          </p>

          <div className="intro-impact-stats reveal">
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">39M+</span>
              <span className="intro-stat-label">Blind People</span>
              <span className="intro-stat-detail">
                worldwide, with over 250&nbsp;million experiencing vision impairment
              </span>
            </div>
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">90%</span>
              <span className="intro-stat-label">Employment</span>
              <span className="intro-stat-detail">
                of braille-literate adults are employed, compared to roughly 30% of non-readers
              </span>
            </div>
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">133</span>
              <span className="intro-stat-label">Languages</span>
              <span className="intro-stat-detail">have braille codes adapted for their writing system</span>
            </div>
          </div>

          <div className="intro-history-highlight reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p>
              <strong>&ldquo;Braille is knowledge, and knowledge is power.&rdquo;</strong> &mdash; Louis Braille. From
              reading medication labels and elevator buttons to using refreshable braille displays with computers and
              smartphones &mdash; braille remains essential for daily independence and professional success.
            </p>
          </div>
        </div>
      </section>

      {/* ========== GRADES OF BRAILLE ========== */}
      <section className="intro-grades" aria-labelledby="intro-grades-heading">
        <div className="intro-grades-inner">
          <h2 id="intro-grades-heading">Grades of Braille</h2>
          <p className="intro-history-text">
            There are two main grades of braille. <strong>Grade&nbsp;1</strong> spells out every word letter by letter
            &mdash; just like the alphabet you explored above. <strong>Grade&nbsp;2</strong> uses contractions and
            abbreviations to save space and speed up reading.
          </p>

          <div className="intro-grades-compare reveal">
            <div className="intro-grades-card intro-grades-card--g1">
              <h3>Grade 1</h3>
              <p>Uncontracted &mdash; letter for letter</p>
              <div className="intro-grades-cells">
                <BrailleCell pattern={brailleMap['T']} label="T" />
                <BrailleCell pattern={brailleMap['H']} label="H" />
                <BrailleCell pattern={brailleMap['E']} label="E" />
              </div>
              <div className="intro-grades-card-count">3 cells</div>
            </div>
            <div className="intro-grades-card intro-grades-card--g2">
              <h3>Grade 2</h3>
              <p>Contracted &mdash; one cell for the whole word</p>
              <div className="intro-grades-cells">
                <BrailleCell pattern={[0, 1, 1, 0, 1, 1]} label="THE" />
              </div>
              <div className="intro-grades-card-count">1 cell</div>
            </div>
          </div>

          <p className="intro-history-text">
            Grade&nbsp;2 is the standard for published braille. It includes <strong>180+ contractions</strong> that
            experienced readers recognize instantly. Here are a few common ones:
          </p>

          <div className="intro-grades-examples reveal">
            {CONTRACTIONS.map((c) => (
              <div key={c.word} className="intro-grades-example">
                <div className="intro-bcell-dots" aria-hidden="true">
                  {c.pattern.map((f, i) => (
                    <span key={i} className={`intro-bcell-dot${f ? ' raised' : ''}`} />
                  ))}
                </div>
                <span className="intro-grades-example-word">{c.word}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NUMBERS IN BRAILLE ========== */}
      <section className="intro-numbers" aria-labelledby="intro-numbers-heading">
        <div className="intro-numbers-inner">
          <h2 id="intro-numbers-heading">Numbers in Braille</h2>
          <p className="intro-history-text">
            Braille cleverly reuses letter patterns for numbers. A special <strong>number indicator</strong> tells the
            reader that the following characters are digits, not letters. Tap any number below to see how it works.
          </p>
          <BrailleNumbers />
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
