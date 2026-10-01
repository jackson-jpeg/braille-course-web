import Link from 'next/link';
import type { Lesson } from '@/lib/course-curriculum';

interface LessonNavProps {
  prev: Lesson | null;
  next: Lesson | null;
}

/** Previous / next lesson links shown at the foot of each lesson. */
export default function LessonNav({ prev, next }: LessonNavProps) {
  return (
    <nav className="lesson-nav" aria-label="Lesson navigation">
      {prev ? (
        <Link href={`/learn/${prev.slug}`} className="lesson-nav-link lesson-nav-link--prev" rel="prev">
          <span className="lesson-nav-dir" aria-hidden="true">
            ← Previous
          </span>
          <span className="lesson-nav-title">{prev.title}</span>
        </Link>
      ) : (
        <Link href="/learn" className="lesson-nav-link lesson-nav-link--prev">
          <span className="lesson-nav-dir" aria-hidden="true">
            ← Back
          </span>
          <span className="lesson-nav-title">Course home</span>
        </Link>
      )}

      {next ? (
        <Link href={`/learn/${next.slug}`} className="lesson-nav-link lesson-nav-link--next" rel="next">
          <span className="lesson-nav-dir" aria-hidden="true">
            Next →
          </span>
          <span className="lesson-nav-title">{next.title}</span>
        </Link>
      ) : (
        <Link href="/learn" className="lesson-nav-link lesson-nav-link--next">
          <span className="lesson-nav-dir" aria-hidden="true">
            Finish →
          </span>
          <span className="lesson-nav-title">Course home</span>
        </Link>
      )}
    </nav>
  );
}
