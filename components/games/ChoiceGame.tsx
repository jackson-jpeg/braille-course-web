'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import type { Difficulty, GameId } from '@/lib/progress-types';
import type { QuestionSpec } from '@/lib/games/quiz';
import { shuffle } from '@/lib/games/quiz';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import DifficultySelector from '@/components/DifficultySelector';

/**
 * Shared shell for the multiple-choice reading games (Capital Quest, Number Lock, Punctuation
 * Detective): rounds, score and streak, keys 1–4, feedback with the reason, and the end screen.
 * Each game supplies its question specs (lib/games/*) and how to draw prompts and choices.
 * The correct answer is decided by the game module's `isCorrect`, the same function the tests use.
 */
export interface ChoiceGameMode {
  id: string;
  label: string;
}

export interface ChoiceGameConfig<P, A> {
  gameId: GameId;
  title: string;
  kicker: string;
  subtitle: string;
  /** CSS prefix for theming, e.g. "cquest". */
  theme: string;
  modes: ChoiceGameMode[];
  rounds: number;
  specs: (difficulty: Difficulty, mode: string) => QuestionSpec<P, A>[];
  makeRound: (spec: QuestionSpec<P, A>) => { choices: A[]; correctIndex: number };
  isCorrect: (spec: QuestionSpec<P, A>, choice: A) => boolean;
  /** The question text above the prompt (e.g. "What does this say?"). */
  question: (spec: QuestionSpec<P, A>, mode: string) => string;
  renderPrompt: (spec: QuestionSpec<P, A>, mode: string) => ReactNode;
  renderChoice: (choice: A, spec: QuestionSpec<P, A>, mode: string) => ReactNode;
  /** Accessible name of a choice button (should state dot numbers when the choice is braille). */
  choiceLabel: (choice: A, spec: QuestionSpec<P, A>, mode: string) => string;
  /** Shown after answering: why the answer is right. */
  explain: (spec: QuestionSpec<P, A>) => ReactNode;
  /** Plain-text version of the answer for the feedback line. */
  answerText: (spec: QuestionSpec<P, A>) => string;
}

interface Round<P, A> {
  spec: QuestionSpec<P, A>;
  choices: A[];
  correctIndex: number;
}

export default function ChoiceGame<P, A>({ config }: { config: ChoiceGameConfig<P, A> }) {
  const { difficulty, setDifficulty, recordResult } = useGameProgress(config.gameId);
  const [mode, setMode] = useState(config.modes[0].id);
  const [queue, setQueue] = useState<QuestionSpec<P, A>[]>([]);
  const [round, setRound] = useState<Round<P, A> | null>(null);
  const [roundNo, setRoundNo] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [tip, setTip] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  const start = useCallback(() => {
    const specs = shuffle(config.specs(difficulty, mode));
    const total = Math.min(config.rounds, specs.length);
    const q = specs.slice(0, total);
    setQueue(q);
    const first = q[0];
    setRound(first ? { spec: first, ...config.makeRound(first) } : null);
    setRoundNo(0);
    setScore(0);
    setStreak(0);
    setPicked(null);
    setDone(false);
    setTip('');
  }, [config, difficulty, mode]);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => (visibleRef.current = entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const answer = useCallback(
    (i: number) => {
      if (!round || picked !== null || done) return;
      setPicked(i);
      const right = config.isCorrect(round.spec, round.choices[i]);
      if (right) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const n = s + 1;
          setBest((b) => Math.max(b, n));
          return n;
        });
      } else {
        setStreak(0);
      }
    },
    [round, picked, done, config],
  );

  const next = useCallback(() => {
    const n = roundNo + 1;
    if (n >= queue.length) {
      setDone(true);
      const won = score >= Math.ceil(queue.length * 0.6);
      pushAchievements(recordResult(won, score));
      setTip(getRandomTip().fact);
      return;
    }
    setRoundNo(n);
    setRound({ spec: queue[n], ...config.makeRound(queue[n]) });
    setPicked(null);
  }, [roundNo, queue, score, recordResult, config]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!visibleRef.current || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= (round?.choices.length ?? 0) && picked === null) {
        e.preventDefault();
        answer(n - 1);
      } else if ((e.key === 'Enter' || e.key === 'n') && picked !== null && !done) {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, next, round, picked, done]);

  const t = config.theme;
  const rightPick = round && picked !== null ? config.isCorrect(round.spec, round.choices[picked]) : null;

  return (
    <div className={`cgame ${t}`} ref={containerRef}>
      <div className="cgame-header">
        <span className="section-label">{config.kicker}</span>
        <h2>{config.title}</h2>
        <p>
          {config.subtitle} <span className="cgame-kbd-hint">Keys 1–4 answer · Enter for next</span>
        </p>
        <DifficultySelector gameId={config.gameId} current={difficulty} onChange={setDifficulty} />
      </div>

      <div className="cgame-body">
        {config.modes.length > 1 && (
          <div className="cgame-modes" role="radiogroup" aria-label="Game mode">
            {config.modes.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                className={`cgame-mode${mode === m.id ? ' active' : ''}`}
                onClick={() => setMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {!done && round && (
          <>
            <div className="cgame-status" aria-live="polite" aria-atomic="true">
              <span>
                Round {roundNo + 1} / {queue.length}
              </span>
              <span>Score: {score}</span>
              <span className={`cgame-streak${streak >= 3 ? ' hot' : ''}`}>Streak: {streak}</span>
            </div>

            <p className="cgame-question">{config.question(round.spec, mode)}</p>
            <div className="cgame-prompt">{config.renderPrompt(round.spec, mode)}</div>

            <div className="cgame-choices" role="group" aria-label="Answer choices">
              {round.choices.map((c, i) => {
                const isRight = config.isCorrect(round.spec, c);
                let cls = 'cgame-choice';
                if (picked !== null && isRight) cls += ' correct';
                else if (picked === i) cls += ' wrong';
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls}
                    onClick={() => answer(i)}
                    disabled={picked !== null}
                    aria-label={`Choice ${i + 1}: ${config.choiceLabel(c, round.spec, mode)}`}
                  >
                    <span className="cgame-choice-num" aria-hidden="true">
                      {i + 1}
                    </span>
                    {config.renderChoice(c, round.spec, mode)}
                  </button>
                );
              })}
            </div>

            <div className="cgame-feedback" role="status" aria-live="assertive">
              {picked !== null && (
                <div className={`cgame-feedback-box ${rightPick ? 'correct' : 'wrong'}`}>
                  <strong>
                    {rightPick ? 'Correct!' : `Not quite. The answer is ${config.answerText(round.spec)}.`}
                  </strong>
                  <div className="cgame-explain">{config.explain(round.spec)}</div>
                  <button type="button" className="cgame-next" onClick={next}>
                    {roundNo + 1 >= queue.length ? 'See results' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {done && (
          <div className="cgame-result">
            <div className="cgame-result-score">
              {score} / {queue.length}
            </div>
            <div className="cgame-result-label">
              {score === queue.length
                ? 'Perfect!'
                : score >= queue.length * 0.7
                  ? 'Great reading!'
                  : 'Keep practicing!'}
              {best >= 3 ? ` Best streak: ${best}.` : ''}
            </div>
            {tip && <p className="cgame-tip">{tip}</p>}
            <button type="button" className="cgame-again" onClick={start}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
