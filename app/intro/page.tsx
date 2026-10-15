import { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import BrailleHero from '@/components/BrailleHero';
import BrailleAlphabet from '@/components/BrailleAlphabet';
import BrailleNumbers from '@/components/BrailleNumbers';
import BrailleCell from '@/components/BrailleCell';
import { ALL_DOTS, type Cell, getContraction, toCell } from '@/lib/braille/ueb';
import { transcribeTokens } from '@/lib/braille/transcribe';
import { contractedWord } from '@/lib/braille/contracted';
import { describeCell, renderProse } from '@/lib/braille/prose';

export const metadata: Metadata = {
  title: 'Intro to Braille: What Is Braille & How to Read It',
  description:
    'Learn braille from the beginning: what it is, how the 6-dot cell works, the A–Z alphabet, grades of braille, how numbers work, and why braille matters. Free interactive guide from a certified TVI.',
  alternates: { canonical: 'https://teachbraille.org/intro' },
  openGraph: {
    title: 'Intro to Braille: What Is Braille & How to Read It | TeachBraille.org',
    description:
      'A free, beginner-friendly guide to braille: history, the braille cell, interactive A–Z alphabet, grades, numbers, and why braille matters.',
  },
};

/** A few common strong contractions (ICEB 10.3), from lib/braille. */
const CONTRACTIONS = ['and', 'for', 'of', 'the', 'with'].map((t) => getContraction(t, 'strong-contraction'));

/** "the" in uncontracted braille (one cell per letter) and in contracted braille (one cell). */
const THE_UNCONTRACTED = transcribeTokens('the');
const THE_CONTRACTED = contractedWord('the', ['the']);

const LEFT_COLUMN: Cell = toCell([1, 2, 3]);
const RIGHT_COLUMN: Cell = toCell([4, 5, 6]);
const CELL_LAYOUT = `the left column holds ${describeCell(LEFT_COLUMN)} (top to bottom) and the right column holds ${describeCell(RIGHT_COLUMN)}`;

function cellCount(n: number): string {
  return `${n} ${n === 1 ? 'cell' : 'cells'}`;
}

function IntroCell({ cell, label, ariaName }: { cell: Cell; label: string; ariaName: string }) {
  return (
    <div className="intro-bcell">
      <BrailleCell
        cell={cell}
        className="intro-bcell-dots"
        dotClassName="intro-bcell-dot"
        raisedClassName="raised"
        flatClassName=""
        label={ariaName}
      />
      <span className="intro-bcell-lbl" aria-hidden="true">
        {label}
      </span>
    </div>
  );
}

const introJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Intro to Braille: What Is Braille & How to Read It',
      description:
        'A beginner-friendly introduction to braille: history, the braille cell, grades of braille, numbers, and an interactive A–Z alphabet.',
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
            text: 'Braille is a tactile writing system used by people who are blind or visually impaired. It was developed by Louis Braille in the 1820s. Each character is formed within a cell of 6 dot positions arranged in 3 rows and 2 columns, giving 64 possible patterns (counting the blank cell), used for letters, numbers, punctuation, and music notation.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the braille cell work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Every braille character lives inside a cell of six dot positions: ${CELL_LAYOUT}. Different combinations of raised dots form each letter, number, or symbol.`,
          },
        },
        {
          '@type': 'Question',
          name: 'What are the grades of braille?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Unified English Braille is written in two grades: Grade 1 (uncontracted) spells out every word letter by letter, while Grade 2 (contracted) also uses contractions and shortforms (the UEB rulebook lists 180 of them) to save space and speed up reading. Most braille books for adult readers are in Grade 2.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do numbers work in braille?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: renderProse(
              'Braille uses the {name:numeric} ({dots:numeric}) before a number. The digits 1 through 9 use the same cells as the letters a through i, and 0 uses the cell for j.',
            ),
          },
        },
        {
          '@type': 'Question',
          name: 'Why does braille matter?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Braille is essential for literacy and independence. About 43 million people worldwide were blind in 2020, and braille gives them direct access to reading and writing. Since 2019 the United Nations has marked January 4, Louis Braille’s birthday, as World Braille Day.',
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
              <strong>Louis Braille</strong>, who devised it as a teenager (he was 15 in 1824) while studying at the
              Royal Institute for Blind Youth in Paris. An accident in his father&apos;s workshop when he was 3 led to
              his blindness by about age 5.
            </p>
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">15</span>
              <span className="intro-stat-label">Years Old</span>
              <span className="intro-stat-detail">
                Louis Braille&apos;s age in 1824, when he devised his dot system
              </span>
            </div>
          </div>

          <div className="intro-history-highlight reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p>
              <strong>1820s:</strong> Louis adapted Charles Barbier&apos;s &ldquo;night writing,&rdquo; a raised-dot
              code devised for the French army, into the 6-dot code that is still the basis of braille today.
            </p>
          </div>

          <div className="intro-history-grid intro-history-grid--reversed reveal">
            <p className="intro-history-text">
              Each braille character is formed within a <strong>cell of 6 dot positions</strong> arranged in 3 rows and
              2 columns, giving <strong>64 possible patterns</strong> including the blank cell. This compact system can
              represent letters, numbers, punctuation, and even music notation.
            </p>
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">64</span>
              <span className="intro-stat-label">Combinations</span>
              <span className="intro-stat-detail">Possible patterns from a single 6-dot cell</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== THE BRAILLE CELL ========== */}
      <section className="intro-cell" aria-labelledby="intro-cell-heading">
        <div className="intro-cell-inner reveal">
          <h2 id="intro-cell-heading">The Braille Cell</h2>
          <p className="intro-history-text">
            Every braille character lives inside a cell of six dot positions: {CELL_LAYOUT}. Different combinations of
            raised dots form each letter, number, or symbol.
          </p>
          <div className="intro-cell-diagram" role="img" aria-label={`Braille cell diagram: ${CELL_LAYOUT}.`}>
            <BrailleCell
              cell={ALL_DOTS}
              showNumbers
              className="intro-cell-grid"
              dotClassName="intro-cell-dot"
              raisedClassName="on"
            />
          </div>
        </div>
      </section>

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
            Braille is far more than a code. It&rsquo;s a gateway to literacy, independence, and opportunity for
            millions of people around the world.
          </p>

          <div className="intro-impact-stats reveal">
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">43M</span>
              <span className="intro-stat-label">Blind People</span>
              <span className="intro-stat-detail">
                worldwide in 2020, with about 295&nbsp;million more living with moderate or severe vision impairment
              </span>
            </div>
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">2016</span>
              <span className="intro-stat-label">One English Code</span>
              <span className="intro-stat-detail">
                by 2016, every member country of the International Council on English Braille had adopted Unified
                English Braille
              </span>
            </div>
            <div className="intro-history-stat-card">
              <span className="intro-stat-number">Jan 4</span>
              <span className="intro-stat-label">World Braille Day</span>
              <span className="intro-stat-detail">
                Louis Braille&apos;s birthday, marked by the United Nations since 2019
              </span>
            </div>
          </div>

          <div className="intro-history-highlight reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <p>
              <strong>Braille is literacy.</strong> From reading medication labels and elevator buttons to using
              refreshable braille displays with computers and smartphones, braille remains essential for daily
              independence and professional success.
            </p>
          </div>
        </div>
      </section>

      {/* ========== GRADES OF BRAILLE ========== */}
      <section className="intro-grades" aria-labelledby="intro-grades-heading">
        <div className="intro-grades-inner">
          <h2 id="intro-grades-heading">Grades of Braille</h2>
          <p className="intro-history-text">
            There are two main grades of braille. <strong>Grade&nbsp;1</strong> spells out every word letter by letter,
            just like the alphabet you explored above. <strong>Grade&nbsp;2</strong> also uses contractions and
            shortforms to save space and speed up reading.
          </p>

          <div className="intro-grades-compare reveal">
            <div className="intro-grades-card intro-grades-card--g1">
              <h3>Grade 1</h3>
              <p>Uncontracted: letter for letter</p>
              <div className="intro-grades-cells">
                {THE_UNCONTRACTED.map((t) => (
                  <IntroCell key={t.print} cell={t.cells[0]} label={t.print} ariaName={t.name} />
                ))}
              </div>
              <div className="intro-grades-card-count">{cellCount(THE_UNCONTRACTED.length)}</div>
            </div>
            <div className="intro-grades-card intro-grades-card--g2">
              <h3>Grade 2</h3>
              <p>Contracted: one cell for the whole word</p>
              <div className="intro-grades-cells">
                <IntroCell cell={THE_CONTRACTED.cells[0]} label="the" ariaName="the word “the” in contracted braille" />
              </div>
              <div className="intro-grades-card-count">{cellCount(THE_CONTRACTED.cells.length)}</div>
            </div>
          </div>

          <p className="intro-history-text">
            Grade&nbsp;2 is used for most braille books for adult readers. The UEB rulebook lists{' '}
            <strong>180 contractions and shortforms</strong> that experienced readers recognize instantly. Here are a
            few common ones:
          </p>

          <div className="intro-grades-examples reveal">
            {CONTRACTIONS.map((c) => (
              <div key={c.text} className="intro-grades-example">
                <BrailleCell
                  cell={c.cells[0]}
                  className="intro-bcell-dots"
                  dotClassName="intro-bcell-dot"
                  raisedClassName="raised"
                  flatClassName=""
                  label={`the word “${c.text}”`}
                />
                <span className="intro-grades-example-word" style={{ textTransform: 'none' }} aria-hidden="true">
                  {c.text}
                </span>
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
            Braille reuses the cells of the letters a&ndash;j for the digits 1&ndash;9 and 0. The{' '}
            <strong>numeric indicator</strong> ({renderProse('{dots:numeric}')}) tells the reader that the cells that
            follow are digits, not letters. Tap any number below to see how it works.
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
              <p>Free interactive activities: Word Game, Dot Explorer, Hangman, and more. No account needed.</p>
              <span className="intro-cta-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>

            <Link href="/learn" className="intro-cta-card">
              <div className="intro-cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3>Take the Free Course</h3>
              <p>
                A free, self-paced course from the braille cell to Grade&nbsp;2 contractions. Write every character
                yourself. No account needed.
              </p>
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
