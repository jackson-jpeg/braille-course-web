'use client';

import '@/styles/games/reflex-dots.css';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  DotPad,
  Hud,
  ModePicker,
  Results,
  StartPanel,
  sample,
  useAnnouncer,
  useGameKeys,
  useSession,
} from '@/components/games/kit';
import Cell from '@/components/ui/Cell';
import { ALPHABET, LETTERS, describe, sameDots } from '@/lib/ueb';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import type { Difficulty } from '@/lib/progress-types';

type Show = 'flash' | 'relaxed';
type Phase = 'ready' | 'show' | 'input' | 'feedback' | 'done';
type Mark = 'correct' | 'missing' | 'extra';

const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Gentle', hint: '2 seconds · 10 rounds' },
  { value: 'intermediate', label: 'Quick', hint: '1.2 seconds · 15 rounds' },
  { value: 'advanced', label: 'Lightning', hint: '0.7 seconds · 20 rounds' },
];

const SHOWS: { value: Show; label: string; hint: string }[] = [
  { value: 'flash', label: 'Flash', hint: 'the cell fades by itself' },
  { value: 'relaxed', label: 'Relaxed', hint: 'you hide it when ready' },
];

function marksFor(target: readonly number[], got: readonly number[]): Partial<Record<number, Mark>> {
  const marks: Partial<Record<number, Mark>> = {};
  for (let d = 1; d <= 6; d++) {
    const want = target.includes(d);
    const have = got.includes(d);
    if (want && have) marks[d] = 'correct';
    else if (want) marks[d] = 'missing';
    else if (have) marks[d] = 'extra';
  }
  return marks;
}

