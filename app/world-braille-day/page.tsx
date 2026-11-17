import type { Metadata } from 'next';
import Link from 'next/link';
import BrailleHero from '@/components/BrailleHero';
import Footer from '@/components/Footer';
import NameInBraille from '@/components/NameInBraille';
import { APP_STORE_URL, CLASSROOM_PATHS, resolveStep } from '@/lib/world-braille-day';

/*
 * Not yet in app/sitemap.ts or linked from the home page: both wait for go-live (Jackson's OK).
 * The "What the day is" paragraph is a draft that Delaney may rewrite.
 */

export const metadata: Metadata = {
  title: 'World Braille Day Activities for Braille Literacy Month',
  description:
    'Free World Braille Day and Braille Literacy Month activities for January: write a name in braille, print a name card, and follow a ten minute, thirty minute or one week classroom path. No account needed.',
  alternates: { canonical: 'https://teachbraille.org/world-braille-day' },
  openGraph: {
    title: 'World Braille Day Activities for Braille Literacy Month | TeachBraille.org',
    description:
      'Write a name in braille, print it, and try a ten minute, thirty minute or one week classroom path. Free, no account needed.',
  },
};

export default function WorldBrailleDayPage() {
  return (
    <div className="wbd-page">
      {/* ========== HERO ========== */}
      <section className="intro-hero wbd-hero" id="top">
        <div className="intro-hero-content">
          <BrailleHero word="WORLD BRAILLE DAY" />
          <div className="section-label">January 4 and Braille Literacy Month</div>
          <h1>
            World Braille <em>Day</em>
          </h1>
          <p className="intro-hero-sub">
            Classroom and family activities for January: write a name in braille, print it on a card, and follow a ten
            minute, thirty minute or one week path through the free lessons and games.
          </p>
        </div>
      </section>

      {/* ========== WHAT THE DAY IS ========== */}
      <section className="wbd-section" id="what-the-day-is" aria-labelledby="wbd-day-heading">
        <div className="wbd-inner">
          <h2 id="wbd-day-heading">What the day is</h2>
          <p className="wbd-text">
            January 4 is the birthday of Louis Braille, born in France in 1809, who lost his sight as a small child. As
            a teenager at a school for blind students in Paris, he worked out the six-dot code that blind people all
            over the world still use to read and write, and since 2019 the United Nations has marked his birthday as
            World Braille Day. In the United States all of January is Braille Literacy Month, a time to remember that
            braille is how blind people read and write for themselves.
          </p>
        </div>
      </section>

      {/* ========== NAME BOX AND PRINTABLE CARD ========== */}
      <NameInBraille />

      {/* ========== CLASSROOM PATHS ========== */}
      <section className="wbd-section" id="classroom-paths" aria-labelledby="wbd-paths-heading">
        <div className="wbd-inner wbd-inner--wide">
          <h2 id="wbd-paths-heading">Ten minutes, thirty minutes, a week</h2>
          <p className="wbd-text">
            Three ready paths made from the lessons and games already on this site. Each lesson takes about ten minutes.
          </p>
          <div className="wbd-paths">
            {CLASSROOM_PATHS.map((p) => (
              <article key={p.id} className="wbd-path" aria-labelledby={`wbd-path-${p.id}`}>
                <h3 id={`wbd-path-${p.id}`}>{p.title}</h3>
                <p>{p.summary}</p>
                <ol className="wbd-path-steps">
                  {p.steps.map((s, i) => {
                    const step = resolveStep(s);
                    return (
                      <li key={i}>
                        {step.when && <span className="wbd-path-when">{step.when}: </span>}
                        <Link href={step.href}>{step.label}</Link>
                      </li>
                    );
                  })}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FOR TEACHERS ========== */}
      <section className="wbd-section" id="for-teachers" aria-labelledby="wbd-teachers-heading">
        <div className="wbd-inner">
          <h2 id="wbd-teachers-heading">For teachers</h2>
          <ul className="wbd-list">
            <li>
              <strong>One screen.</strong> Put this page on the board. The class calls out each letter while one person
              types, then reads the dot numbers back.
            </li>
            <li>
              <strong>Pairs.</strong> One partner reads dot numbers aloud from a name card; the other works out the
              letters.
            </li>
            <li>
              <strong>Homework.</strong> Send the link. The lessons and games work on phones, tablets and computers, and
              progress is kept on each device.
            </li>
          </ul>
          <p className="wbd-text">
            There are no accounts, no sign-up and nothing to install. The lessons start with uncontracted braille, where
            every letter is spelled out, and go on to the most common one-cell contractions; they do not cover the whole
            of contracted braille. Printed and on-screen dots are for learning the patterns by sight. To feel braille,
            use a braille book, labeler or embosser.
          </p>
        </div>
      </section>

      {/* ========== TAKE IT WITH YOU ========== */}
      <section className="wbd-section" id="take-it-with-you" aria-labelledby="wbd-take-heading">
        <div className="wbd-inner">
          <h2 id="wbd-take-heading">Take it with you</h2>
          <ul className="wbd-list">
            <li>
              <strong>The TeachBraille app.</strong> The same lessons and games, free on iPhone and iPad.{' '}
              <a href={APP_STORE_URL}>Get it on the App Store</a>.
            </li>
            <li>
              <strong>Lessons with a teacher.</strong> Delaney Costello, a certified Teacher of the Visually Impaired,
              teaches braille one to one. <Link href="/services">See her services</Link>.
            </li>
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
}
