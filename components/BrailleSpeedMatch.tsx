'use client';

import '@/styles/games/speed-match.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import Cell from '@/components/ui/Cell';
import {
  Choices,
  Hud,
  ModePicker,
  Results,
  StartPanel,
  dotSimilarity,
  pickDistractors,
  sample,
  shuffle,
  useAnnouncer,
  useGameKeys,
  useSession,
  type Choice,
} from '@/components/games/kit';
import { ALPHABET, LETTERS, describe } from '@/lib/ueb';
import { DIFFICULTY_INFO, getDifficultyParams } from '@/lib/difficulty-settings';
import type { Difficulty } from '@/lib/progress-types';

type Mode = 'read' | 'write';
type Pace = 'relaxed' | 'timed';
type Phase = 'start' | 'play' | 'done';

const ROUND = 12;
const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

interface Question {
  letter: string;
  options: string[];
}

function makeQuestion(count: number, avoid?: string): Question {
  const letter = sample(ALPHABET.filter((l) => l !== avoid));
  const wrong = pickDistractors(letter, ALPHABET, count - 1, (a, b) => dotSimilarity(LETTERS[a], LETTERS[b]));
  return { letter, options: shuffle([letter, ...wrong]) };
}

function levelParams(d: Difficulty) {
  const p = getDifficultyParams('speedmatch', d) as { choiceCount?: number; timeLimit?: number };
  return { choiceCount: p.choiceCount ?? 4, timeLimit: p.timeLimit || 6000 };
}

function starsFor(correct: number) {
  const pct = correct / ROUND;
  return pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;
}

