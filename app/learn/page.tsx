import type { Metadata } from 'next';
import BrailleHero from '@/components/BrailleHero';
import Footer from '@/components/Footer';
import LessonList from '@/components/course/LessonList';
import { COURSE_MODULES, TOTAL_LESSONS } from '@/lib/course-curriculum';

export const metadata: Metadata = {
  title: 'Free Braille Course — Learn to Read Braille Step by Step',
  description:
    'A free, self-paced braille course that takes you from the six-dot cell to reading contracted (Grade 2) braille. No account needed — progress saves on your device. Written by a certified Teacher of the Visually Impaired.',
  alternates: { canonical: 'https://teachbraille.org/learn' },
  openGraph: {
    title: 'Free Braille Course — Learn to Read Braille Step by Step | TeachBraille.org',
    description:
      'Go from the braille cell to Grade 2 contractions with a free, self-paced course. Interactive writing drills and practice games. No login required.',
  },
};

const courseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Learn Braille — Free Self-Paced Course',
  description:
    'A free, self-paced course from the braille cell through Grade 2 contractions, with interactive writing drills and practice games.',
  provider: {
    '@type': 'Person',
    name: 'Delaney Costello',
    jobTitle: 'Teacher of the Visually Impaired',
  },
  url: 'https://teachbraille.org/learn',
  isAccessibleForFree: true,
  educationalLevel: 'Beginner',
  numberOfCredits: TOTAL_LESSONS,
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: `PT${TOTAL_LESSONS}H`,
  },
  syllabusSections: COURSE_MODULES.map((mod) => ({
    '@type': 'Syllabus',
    name: mod.title,
    description: mod.blurb,
  })),
};

export default function LearnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />

      {/* ========== HERO ========== */}
      <section className="course-hero" id="top">
        <div className="course-hero-content">
          <BrailleHero word="LEARN BRAILLE" />
          <div className="section-label">Free Self-Paced Course</div>
          <h1>
            Learn to Read <em>Braille</em>
          </h1>
          <p className="course-hero-sub">
            {TOTAL_LESSONS} short lessons take you from a single dot to reading contracted braille. You write every
            character yourself, then practice with interactive games. Free, no account required — pick up right where
            you left off.
          </p>
        </div>
      </section>

      {/* ========== LESSON LIST + PROGRESS ========== */}
      <section className="course-home" aria-label="Course lessons">
        <LessonList />
      </section>

      <Footer />
    </>
  );
}
