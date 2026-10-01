import type { Metadata } from 'next';
import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import BrailleText from '@/components/ui/BrailleText';
import Cell from '@/components/ui/Cell';
import InterestForm from '@/components/courses/InterestForm';
import CohortEnrollment from '@/components/courses/CohortEnrollment';
import { NEXT_COHORT } from '@/lib/cohort';
import { LETTERS } from '@/lib/ueb';
import { TOTAL_LESSONS } from '@/lib/course-curriculum';
import { GAMES } from '@/lib/games/registry';
import '@/styles/pages/courses.css';

export const metadata: Metadata = {
  title: 'Live Braille Courses for Parents & Families',
  description:
    'A small-group, remote braille course for parents and loved ones of visually impaired children, taught live by Delaney Costello, Teacher of the Visually Impaired. Join the list to hear first when the next course opens.',
  alternates: { canonical: 'https://teachbraille.org/courses' },
  openGraph: {
    title: 'Live Braille Courses for Parents & Families | TeachBraille.org',
    description:
      'Learn braille live, in a small group, with a Teacher of the Visually Impaired. Join the list for the next course.',
  },
};

const courseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Braille for Parents & Loved Ones (live, remote)',
  description:
    'An introductory remote course in Unified English Braille for parents and loved ones of visually impaired people: the alphabet, numbers and common contractions, with live instruction and personal feedback.',
  provider: {
    '@type': 'Person',
    name: 'Delaney Costello',
    jobTitle: 'Teacher of the Visually Impaired',
    url: 'https://teachbraille.org',
  },
  url: 'https://teachbraille.org/courses',
  inLanguage: 'en',
  educationalLevel: 'Beginner',
  ...(NEXT_COHORT
    ? {
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          startDate: NEXT_COHORT.startDate,
          endDate: NEXT_COHORT.endDate,
          instructor: { '@type': 'Person', name: 'Delaney Costello' },
        },
      }
    : {}),
};

const INCLUDED = [
  {
    letter: 's',
    title: 'Copies of every slide',
    text: 'The Google Slides from each session, so you can review at your own pace.',
  },
  {
    letter: 'r',
    title: 'One-on-one reading practice',
    text: 'Individual braille reading time, tailored to where you are.',
  },
  {
    letter: 'w',
    title: 'Graded writing practice',
    text: 'Personal feedback on your braille writing, so you know exactly what to work on.',
  },
];

const FAQ = [
  {
    q: 'When is the next course?',
    a: 'The next course hasn’t been scheduled yet. Join the list above and Delaney will email you as soon as dates are set — people on the list hear first.',
  },
  {
    q: 'How much does it cost?',
    a: 'Tuition for the next course will be shared along with the dates. Questions about cost? Email Delaney@TeachBraille.org.',
  },
  {
    q: 'Do I need this course to learn braille?',
    a: 'Not at all. The free lessons and games on this site will take you a long way. The course adds live teaching, structured pacing and personal feedback on your reading and writing.',
  },
  {
    q: 'Who is it for?',
    a: 'Parents, grandparents, siblings, friends and anyone who loves someone who reads braille. No experience needed. Looking for help for a child who is learning braille? See 1-on-1 TVI services.',
  },
  {
    q: 'What will I learn?',
    a: 'An introduction to Unified English Braille (UEB): the full alphabet, numbers 0–9 and some commonly used contractions.',
  },
  {
    q: 'What do I need?',
    a: 'A computer, WiFi and a webcam. A brailler is optional but highly recommended. Don’t have one? Delaney can talk through options before the course begins.',
  },
];

