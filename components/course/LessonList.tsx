'use client';

import Link from 'next/link';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import CourseProgressBar from '@/components/course/CourseProgressBar';
import { COURSE_MODULES, TOTAL_LESSONS, ALL_LESSONS, getLessonBySlug } from '@/lib/course-curriculum';

export default function LessonList() {
  const { completedCount, percent, lastLessonSlug, isComplete } = useCourseProgress();

  const resumeLesson = lastLessonSlug ? getLessonBySlug(lastLessonSlug) : undefined;
  const allDone = completedCount >= TOTAL_LESSONS && TOTAL_LESSONS > 0;
  const firstLesson = ALL_LESSONS[0];

  // Where the primary CTA points: first unfinished lesson (or resume, or start).
  const nextUp = resumeLesson && !allDone ? resumeLesson : firstLesson;
  const ctaLabel = allDone
    ? 'Review from the start'
    : resumeLesson
      ? `Resume: ${resumeLesson.title}`
      : 'Start the course';
  const ctaHref = allDone ? `/learn/${firstLesson.slug}` : `/learn/${nextUp.slug}`;

  let lessonNumber = 0;

  return (
    <div className="course-home-inner">
      <div className="course-home-progress reveal">
        <CourseProgressBar percent={percent} completedCount={completedCount} total={TOTAL_LESSONS} />
        <Link href={ctaHref} className="cta-button course-home-cta">
          {ctaLabel}
        </Link>
        <p className="course-home-note">Free · no account needed · your progress is saved on this device.</p>
      </div>

      <ol className="course-modules">
        {COURSE_MODULES.map((mod) => (
          <li key={mod.id} className="course-module reveal">
            <h2 className="course-module-title">{mod.title}</h2>
            <p className="course-module-blurb">{mod.blurb}</p>
            <ol className="course-lessons">
              {mod.lessons.map((lesson) => {
                lessonNumber += 1;
                const done = isComplete(lesson.slug);
                return (
                  <li key={lesson.slug} className={`course-lesson${done ? ' done' : ''}`}>
                    <Link href={`/learn/${lesson.slug}`} className="course-lesson-link">
                      <span className="course-lesson-num" aria-hidden="true">
                        {done ? '✓' : lessonNumber}
                      </span>
                      <span className="course-lesson-body">
                        <span className="course-lesson-title">{lesson.title}</span>
                        <span className="course-lesson-summary">{lesson.summary}</span>
                      </span>
                      <span className="sr-only">{done ? ' (completed)' : ''}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
