'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { markLessonComplete, getLessonState } from '@/lib/progress-storage';
import { checkAchievements } from '@/lib/achievements';
import { pushAchievements } from '@/components/AchievementToast';
import ButtonCell from '@/components/ui/ButtonCell';
import Cell from '@/components/ui/Cell';
import { useLessonProgress } from './LessonProgress';

interface Props {
  slug: string;
  practiceHref: string;
  practiceLabel: string;
  next: { href: string; title: string } | null;
  isLast: boolean;
}

/** End of a lesson: mark it done, then point to the matching game and the next lesson. */
export default function LessonFinish({ slug, practiceHref, practiceLabel, next, isLast }: Props) {
  const { score } = useLessonProgress();
  const [done, setDone] = useState(false);
  const [wasDone, setWasDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setWasDone(getLessonState(slug).completed), [slug]);

  function finish() {
    const progress = markLessonComplete(slug, score());
    pushAchievements(checkAchievements(progress));
    setDone(true);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <section className="lesson-finish band-ink" aria-labelledby="finish-h">
      <div className="lesson-finish-inner">
        <div className="lesson-finish-cells" aria-hidden="true">
          {[[1], [1, 2], [1, 2, 4], [1, 2, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]].map((d, i) => (
            <Cell key={i} dots={done || wasDone ? d : []} size="sm" tone="marigold" pop={done} onInk />
          ))}
        </div>
        <h2 id="finish-h" ref={headingRef} tabIndex={-1}>
          {done ? 'Lesson complete!' : wasDone ? 'You’ve finished this one before' : 'Ready to wrap up?'}
        </h2>
        {!done && (
          <p>
            {isLast
              ? 'Mark the track complete, then choose your next step below.'
              : 'Mark this lesson done to keep your place, then practise it in a game.'}
          </p>
        )}
        {done && <p>Nicely done. Practise it now while it’s fresh — that’s how it sticks.</p>}
        <div className="cluster lesson-finish-actions">
          {!done && (
            <button type="button" className="btn btn--marigold btn--lg" onClick={finish}>
              <ButtonCell letter="d" />
              {wasDone ? 'Mark done again' : 'Mark lesson done'}
            </button>
          )}
          <Link href={practiceHref} className={`btn ${done ? 'btn--marigold btn--lg' : 'btn--paper'}`}>
            {practiceLabel}
          </Link>
          {next && (
            <Link href={next.href} className="btn btn--paper">
              Next: {next.title}
            </Link>
          )}
          {isLast && (
            <Link href="/courses" className="btn btn--paper">
              See Delaney’s courses
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
