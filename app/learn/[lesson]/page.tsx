import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BrailleHero from '@/components/BrailleHero';
import Footer from '@/components/Footer';
import LessonRunner from '@/components/course/LessonRunner';
import {
  LESSON_SLUGS,
  getLessonBySlug,
  getModuleForLesson,
  getAdjacentLessons,
  getLessonIndex,
  TOTAL_LESSONS,
} from '@/lib/course-curriculum';

export function generateStaticParams() {
  return LESSON_SLUGS.map((lesson) => ({ lesson }));
}

// The course has a fixed set of lessons — any other slug is a genuine 404.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const { lesson: slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) return {};
  const title = `${lesson.title} — Free Braille Course`;
  return {
    title,
    description: `${lesson.summary} Part of a free, self-paced braille course. Write each character yourself and practice with interactive games — no account needed.`,
    alternates: { canonical: `https://teachbraille.org/learn/${lesson.slug}` },
    openGraph: {
      title: `${title} | TeachBraille.org`,
      description: lesson.summary,
    },
  };
}

export default async function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson: slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  const mod = getModuleForLesson(lesson);
  const { prev, next } = getAdjacentLessons(slug);
  const lessonNumber = getLessonIndex(slug) + 1;

  const lessonJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.summary,
    url: `https://teachbraille.org/learn/${lesson.slug}`,
    learningResourceType: 'Lesson',
    isAccessibleForFree: true,
    isPartOf: {
      '@type': 'Course',
      name: 'Learn Braille — Free Self-Paced Course',
      url: 'https://teachbraille.org/learn',
    },
    author: {
      '@type': 'Person',
      name: 'Delaney Costello',
      jobTitle: 'Teacher of the Visually Impaired',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(lessonJsonLd) }} />

      {/* ========== LESSON HERO ========== */}
      <section className="lesson-hero" id="top">
        <div className="lesson-hero-content">
          <BrailleHero word={lesson.title.toUpperCase()} />
          <p className="lesson-hero-crumb">
            <Link href="/learn">Braille Course</Link>
            {mod && <span aria-hidden="true"> · {mod.title}</span>}
          </p>
          <div className="section-label">
            Lesson {lessonNumber} of {TOTAL_LESSONS}
          </div>
          <h1>{lesson.title}</h1>
          <p className="lesson-hero-sub">{lesson.summary}</p>
        </div>
      </section>

      <LessonRunner lesson={lesson} prev={prev} next={next} />

      <Footer />
    </>
  );
}
