'use client';

import { useState } from 'react';
import Cell from '@/components/ui/Cell';
import type { QuizQuestion } from '@/lib/course-curriculum';
import { describe } from '@/lib/ueb';
import { useLessonProgress } from './LessonProgress';

/** A short check-your-understanding quiz. Each question gets immediate, kind feedback. */
export default function Quiz({ id, questions }: { id: string; questions: QuizQuestion[] }) {
  const { report } = useLessonProgress();
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));

  function choose(q: number, option: number) {
    if (answers[q] !== null) return;
    const next = [...answers];
    next[q] = option;
    setAnswers(next);
    if (next.every((a) => a !== null)) {
      report(id, next.filter((a, i) => a === questions[i].answer).length, questions.length);
    }
  }

  return (
    <section className="quiz tile tile--sunk" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="drill-title">
        Quick check
      </h3>
      <ol className="quiz-list">
        {questions.map((q, qi) => {
          const a = answers[qi];
          const right = a === q.answer;
          return (
            <li key={qi} className="quiz-q">
              <p className="quiz-prompt" id={`${id}-q${qi}`}>
                {q.prompt}
              </p>
              {q.cells && (
                <div className="quiz-cells" role="img" aria-label={`Braille: ${q.cells.map(describe).join(', then ')}`}>
                  {q.cells.map((c, ci) => (
                    <Cell key={ci} dots={c} size="lg" framed />
                  ))}
                </div>
              )}
              <div className="quiz-options" role="group" aria-labelledby={`${id}-q${qi}`}>
                {q.options.map((o, oi) => {
                  const state = a === null ? '' : oi === q.answer ? ' is-correct' : oi === a ? ' is-wrong' : '';
                  return (
                    <button
                      key={oi}
                      type="button"
                      className={`quiz-option${state}`}
                      onClick={() => choose(qi, oi)}
                      aria-disabled={a !== null}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              <p className={`quiz-feedback${a === null ? '' : right ? ' is-good' : ' is-bad'}`} role="status">
                {a === null ? '' : `${right ? 'Yes! ' : 'Not quite. '}${q.explain}`}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
