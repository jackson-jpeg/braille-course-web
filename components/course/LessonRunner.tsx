'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import BrailleCell from '@/components/BrailleCell';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import BraillerInput from '@/components/course/BraillerInput';
import LessonNav from '@/components/course/LessonNav';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { describeDots, type Lesson } from '@/lib/course-curriculum';
import type { GameId } from '@/lib/progress-types';

function GameSkeleton() {
  return (
    <div className="game-skeleton" aria-label="Loading practice game…" role="status">
      <div className="game-skeleton-shimmer" />
    </div>
  );
}

// Reuse the existing games whole as each lesson's deeper-practice step.
const GAME_COMPONENTS: Record<GameId, ComponentType> = {
  wordgame: dynamic(() => import('@/components/BrailleWordGame'), { loading: GameSkeleton }),
  explorer: dynamic(() => import('@/components/BrailleDotExplorer'), { loading: GameSkeleton }),
  hangman: dynamic(() => import('@/components/BrailleHangman'), { loading: GameSkeleton }),
  speedmatch: dynamic(() => import('@/components/BrailleSpeedMatch'), { loading: GameSkeleton }),
  memorymatch: dynamic(() => import('@/components/BrailleMemoryMatch'), { loading: GameSkeleton }),
  'contraction-sprint': dynamic(() => import('@/components/BrailleContractionSprint'), { loading: GameSkeleton }),
  'number-sense': dynamic(() => import('@/components/BrailleNumberSense'), { loading: GameSkeleton }),
  'reflex-dots': dynamic(() => import('@/components/BrailleReflexDots'), { loading: GameSkeleton }),
  sequence: dynamic(() => import('@/components/BrailleSequence'), { loading: GameSkeleton }),
  'sentence-decoder': dynamic(() => import('@/components/BrailleSentenceDecoder'), { loading: GameSkeleton }),
  bingo: dynamic(() => import('@/components/BrailleBingo'), { loading: GameSkeleton }),
  rain: dynamic(() => import('@/components/BrailleRain'), { loading: GameSkeleton }),
};

interface LessonRunnerProps {
  lesson: Lesson;
  prev: Lesson | null;
  next: Lesson | null;
}

