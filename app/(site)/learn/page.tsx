import type { Metadata } from 'next';
import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import BrailleText from '@/components/ui/BrailleText';
import TrackList from '@/components/learn/TrackList';
import { COURSE_MODULES, TOTAL_LESSONS, ALL_LESSONS } from '@/lib/course-curriculum';
import '@/styles/pages/learn.css';

export const metadata: Metadata = {
  title: 'Learn Braille Free — 12 Beginner Lessons for Families',
  description:
    'A free, self-paced braille course for parents, family and beginners: the braille cell, the alphabet, numbers, punctuation, capitals and first contractions. Unified English Braille, written by a Teacher of the Visually Impaired. No account needed.',
  alternates: { canonical: 'https://teachbraille.org/learn' },
  openGraph: {
    title: 'Learn Braille Free — 12 Beginner Lessons for Families | TeachBraille.org',
    description: 'Twelve short, warm lessons from a Teacher of the Visually Impaired. No account needed.',
  },
};

const courseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Learn Braille: Free Beginner Track',
  description:
    'Twelve short lessons in Unified English Braille, from what braille is to first contractions, with interactive writing practice and games.',
  provider: { '@type': 'Person', name: 'Delaney Costello', jobTitle: 'Teacher of the Visually Impaired' },
  url: 'https://teachbraille.org/learn',
  isAccessibleForFree: true,
  educationalLevel: 'Beginner',
  inLanguage: 'en',
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: `PT${ALL_LESSONS.reduce((s, l) => s + l.minutes, 0)}M`,
  },
  syllabusSections: COURSE_MODULES.map((m) => ({ '@type': 'Syllabus', name: m.title, description: m.blurb })),
};

export default function LearnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <section className="page-hero lattice">
        <div className="wrap page-hero-grid">
          <div>
            <Eyebrow>Free lessons</Eyebrow>
            <h1>Learn braille, one dot at a time</h1>
            <p className="lead">
              {TOTAL_LESSONS} short, friendly lessons for parents, family and curious beginners. Write every letter
              yourself, then practise with a game. No account, no cost — your progress saves on this device.
            </p>
            <div className="cluster mt-5">
              <Link href="/learn/what-is-braille" className="btn btn--lg">
                Start with lesson 1
              </Link>
              <Link href="/games" className="btn btn--paper">
                Jump to the games
              </Link>
            </div>
          </div>
          <div className="learn-hero-art tile" aria-hidden="true">
            <BrailleText text="abc" size="xl" pop />
            <p className="learn-hero-caption">a · b · c</p>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap-narrow">
          <TrackList />
        </div>
      </section>

      <section className="section band-sunk">
        <div className="wrap-narrow center stack">
          <Eyebrow>After the track</Eyebrow>
          <h2>Want a teacher in your corner?</h2>
          <p className="lead center">
            Delaney&rsquo;s live remote courses add one-on-one reading practice and personal feedback on your writing.
          </p>
          <div className="cluster" style={{ justifyContent: 'center' }}>
            <Link href="/courses" className="btn">
              See courses
            </Link>
            <Link href="/services" className="btn btn--paper">
              1-on-1 sessions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
