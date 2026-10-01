'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Cell from '@/components/ui/Cell';
import { getCourseProgress } from '@/lib/progress-storage';
import { COURSE_MODULES, TOTAL_LESSONS, getLessonIndex } from '@/lib/course-curriculum';

/** The lesson track with this device's progress: done lessons fill their cell, the next one is highlighted. */
export default function TrackList() {
  const [done, setDone] = useState<string[]>([]);
  const [last, setLast] = useState('');
  useEffect(() => {
    const p = getCourseProgress();
    setDone(p.completedSlugs);
    setLast(p.lastLessonSlug);
  }, []);

  const nextSlug = COURSE_MODULES.flatMap((m) => m.lessons).find((l) => !done.includes(l.slug))?.slug;
  const pct = Math.round((done.length / TOTAL_LESSONS) * 100);
  const resume = last && !done.includes(last) ? last : nextSlug;

  return (
    <div className="track">
      <div className="track-progress tile">
        <div className="meter">
          <span className="meter-track" aria-hidden="true">
            <span className="meter-fill" style={{ width: `${pct}%`, display: 'block' }} />
          </span>
          <span className="meter-label">
            {done.length} of {TOTAL_LESSONS} lessons done
          </span>
        </div>
        {resume && (
          <Link href={`/learn/${resume}`} className="btn">
            {done.length === 0 && !last ? 'Start lesson 1' : `Continue: lesson ${getLessonIndex(resume) + 1}`}
          </Link>
        )}
        {!resume && (
          <Link href="/courses" className="btn">
            You finished! See live courses
          </Link>
        )}
      </div>

      {COURSE_MODULES.map((m, mi) => (
        <section key={m.id} className="track-module" aria-labelledby={`mod-${m.id}`}>
          <div className="track-module-head">
            <p className="track-module-num">Part {mi + 1}</p>
            <h2 id={`mod-${m.id}`}>{m.title}</h2>
            <p className="muted">{m.blurb}</p>
          </div>
          <ol className="track-lessons">
            {m.lessons.map((l) => {
              const n = getLessonIndex(l.slug) + 1;
              const isDone = done.includes(l.slug);
              const isNext = l.slug === nextSlug;
              return (
                <li key={l.slug}>
                  <Link
                    href={`/learn/${l.slug}`}
                    className={`track-lesson tile tile-link${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}`}
                  >
                    <Cell
                      dots={isDone ? [1, 2, 3, 4, 5, 6] : isNext ? [1] : []}
                      size="sm"
                      tone={isDone ? 'pine' : 'tomato'}
                      flat="ghost"
                    />
                    <span className="track-lesson-text">
                      <span className="track-lesson-num">Lesson {n}</span>
                      <span className="track-lesson-title">{l.title}</span>
                      <span className="track-lesson-sum">{l.summary}</span>
                    </span>
                    <span className="track-lesson-meta">
                      {isDone ? (
                        <span className="chip chip--pine">Done</span>
                      ) : isNext ? (
                        <span className="chip chip--tomato">Up next</span>
                      ) : (
                        <span className="chip">{l.minutes} min</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