export default function LessonRunner({ lesson, prev, next }: LessonRunnerProps) {
  const hasChars = lesson.chars.length > 0;
  const { complete, markOpened, isComplete } = useCourseProgress();

  const [solved, setSolved] = useState<boolean[]>(() => lesson.chars.map(() => false));
  const [firstTry, setFirstTry] = useState<boolean[]>(() => lesson.chars.map(() => false));
  const [current, setCurrent] = useState(0);
  const [manualDone, setManualDone] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const completedRef = useRef(false);

  // Record that this lesson was opened (for "Resume") and note prior completion.
  useEffect(() => {
    markOpened(lesson.slug);
    setAlreadyDone(isComplete(lesson.slug));
  }, [lesson.slug, markOpened, isComplete]);

  const drillDone = hasChars && solved.every(Boolean);
  const PracticeGame = lesson.practiceGameId ? GAME_COMPONENTS[lesson.practiceGameId] : null;

  const handleSolved = useCallback((index: number, ft: boolean) => {
    setSolved((prev) => {
      const nextArr = [...prev];
      nextArr[index] = true;
      return nextArr;
    });
    setFirstTry((prev) => {
      const nextArr = [...prev];
      nextArr[index] = ft;
      return nextArr;
    });
  }, []);

  // Persist completion once the whole drill is solved.
  useEffect(() => {
    if (drillDone && !completedRef.current) {
      completedRef.current = true;
      const total = lesson.chars.length;
      const score = Math.round((firstTry.filter(Boolean).length / total) * 100);
      complete(lesson.slug, score);
    }
  }, [drillDone, firstTry, lesson.chars.length, lesson.slug, complete]);

  const finishWrapUp = useCallback(() => {
    setManualDone(true);
    complete(lesson.slug, 100);
  }, [complete, lesson.slug]);

  const lessonFinished = drillDone || manualDone || alreadyDone;

  return (
    <>
      {/* ===== TEACH ===== */}
      <section className="lesson-teach" aria-labelledby="lesson-teach-heading">
        <div className="lesson-inner">
          <h2 id="lesson-teach-heading" className="lesson-section-heading">
            Learn
          </h2>
          {lesson.intro.map((para, i) => (
            <p key={i} className="lesson-text">
              {para}
            </p>
          ))}

          {hasChars && (
            <ul className="lesson-chars" role="list">
              {lesson.chars.map((c) => (
                <li key={c.print} className="lesson-char">
                  <BrailleCell pattern={c.pattern} className="lesson-char-cell" dotClassName="lesson-char-dot" />
                  <span className="lesson-char-print">{c.print}</span>
                  <span className="lesson-char-dots">{describeDots(c.pattern)}</span>
                  {c.note && <span className="lesson-char-note">{c.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ===== WRITE IT (signature drill) ===== */}
      {hasChars && (
        <section className="lesson-drill" aria-labelledby="lesson-drill-heading">
          <div className="lesson-inner">
            <div className="section-label">Your Turn</div>
            <h2 id="lesson-drill-heading" className="lesson-section-heading">
              Write It Yourself
            </h2>
            <p className="lesson-text">
              Braille is read by touch and written dot by dot. Recreate each character below in the writer — the best
              way to make it stick.
            </p>

            <ol className="lesson-drill-chips" aria-label="Drill progress">
              {lesson.chars.map((c, i) => (
                <li
                  key={c.print}
                  className={`lesson-drill-chip${solved[i] ? ' done' : ''}${i === current && !drillDone ? ' active' : ''}`}
                >
                  <span aria-hidden="true">{c.print}</span>
                  <span className="sr-only">
                    {c.print}
                    {solved[i] ? ' — done' : i === current ? ' — current' : ''}
                  </span>
                </li>
              ))}
            </ol>

            {!drillDone ? (
              <>
                <p className="lesson-drill-counter" aria-live="polite">
                  Character {current + 1} of {lesson.chars.length}
                </p>
                <BraillerInput
                  target={lesson.chars[current]}
                  solved={solved[current]}
                  onSolved={(ft) => handleSolved(current, ft)}
                />
                {solved[current] && current < lesson.chars.length - 1 && (
                  <button
                    type="button"
                    className="cta-button lesson-drill-next"
                    onClick={() => setCurrent((c) => Math.min(c + 1, lesson.chars.length - 1))}
                  >
                    Next character →
                  </button>
                )}
              </>
            ) : (
              <div className="lesson-done-banner" role="status">
                <strong>Nicely done — you wrote every character in this lesson.</strong>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== PRACTICE (embedded existing game) ===== */}
      {PracticeGame && (
        <section className="lesson-practice" aria-labelledby="lesson-practice-heading">
          <div className="lesson-inner">
            <div className="section-label">Practice</div>
            <h2 id="lesson-practice-heading" className="lesson-section-heading">
              Keep Practicing{lesson.practiceGameLabel ? ` — ${lesson.practiceGameLabel}` : ''}
            </h2>
            <p className="lesson-text">
              {lessonFinished
                ? 'Reinforce what you just learned with a full practice activity.'
                : 'Finish writing the characters above, then this practice activity will help it stick.'}
            </p>
          </div>
          {lessonFinished ? (
            <div className="lesson-practice-game">
              <GameErrorBoundary gameName={lesson.practiceGameLabel ?? 'Practice'}>
                <PracticeGame />
              </GameErrorBoundary>
            </div>
          ) : (
            <div className="lesson-inner">
              <div className="lesson-practice-locked" aria-hidden="true">
                Complete the writing drill to unlock practice.
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===== WRAP-UP LESSON (no chars) ===== */}
      {!hasChars && !manualDone && !alreadyDone && (
        <section className="lesson-drill" aria-label="Complete lesson">
          <div className="lesson-inner">
            <button type="button" className="cta-button" onClick={finishWrapUp}>
              Mark this lesson complete
            </button>
          </div>
        </section>
      )}

      {/* ===== COMPLETION + TIP + NAV ===== */}
      <section className="lesson-foot">
        <div className="lesson-inner">
          {lessonFinished && (
            <div className="lesson-complete" role="status">
              <span className="lesson-complete-check" aria-hidden="true">
                ✓
              </span>
              <p>
                <strong>Lesson complete.</strong>{' '}
                {next ? (
                  <>
                    Ready for <Link href={`/learn/${next.slug}`}>{next.title}</Link>?
                  </>
                ) : (
                  <>
                    You&rsquo;ve reached the end of the course — explore the <Link href="/games">practice games</Link>{' '}
                    any time.
                  </>
                )}
              </p>
            </div>
          )}

          {lesson.tip && (
            <p className="lesson-tip">
              <span className="lesson-tip-label">Tip</span> {lesson.tip}
            </p>
          )}

          <LessonNav prev={prev} next={next} />
        </div>
      </section>
    </>
  );
}