export default function BrailleSpeedMatch() {
  const { difficulty, setDifficulty, stats, finish, answer } = useSession('speedmatch');
  const { announce, region } = useAnnouncer();
  const [phase, setPhase] = useState<Phase>('start');
  const [mode, setMode] = useState<Mode>('read');
  const [pace, setPace] = useState<Pace>('relaxed');
  const [q, setQ] = useState<Question>(() => makeQuestion(4));
  const [num, setNum] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<{ best: number; isNewBest: boolean } | null>(null);

  const { choiceCount, timeLimit } = levelParams(difficulty);
  const answered = picked !== null || timedOut;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lockRef = useRef(false);
  const promptRef = useRef<HTMLHeadingElement>(null);

  // When a new question replaces the button that had focus, keep focus in the game.
  useEffect(() => {
    if (phase !== 'play') return;
    const active = document.activeElement;
    if (!active || active === document.body) promptRef.current?.focus();
  }, [phase, q]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const ask = useCallback(
    (prev?: string) => {
      const next = makeQuestion(choiceCount, prev);
      setQ(next);
      setPicked(null);
      setTimedOut(false);
      setTimeLeft(timeLimit);
      lockRef.current = false;
      return next;
    },
    [choiceCount, timeLimit],
  );

  const start = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setCorrect(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setNum(1);
    setResult(null);
    setPhase('play');
    ask();
    announce(mode === 'read' ? 'Question 1. Which letter is this cell?' : 'Question 1. Which cell is this letter?');
  }, [announce, ask, mode]);

  const advance = useCallback(() => {
    if (num >= ROUND) {
      const prevBest = stats.bestScore;
      finish(correct >= Math.ceil(ROUND * 0.7), score);
      setResult({ best: Math.max(prevBest, score), isNewBest: score > prevBest });
      setPhase('done');
      return;
    }
    setNum((n) => n + 1);
    ask(q.letter);
  }, [ask, correct, finish, num, q.letter, score, stats.bestScore]);

  const settle = useCallback(
    (pick: string | null) => {
      if (lockRef.current) return;
      lockRef.current = true;
      const right = pick === q.letter;
      answer(`letter:${q.letter}`, right);
      if (pick === null) setTimedOut(true);
      else setPicked(pick);

      const cell = describe(LETTERS[q.letter]);
      if (right) {
        const s = streak + 1;
        setStreak(s);
        setBestStreak((b) => Math.max(b, s));
        setCorrect((c) => c + 1);
        setScore((v) => v + 10 + (s >= 3 ? 5 : 0));
        announce(`Correct! ${q.letter} is ${cell}.${s >= 3 ? ` Streak ${s}!` : ''}`);
        later(() => advanceRef.current(), 700);
      } else {
        setStreak(0);
        announce(
          `${pick === null ? "Time's up." : 'Not quite.'} ${q.letter} is ${cell}. ${pace === 'relaxed' ? 'Press Enter for the next one.' : ''}`,
        );
        if (pace === 'timed') later(() => advanceRef.current(), 1600);
      }
    },
    [announce, answer, pace, q.letter, streak],
  );

  // Timers read the latest advance() (it closes over the score).
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Countdown (Timed pace only — Relaxed has no timer, WCAG 2.2.1).
  useEffect(() => {
    if (phase !== 'play' || pace !== 'timed' || answered) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, timeLimit - (Date.now() - startedAt));
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(id);
        settleRef.current(null);
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, pace, answered, timeLimit, q]);
  const settleRef = useRef(settle);
  settleRef.current = settle;

  const waitingForNext = phase === 'play' && answered && picked !== q.letter && pace === 'relaxed';

  useGameKeys((e) => {
    if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
    if (phase === 'play') {
      if (waitingForNext) {
        e.preventDefault();
        advance();
      }
    } else {
      e.preventDefault();
      start();
    }
  });

  const choices: Choice[] = q.options.map((l) =>
    mode === 'read'
      ? { id: l, content: <span className="spm-letter">{l}</span> }
      : { id: l, content: <Cell dots={LETTERS[l]} size="md" />, label: `braille cell, ${describe(LETTERS[l])}` },
  );

  const pct = timeLimit ? Math.round((timeLeft / timeLimit) * 100) : 0;

  return (
    <div className="game-board spm" data-testid="game-board">
      {region}

      {phase === 'start' && (
        <StartPanel heading="Ready to match?" onStart={start}>
          <div className="spm-options">
            <ModePicker
              legend="Game"
              name="spm-mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'read', label: 'Read braille', hint: 'See a cell, pick the letter' },
                { value: 'write', label: 'Find the cell', hint: 'See a letter, pick its cell' },
              ]}
            />
            <ModePicker
              legend="Level"
              name="spm-level"
              value={difficulty}
              onChange={setDifficulty}
              options={LEVELS.map((d) => ({
                value: d,
                label: DIFFICULTY_INFO[d].label,
                hint: `${levelParams(d).choiceCount} choices`,
              }))}
            />
            <ModePicker
              legend="Timer"
              name="spm-pace"
              value={pace}
              onChange={setPace}
              options={[
                { value: 'relaxed', label: 'Relaxed', hint: 'No timer' },
                { value: 'timed', label: 'Timed', hint: `${timeLimit / 1000} seconds each` },
              ]}
            />
          </div>
          <p className="game-prompt-sub">{ROUND} questions. Press Enter or Start.</p>
        </StartPanel>
      )}

      {phase === 'play' && (
        <>
          <div className="game-board-toolbar">
            <Hud
              items={[
                { label: 'Question', value: `${num} / ${ROUND}` },
                { label: 'Score', value: score },
                { label: 'Streak', value: streak, tone: 'streak' },
              ]}
            />
          </div>
          {pace === 'timed' && (
            <div
              className={`timer-bar${pct < 30 ? ' is-low' : ''}`}
              role="progressbar"
              aria-label="Time left"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <span style={{ width: `${pct}%` }} />
            </div>
          )}

          <h2 className="game-prompt" ref={promptRef} tabIndex={-1}>
            {mode === 'read' ? 'Which letter is this?' : 'Which cell is this letter?'}
          </h2>
          <div className="game-cell-stage spm-stage" key={`${num}-${q.letter}`}>
            {mode === 'read' ? (
              <Cell dots={LETTERS[q.letter]} size="xl" framed pop label="Mystery cell" />
            ) : (
              <span className="big-print">{q.letter}</span>
            )}
          </div>

          <Choices
            choices={choices}
            onPick={(id) => settle(id)}
            correctId={answered ? q.letter : null}
            pickedId={picked}
            disabled={answered}
            typeToPick={mode === 'read'}
            label="Answers"
          />

          <div className={`feedback ${answered ? (picked === q.letter ? 'feedback--good' : 'feedback--bad') : ''}`}>
            {answered && (
              <span className="feedback-pill">
                {picked === q.letter ? '✓ Correct!' : `${timedOut ? '⏱ Time’s up' : '✗ Not quite'} — it’s ${q.letter}`}
              </span>
            )}
          </div>
          {waitingForNext && (
            <button type="button" className="btn btn--pine spm-next" onClick={advance}>
              Next
            </button>
          )}
        </>
      )}

      {phase === 'done' && result && (
        <Results
          title={correct >= ROUND * 0.7 ? 'Speedy reading!' : 'Good practice!'}
          summary={`${correct} of ${ROUND} right · best streak ${bestStreak} · ${score} points`}
          stars={starsFor(correct)}
          best={`${result.best} points`}
          isNewBest={result.isNewBest}
          onReplay={start}
        />
      )}
    </div>
  );
}
