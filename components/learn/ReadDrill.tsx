'use client';

import { useMemo, useState } from 'react';
import Cell from '@/components/ui/Cell';
import { useAnnouncer } from '@/components/games/kit/useAnnouncer';
import { recordItem } from '@/lib/progress-storage';
import type { CharItem } from '@/lib/course-curriculum';
import { useLessonProgress } from './LessonProgress';

/** Deterministic option order (no Math.random during render → no hydration mismatch). */
function optionsFor(item: CharItem, pool: CharItem[], i: number): CharItem[] {
  const others = pool.filter((p) => p.key !== item.key);
  const picks = [0, 1, 2].map((k) => others[(i * 7 + k * 5 + 3) % others.length]);
  const unique = Array.from(new Map(picks.map((p) => [p.key, p])).values());
  const opts = [...unique.slice(0, 3), item];
  const shift = i % opts.length;
  return [...opts.slice(shift), ...opts.slice(0, shift)];
}

/** "Now read them": see a cell, choose its letter. */
export default function ReadDrill({
  id,
  title,
  items,
  pool,
}: {
  id: string;
  title: string;
  items: CharItem[];
  pool: CharItem[];
}) {
  const { report } = useLessonProgress();
  const { announce, region } = useAnnouncer();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const finished = index >= items.length;
  const item = items[Math.min(index, items.length - 1)];
  const options = useMemo(() => optionsFor(item, pool, index), [item, pool, index]);

  function pick(key: string) {
    if (picked) return;
    setPicked(key);
    const ok = key === item.key;
    recordItem(item.key, ok);
    if (ok) setScore((s) => s + 1);
    announce(ok ? `Yes, that's ${item.print}.` : `Not quite. That cell is ${item.print}.`);
  }

  function next() {
    const n = index + 1;
    setPicked(null);
    setIndex(n);
    if (n >= items.length) {
      report(id, score, items.length);
      announce(`Finished. ${score} of ${items.length} right.`);
    }
  }

  return (
    <section className="drill tile" aria-labelledby={`${id}-h`}>
      {region}
      <h3 id={`${id}-h`} className="drill-title">
        {title}
      </h3>
      {finished ? (
        <div className="drill-done">
          <p className="drill-done-msg">
            {score} of {items.length} right{score === items.length ? ' — perfect!' : '.'}
          </p>
          <button
            type="button"
            className="btn btn--paper btn--sm"
            onClick={() => {
              setIndex(0);
              setScore(0);
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="read-drill">
          <p className="drill-step">
            {index + 1} of {items.length}
          </p>
          <div className="read-drill-cell">
            <Cell dots={item.cells[item.cells.length - 1]} size="xl" framed label="Which letter is this cell" />
          </div>
          <div className="read-options" role="group" aria-label="Choose the letter">
            {options.map((o) => {
              const state = picked ? (o.key === item.key ? ' is-correct' : o.key === picked ? ' is-wrong' : '') : '';
              return (
                <button
                  key={o.key}
                  type="button"
                  className={`read-option${state}`}
                  onClick={() => pick(o.key)}
                  disabled={!!picked}
                >
                  {o.print}
                </button>
              );
            })}
          </div>
          {picked && (
            <button type="button" className="btn btn--pine btn--sm" onClick={next} autoFocus>
              {index + 1 < items.length ? 'Next' : 'Finish'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