/** Reflex Dots: a cell flashes up, then fades — raise the same dots from memory. */
export default function BrailleReflexDots() {
  const { difficulty, setDifficulty, stats, finish, answer } = useSession('reflex-dots');
  const { announce, region } = useAnnouncer();
  const { displayTime, rounds } = getDifficultyParams('reflex-dots', difficulty) as {
    displayTime: number;
    rounds: number;
  };

  const [show, setShow] = useState<Show>('flash');
  const [phase, setPhase] = useState<Phase>('ready');
  const [letter, setLetter] = useState('a');
  const [dots, setDots] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const nextRef = useRef<HTMLButtonElement>(null);
  const lastLetter = useRef('');

  const clearTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);
  useEffect(() => clearTimer, [clearTimer]);

  const hide = useCallback(() => {
    clearTimer();
    setPhase((p) => (p === 'show' ? 'input' : p));
    announce('Your turn. Raise the dots you saw, then press Enter.');
  }, [clearTimer, announce]);

  const showCell = useCallback(() => {
    let l = sample(ALPHABET);
    while (l === lastLetter.current) l = sample(ALPHABET);
    lastLetter.current = l;
    setLetter(l);
    setDots([]);
    setPhase('show');
    announce(`Remember this cell: ${describe(LETTERS[l])}.`);
    clearTimer();
    if (show === 'flash') hideTimer.current = setTimeout(hide, displayTime);
  }, [show, displayTime, hide, clearTimer, announce]);

  const start = useCallback(() => {
    setRound(0);
    setScore(0);
    setNewBest(false);
    showCell();
  }, [showCell]);

  const target = LETTERS[letter];

  const check = useCallback(() => {
    if (phase !== 'input') return;
    const ok = sameDots(dots, target);
    answer(`letter:${letter}`, ok);
    if (ok) setScore((s) => s + 1);
    setPhase('feedback');
    announce(
      ok
        ? `Correct! ${describe(target)} — that’s the letter ${letter}.`
        : `Not quite. You raised ${describe(dots)}. The cell was ${describe(target)}, the letter ${letter}.`,
    );
  }, [phase, dots, target, letter, answer, announce]);

  const next = useCallback(() => {
    if (phase !== 'feedback') return;
    if (round + 1 >= rounds) {
      setNewBest(score > stats.bestScore);
      finish(score >= rounds / 2, score);
      setPhase('done');
      return;
    }
    setRound(round + 1);
    showCell();
  }, [phase, round, rounds, score, stats.bestScore, finish, showCell]);

  useEffect(() => {
    if (phase === 'feedback') nextRef.current?.focus();
  }, [phase]);

  useGameKeys(
    (e) => {
      if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (phase === 'ready') start();
      else if (phase === 'show' && show === 'relaxed') hide();
      else if (phase === 'feedback') next();
    },
    { enabled: phase === 'ready' || phase === 'show' || phase === 'feedback' },
  );

  const ok = phase === 'feedback' && sameDots(dots, target);

  return (
    <div className="game-board rx-board" data-testid="game-board">
      {region}

      {phase === 'ready' && (
        <StartPanel heading="How good is your dot memory?" onStart={start}>
          <p className="game-prompt-sub">
            A cell appears, then disappears. Raise the same dots from memory with the dot pad, keys 1–6, or F D S J K L.
          </p>
          <div className="rx-options">
            <ModePicker legend="Speed" name="rx-level" value={difficulty} options={LEVELS} onChange={setDifficulty} />
            <ModePicker legend="Showing the cell" name="rx-show" value={show} options={SHOWS} onChange={setShow} />
          </div>
        </StartPanel>
      )}

      {(phase === 'show' || phase === 'input' || phase === 'feedback') && (
        <>
          <Hud
            items={[
              { label: 'Round', value: `${round + 1} of ${rounds}` },
              { label: 'Score', value: score },
            ]}
          />

          {phase === 'show' && (
            <div className="rx-show">
              <h2 className="game-prompt rx-prompt">Remember this cell</h2>
              <div className="game-cell-stage rx-stage">
                <Cell key={`${round}-${letter}`} dots={target} size="xl" framed pop label="Cell to remember" />
              </div>
              {show === 'flash' ? (
                <div className="timer-bar rx-fuse" aria-hidden="true">
                  <span style={{ '--rx-ms': `${displayTime}ms` } as CSSProperties} />
                </div>
              ) : (
                <div className="rx-actions">
                  <button type="button" className="btn btn--pine" onClick={hide}>
                    Got it — hide the cell
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === 'input' && (
            <div className="rx-input">
              <h2 className="game-prompt rx-prompt">Now raise the same dots</h2>
              <DotPad value={dots} onChange={setDots} onSubmit={check} label="Your cell" />
              <div className="rx-actions">
                <button
                  type="button"
                  className="btn btn--paper btn--sm"
                  onClick={() => setDots([])}
                  disabled={!dots.length}
                >
                  Clear
                </button>
                <button type="button" className="btn btn--pine" onClick={check}>
                  Check
                </button>
              </div>
            </div>
          )}

          {phase === 'feedback' && (
            <div className="rx-feedback">
              <h2 className="game-prompt rx-prompt">{ok ? 'Perfect copy!' : 'Here’s how it compares'}</h2>
              <div className="rx-compare">
                <figure className="rx-col">
                  <DotPad
                    value={dots}
                    onChange={() => {}}
                    disabled
                    keyboard={false}
                    marks={marksFor(target, dots)}
                    size="md"
                    label="Your cell"
                  />
                  <figcaption>Yours</figcaption>
                </figure>
                <figure className="rx-col">
                  <div className="rx-target">
                    <Cell dots={target} size="xl" framed label={`The cell was the letter ${letter}`} />
                  </div>
                  <figcaption>
                    The cell: <span className="letter-chip">{letter}</span>
                  </figcaption>
                </figure>
              </div>
              {!ok && (
                <ul className="rx-legend" aria-hidden="true">
                  <li>
                    <span className="rx-key">✓</span> right dot
                  </li>
                  <li>
                    <span className="rx-key">+</span> missed dot
                  </li>
                  <li>
                    <span className="rx-key">✗</span> extra dot
                  </li>
                </ul>
              )}
              <div className={`feedback ${ok ? 'feedback--good' : 'feedback--bad'}`} aria-hidden="true">
                <span className="feedback-pill">
                  {ok ? `✓ Correct — ${describe(target)}` : `✗ It was ${describe(target)}`}
                </span>
              </div>
              <div className="rx-actions">
                <button ref={nextRef} type="button" className="btn btn--pine" onClick={next}>
                  {round + 1 >= rounds ? 'See results' : 'Next cell'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === 'done' && (
        <Results
          title={
            score === rounds
              ? 'Perfect reflexes!'
              : score >= rounds * 0.7
                ? 'Sharp memory!'
                : score >= rounds / 2
                  ? 'Good effort!'
                  : 'Keep practicing!'
          }
          summary={`${score} of ${rounds} cells copied exactly`}
          stars={score === rounds ? 3 : score >= rounds * 0.7 ? 2 : score >= rounds / 2 ? 1 : 0}
          best={Math.max(stats.bestScore, score) > 0 ? `${Math.max(stats.bestScore, score)} cells` : undefined}
          isNewBest={newBest}
          onReplay={start}
        />
      )}
    </div>
  );
}
