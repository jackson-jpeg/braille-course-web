'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadProgress } from '@/lib/progress-storage';
import { getNextSteps, type NextStep } from '@/lib/games/next-up';
import Cell from '@/components/ui/Cell';
import { LETTERS } from '@/lib/ueb';

const KIND_CELL: Record<NextStep['kind'], keyof typeof LETTERS> = {
  lesson: 'l',
  game: 'g',
  review: 'r',
  streak: 's',
  course: 'c',
};

/** "What to practise next" cards, personalised from this device's progress. */
export default function NextUp({ heading = 'What to practise next', max = 3 }: { heading?: string; max?: number }) {
  const [steps, setSteps] = useState<NextStep[] | null>(null);
  useEffect(() => setSteps(getNextSteps(loadProgress(), max)), [max]);

  return (
    <section className="next-up" aria-labelledby="next-up-heading">
      <h2 id="next-up-heading" className="next-up-heading">
        {heading}
      </h2>
      {steps === null ? (
        <p className="muted">Checking your progress…</p>
      ) : (
        <ul className="next-up-list">
          {steps.map((s) => (
            <li key={s.href + s.kind}>
              <Link href={s.href} className={`next-up-card tile tile-link next-up-card--${s.kind}`}>
                <Cell dots={LETTERS[KIND_CELL[s.kind]]} size="sm" />
                <span className="next-up-text">
                  <span className="next-up-title">{s.title}</span>
                  <span className="next-up-reason">{s.reason}</span>
                </span>
                <span className="next-up-cta link-arrow">{s.cta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
