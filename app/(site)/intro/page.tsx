import type { Metadata } from 'next';
import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import ButtonCell from '@/components/ui/ButtonCell';
import PrintButton from '@/components/pages/PrintButton';
import {
  ALPHABET,
  CONTRACTIONS,
  DIGIT_LETTER,
  INDICATORS,
  LETTERS,
  describe,
  describeCells,
  transcribe,
} from '@/lib/ueb';
import { gameHref, getGame } from '@/lib/games/registry';
import '@/styles/pages/intro.css';

export const metadata: Metadata = {
  title: "Braille Alphabet Chart & Beginner's Guide (UEB)",
  description:
    'A printable braille alphabet chart with every letter A–Z, numbers 0–9, the capital sign and the first whole-word contractions in Unified English Braille (UEB), plus a short guide to what braille is and how the six-dot cell works. From a Teacher of the Visually Impaired.',
  alternates: { canonical: 'https://teachbraille.org/intro' },
  openGraph: {
    title: "Braille Alphabet Chart & Beginner's Guide (UEB) | TeachBraille.org",
    description:
      'Every braille letter A–Z, numbers, capitals and first contractions on one printable page, with a beginner-friendly guide to the braille cell.',
    url: 'https://teachbraille.org/intro',
  },
};

/* ── Data: every cell comes from lib/ueb.ts ─────────────────────────────── */

const LETTER_GROUPS = [
  {
    id: 'letters-a-j',
    title: 'a to j',
    rule: 'Only the top four dots (1, 2, 4 and 5). Learn these ten and the rest of the alphabet follows a pattern.',
    letters: ALPHABET.slice(0, 10),
    lesson: '/learn/letters-a-j',
    lessonLabel: 'Lesson: letters a to j',
  },
  {
    id: 'letters-k-t',
    title: 'k to t',
    rule: 'Exactly a to j again, with dot 3 added in the bottom-left corner. k is a plus dot 3; t is j plus dot 3.',
    letters: ALPHABET.slice(10, 20),
    lesson: '/learn/letters-k-t',
    lessonLabel: 'Lesson: letters k to t',
  },
  {
    id: 'letters-u-z',
    title: 'u to z',
    rule: 'u, v, x, y and z are a to e with both bottom dots added (3 and 6). w is the odd one out: it was not used in French when Louis Braille designed his code, so it was added later. Think of it as j plus dot 6.',
    letters: ALPHABET.slice(20),
    lesson: '/learn/letters-u-z',
    lessonLabel: 'Lesson: letters u to z',
  },
] as const;

/** Digits in braille order (1–9, then 0), matching letters a–j. */
const DIGIT_ORDER = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const STRONG_CONTRACTIONS = CONTRACTIONS.filter((c) => c.kind === 'strong-contraction');
const THE = STRONG_CONTRACTIONS.find((c) => c.text === 'the')!;

const NUMBER_SIGN = INDICATORS.numeric.cells[0];
const CAPITAL_SIGN = INDICATORS.capital.cells[0];

/** The six positions, in the reading order of a 2-column grid. */
const CELL_KEY = [1, 4, 2, 5, 3, 6];

const PRACTICE = [
  { id: 'letter-race', params: { set: 'a-z' }, blurb: 'Race through the whole alphabet against the clock.' },
  { id: 'dot-builder', blurb: 'Build each letter yourself, dot by dot.' },
  { id: 'word-decoder', params: { level: 'numbers' }, blurb: 'Read real words, numbers and names.' },
  { id: 'contraction-trainer', params: { deck: 'first' }, blurb: 'Learn and, for, of, the and with.' },
] as const;

const introJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: "Braille Alphabet Chart & Beginner's Guide (UEB)",
      description:
        'A printable Unified English Braille reference: the A–Z alphabet, numbers, capitals and the five strong contractions, with a beginner-friendly introduction to the braille cell and its history.',
      author: {
        '@type': 'Person',
        name: 'Delaney Costello',
        jobTitle: 'Teacher of the Visually Impaired',
      },
      url: 'https://teachbraille.org/intro',
      mainEntityOfPage: 'https://teachbraille.org/intro',
      about: { '@type': 'Thing', name: 'Braille' },
      inLanguage: 'en',
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
            text: 'Braille uses a number sign (dots 3, 4, 5, 6) placed before letter patterns to represent numbers. Numbers 1 through 9 reuse the same dot patterns as letters A through I, and 0 uses the pattern for J.',
          },
        },
        {
          '@type': 'Question',
          name: 'How are capital letters written in braille?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Braille has no separate capital shapes. A capital sign (dot 6) goes in front of a letter to make it a capital. Two capital signs make the whole word capitals.',
          },
        },
        {
          '@type': 'Question',
          name: 'Why does braille matter?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Braille gives people who are blind or have low vision direct access to reading and writing, from books and labels to math, music and computer code. It has been adapted for many languages around the world.',
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

      {/* ── Hero ── */}
      <section className="page-hero lattice intro-hero" aria-labelledby="intro-title">
        <div className="wrap page-hero-grid">
          <div>
            <Eyebrow>Alphabet guide</Eyebrow>
            <h1 id="intro-title">The braille alphabet, on one page</h1>
            <p className="lead">
              Every letter from a to z, the numbers, capitals and your first shortcuts, in Unified English Braille
              (UEB). Keep it open beside the <Link href="/learn">free lessons</Link>, or print it for the fridge.
            </p>
            <div className="cluster mt-5 intro-noprint">
              <a href="#chart" className="btn btn--lg">
                <ButtonCell letter="a" />
                See the chart
              </a>
              <PrintButton />
            </div>
          </div>

          <figure className="tile intro-key" aria-labelledby="intro-key-caption">
            <div
              className="intro-key-grid"
              role="img"
              aria-label="The braille cell: two columns of three dots. Dots 1, 2 and 3 run down the left; dots 4, 5 and 6 run down the right."
            >
              {CELL_KEY.map((n) => (
                <span key={n} className="intro-key-dot">
                  {n}
                </span>
              ))}
            </div>
            <figcaption id="intro-key-caption" className="intro-key-caption">
              <strong>The cell.</strong> Six dot positions: 1&nbsp;2&nbsp;3 down the left, 4&nbsp;5&nbsp;6 down the
              right.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── On this page ── */}
      <nav className="intro-toc intro-noprint" aria-label="On this page">
        <div className="wrap">
          <ul className="cluster">
            <li>
              <a href="#chart">Letters a–z</a>
            </li>
            <li>
              <a href="#numbers">Numbers</a>
            </li>
            <li>
              <a href="#capitals">Capitals</a>
            </li>
            <li>
              <a href="#contractions">Contractions</a>
            </li>
            <li>
              <a href="#what-is-braille">What is braille?</a>
            </li>
            <li>
              <a href="#practice">Practise</a>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── A–Z chart ── */}
      <section id="chart" className="section-tight intro-chart" aria-labelledby="chart-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Chart</Eyebrow>
            <h2 id="chart-heading">Braille alphabet chart, a to z</h2>
            <p className="measure muted">
              Each tile shows the raised dots for one letter. Braille has no separate capital shapes; a capital sign
              goes in front instead (see <a href="#capitals">capitals</a>).
            </p>
          </div>

          {LETTER_GROUPS.map((group) => (
            <div key={group.id} className="intro-group">
              <div className="intro-group-head">
                <h3 id={`${group.id}-heading`}>Letters {group.title}</h3>
                <p>{group.rule}</p>
                <Link href={group.lesson} className="link-arrow intro-noprint">
                  {group.lessonLabel}
                </Link>
              </div>
              <ul className="intro-tiles" role="list">
                {group.letters.map((l) => (
                  <li key={l} className="intro-tile">
                    <Cell dots={LETTERS[l]} size="lg" label={l} />
                    <span className="intro-tile-print" aria-hidden="true">
                      {l.toUpperCase()}
                      <span className="intro-tile-lower">{l}</span>
                    </span>
                    <span className="intro-tile-dots" aria-hidden="true">
                      {describe(LETTERS[l])}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Numbers ── */}
      <section id="numbers" className="section-tight band-sunk intro-signs" aria-labelledby="numbers-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Numbers</Eyebrow>
            <h2 id="numbers-heading">Numbers 0 to 9</h2>
            <p className="measure muted">
              Braille borrows the first ten letters for digits. A <strong>number sign</strong> (dots 3, 4, 5 and 6) says
              &ldquo;the next cells are numbers&rdquo;: then a means 1, b means 2, and j means 0. One number sign covers
              a whole number, so 25 is the number sign, b, e.
            </p>
          </div>

          <div className="intro-sign-row">
            <div className="intro-tile intro-tile--sign">
              <Cell dots={NUMBER_SIGN} size="lg" tone="pine" label="Number sign" />
              <span className="intro-tile-name" aria-hidden="true">
                Number sign
              </span>
              <span className="intro-tile-dots" aria-hidden="true">
                {describe(NUMBER_SIGN)}
              </span>
            </div>
            <ul className="intro-tiles intro-tiles--digits" role="list">
              {DIGIT_ORDER.map((d) => {
                const cells = transcribe(d).map((c) => c.dots);
                return (
                  <li key={d} className="intro-tile">
                    <BrailleText cells={cells} size="md" label={`Number ${d}: ${describeCells(cells)}`} />
                    <span className="intro-tile-print" aria-hidden="true">
                      {d}
                    </span>
                    <span className="intro-tile-dots" aria-hidden="true">
                      like {DIGIT_LETTER[d]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="intro-more intro-noprint">
            <Link href="/learn/numbers" className="link-arrow">
              Lesson: numbers
            </Link>
            <Link href={gameHref('number-sense')} className="link-arrow">
              Play Number Sense
            </Link>
          </p>
        </div>
      </section>

      {/* ── Capitals ── */}
      <section id="capitals" className="section-tight intro-signs" aria-labelledby="capitals-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Capitals</Eyebrow>
            <h2 id="capitals-heading">Capital letters</h2>
            <p className="measure muted">
              One small dot does the job. The <strong>capital sign</strong> (dot 6) goes in front of a letter to make it
              a capital. Two capital signs make the whole word capitals.
            </p>
          </div>

          <ul className="intro-tiles intro-tiles--wide" role="list">
            <li className="intro-tile intro-tile--sign">
              <Cell dots={CAPITAL_SIGN} size="lg" tone="pine" label="Capital sign" />
              <span className="intro-tile-name" aria-hidden="true">
                Capital sign
              </span>
              <span className="intro-tile-dots" aria-hidden="true">
                {describe(CAPITAL_SIGN)}
              </span>
            </li>
            <li className="intro-tile intro-tile--sign">
              <BrailleText
                cells={[...INDICATORS.capitalWord.cells]}
                size="lg"
                tone="pine"
                label={`Whole word in capitals: ${describeCells(INDICATORS.capitalWord.cells)}`}
              />
              <span className="intro-tile-name" aria-hidden="true">
                Whole word in capitals
              </span>
              <span className="intro-tile-dots" aria-hidden="true">
                dot 6, twice
              </span>
            </li>
            <li className="intro-tile intro-tile--example">
              <BrailleText text="Mom" size="md" label="Mom: capital sign, then m, o, m" />
              <span className="intro-tile-print" aria-hidden="true">
                Mom
              </span>
              <span className="intro-tile-dots" aria-hidden="true">
                capital sign, m, o, m
              </span>
            </li>
            <li className="intro-tile intro-tile--example">
              <BrailleText text="USA" size="md" label="USA: two capital signs, then u, s, a" />
              <span className="intro-tile-print" aria-hidden="true">
                USA
              </span>
              <span className="intro-tile-dots" aria-hidden="true">
                two capital signs, u, s, a
              </span>
            </li>
          </ul>

          <p className="intro-more intro-noprint">
            <Link href="/learn/capitals" className="link-arrow">
              Lesson: capital letters
            </Link>
            <Link href="/learn/punctuation" className="link-arrow">
              Lesson: punctuation
            </Link>
          </p>
        </div>
      </section>

      {/* ── Contractions ── */}
      <section id="contractions" className="section-tight band-sunk intro-signs" aria-labelledby="contractions-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Shortcuts</Eyebrow>
            <h2 id="contractions-heading">Five words with cells of their own</h2>
            <p className="measure muted">
              Contractions are braille&rsquo;s shortcuts. Most books, menus and signs use them. Five very common words
              get a cell that is not a letter at all. They can stand alone as whole words or appear inside longer words.
            </p>
          </div>

          <ul className="intro-tiles intro-tiles--wide" role="list">
            {STRONG_CONTRACTIONS.map((c) => (
              <li key={c.text} className="intro-tile">
                <Cell dots={c.dots} size="lg" label={`${c.text}`} />
                <span className="intro-tile-print intro-tile-print--word" aria-hidden="true">
                  {c.text}
                </span>
                <span className="intro-tile-dots" aria-hidden="true">
                  {describe(c.dots)}
                </span>
              </li>
            ))}
          </ul>

          <div className="intro-grades">
            <div className="tile intro-grade">
              <h3>Grade 1: letter for letter</h3>
              <BrailleText
                text="the"
                size="md"
                label={`the, spelled out: ${describeCells(transcribe('the').map((c) => c.dots))}`}
              />
              <p>t, h, e: three cells</p>
            </div>
            <div className="tile intro-grade">
              <h3>Grade 2: contracted</h3>
              <Cell dots={THE.dots} size="md" label="the, as one contraction" />
              <p>&ldquo;the&rdquo;: one cell</p>
            </div>
          </div>
          <p className="measure muted mt-5">
            Grade 2 is the standard for published braille. It includes <strong>180+ contractions</strong> that
            experienced readers recognize instantly, so learning a few early pays off.
          </p>

          <p className="intro-more intro-noprint">
            <Link href="/learn/first-contractions" className="link-arrow">
              Lesson: your first contractions
            </Link>
            <Link href={gameHref('contraction-trainer', { deck: 'first' })} className="link-arrow">
              Contraction Trainer
            </Link>
          </p>
        </div>
      </section>

      {/* ── What is braille ── */}
      <section id="what-is-braille" className="section intro-about intro-noprint" aria-labelledby="about-heading">
        <div className="wrap intro-about-grid">
          <div className="prose">
            <Eyebrow>Guide</Eyebrow>
            <h2 id="about-heading" className="mt-3">
              What is braille?
            </h2>
            <p>
              Braille is a tactile writing system used by people who are blind or visually impaired. Each character is
              formed within a <strong>cell of six dots</strong>, arranged in three rows and two columns. That gives{' '}
              <strong>64 possible combinations</strong>, including the blank cell, enough for letters, numbers,
              punctuation and even music notation.
            </p>
            <h3 id="history">Who invented it?</h3>
            <p>
              <strong>Louis Braille</strong> created the code in <strong>1824</strong>, when he was just 15 years old
              and studying at the Royal Institute for Blind Youth in Paris. He had lost his sight at age 3 after an
              accident in his father&rsquo;s workshop. Louis adapted Charles Barbier&rsquo;s military &ldquo;night
              writing&rdquo; into the six-dot code we still use today, and first published it in 1829.
            </p>
            <h3>Grade 1 and Grade 2</h3>
            <p>
              <strong>Grade 1</strong> (uncontracted) spells out every word letter by letter, like the chart above.{' '}
              <strong>Grade 2</strong> (contracted) uses shortcuts to save space and speed up reading. Since 2016,
              schools in the United States have used Unified English Braille (UEB), the same code used across much of
              the English-speaking world. Every cell on this page is UEB.
            </p>
            <p>
              Want the full, gentle version? The <Link href="/learn/what-is-braille">first lesson</Link> covers all of
              this in about five minutes, and <Link href="/learn/the-braille-cell">lesson two</Link> lets you raise the
              dots yourself.
            </p>
          </div>

          <aside className="intro-facts" aria-labelledby="facts-heading">
            <h3 id="facts-heading" className="sr-only">
              Braille by the numbers
            </h3>
            <ul className="intro-facts-list" role="list">
              <li className="intro-fact">
                <span className="intro-fact-num">15</span>
                <span>Louis Braille&rsquo;s age when he invented the system</span>
              </li>
              <li className="intro-fact">
                <span className="intro-fact-num">64</span>
                <span>possible patterns from a single six-dot cell</span>
              </li>
              <li className="intro-fact">
                <span className="intro-fact-num">133</span>
                <span>languages have braille codes adapted for their writing system</span>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      {/* ── Why it matters ── */}
      <section className="section-tight band-ink lattice intro-noprint" aria-labelledby="matters-heading">
        <div className="wrap intro-matters">
          <div>
            <Eyebrow>Why it matters</Eyebrow>
            <h2 id="matters-heading" className="mt-3">
              A gateway to literacy and independence
            </h2>
            <p className="lead mt-4">
              From medication labels and elevator buttons to refreshable braille displays on phones and computers,
              braille remains essential for daily independence and professional success.
            </p>
          </div>
          <ul className="intro-matters-stats" role="list">
            <li>
              <span className="intro-fact-num">39M+</span>
              <span>blind people worldwide, with over 250&nbsp;million experiencing vision impairment</span>
            </li>
            <li>
              <span className="intro-fact-num">1829</span>
              <span>the year Louis Braille first published his six-dot code</span>
            </li>
          </ul>
          <blockquote className="intro-quote">
            <p>&ldquo;Braille is knowledge, and knowledge is power.&rdquo;</p>
            <footer>Louis Braille</footer>
          </blockquote>
        </div>
      </section>

      {/* ── Practise ── */}
      <section id="practice" className="section intro-noprint" aria-labelledby="practice-heading">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>Keep going</Eyebrow>
            <h2 id="practice-heading">Turn the chart into muscle memory</h2>
            <p className="measure muted">
              Reading a chart is a start. Writing and playing is how it sticks. Everything here is free, with no account
              needed.
            </p>
          </div>
          <ul className="intro-practice" role="list">
            <li>
              <Link href="/learn" className="tile tile-link intro-practice-card intro-practice-card--learn">
                <BrailleText text="learn" size="sm" />
                <span className="intro-practice-title">Free lessons</span>
                <span className="intro-practice-blurb">
                  Twelve short lessons, from the braille cell to first contractions. Write every letter yourself.
                </span>
              </Link>
            </li>
            {PRACTICE.map((p) => {
              const game = getGame(p.id);
              if (!game) return null;
              return (
                <li key={p.id}>
                  <Link
                    href={gameHref(game.id, 'params' in p ? p.params : undefined)}
                    className="tile tile-link intro-practice-card"
                  >
                    <BrailleText text={game.emblem} size="sm" />
                    <span className="intro-practice-title">{game.title}</span>
                    <span className="intro-practice-blurb">{p.blurb}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-5">
            <Link href="/games" className="link-arrow">
              See all the games
            </Link>
          </p>
        </div>
      </section>

      <p className="intro-print-footer" aria-hidden="true">
        Braille alphabet chart (UEB) from TeachBraille.org/intro
      </p>
    </>
  );
}