export default function CoursesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />

      <section className="page-hero lattice courses-hero">
        <div className="wrap page-hero-grid">
          <div>
            <Eyebrow>Live courses</Eyebrow>
            <h1>Learn braille together, live with Delaney</h1>
            <p className="lead">
              A small-group, remote braille course for parents and loved ones of visually impaired children and adults,
              taught by a Teacher of the Visually Impaired.
            </p>
            {NEXT_COHORT ? (
              <p className="courses-status chip chip--pine">
                Now enrolling: {NEXT_COHORT.name} · {NEXT_COHORT.dates}
              </p>
            ) : (
              <p className="courses-status chip chip--marigold">The next course is being planned</p>
            )}
          </div>
          <div className="courses-signup tile" id="join">
            <h2 className="courses-signup-title">{NEXT_COHORT ? 'Not ready to enroll?' : 'Be first to hear'}</h2>
            <p className="muted">
              {NEXT_COHORT
                ? 'Join the list for future courses.'
                : 'Join the list and Delaney will email you when dates and details for the next course are set.'}
            </p>
            <InterestForm id="hero-interest" />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="story-h">
        <div className="wrap courses-story">
          <div className="stack">
            <Eyebrow>Why this course exists</Eyebrow>
            <h2 id="story-h">It started with one parent&rsquo;s request</h2>
            <p>
              A former student&rsquo;s mother reached out hoping to learn braille, the first time a parent had ever
              asked. Over several weeks at the library, at her home and on video calls, she learned half the alphabet
              and gained real confidence reading and writing braille. Her curiosity and determination inspired this
              course, so more families can share that same experience.
            </p>
          </div>
          <blockquote className="courses-quote">
            <BrailleText text="dc" size="sm" />
            <p>
              A summer braille course for parents is one of the best ways I can think to spend <em>my summer</em>.
            </p>
            <footer>Delaney Costello, TVI</footer>
          </blockquote>
        </div>
      </section>

      <section className="section band-sunk" aria-labelledby="how-h">
        <div className="wrap">
          <div className="section-head">
            <Eyebrow>How it works</Eyebrow>
            <h2 id="how-h">Real teaching, at a gentle pace</h2>
            <p className="lead">
              The first course ran for eight weeks, with two one-hour live sessions a week in groups of five. Details
              for the next course will be confirmed when dates are announced.
            </p>
          </div>
          <ul className="grid-auto courses-included" style={{ '--min': '16rem' } as React.CSSProperties}>
            {INCLUDED.map((item) => (
              <li key={item.title} className="tile">
                <Cell dots={LETTERS[item.letter]} size="md" framed />
                <h3>{item.title}</h3>
                <p className="muted">{item.text}</p>
              </li>
            ))}
          </ul>
          <div className="courses-learn tile tile--sunk">
            <h3>What you&rsquo;ll learn</h3>
            <p>
              An introduction to <strong>Unified English Braille (UEB)</strong>: the full alphabet, numbers 0–9 and some
              commonly used contractions — enough to read and write notes, labels and early reading books with your
              child.
            </p>
          </div>
        </div>
      </section>

      {NEXT_COHORT && <CohortEnrollment cohort={NEXT_COHORT} />}

      <section className="section" aria-labelledby="faq-h">
        <div className="wrap-narrow">
          <div className="section-head">
            <Eyebrow>Questions</Eyebrow>
            <h2 id="faq-h">Good to know</h2>
          </div>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <p className="muted mt-5">
            Something else? Email <a href="mailto:Delaney@TeachBraille.org">Delaney@TeachBraille.org</a>.
          </p>
        </div>
      </section>

      <section className="section band-ink lattice" aria-labelledby="meanwhile-h">
        <div className="wrap courses-meanwhile">
          <div className="stack">
            <Eyebrow>Meanwhile</Eyebrow>
            <h2 id="meanwhile-h">Start learning free, today</h2>
            <p className="lead">
              {TOTAL_LESSONS} short lessons and {GAMES.length} games will have you reading the alphabet before the next
              course begins.
            </p>
          </div>
          <div className="cluster">
            <Link href="/learn" className="btn btn--marigold btn--lg">
              Start the free lessons
            </Link>
            <Link href="/services" className="btn btn--paper">
              Prefer 1-on-1?
            </Link>
          </div>
        </div>
      </section>

      <section className="section-tight" aria-labelledby="join-again-h">
        <div className="wrap-narrow center stack">
          <h2 id="join-again-h">Want a spot when it opens?</h2>
          <InterestForm id="footer-interest" />
        </div>
      </section>
    </>
  );
}
