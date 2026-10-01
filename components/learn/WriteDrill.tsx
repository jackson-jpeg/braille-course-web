'use client';

import { useState } from 'react';
import DotPad from '@/components/games/kit/DotPad';
import { useAnnouncer } from '@/components/games/kit/useAnnouncer';
import Cell from '@/components/ui/Cell';
import { describe, sameDots, type Dots } from '@/lib/ueb';
import { recordItem } from '@/lib/progress-storage';
import type { CharItem } from '@/lib/course-curriculum';
import { useLessonProgress } from './LessonProgress';
import { useFocusWithin } from './useFocusWithin';

type Marks = Partial<Record<number, 'correct' | 'missing' | 'extra'>>;

/** "Try it": write each character on a dot pad. Multi-cell items (numbers) are written cell by cell. */
export default function WriteDrill({ id, title, items }: { id: string; title: string; items: CharItem[] }) {
  const { report } = useLessonProgress();
  const { announce, region } = useAnnouncer();
  const focus = useFocusWithin();
  const [index, setIndex] = useState(0);
  const [cellIndex, setCellIndex] = useState(0);
  const [dots, setDots] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [firstTry, setFirstTry] = useState<boolean[]>([]);
  const [marks, setMarks] = useState<Marks | undefined>();
  const [message, setMessage] = useState('');
  const finished = index >= items.length;

  const item = items[Math.min(index, items.length - 1)];
  const target: Dots = item.cells[cellIndex];

  function check() {
    if (finished) return;
    if (sameDots(dots, target)) {
      const lastCell = cellIndex === item.cells.length - 1;
      setMarks(undefined);
      setDots([]);
      if (!lastCell) {
        setCellIndex(cellIndex + 1);
        setMessage(`Yes! Now cell ${cellIndex + 2} of ${item.cells.length}.`);
        announce(`Correct. Now write cell ${cellIndex + 2} of ${item.cells.length}.`);
        return;
      }
      const ok = misses === 0;
      recordItem(item.key, ok);
      const results = [...firstTry, ok];
      setFirstTry(results);
      setCellIndex(0);
      setMisses(0);
      const nextIndex = index + 1;
      setIndex(nextIndex);
      if (nextIndex >= items.length) {
        const correct = results.filter(Boolean).length;
        report(id, correct, items.length);
        setMessage('All done. Lovely work!');
        announce(`Correct! You wrote all ${items.length}. Lovely work.`);
      } else {
        setMessage(`Yes, that's ${item.print}! Next: ${items[nextIndex].print}.`);
        announce(`Correct, that's ${item.print}. Next, write ${items[nextIndex].print}.`);
      }
    } else {
      const m: Marks = {};
      for (let d = 1; d <= 6; d++) {
        const want = target.includes(d);
        const have = dots.includes(d);
        if (want && !have) m[d] = 'missing';
        if (!want && have) m[d] = 'extra';
      }
      setMarks(m);
      setMisses(misses + 1);
      const hint =
        misses >= 1
          ? ` ${item.print} is ${describe(target)}. The outlined dots show what to change.`
          : ' Have another look at the dot numbers.';
      setMessage(`Not quite.${hint}`);
      announce(
        `Not quite. You raised ${describe(dots)}.${misses >= 1 ? ` ${item.print} is ${describe(target)}.` : ''}`,
      );
    }
  }

  return (
    <section className="drill tile" aria-labelledby={`${id}-h`} {...focus.props}>
      {region}
      <h3 id={`${id}-h`} className="drill-title">
        {title}
      </h3>
      {finished ? (
        <div className="drill-done">
          <p className="drill-done-msg">
            You wrote {items.length} {items.length === 1 ? 'character' : 'characters'}.{' '}
            {firstTry.filter(Boolean).length} on the first try.
          </p>
          <div className="drill-done-cells" aria-hidden="true">
            {items.map((it) => it.cells.map((c, i) => <Cell key={it.key + i} dots={c} size="sm" pop />))}
          </div>
          <button
            type="button"
            className="btn btn--paper btn--sm"
            onClick={() => {
              setIndex(0);
              setFirstTry([]);
              setMessage('');
            }}
          >
            Practise again
          </button>
        </div>
      ) : (
        <div className="drill-body">
          <div className="drill-target">
            <p className="drill-step">
              {index + 1} of {items.length}
            </p>
            <p className="drill-print" aria-live="off">
              Write <strong>{item.print}</strong>
              {item.cells.length > 1 && (
                <span className="drill-subcell">
                  {' '}
                  — cell {cellIndex + 1} of {item.cells.length}
                </span>
              )}
            </p>
            {item.note && <p className="muted drill-note">{item.note}</p>}
            {misses >= 2 && (
              <p className="drill-reveal">
                <Cell dots={target} size="md" framed label={`${item.print} looks like this`} />
              </p>
            )}
          </div>
          <div className="drill-pad">
            <DotPad
              value={dots}
              onChange={(d) => {
                setDots(d);
                setMarks(undefined);
              }}
              onSubmit={check}
              marks={marks}
              keyboard={focus.active}
              label={`Write ${item.print}`}
              size="md"
            />
            <div className="cluster drill-actions">
              <button type="button" className="btn btn--pine" onClick={check}>
                Check
              </button>
              <button type="button" className="btn btn--paper btn--sm" onClick={() => setDots([])}>
                Clear
              </button>
            </div>
            <p className="drill-keys muted">Keys: 1–6 or F D S J K L raise dots · Enter checks</p>
          </div>
        </div>
      )}
      <p className={`drill-msg${message.startsWith('Not') ? ' is-bad' : ''}`}>{message}</p>
    </section>
  );
}
